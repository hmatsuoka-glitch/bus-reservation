import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

  // Send invitation email
  if (resend) {
    const inviterName = session.user.name || session.user.email || "ユーザー";
    const appUrl = process.env.NEXTAUTH_URL || "https://bus-reservation-taupe.vercel.app";
    await resend.emails.send({
      from: "BusPass <onboarding@resend.dev>",
      to: targetUser.email,
      subject: `【BusPass】${inviterName}さんからルームへの招待が届きました`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1d4ed8;">BusPass ルーム招待</h2>
          <p>${inviterName}さんがあなたを「<strong>${room.name}</strong>」ルームに招待しました。</p>
          ${room.description ? `<p style="color: #6b7280;">${room.description}</p>` : ""}
          <a href="${appUrl}/rooms/invitations"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #2563eb; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">
            招待を確認する
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
            このメールに心当たりがない場合は無視してください。
          </p>
        </div>
      `,
    }).catch((err) => console.error("Email send failed:", err));
  }

  return NextResponse.json(member, { status: 201 });
}
