import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() || "";
  const roleParam = searchParams.get("role")?.toUpperCase();
  const statusParam = searchParams.get("status")?.toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.UserWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleParam && roleParam !== "ALL" && Object.values(Role).includes(roleParam as Role)) {
      whereClause.role = roleParam as Role;
    }

    if (statusParam === "ACTIVE") {
      whereClause.isSuspended = false;
    } else if (statusParam === "SUSPENDED") {
      whereClause.isSuspended = true;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          department: true,
          batch: true,
          isVerified: true,
          isSuspended: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              groupMemberships: true,
              materials: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}
