import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";

const RP_ID =
  process.env.NEXTAUTH_URL?.replace("https://", "")
    .replace("http://", "")
    .split(":")[0] || "localhost";
const ORIGIN = process.env.NEXTAUTH_URL || "http://localhost:3000";

const challengeStore = new Map<string, string>();
const CHALLENGE_KEY = "global_auth_challenge";

export async function GET() {
  const passkeys = await prisma.passkey.findMany({
    include: { user: true },
  });

  if (passkeys.length === 0) {
    return NextResponse.json({ challenge: "", allowCredentials: [] });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "required",
  });

  challengeStore.set(CHALLENGE_KEY, options.challenge);

  return NextResponse.json({
    challenge: options.challenge,
    allowCredentials: passkeys.map((p) => ({
      id: Buffer.from(p.credentialId).toString("base64"),
      type: "public-key",
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const expectedChallenge = challengeStore.get(CHALLENGE_KEY);

  if (!expectedChallenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 400 });
  }

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: body.id },
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
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
      authenticator: {
        credentialID: new Uint8Array(Buffer.from(passkey.credentialId, "base64")),
        credentialPublicKey: new Uint8Array(
          Buffer.from(passkey.publicKey, "base64")
        ),
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

    challengeStore.delete(CHALLENGE_KEY);

    return NextResponse.json({
      userId: passkey.userId,
      email: passkey.user.email,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
