import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf";

    const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!supportedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "対応していないファイル形式です。JPG・PNG・GIF・WebP・PDFを使用してください。" },
        { status: 400 }
      );
    }

    let messageContent: Anthropic.MessageParam["content"];

    if (mimeType === "application/pdf") {
      messageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        } as Anthropic.DocumentBlockParam,
        {
          type: "text",
          text: PARSE_PROMPT,
        },
      ];
    } else {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: base64,
          },
        },
        {
          type: "text",
          text: PARSE_PROMPT,
        },
      ];
    }

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
    }

    // Extract JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "情報を抽出できませんでした" }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Image parse error:", error);
    return NextResponse.json({ error: "ファイルの解析中にエラーが発生しました" }, { status: 500 });
  }
}
