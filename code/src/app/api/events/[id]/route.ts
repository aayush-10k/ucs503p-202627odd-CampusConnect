import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventType } from "@prisma/client";
import { z } from "zod";

const updateEventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(200, "Title is too long").optional(),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(EventType).optional(),
  startDate: z.string().datetime().or(z.string().min(1)).optional(),
  endDate: z.string().datetime().or(z.string().min(1)).optional().nullable(),
  isPrivate: z.boolean().optional(),
});

// GET /api/events/[id] — Fetch single event details
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

    const event = await prisma.event.findUnique({
      where: { id },
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

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Access check: If private and not creator
    if (event.isPrivate && event.creatorId !== currentUserId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // If attached to a group, verify membership or public access
    if (event.groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: currentUserId,
            groupId: event.groupId,
          },
        },
      });

      if (!membership && session.user.role !== "ADMIN" && event.creatorId !== currentUserId) {
        return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 });
      }
    }

    return NextResponse.json({ event });
  } catch (error: unknown) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PATCH /api/events/[id] — Update an existing event
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
    const currentUserRole = session.user.role;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check edit authorization
    let isAuthorized = event.creatorId === currentUserId || currentUserRole === "ADMIN";

    if (!isAuthorized && event.groupId) {
      const groupAdminMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: event.groupId,
          userId: currentUserId,
          role: "ADMIN",
        },
      });
      if (groupAdminMembership) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You do not have permission to modify this event" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = updateEventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { title, description, type, startDate, endDate, isPrivate } = parseResult.data;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (type !== undefined) updateData.type = type;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    if (startDate !== undefined) {
      const parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        return NextResponse.json({ error: "Invalid startDate format" }, { status: 400 });
      }
      updateData.startDate = parsedStart;
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        updateData.endDate = null;
      } else {
        const parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return NextResponse.json({ error: "Invalid endDate format" }, { status: 400 });
        }
        updateData.endDate = parsedEnd;
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ event: updatedEvent });
  } catch (error: unknown) {
    console.error("PATCH /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] — Delete an event
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
    const currentUserRole = session.user.role;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check delete authorization
    let isAuthorized = event.creatorId === currentUserId || currentUserRole === "ADMIN";

    if (!isAuthorized && event.groupId) {
      const groupAdminMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: event.groupId,
          userId: currentUserId,
          role: "ADMIN",
        },
      });
      if (groupAdminMembership) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You do not have permission to delete this event" },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
