import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roomId: string; memberId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, memberId } = await params;

  const [room, member] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId } }),
    prisma.roomMember.findUnique({ where: { id: memberId } }),
  ]);

  if (!room || !member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = room.ownerId === session.user.id;
  const isSelf = member.userId === session.user.id;

  if (!isOwner && !isSelf) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  await prisma.roomMember.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}
