import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/materials/[id] — Delete a course material
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;
    const isPlatformAdmin = session.user.role === "ADMIN";

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            members: {
              where: { userId: currentUserId },
            },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const isUploader = material.uploaderId === currentUserId;
    const isGroupAdmin = material.group.members.some((m) => m.role === "ADMIN");

    if (!isUploader && !isGroupAdmin && !isPlatformAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to delete this material." },
        { status: 403 }
      );
    }

    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/materials/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}
