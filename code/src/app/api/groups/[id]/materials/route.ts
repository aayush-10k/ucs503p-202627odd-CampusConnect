import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/cloudinary";

// Helper to determine normalized fileType string from mime or filename
function extractFileType(filename: string, mimeType?: string): string {
  if (mimeType?.includes("pdf") || filename.toLowerCase().endsWith(".pdf")) return "PDF";
  if (mimeType?.includes("word") || filename.match(/\.(docx?|odt)$/i)) return "DOC";
  if (mimeType?.includes("presentation") || filename.match(/\.(pptx?|key)$/i)) return "PPT";
  if (mimeType?.includes("spreadsheet") || filename.match(/\.(xlsx?|csv)$/i)) return "SHEET";
  if (mimeType?.includes("image") || filename.match(/\.(png|jpe?g|webp|gif|svg)$/i)) return "IMAGE";
  if (mimeType?.includes("zip") || filename.match(/\.(zip|tar|gz|rar|7z)$/i)) return "ARCHIVE";
  return "OTHER";
}

// GET /api/groups/[id]/materials — List materials for a group with folder/search filters
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder");
    const search = searchParams.get("search");

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const whereClause: Record<string, unknown> = {
      groupId,
    };

    if (folder && folder !== "ALL") {
      whereClause.folder = folder;
    }

    if (search && search.trim()) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [materials, allFoldersRecords] = await Promise.all([
      prisma.material.findMany({
        where: whereClause,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.material.findMany({
        where: { groupId },
        select: { folder: true },
        distinct: ["folder"],
      }),
    ]);

    const folders = Array.from(
      new Set(
        allFoldersRecords
          .map((r) => r.folder)
          .filter((f): f is string => Boolean(f && f.trim()))
      )
    );

    return NextResponse.json({
      materials,
      folders,
      total: materials.length,
    });
  } catch (error: unknown) {
    console.error("GET /api/groups/[id]/materials error:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/materials — Upload and record a course material
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const currentUserId = session.user.id;
    const currentUserRole = session.user.role;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Verify membership: caller must be a member of the group, or platform ADMIN
    if (currentUserRole !== "ADMIN") {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: currentUserId,
            groupId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You must be a member of this group to upload course materials." },
          { status: 403 }
        );
      }
    }

    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let description: string | null = null;
    let folder: string = "General";
    let fileUrl = "";
    let fileType = "OTHER";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      title = (formData.get("title") as string) || "";
      description = (formData.get("description") as string) || null;
      folder = (formData.get("folder") as string) || "General";

      if (!file) {
        return NextResponse.json({ error: "File is required" }, { status: 400 });
      }

      if (!title.trim()) {
        title = file.name.replace(/\.[^/.]+$/, "");
      }

      fileType = extractFileType(file.name, file.type);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResult = await uploadFile(
        buffer,
        `campusconnect/materials/${groupId}`
      );
      fileUrl = uploadResult.url;
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      title = body.title || "";
      description = body.description || null;
      folder = body.folder || "General";
      fileUrl = body.fileUrl || "";
      fileType = body.fileType ? body.fileType.toUpperCase() : "OTHER";

      if (!fileUrl) {
        return NextResponse.json({ error: "fileUrl is required" }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type. Use multipart/form-data or application/json." },
        { status: 400 }
      );
    }

    if (!title.trim()) {
      return NextResponse.json({ error: "Material title is required." }, { status: 400 });
    }

    const material = await prisma.material.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        fileUrl,
        fileType,
        folder: folder.trim() || "General",
        groupId,
        uploaderId: currentUserId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Material uploaded successfully",
        material,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/groups/[id]/materials error:", error);
    return NextResponse.json(
      { error: "Failed to upload material" },
      { status: 500 }
    );
  }
}
