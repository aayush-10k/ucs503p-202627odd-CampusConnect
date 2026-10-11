import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/messages/[userId] — Fetch message history with a specific peer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: partnerId } = await params;
    const currentUserId = session.user.id;

    // Fetch the conversation partner's profile
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        department: true,
        batch: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Retrieve full message history between these two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: partnerId },
          { senderId: partnerId, receiverId: currentUserId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Mark unread messages sent by the partner to current user as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      messages,
      partner,
      total: messages.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/messages/[userId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch message history" },
      { status: 500 }
    );
  }
}
