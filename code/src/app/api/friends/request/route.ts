import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const body = await req.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
    }

    if (currentUserId === receiverId) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json({ error: "User does not exist" }, { status: 404 });
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: currentUserId, userBId: receiverId },
          { userAId: receiverId, userBId: currentUserId },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: "You are already friends with this user" }, { status: 400 });
    }

    // Check if pending request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId, status: "PENDING" },
          { senderId: receiverId, receiverId: currentUserId, status: "PENDING" },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.senderId === currentUserId) {
        return NextResponse.json({ error: "Friend request already sent and pending" }, { status: 400 });
      } else {
        return NextResponse.json({
          error: "This user has already sent you a request. You can accept it from your Requests tab.",
          pendingRequestId: existingRequest.id,
        }, { status: 400 });
      }
    }

    // Upsert or create friend request
    const friendRequest = await prisma.friendRequest.upsert({
      where: {
        senderId_receiverId: {
          senderId: currentUserId,
          receiverId,
        },
      },
      update: {
        status: "PENDING",
      },
      create: {
        senderId: currentUserId,
        receiverId,
        status: "PENDING",
      },
    });

    // Create Notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "FRIEND_REQUEST",
        message: `${session.user.name || "A user"} sent you a friend request.`,
        link: `/friends`,
      },
    });

    return NextResponse.json({ success: true, request: friendRequest }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Friend Request API] Error:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}
