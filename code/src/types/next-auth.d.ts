import { Role } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string | null;
      batch?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: Role;
    department?: string | null;
    batch?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: Role;
    department?: string | null;
    batch?: string | null;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role?: Role;
    department?: string | null;
    batch?: string | null;
  }
}
