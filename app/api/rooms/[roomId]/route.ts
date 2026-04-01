import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const userId = session.user.id;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      owner: { select: { id: true, nickname: true, email: true } },
      members: {
        include: { user: { select: { id: true, nickname: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { sharedReservations: true } },
    },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const isOwner = room.ownerId === userId;
  const isMember = room.members.some((m) => m.userId === userId && m.status === "active");

  if (!isOwner && !isMember) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const activeMembers = room.members.filter((m) => m.status === "active");
  const pendingInvitations = isOwner ? room.members.filter((m) => m.status === "pending") : [];

  return NextResponse.json({ ...room, members: activeMembers, pendingInvitations, isOwner });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.ownerId !== session.user.id) return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "ルーム名を入力してください" }, { status: 400 });

  const updated = await prisma.room.update({
    where: { id: roomId },
    data: { name: name.trim().slice(0, 30), description: description?.trim().slice(0, 200) || null },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.ownerId !== session.user.id) return NextResponse.json({ error: "Owner only" }, { status: 403 });

  await prisma.room.delete({ where: { id: roomId } });
  return NextResponse.json({ success: true });
}
