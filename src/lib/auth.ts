import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const adminUser = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
        if (!adminUser) return null;

        const isValid = await bcrypt.compare(password, adminUser.passwordHash);
        if (!isValid) return null;

        return {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name || adminUser.email,
          role: adminUser.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "STAFF" | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
