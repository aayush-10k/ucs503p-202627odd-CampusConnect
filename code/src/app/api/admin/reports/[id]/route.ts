import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";

const resolveReportSchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  action: z.enum(["APPROVE", "DISMISS", "REMOVE_POST"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Report ID is required." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = resolveReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const report = await prisma.moderationReport.findUnique({
    where: { id },
    include: { post: true },
  });

  if (!report) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  const { status, action } = parsed.data;

  // Determine target report status
  let finalStatus: ReportStatus = ReportStatus.REVIEWED;
  if (status) {
    finalStatus = status;
  } else if (action === "REMOVE_POST") {
    finalStatus = ReportStatus.REMOVED;
  } else if (action === "DISMISS") {
    finalStatus = ReportStatus.DISMISSED;
  } else if (action === "APPROVE") {
    finalStatus = ReportStatus.REVIEWED;
  }

  try {
    // Transaction to update report and post in sync
    const [updatedReport] = await prisma.$transaction([
      prisma.moderationReport.update({
        where: { id },
        data: {
          status: finalStatus,
          reviewedAt: new Date(),
        },
        include: {
          post: true,
          reporter: { select: { id: true, name: true, email: true } },
        },
      }),
      // Post side-effects based on final moderation status
      ...(finalStatus === ReportStatus.REMOVED
        ? [
            prisma.post.update({
              where: { id: report.postId },
              data: {
                isHidden: true,
                isFlagged: true,
                flagReason: report.reason || "Content removed by platform administrator.",
              },
            }),
          ]
        : finalStatus === ReportStatus.DISMISSED
        ? [
            prisma.post.update({
              where: { id: report.postId },
              data: {
                isHidden: false,
                isFlagged: false,
                flagReason: null,
              },
            }),
          ]
        : [
            prisma.post.update({
              where: { id: report.postId },
              data: {
                isHidden: true,
                isFlagged: true,
              },
            }),
          ]),
    ]);

    return NextResponse.json({
      message: `Report marked as ${finalStatus}.`,
      report: updatedReport,
    });
  } catch (error: unknown) {
    console.error("Error resolving report:", error);
    return NextResponse.json({ message: "Failed to resolve report" }, { status: 500 });
  }
}
