import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.ownerId !== session.user.id) return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const invitations = await prisma.roomMember.findMany({
    where: { roomId, status: "pending" },
    include: { user: { select: { id: true, nickname: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.ownerId !== session.user.id) return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!targetUser) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  if (targetUser.id === session.user.id) return NextResponse.json({ error: "自分自身は招待できません" }, { status: 400 });
  if (targetUser.id === room.ownerId) return NextResponse.json({ error: "オーナーは既にルームのメンバーです" }, { status: 409 });

  const existing = await prisma.roomMember.findUnique({ where: { roomId_userId: { roomId, userId: targetUser.id } } });
  if (existing) {
    return NextResponse.json(
      { error: existing.status === "active" ? "既にメンバーです" : "既に招待済みです" },
      { status: 409 }
    );
  }

  const member = await prisma.roomMember.create({
    data: { roomId, userId: targetUser.id, invitedBy: session.user.id, status: "pending" },
    include: { user: { select: { id: true, nickname: true, email: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}
