import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSettingsSchema = z.object({
  joinPolicy: z.enum(["OPEN", "DOMAIN_RESTRICTED", "INVITE_ONLY"]).optional(),
  allowedDomains: z.string().trim().optional(),
  aiModerationEnabled: z.boolean().optional(),
  aiSensitivity: z.enum(["STRICT", "MODERATE", "LENIENT"]).optional(),
});

export async function GET() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  try {
    const settings = await prisma.systemSetting.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        joinPolicy: "OPEN",
        allowedDomains: "campus.edu,thapar.edu",
        aiModerationEnabled: true,
        aiSensitivity: "MODERATE",
      },
    });

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json({ message: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden. Admin only." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const settings = await prisma.systemSetting.upsert({
      where: { id: "default" },
      update: parsed.data,
      create: {
        id: "default",
        joinPolicy: parsed.data.joinPolicy || "OPEN",
        allowedDomains: parsed.data.allowedDomains || "campus.edu,thapar.edu",
        aiModerationEnabled: parsed.data.aiModerationEnabled ?? true,
        aiSensitivity: parsed.data.aiSensitivity || "MODERATE",
      },
    });

    return NextResponse.json({
      message: "System settings updated successfully.",
      settings,
    });
  } catch (error: unknown) {
    console.error("Error updating system settings:", error);
    return NextResponse.json({ message: "Failed to update settings" }, { status: 500 });
  }
}
