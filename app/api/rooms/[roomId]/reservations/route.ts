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
    include: { members: { where: { userId, status: "active" } } },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const isOwner = room.ownerId === userId;
  const isMember = room.members.length > 0;
  if (!isOwner && !isMember) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const sharedReservations = await prisma.roomReservation.findMany({
    where: { roomId },
    include: { reservation: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sharedReservations);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const userId = session.user.id;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { members: { where: { userId, status: "active" } } },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const isOwner = room.ownerId === userId;
  const isMember = room.members.length > 0;
  if (!isOwner && !isMember) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { reservationId } = await req.json();
  if (!reservationId) return NextResponse.json({ error: "reservationId required" }, { status: 400 });

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  if (reservation.userId !== userId) return NextResponse.json({ error: "You can only share your own reservations" }, { status: 403 });

  const existing = await prisma.roomReservation.findUnique({
    where: { roomId_reservationId: { roomId, reservationId } },
  });
  if (existing) return NextResponse.json({ error: "Already shared" }, { status: 409 });

  const shared = await prisma.roomReservation.create({
    data: { roomId, reservationId, sharedBy: userId },
    include: { reservation: true },
  });

  return NextResponse.json(shared, { status: 201 });
}
