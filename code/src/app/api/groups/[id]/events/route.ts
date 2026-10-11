import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventType } from "@prisma/client";
import { z } from "zod";

const createGroupEventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(200, "Title is too long"),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(EventType).optional().default(EventType.LECTURE),
  startDate: z.string().datetime().or(z.string().min(1)),
  endDate: z.string().datetime().or(z.string().min(1)).optional().nullable(),
});

// GET /api/groups/[id]/events — Fetch all events for a specific group
export async function GET(
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

    // Access check: User must be a member of the group, group must be open, or user is platform ADMIN
    if (currentUserRole !== "ADMIN" && !group.isOpen) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: currentUserId,
            groupId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You do not have access to this group's schedule" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const typeParam = searchParams.get("type");

    const whereConditions: Record<string, unknown>[] = [{ groupId }];

    if (typeParam && Object.values(EventType).includes(typeParam as EventType)) {
      whereConditions.push({ type: typeParam as EventType });
    }

    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        whereConditions.push({
          startDate: {
            gte: start,
            lte: end,
          },
        });
      }
    }

    const events = await prisma.event.findMany({
      where: { AND: whereConditions },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json({
      events,
      total: events.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/groups/[id]/events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch group events" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/events — Schedule a new event within a group
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
    const currentUserName = session.user.name || "A member";

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId: currentUserId },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Role verification: Must be group ADMIN, platform ADMIN, or TEACHER
    const membership = group.members[0];
    const isGroupAdmin = membership?.role === "ADMIN";
    const isAuthorizedRole = currentUserRole === "TEACHER" || currentUserRole === "ADMIN";

    if (!isGroupAdmin && !isAuthorizedRole) {
      return NextResponse.json(
        { error: "Only Teachers, Platform Admins, or Group Admins can schedule group events" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = createGroupEventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { title, description, type, startDate, endDate } = parseResult.data;

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : null;

    if (isNaN(parsedStartDate.getTime())) {
      return NextResponse.json({ error: "Invalid startDate format" }, { status: 400 });
    }

    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      return NextResponse.json({ error: "Invalid endDate format" }, { status: 400 });
    }

    if (parsedEndDate && parsedEndDate < parsedStartDate) {
      return NextResponse.json({ error: "End date cannot be earlier than start date" }, { status: 400 });
    }

    // Create the group event
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isPrivate: false,
        groupId,
        creatorId: currentUserId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Task 6.3: Notify all other group members of the new schedule event
    const otherMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { not: currentUserId },
      },
      select: { userId: true },
    });

    if (otherMembers.length > 0) {
      const formattedType = type.charAt(0) + type.slice(1).toLowerCase();
      await prisma.notification.createMany({
        data: otherMembers.map((m) => ({
          userId: m.userId,
          type: "NEW_EVENT",
          message: `${currentUserName} scheduled a new ${formattedType}: "${event.title}" in ${group.name}`,
          link: `/groups/${groupId}/schedule`,
        })),
      });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/groups/[id]/events error:", error);
    return NextResponse.json(
      { error: "Failed to create group event" },
      { status: 500 }
    );
  }
}
