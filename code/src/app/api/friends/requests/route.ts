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

    const [incoming, outgoing] = await Promise.all([
      prisma.friendRequest.findMany({
        where: {
          receiverId: currentUserId,
          status: "PENDING",
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
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.friendRequest.findMany({
        where: {
          senderId: currentUserId,
          status: "PENDING",
        },
        include: {
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
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ incoming, outgoing });
  } catch (error: unknown) {
    console.error("[Friend Requests API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch friend requests" }, { status: 500 });
  }
}
