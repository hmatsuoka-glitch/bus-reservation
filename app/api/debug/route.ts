import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "NOT SET",
      DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN ? "SET (length: " + process.env.DATABASE_AUTH_TOKEN.length + ")" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    }
  };

  try {
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");

    const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    const config = authToken ? { url, authToken } : { url };
    const adapter = new PrismaLibSql(config);
    const prisma = new PrismaClient({ adapter } as never);

    const count = await prisma.user.count();
    results.db = { status: "connected", userCount: count };
    await prisma.$disconnect();
  } catch (error) {
    results.db = {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined
    };
  }

  return NextResponse.json(results);
}
