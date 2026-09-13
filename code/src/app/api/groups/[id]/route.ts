import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GroupType } from "@prisma/client";

// GET /api/groups/[id] — Get detailed group info and membership status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                department: true,
                batch: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
          take: 12,
        },
        _count: {
          select: {
            members: true,
            materials: true,
            posts: true,
            events: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check current user's membership
    const userMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: currentUserId,
          groupId: id,
        },
      },
    });

    return NextResponse.json({
      group: {
        ...group,
        isMember: Boolean(userMembership),
        currentUserRole: userMembership?.role || null,
        joinedAt: userMembership?.joinedAt || null,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch group details" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id] — Update group details (Group ADMIN or platform ADMIN)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;
    const isPlatformAdmin = session.user.role === "ADMIN";

    // Verify permission: platform admin OR group admin
    if (!isPlatformAdmin) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: currentUserId,
            groupId: id,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only group administrators can modify group settings." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { name, description, type, isOpen } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (name && typeof name === "string" && name.trim()) {
      dataToUpdate.name = name.trim();
    }
    if (description !== undefined) {
      dataToUpdate.description = description ? description.trim() : null;
    }
    if (type && Object.values(GroupType).includes(type)) {
      dataToUpdate.type = type as GroupType;
    }
    if (typeof isOpen === "boolean") {
      dataToUpdate.isOpen = isOpen;
    }

    const updated = await prisma.group.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ group: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id] — Delete group (Group ADMIN or platform ADMIN)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;
    const isPlatformAdmin = session.user.role === "ADMIN";

    if (!isPlatformAdmin) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: currentUserId,
            groupId: id,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only group administrators can delete this group." },
          { status: 403 }
        );
      }
    }

    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/groups/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
