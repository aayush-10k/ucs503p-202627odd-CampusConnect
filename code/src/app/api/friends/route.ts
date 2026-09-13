import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
      },
      include: {
        userA: {
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
        userB: {
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
      orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map((f) => {
      const friend = f.userAId === currentUserId ? f.userB : f.userA;
      return {
        friendshipId: f.id,
        createdAt: f.createdAt,
        ...friend,
      };
    });

    return NextResponse.json({ friends });
  } catch (error: unknown) {
    console.error("[Friends List API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch friends list" }, { status: 500 });
  }
}
