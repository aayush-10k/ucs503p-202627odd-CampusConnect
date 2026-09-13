import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const body = await req.json();
    const { action } = body;

    if (!action || (action !== "ACCEPT" && action !== "REJECT")) {
      return NextResponse.json({ error: "action must be 'ACCEPT' or 'REJECT'" }, { status: 400 });
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    // Only the receiver can accept or reject the request
    if (request.receiverId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden: Not authorized to resolve this request" }, { status: 403 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: `Request already marked as ${request.status}` }, { status: 400 });
    }

    if (action === "ACCEPT") {
      // Canonicalize userAId and userBId (alphabetical sort)
      const [userAId, userBId] = [request.senderId, request.receiverId].sort();

      // Transaction: update request, create friendship, create notification
      await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id },
          data: { status: "ACCEPTED" },
        }),
        prisma.friendship.upsert({
          where: {
            userAId_userBId: { userAId, userBId },
          },
          update: {},
          create: { userAId, userBId },
        }),
        prisma.notification.create({
          data: {
            userId: request.senderId,
            type: "FRIEND_ACCEPTED",
            message: `${session.user.name || "A user"} accepted your friend request.`,
            link: `/profile/${currentUserId}`,
          },
        }),
      ]);

      return NextResponse.json({ success: true, status: "ACCEPTED" });
    } else {
      await prisma.friendRequest.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({ success: true, status: "REJECTED" });
    }
  } catch (error: unknown) {
    console.error("[Friend Request Resolution API] Error:", error);
    return NextResponse.json({ error: "Failed to resolve friend request" }, { status: 500 });
  }
}
