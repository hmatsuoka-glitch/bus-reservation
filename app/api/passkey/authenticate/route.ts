import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { randomUUID } from "crypto";

const RP_ID =
  process.env.NEXTAUTH_URL?.replace("https://", "")
    .replace("http://", "")
    .split(":")[0] || "localhost";
const ORIGIN = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function GET() {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "required",
  });

  // Store challenge in DB with expiry (works across serverless instances)
  const challengeRecord = await prisma.authChallenge.create({
    data: {
      id: randomUUID(),
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  return NextResponse.json({
    ...options,
    challengeId: challengeRecord.id,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { challengeId, ...credential } = body;

  if (!challengeId) {
    return NextResponse.json({ error: "Challenge ID missing" }, { status: 400 });
  }

  // Look up challenge from DB
  const challengeRecord = await prisma.authChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "Challenge expired or not found" }, { status: 400 });
  }

  // Delete used challenge
  await prisma.authChallenge.delete({ where: { id: challengeId } });

  // Find passkey by credential ID
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: credential.id },
    include: { user: true },
  });

  if (!passkey) {
    return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
  }

  try {
    const transports = (
      passkey.transports?.split(",").filter(Boolean) || []
    ) as AuthenticatorTransportFuture[];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
      authenticator: {
        credentialID: new Uint8Array(Buffer.from(passkey.credentialId, "base64url")),
        credentialPublicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64url")),
        counter: passkey.counter,
        transports,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    await prisma.passkey.update({
      where: { id: passkey.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    // Issue a short-lived login token
    const token = randomUUID();
    await prisma.user.update({
      where: { id: passkey.userId },
      data: {
        passkeyToken: token,
        passkeyTokenExp: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      },
    });

    return NextResponse.json({
      token,
      email: passkey.user.email,
    });
  } catch (error) {
    console.error("Passkey authentication error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
