import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "student@campus.edu" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password.");
        }

        if (user.isSuspended) {
          throw new Error("Your account has been suspended. Please contact administration.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar,
          department: user.department,
          batch: user.batch,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role ?? "STUDENT") as Role;
        token.department = user.department;
        token.batch = user.batch;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = (token.role ?? "STUDENT") as Role;
        session.user.department = token.department;
        session.user.batch = token.batch;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Helper to get the session on the server side
 */
export const getServerAuthSession = () => getServerSession(authOptions);
