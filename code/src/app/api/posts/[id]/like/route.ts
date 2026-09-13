import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: id,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          userId: currentUserId,
          postId: id,
        },
      });
      liked = true;

      // Notify post author if not liking own post
      if (post.authorId !== currentUserId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "POST_LIKE",
            message: `${session.user.name || "A user"} liked your post.`,
            link: `/feed`,
          },
        });
      }
    }

    const likeCount = await prisma.like.count({
      where: { postId: id },
    });

    return NextResponse.json({ liked, likeCount });
  } catch (error: unknown) {
    console.error("[Like API] Error:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
