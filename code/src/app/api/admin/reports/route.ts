import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, ReportStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const statusParam = searchParams.get("status")?.toUpperCase();
  const aiFlaggedParam = searchParams.get("aiFlagged");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.ModerationReportWhereInput = {};

    if (statusParam && statusParam !== "ALL" && Object.values(ReportStatus).includes(statusParam as ReportStatus)) {
      whereClause.status = statusParam as ReportStatus;
    }

    if (aiFlaggedParam === "true") {
      whereClause.aiFlagged = true;
    } else if (aiFlaggedParam === "false") {
      whereClause.aiFlagged = false;
    }

    const [total, reports] = await Promise.all([
      prisma.moderationReport.count({ where: whereClause }),
      prisma.moderationReport.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              imageUrl: true,
              isFlagged: true,
              flagReason: true,
              isHidden: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching moderation reports:", error);
    return NextResponse.json({ message: "Failed to fetch reports" }, { status: 500 });
  }
}
