import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

    // Delete existing friendship record
    const result = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userAId: currentUserId, userBId: id },
          { userAId: id, userBId: currentUserId },
        ],
      },
    });

    // Also clean up any lingering FriendRequest records between them
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: id },
          { senderId: id, receiverId: currentUserId },
        ],
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: unknown) {
    console.error("[Unfriend API] Error:", error);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}
