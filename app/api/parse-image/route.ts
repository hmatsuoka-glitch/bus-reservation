import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic();

const PARSE_PROMPT = `この画像またはPDFは高速バスの予約確認書です。以下の情報をすべて抽出して、JSON形式で返してください。
情報が見つからない場合はnullにしてください。

返すJSONの形式：
{
  "busCompany": "バス会社名",
  "bookingNumber": "予約番号",
  "passengerName": "乗客名（様などの敬称は除く）",
  "departureDate": "出発日（YYYY-MM-DD形式）",
  "departureTime": "出発時刻（HH:MM形式）",
  "arrivalTime": "到着時刻（HH:MM形式）",
  "departureStop": "出発バス停・乗り場名",
  "arrivalStop": "到着バス停・目的地名",
  "seatNumber": "座席番号"
}

JSONのみを返し、余分なテキストや説明は不要です。`;

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

async function parseFile(file: File): Promise<ParsedReservation> {
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type;

  if (!SUPPORTED_TYPES.includes(mimeType)) {
    throw new Error(`対応していないファイル形式: ${mimeType}`);
  }

  let messageContent: Anthropic.MessageParam["content"];

  if (mimeType === "application/pdf") {
    messageContent = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      } as Anthropic.DocumentBlockParam,
      { type: "text", text: PARSE_PROMPT },
    ];
  } else {
    messageContent = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as SupportedImageType,
          data: base64,
        },
      },
      { type: "text", text: PARSE_PROMPT },
    ];
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: messageContent }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("AIからのレスポンスが空でした");
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("予約情報を抽出できませんでした");
  }

  return JSON.parse(jsonMatch[0]) as ParsedReservation;
}

// Merge multiple results — non-null values from later files override earlier ones
function mergeResults(results: ParsedReservation[]): ParsedReservation {
  const merged: ParsedReservation = {};
  for (const result of results) {
    for (const key of Object.keys(result) as (keyof ParsedReservation)[]) {
      if (result[key] != null) {
        (merged as Record<string, unknown>)[key] = result[key];
      }
    }
  }
  return merged;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    // Also support legacy single-file "file" key
    const singleFile = formData.get("file") as File | null;
    const allFiles = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }

    if (allFiles.length > 5) {
      return NextResponse.json({ error: "一度に処理できるファイルは5枚までです" }, { status: 400 });
    }

    // Check all file types upfront
    for (const file of allFiles) {
      if (!SUPPORTED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `${file.name}: 対応していないファイル形式です。JPG・PNG・GIF・WebP・PDFを使用してください。` },
          { status: 400 }
        );
      }
    }

    // Parse all files in parallel
    const results = await Promise.all(allFiles.map(parseFile));

    // Merge all results
    const merged = mergeResults(results);

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Image parse error:", error);
    const message = error instanceof Error ? error.message : "ファイルの解析中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
