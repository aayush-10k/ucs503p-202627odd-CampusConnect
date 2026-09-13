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

    // Get current user profile
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { department: true, batch: true },
    });

    // 1. Get confirmed friends to exclude
    const existingFriendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
      },
    });
    const friendIds = existingFriendships.map((f) =>
      f.userAId === currentUserId ? f.userBId : f.userAId
    );

    // 2. Get pending requests to exclude
    const pendingRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
        status: "PENDING",
      },
    });
    const pendingIds = pendingRequests.map((r) =>
      r.senderId === currentUserId ? r.receiverId : r.senderId
    );

    const excludedIds = Array.from(new Set([currentUserId, ...friendIds, ...pendingIds]));

    // 3. Find peers: first prioritize same department or batch, then general campus users
    interface SuggestedUser {
      id: string;
      name: string;
      email: string;
      role: string;
      avatar: string | null;
      department: string | null;
      batch: string | null;
    }
    let suggestions: SuggestedUser[] = [];

    if (currentUser?.department || currentUser?.batch) {
      suggestions = await prisma.user.findMany({
        where: {
          id: { notIn: excludedIds },
          isSuspended: false,
          OR: [
            ...(currentUser.department ? [{ department: currentUser.department }] : []),
            ...(currentUser.batch ? [{ batch: currentUser.batch }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          department: true,
          batch: true,
        },
        take: 12,
      });
    }

    // If fewer than 6 suggestions, fill with other campus members
    if (suggestions.length < 6) {
      const moreExcluded = Array.from(new Set([...excludedIds, ...suggestions.map((s) => s.id)]));
      const fallbackUsers = await prisma.user.findMany({
        where: {
          id: { notIn: moreExcluded },
          isSuspended: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          department: true,
          batch: true,
        },
        take: 12 - suggestions.length,
      });
      suggestions = [...suggestions, ...fallbackUsers];
    }

    // Attach match reason
    const annotatedSuggestions = suggestions.map((user) => {
      let reason = "Campus Member";
      if (user.department && user.department === currentUser?.department) {
        reason = `Same Department (${user.department})`;
      } else if (user.batch && user.batch === currentUser?.batch) {
        reason = `Same Batch (${user.batch})`;
      }
      return {
        ...user,
        reason,
      };
    });

    return NextResponse.json({ suggestions: annotatedSuggestions });
  } catch (error: unknown) {
    console.error("[Friend Suggestions API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch friend suggestions" }, { status: 500 });
  }
}
