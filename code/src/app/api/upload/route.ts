import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "campusconnect";

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadFile(buffer, folder);
      return NextResponse.json({
        url: result.url,
        publicId: result.publicId,
      });
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      const { dataUrl, folder = "campusconnect" } = body;

      if (!dataUrl) {
        return NextResponse.json({ error: "No dataUrl provided" }, { status: 400 });
      }

      const result = await uploadFile(dataUrl, folder);
      return NextResponse.json({
        url: result.url,
        publicId: result.publicId,
      });
    }

    return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("[Upload API] Error:", error);
    const message = error instanceof Error ? error.message : "File upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
