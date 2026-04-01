import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roomId: string; reservationId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, reservationId } = await params;
  const userId = session.user.id;

  const [room, shared] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId } }),
    prisma.roomReservation.findUnique({ where: { roomId_reservationId: { roomId, reservationId } } }),
  ]);

  if (!room || !shared) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = room.ownerId === userId;
  const isSharedBy = shared.sharedBy === userId;
  if (!isOwner && !isSharedBy) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  await prisma.roomReservation.delete({ where: { roomId_reservationId: { roomId, reservationId } } });
  return NextResponse.json({ success: true });
}
