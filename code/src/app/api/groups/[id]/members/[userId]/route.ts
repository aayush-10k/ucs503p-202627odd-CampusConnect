import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GroupMemberRole } from "@prisma/client";

// DELETE /api/groups/[id]/members/[userId] — Leave group or remove a member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId, userId: targetUserId } = await params;
    const currentUserId = session.user.id;
    const isPlatformAdmin = session.user.role === "ADMIN";

    // Verify target membership exists
    const targetMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Target user is not a member of this group." },
        { status: 404 }
      );
    }

    const isSelf = currentUserId === targetUserId;

    if (!isSelf && !isPlatformAdmin) {
      // Check caller's group role
      const callerMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: currentUserId,
            groupId,
          },
        },
      });

      if (!callerMembership || callerMembership.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only group administrators can remove members from the group." },
          { status: 403 }
        );
      }
    }

    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: isSelf ? "You have left the group." : "Member removed from the group.",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/groups/[id]/members/[userId] error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id]/members/[userId] — Change member role (ADMIN / MEMBER)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId, userId: targetUserId } = await params;
    const currentUserId = session.user.id;
    const isPlatformAdmin = session.user.role === "ADMIN";

    // Only group ADMIN or platform ADMIN can alter member roles
    if (!isPlatformAdmin) {
      const callerMembership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: currentUserId,
            groupId,
          },
        },
      });

      if (!callerMembership || callerMembership.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only group administrators can change member roles." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { role } = body;

    if (!role || !Object.values(GroupMemberRole).includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${Object.values(GroupMemberRole).join(", ")}` },
        { status: 400 }
      );
    }

    const updated = await prisma.groupMember.update({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
      data: {
        role: role as GroupMemberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      membership: updated,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/groups/[id]/members/[userId] error:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
