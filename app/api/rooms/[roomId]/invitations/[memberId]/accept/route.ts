import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ roomId: string; memberId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = await params;

  const member = await prisma.roomMember.findUnique({ where: { id: memberId } });
  if (!member) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (member.userId !== session.user.id) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  if (member.status === "active") return NextResponse.json({ error: "Already a member" }, { status: 409 });

  const updated = await prisma.roomMember.update({
    where: { id: memberId },
    data: { status: "active", joinedAt: new Date() },
  });

  return NextResponse.json(updated);
}
