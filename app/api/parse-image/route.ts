import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const PARSE_PROMPT = `This image or PDF is a highway bus reservation confirmation. Extract all of the following information and return it as JSON.
If information is not found, use null.

Return JSON format:
{
  "busCompany": "bus company name",
  "bookingNumber": "booking/reservation number",
  "passengerName": "passenger name (exclude honorifics)",
  "departureDate": "departure date (YYYY-MM-DD format)",
  "departureTime": "departure time (HH:MM format)",
  "arrivalTime": "arrival time (HH:MM format)",
  "departureStop": "departure bus stop / boarding location name",
  "arrivalStop": "arrival bus stop / destination name",
  "seatNumber": "seat number"
}

Return only the JSON object, no extra text or explanation.`;

type SupportedImageType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const SUPPORTED_IMAGE_TYPES: SupportedImageType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const SUPPORTED_TYPES = [...SUPPORTED_IMAGE_TYPES, "application/pdf"];

interface ParsedReservation {
  busCompany?: string | null;
  bookingNumber?: string | null;
  passengerName?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  departureStop?: string | null;
  arrivalStop?: string | null;
  seatNumber?: string | null;
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

async function parseOne(base64: string, mimeType: string): Promise<ParsedReservation> {
  if (!SUPPORTED_TYPES.includes(mimeType)) {
    throw new Error(`対応していないファイル形式: ${mimeType}`);
  }

  const content = mimeType === "application/pdf"
    ? [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
        { type: "text", text: PARSE_PROMPT },
      ]
    : [
        { type: "image", source: { type: "base64", media_type: mimeType as SupportedImageType, data: base64 } },
        { type: "text", text: PARSE_PROMPT },
      ];

  const bodyObj = {
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content }],
  };

  // Use Buffer (Uint8Array) as body to bypass Node.js undici's ByteString validation
  // which rejects string bodies containing non-Latin-1 characters.
  const bodyBuffer = Buffer.from(JSON.stringify(bodyObj), "utf-8");

  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: bodyBuffer,
  });

  const data = await apiRes.json() as AnthropicResponse;

  if (!apiRes.ok) {
    throw new Error(data?.error?.message ?? `Anthropic API error: ${apiRes.status}`);
  }

  const textBlock = data.content?.find((c) => c.type === "text");
  if (!textBlock?.text) throw new Error("AIからのレスポンスが空でした");

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("予約情報を抽出できませんでした");

  return JSON.parse(jsonMatch[0]) as ParsedReservation;
}

function mergeResults(results: ParsedReservation[]): ParsedReservation {
  const merged: ParsedReservation = {};
  for (const result of results) {
    for (const key of Object.keys(result) as (keyof ParsedReservation)[]) {
      if (result[key] != null && merged[key] == null) {
        (merged as Record<string, unknown>)[key] = result[key];
      }
    }
  }
  return merged;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files: { data: string; mimeType: string }[] = body.files || [];

    if (files.length === 0) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }
    if (files.length > 5) {
      return NextResponse.json({ error: "一度に処理できるファイルは5枚までです" }, { status: 400 });
    }

    for (const { mimeType } of files) {
      if (!SUPPORTED_TYPES.includes(mimeType)) {
        return NextResponse.json(
          { error: "対応していないファイル形式です。JPG・PNG・GIF・WebP・PDFを使用してください。" },
          { status: 400 }
        );
      }
    }

    const results = await Promise.all(files.map(({ data, mimeType }) => parseOne(data, mimeType)));
    const merged = mergeResults(results);

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Image parse error:", error);
    const message = error instanceof Error ? error.message : "ファイルの解析中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
