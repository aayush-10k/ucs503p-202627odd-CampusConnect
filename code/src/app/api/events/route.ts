import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventType } from "@prisma/client";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(200, "Title is too long"),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(EventType).optional().default(EventType.OTHER),
  startDate: z.string().datetime({ message: "Valid ISO startDate is required" }).or(z.string().min(1)),
  endDate: z.string().datetime().or(z.string().min(1)).optional().nullable(),
  isPrivate: z.boolean().optional().default(false),
  groupId: z.string().optional().nullable(),
});

// GET /api/events — Fetch all events relevant to current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);

    const typeParam = searchParams.get("type");
    const groupIdParam = searchParams.get("groupId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const monthParam = searchParams.get("month"); // 1-12
    const yearParam = searchParams.get("year");   // e.g. 2026

    // Get user's joined groups
    const memberships = await prisma.groupMember.findMany({
      where: { userId: currentUserId },
      select: { groupId: true },
    });
    const joinedGroupIds = memberships.map((m) => m.groupId);

    // Build the query where clause
    const whereConditions: Record<string, unknown>[] = [];

    // Group / Scope filter
    if (groupIdParam) {
      if (groupIdParam === "personal") {
        // Only personal events created by the user with no group attached
        whereConditions.push({
          creatorId: currentUserId,
          groupId: null,
        });
      } else {
        // Specific group
        if (!joinedGroupIds.includes(groupIdParam) && session.user.role !== "ADMIN") {
          return NextResponse.json(
            { error: "You are not a member of this group" },
            { status: 403 }
          );
        }
        whereConditions.push({ groupId: groupIdParam });
      }
    } else {
      // General feed: User's own events OR public events in groups user belongs to
      whereConditions.push({
        OR: [
          { creatorId: currentUserId },
          {
            groupId: { in: joinedGroupIds },
            isPrivate: false,
          },
        ],
      });
    }

    // Event Type filter
    if (typeParam && Object.values(EventType).includes(typeParam as EventType)) {
      whereConditions.push({ type: typeParam as EventType });
    }

    // Date range filter
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
    } else if (monthParam && yearParam) {
      const year = parseInt(yearParam, 10);
      const month = parseInt(monthParam, 10) - 1; // 0-indexed JS month
      if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
        const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        whereConditions.push({
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        });
      }
    }

    const events = await prisma.event.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : {},
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
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events — Create a personal or group event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserRole = session.user.role;
    const currentUserName = session.user.name || "A member";

    const body = await req.json();
    const parseResult = createEventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { title, description, type, startDate, endDate, isPrivate, groupId } = parseResult.data;

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

    // If associating with a group
    let targetGroup = null;
    if (groupId) {
      targetGroup = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          members: {
            where: { userId: currentUserId },
          },
        },
      });

      if (!targetGroup) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }

      const membership = targetGroup.members[0];
      const isGroupAdmin = membership?.role === "ADMIN";
      const isAuthorizedRole = currentUserRole === "TEACHER" || currentUserRole === "ADMIN";

      if (!isGroupAdmin && !isAuthorizedRole) {
        return NextResponse.json(
          { error: "Only Teachers, Platform Admins, or Group Admins can schedule group events" },
          { status: 403 }
        );
      }
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isPrivate: isPrivate ?? false,
        groupId: groupId || null,
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

    // Task 6.3: If it's a group event, notify all other members
    if (groupId && targetGroup) {
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
            message: `${currentUserName} scheduled a new ${formattedType}: "${event.title}" in ${targetGroup.name}`,
            link: `/groups/${groupId}/schedule`,
          })),
        });
      }
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
