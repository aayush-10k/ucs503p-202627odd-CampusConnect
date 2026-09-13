import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GroupType } from "@prisma/client";

// GET /api/groups — Fetch joined groups and discoverable open groups
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const typeParam = searchParams.get("type");
    const type = Object.values(GroupType).includes(typeParam as GroupType)
      ? (typeParam as GroupType)
      : undefined;

    const currentUserId = session.user.id;

    // Fetch user's joined groups
    const joinedMemberships = await prisma.groupMember.findMany({
      where: {
        userId: currentUserId,
        group: {
          ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
          ...(type ? { type } : {}),
        },
      },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true, materials: true, posts: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const joinedGroups = joinedMemberships.map((m) => ({
      ...m.group,
      currentUserRole: m.role,
      joinedAt: m.joinedAt,
      isMember: true,
    }));

    const joinedGroupIds = joinedGroups.map((g) => g.id);

    // Fetch discoverable open groups that the user has not joined
    const discoverList = await prisma.group.findMany({
      where: {
        id: { notIn: joinedGroupIds },
        isOpen: true,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        _count: {
          select: { members: true, materials: true, posts: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const discoverGroups = discoverList.map((g) => ({
      ...g,
      currentUserRole: null,
      isMember: false,
    }));

    return NextResponse.json({
      joinedGroups,
      discoverGroups,
    });
  } catch (error: unknown) {
    console.error("GET /api/groups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/groups — Create a new academic group (TEACHER or ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Only teachers and administrators can create academic groups." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, type = "SUBJECT", isOpen = true } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required." },
        { status: 400 }
      );
    }

    if (!Object.values(GroupType).includes(type)) {
      return NextResponse.json(
        { error: `Invalid group type. Must be one of: ${Object.values(GroupType).join(", ")}` },
        { status: 400 }
      );
    }

    // Create group and make creator the group ADMIN in a transaction
    const newGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          type: type as GroupType,
          isOpen: Boolean(isOpen),
        },
      });

      await tx.groupMember.create({
        data: {
          userId: session.user.id,
          groupId: group.id,
          role: "ADMIN",
        },
      });

      return group;
    });

    return NextResponse.json(
      {
        message: "Group created successfully",
        group: {
          ...newGroup,
          currentUserRole: "ADMIN",
          isMember: true,
          _count: { members: 1, materials: 0, posts: 0 },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/groups error:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
