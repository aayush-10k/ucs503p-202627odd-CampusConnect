import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateContent } from "@/lib/gemini";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comments = await prisma.comment.findMany({
      where: { postId: id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            department: true,
            batch: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error: unknown) {
    console.error("[Comments API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

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
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // AI content moderation check on comment
    try {
      const moderation = await moderateContent(content, "MODERATE");
      if (moderation.flagged) {
        return NextResponse.json(
          {
            error: `Comment blocked by safety rules: ${moderation.reason || "Content violates community policy"}`,
          },
          { status: 400 }
        );
      }
    } catch (modErr) {
      console.warn("[Comments API] Moderation fallback:", modErr);
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId: id,
        authorId: currentUserId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            department: true,
            batch: true,
          },
        },
      },
    });

    // Notify author if commenting on someone else's post
    if (post.authorId !== currentUserId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "POST_COMMENT",
          message: `${session.user.name || "A user"} commented on your post.`,
          link: `/feed`,
        },
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Comments API] POST error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
