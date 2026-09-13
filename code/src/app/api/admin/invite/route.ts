import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// ─── Validation ───────────────────────────────────────────────────────────────

const createInviteSchema = z.object({
  role: z.nativeEnum(Role).optional().default(Role.STUDENT),
  label: z.string().max(120).trim().optional(),
  maxUses: z.number().int().min(1).max(500).optional().default(1),
  /** Hours until expiry — default 72 h */
  expiresInHours: z.number().int().min(1).max(720).optional().default(72),
});

// ─── POST /api/admin/invite — create invite link ──────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { role, label, maxUses, expiresInHours } = parsed.data;

  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const invite = await prisma.inviteToken.create({
    data: {
      role,
      label: label ?? null,
      maxUses,
      expiresAt,
      createdBy: session.user.id,
    },
    select: {
      id: true,
      token: true,
      role: true,
      label: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/join/${invite.token}`;

  return NextResponse.json(
    { message: "Invite link created.", invite, inviteUrl },
    { status: 201 }
  );
}

// ─── GET /api/admin/invite — list all invite links ───────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const invites = await prisma.inviteToken.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      role: true,
      label: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const invitesWithUrl = invites.map((inv) => ({
    ...inv,
    inviteUrl: `${baseUrl}/join/${inv.token}`,
    isExpired: inv.expiresAt < new Date(),
    isExhausted: inv.usedCount >= inv.maxUses,
  }));

  return NextResponse.json({ invites: invitesWithUrl });
}

// ─── DELETE /api/admin/invite?id=xxx — revoke an invite ──────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing invite id." }, { status: 400 });
  }

  try {
    await prisma.inviteToken.delete({ where: { id } });
    return NextResponse.json({ message: "Invite revoked." });
  } catch {
    return NextResponse.json({ message: "Invite not found." }, { status: 404 });
  }
}
