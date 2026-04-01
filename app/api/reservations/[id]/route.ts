import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reservation = await prisma.reservation.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(reservation);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const reservation = await prisma.reservation.updateMany({
    where: { id, userId: session.user.id },
    data: {
      bookingNumber: body.bookingNumber,
      passengerName: body.passengerName,
      busCompany: body.busCompany,
      departureDate: body.departureDate,
      departureTime: body.departureTime,
      arrivalTime: body.arrivalTime,
      departureStop: body.departureStop,
      arrivalStop: body.arrivalStop,
      departureLat: body.departureLat,
      departureLng: body.departureLng,
      seatNumber: body.seatNumber,
      qrCodeData: body.qrCodeData,
      boardingPassUrl: body.boardingPassUrl,
      status: body.status,
      notes: body.notes,
    },
  });

  return NextResponse.json(reservation);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.reservation.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
