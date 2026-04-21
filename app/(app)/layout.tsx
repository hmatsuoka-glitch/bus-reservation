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
  // redirect() must be called OUTSIDE try/catch (Next.js throws NEXT_REDIRECT internally)
  let dbUser: { nickname: string | null } | null = null;
  let dbFailed = false;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nickname: true },
    });
  } catch (e) {
    console.error("Database error in layout:", e);
    dbFailed = true;
  }

  if (dbFailed) redirect("/login");

  const nickname = dbUser?.nickname;
  if (!nickname) redirect("/setup-nickname");

  const displayName = nickname;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={{ ...session.user, nickname: displayName }} />
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">
        {children}
      </main>
    </div>
  );
}
