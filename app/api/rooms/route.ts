import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [owned, member] = await Promise.all([
    prisma.room.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { members: { where: { status: "active" } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.room.findMany({
      where: { members: { some: { userId, status: "active" } } },
      include: {
        _count: { select: { members: { where: { status: "active" } } } },
        owner: { select: { nickname: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ owned, member });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "ルーム名を入力してください" }, { status: 400 });

  const room = await prisma.room.create({
    data: { name: name.trim().slice(0, 30), description: description?.trim().slice(0, 200) || null, ownerId: session.user.id },
  });

  return NextResponse.json(room, { status: 201 });
}
