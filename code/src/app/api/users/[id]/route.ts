import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        department: true,
        batch: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compute friend count
    const friendCount = await prisma.friendship.count({
      where: {
        OR: [{ userAId: id }, { userBId: id }],
      },
    });

    // Compute relationship status with current user
    let relationship: "SELF" | "FRIENDS" | "PENDING_SENT" | "PENDING_RECEIVED" | "NOT_FRIENDS" = "NOT_FRIENDS";
    let pendingRequestId: string | null = null;

    if (currentUserId) {
      if (currentUserId === id) {
        relationship = "SELF";
      } else {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userAId: currentUserId, userBId: id },
              { userAId: id, userBId: currentUserId },
            ],
          },
        });

        if (friendship) {
          relationship = "FRIENDS";
        } else {
          const sentReq = await prisma.friendRequest.findFirst({
            where: {
              senderId: currentUserId,
              receiverId: id,
              status: "PENDING",
            },
          });

          if (sentReq) {
            relationship = "PENDING_SENT";
            pendingRequestId = sentReq.id;
          } else {
            const receivedReq = await prisma.friendRequest.findFirst({
              where: {
                senderId: id,
                receiverId: currentUserId,
                status: "PENDING",
              },
            });

            if (receivedReq) {
              relationship = "PENDING_RECEIVED";
              pendingRequestId = receivedReq.id;
            }
          }
        }
      }
    }

    // Compute post counts
    const isSelfOrAdmin = Boolean(
      currentUserId && (currentUserId === id || session?.user?.role === "ADMIN")
    );

    const [publishedPostCount, flaggedPostCount] = await Promise.all([
      prisma.post.count({ where: { authorId: id, isHidden: false } }),
      isSelfOrAdmin
        ? prisma.post.count({ where: { authorId: id, isFlagged: true } })
        : Promise.resolve(0),
    ]);

    return NextResponse.json({
      user: {
        ...user,
        friendCount,
        postCount: isSelfOrAdmin ? user._count.posts : publishedPostCount,
        publishedPostCount,
        flaggedPostCount,
      },
      relationship,
      pendingRequestId,
    });
  } catch (error: unknown) {
    console.error("[User Profile API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

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

    // Only user themselves or ADMIN can update profile
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { bio, department, batch, avatar, name } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(department !== undefined && { department }),
        ...(batch !== undefined && { batch }),
        ...(avatar !== undefined && { avatar }),
        ...(name !== undefined && session.user.role === "ADMIN" && { name }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        department: true,
        batch: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: unknown) {
    console.error("[User Profile API] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
