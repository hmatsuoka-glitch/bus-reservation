import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Check if nickname is set
  let dbUser: { nickname: string | null } | null = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nickname: true },
    });
  } catch (e) {
    console.error("Database error in layout:", e);
    redirect("/login");
  }

  if (!dbUser?.nickname) {
    redirect("/setup-nickname");
  }

  const displayName = dbUser.nickname;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={{ ...session.user, nickname: displayName }} />
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">
        {children}
      </main>
    </div>
  );
}
