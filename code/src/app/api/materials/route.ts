import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/materials — Global list of materials across user's joined groups
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const groupId = searchParams.get("groupId");
    const folder = searchParams.get("folder");

    // Fetch user's joined group IDs
    const userMemberships = await prisma.groupMember.findMany({
      where: { userId: currentUserId },
      select: { groupId: true },
    });

    const joinedGroupIds = userMemberships.map((m) => m.groupId);

    const whereClause: Record<string, unknown> = {};

    if (groupId) {
      whereClause.groupId = groupId;
    } else {
      whereClause.groupId = { in: joinedGroupIds };
    }

    if (folder && folder !== "ALL") {
      whereClause.folder = folder;
    }

    if (search && search.trim()) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [materials, userGroups] = await Promise.all([
      prisma.material.findMany({
        where: whereClause,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.group.findMany({
        where: { id: { in: joinedGroupIds } },
        select: { id: true, name: true, type: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      materials,
      userGroups,
      total: materials.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/materials error:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}
