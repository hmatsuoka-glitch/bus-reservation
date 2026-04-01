import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nickname } = await req.json();

    if (!nickname || nickname.trim().length === 0) {
      return NextResponse.json({ error: "ニックネームを入力してください" }, { status: 400 });
    }

    if (nickname.trim().length > 20) {
      return NextResponse.json({ error: "ニックネームは20文字以内で入力してください" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { nickname: nickname.trim() },
    });

    return NextResponse.json({ success: true, nickname: nickname.trim() });
  } catch (error) {
    console.error("Nickname error:", error);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
