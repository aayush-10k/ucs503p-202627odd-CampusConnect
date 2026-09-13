import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateContent } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const authorId = searchParams.get("authorId");
    const groupId = searchParams.get("groupId");
    const statusFilter = searchParams.get("status"); // "ALL" | "PUBLISHED" | "FLAGGED"
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    const isOwnerOrAdmin = Boolean(
      currentUserId && (currentUserId === authorId || session?.user?.role === "ADMIN")
    );

    const whereClause: Record<string, unknown> = {};

    if (authorId) {
      whereClause.authorId = authorId;
      if (isOwnerOrAdmin) {
        if (statusFilter === "FLAGGED") {
          whereClause.isFlagged = true;
        } else if (statusFilter === "PUBLISHED") {
          whereClause.isHidden = false;
        }
        // If "ALL" or not specified, do not filter by isHidden so owner sees all their posts
      } else {
        whereClause.isHidden = false;
      }
    } else {
      whereClause.isHidden = false;
    }

    if (groupId) {
      whereClause.groupId = groupId;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          ...(currentUserId
            ? {
                likes: {
                  where: { userId: currentUserId },
                  select: { id: true },
                },
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      author: post.author,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      hasLiked: Boolean(post.likes && post.likes.length > 0),
      isFlagged: post.isFlagged,
      flagReason: post.flagReason,
      isHidden: post.isHidden,
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("[Posts API] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const body = await req.json();
    const { content, imageUrl, groupId } = body;

    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: "Post must contain text or an image." },
        { status: 400 }
      );
    }

    // Run AI content moderation on text
    let isFlagged = false;
    let flagReason: string | null = null;
    let isHidden = false;

    if (content && content.trim().length > 0) {
      try {
        const moderationResult = await moderateContent(content, "MODERATE");
        if (moderationResult.flagged) {
          isFlagged = true;
          flagReason = moderationResult.reason || "Violates community guidelines";
          isHidden = true;
        }
      } catch (modErr) {
        console.warn("[Posts API] Moderation error, proceeding with unflagged:", modErr);
      }
    }

    // Create post in DB
    const post = await prisma.post.create({
      data: {
        content: content || "",
        imageUrl: imageUrl || null,
        authorId: currentUserId,
        groupId: groupId || null,
        isFlagged,
        flagReason,
        isHidden,
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // If flagged, create ModerationReport for admin queue
    if (isFlagged) {
      await prisma.moderationReport.create({
        data: {
          postId: post.id,
          reporterId: currentUserId,
          reason: `Automated AI Moderation: ${flagReason}`,
          aiFlagged: true,
          aiReason: flagReason,
          status: "PENDING",
        },
      });

      return NextResponse.json(
        {
          post,
          warning:
            "Your post was automatically flagged by CampusConnect AI safety rules and submitted for administrative review.",
          flagged: true,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ post, flagged: false }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Posts API] POST error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
