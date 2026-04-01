import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";

const RP_NAME = "BusPass";
const RP_ID =
  process.env.NEXTAUTH_URL?.replace("https://", "")
    .replace("http://", "")
    .split(":")[0] || "localhost";
const ORIGIN = process.env.NEXTAUTH_URL || "http://localhost:3000";

const challengeStore = new Map<string, string>();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { passkeys: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: user.id,
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: user.passkeys.map((p) => ({
      id: Buffer.from(p.credentialId, "base64") as unknown as BufferSource,
      type: "public-key" as const,
      transports: (p.transports?.split(",").filter(Boolean) ||
        []) as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      userVerification: "required",
      residentKey: "preferred",
    },
  });

  challengeStore.set(session.user.id, options.challenge);
  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const expectedChallenge = challengeStore.get(session.user.id);

  if (!expectedChallenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    await prisma.passkey.create({
      data: {
        userId: session.user.id,
        credentialId: Buffer.from(credentialID).toString("base64"),
        publicKey: Buffer.from(credentialPublicKey).toString("base64"),
        counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: body.response?.transports?.join(",") || "",
      },
    });

    challengeStore.delete(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
