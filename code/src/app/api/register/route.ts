import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// ─── Validation Schema ────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  role: z.nativeEnum(Role).optional().default(Role.STUDENT),
  department: z.string().max(100).trim().optional(),
  batch: z.string().max(20).trim().optional(),
  /** If provided, validates against InviteToken and uses the token’s role */
  inviteToken: z.string().optional(),
});

// ─── POST /api/register ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    const { name, email, password, role: requestedRole, department, batch, inviteToken } = parsed.data;

    // ── Invite token flow ────────────────────────────────────────────────────
    let resolvedRole = requestedRole;

    if (inviteToken) {
      const invite = await prisma.inviteToken.findUnique({
        where: { token: inviteToken },
      });

      if (!invite) {
        return NextResponse.json(
          { message: "Invite link is invalid or has been revoked." },
          { status: 400 }
        );
      }
      if (invite.expiresAt < new Date()) {
        return NextResponse.json(
          { message: "This invite link has expired." },
          { status: 400 }
        );
      }
      if (invite.usedCount >= invite.maxUses) {
        return NextResponse.json(
          { message: "This invite link has already reached its usage limit." },
          { status: 400 }
        );
      }
      // Use the role defined by the invite, not what the client sent
      resolvedRole = invite.role;
    }

    // ── Block self-assigning ADMIN on open registration ──────────────────────
    if (resolvedRole === Role.ADMIN && !inviteToken) {
      return NextResponse.json(
        { message: "You cannot register as an admin. Contact your administrator." },
        { status: 403 }
      );
    }

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (and increment invite usedCount) in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: resolvedRole,
          department: department ?? null,
          batch: batch ?? null,
          isVerified: false,
          isSuspended: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (inviteToken) {
        await tx.inviteToken.update({
          where: { token: inviteToken },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newUser;
    });

    return NextResponse.json(
      {
        message: "Account created successfully. You can now sign in.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/register]", error);
    return NextResponse.json(
      { message: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
