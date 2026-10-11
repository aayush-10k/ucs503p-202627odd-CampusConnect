import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  content: z.string().max(4000, "Message is too long").default(""),
  imageUrl: z.string().url().optional().nullable(),
}).refine((data) => data.content.trim().length > 0 || Boolean(data.imageUrl), {
  message: "Message must contain either text content or an image attachment",
});

// GET /api/messages — Fetch all active conversations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Fetch all messages involving the current user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      include: {
        sender: {
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
        receiver: {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group messages by conversation partner
    const conversationMap = new Map<
      string,
      {
        partner: {
          id: string;
          name: string;
          email: string;
          role: string;
          avatar: string | null;
          department: string | null;
          batch: string | null;
        };
        lastMessage: {
          id: string;
          content: string;
          imageUrl: string | null;
          createdAt: Date;
          senderId: string;
          isRead: boolean;
        };
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      const isSender = msg.senderId === currentUserId;
      const partner = isSender ? msg.receiver : msg.sender;
      const partnerId = partner.id;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            imageUrl: msg.imageUrl,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
            isRead: msg.isRead,
          },
          unreadCount: 0,
        });
      }

      // If this message was sent to current user and unread, increment count
      if (!isSender && !msg.isRead) {
        const conv = conversationMap.get(partnerId)!;
        conv.unreadCount += 1;
      }
    }

    const conversations = Array.from(conversationMap.values());

    return NextResponse.json({
      conversations,
      total: conversations.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/messages — Send a direct message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const currentUserName = session.user.name || "A classmate";

    const body = await req.json();
    const parseResult = sendMessageSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { receiverId, content, imageUrl } = parseResult.data;

    if (receiverId === currentUserId) {
      return NextResponse.json(
        { error: "Cannot send a direct message to yourself" },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, isSuspended: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    if (receiver.isSuspended) {
      return NextResponse.json(
        { error: "Cannot message a suspended account" },
        { status: 403 }
      );
    }

    // Persist message in database
    const message = await prisma.message.create({
      data: {
        senderId: currentUserId,
        receiverId,
        content: content.trim(),
        imageUrl: imageUrl || null,
        isRead: false,
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
    });

    // Generate in-app notification for the recipient
    const previewSnippet = content.trim().length > 0
      ? content.trim().slice(0, 60) + (content.trim().length > 60 ? "..." : "")
      : "sent an image attachment";

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "NEW_MESSAGE",
        message: `${currentUserName}: ${previewSnippet}`,
        link: `/messages?userId=${currentUserId}`,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
