import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  try {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      suspendedUsers,
      verifiedUsers,
      totalGroups,
      totalPosts,
      flaggedPosts,
      pendingReports,
      activeInvites,
      recentUsers,
      recentReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.group.count(),
      prisma.post.count(),
      prisma.post.count({ where: { isFlagged: true } }),
      prisma.moderationReport.count({ where: { status: "PENDING" } }),
      prisma.inviteToken.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          isSuspended: true,
          createdAt: true,
        },
      }),
      prisma.moderationReport.findMany({
        take: 5,
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          post: { select: { id: true, content: true, author: { select: { name: true } } } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        suspendedUsers,
        verifiedUsers,
        totalGroups,
        totalPosts,
        flaggedPosts,
        pendingReports,
        activeInvites,
      },
      recentUsers,
      recentReports,
    });
  } catch (error: unknown) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ message: "Failed to fetch admin stats" }, { status: 500 });
  }
}
