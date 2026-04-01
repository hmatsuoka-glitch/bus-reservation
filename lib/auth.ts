import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Passkey token login
        if (credentials.password.startsWith("__passkey_token__")) {
          const token = credentials.password.replace("__passkey_token__", "");
          const user = await prisma.user.findFirst({
            where: {
              email: credentials.email,
              passkeyToken: token,
              passkeyTokenExp: { gt: new Date() },
            },
          });
          if (!user) return null;

          // Consume token
          await prisma.user.update({
            where: { id: user.id },
            data: { passkeyToken: null, passkeyTokenExp: null },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.nickname || user.email,
            nickname: user.nickname,
          };
        }

        // Normal password login
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nickname || user.email,
          nickname: user.nickname,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nickname = (user as { nickname?: string | null }).nickname;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.nickname = token.nickname as string | null | undefined;
      }
      return session;
    },
  },
};
