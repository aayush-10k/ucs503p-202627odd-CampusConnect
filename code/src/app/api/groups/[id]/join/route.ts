import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/groups/[id]/join — Join an open group
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

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: currentUserId,
          groupId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this group." },
        { status: 400 }
      );
    }

    if (!group.isOpen) {
      return NextResponse.json(
        { error: "This group is private/closed. An invitation from a group administrator is required." },
        { status: 403 }
      );
    }

    const membership = await prisma.groupMember.create({
      data: {
        userId: currentUserId,
        groupId,
        role: "MEMBER",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Joined ${group.name} successfully!`,
      membership,
    });
  } catch (error: unknown) {
    console.error("POST /api/groups/[id]/join error:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
