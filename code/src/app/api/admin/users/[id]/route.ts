import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isSuspended: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "User ID is required." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  // Self-protection guard
  if (session.user.id === id) {
    if (parsed.data.isSuspended === true) {
      return NextResponse.json(
        { message: "You cannot suspend your own admin account." },
        { status: 400 }
      );
    }
    if (parsed.data.role && parsed.data.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You cannot demote your own admin account." },
        { status: 400 }
      );
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
        batch: true,
        isVerified: true,
        isSuspended: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "User ID is required." }, { status: 400 });
  }

  // Self-protection guard
  if (session.user.id === id) {
    return NextResponse.json(
      { message: "You cannot delete your own admin account." },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
  }
}
