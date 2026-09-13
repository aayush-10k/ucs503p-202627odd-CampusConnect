import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/groups/[id]/invite — Invite / add a user to the group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const currentUserId = session.user.id;
    const currentUserRole = session.user.role;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Verify inviter permissions: group ADMIN, or platform TEACHER/ADMIN
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: currentUserId,
          groupId,
        },
      },
    });

    const isGroupAdmin = membership?.role === "ADMIN";
    const isPlatformPrivileged = currentUserRole === "ADMIN" || currentUserRole === "TEACHER";

    if (!isGroupAdmin && !isPlatformPrivileged) {
      return NextResponse.json(
        { error: "Only group administrators or teachers can invite members." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, email } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Please provide either a user ID or email address to invite." },
        { status: 400 }
      );
    }

    // Lookup target user
    const targetUser = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: { equals: email.trim(), mode: "insensitive" } },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "No user found with the provided credentials." },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingTargetMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: targetUser.id,
          groupId,
        },
      },
    });

    if (existingTargetMembership) {
      return NextResponse.json(
        { error: `${targetUser.name} is already a member of this group.` },
        { status: 400 }
      );
    }

    // Add target user to the group
    const newMembership = await prisma.groupMember.create({
      data: {
        userId: targetUser.id,
        groupId,
        role: "MEMBER",
      },
    });

    // Notify target user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: "GROUP_INVITE",
        message: `${session.user.name || "A team member"} added you to the group "${group.name}".`,
        link: `/groups/${groupId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${targetUser.name} to ${group.name}.`,
      membership: newMembership,
      user: targetUser,
    });
  } catch (error: unknown) {
    console.error("POST /api/groups/[id]/invite error:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}
