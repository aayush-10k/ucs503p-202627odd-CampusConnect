import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/invite/validate?token=xxx
 *
 * Public endpoint — validates an invite token without consuming it.
 * Used by the /join/[token] page to check validity before showing the form.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, reason: "No token provided." }, { status: 400 });
  }

  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    select: {
      role: true,
      label: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
    },
  });

  if (!invite) {
    return NextResponse.json({ valid: false, reason: "Invite link not found or already revoked." });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, reason: "This invite link has expired." });
  }

  if (invite.usedCount >= invite.maxUses) {
    return NextResponse.json({ valid: false, reason: "This invite link has already been used the maximum number of times." });
  }

  return NextResponse.json({
    valid: true,
    role: invite.role,
    label: invite.label ?? null,
    expiresAt: invite.expiresAt.toISOString(),
  });
}
