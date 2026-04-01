import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    orderBy: [{ departureDate: "asc" }, { departureTime: "asc" }],
  });

  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const reservation = await prisma.reservation.create({
    data: {
      userId: session.user.id,
      bookingNumber: body.bookingNumber || "",
      passengerName: body.passengerName || "",
      busCompany: body.busCompany || "",
      departureDate: body.departureDate || "",
      departureTime: body.departureTime || "",
      arrivalTime: body.arrivalTime || null,
      departureStop: body.departureStop || "",
      arrivalStop: body.arrivalStop || "",
      departureLat: body.departureLat || null,
      departureLng: body.departureLng || null,
      seatNumber: body.seatNumber || null,
      qrCodeData: body.qrCodeData || null,
      boardingPassUrl: body.boardingPassUrl || null,
      notes: body.notes || null,
      rawEmailContent: body.rawEmailContent || null,
    },
  });

  return NextResponse.json(reservation, { status: 201 });
}
