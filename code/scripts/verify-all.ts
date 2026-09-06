import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { GoogleGenAI } from "@google/genai";

async function verifyAll() {
  console.log("==========================================");
  console.log("🔍 CAMPUSCONNECT FULL SYSTEM VERIFICATION");
  console.log("==========================================\n");

  let allPassed = true;

  // 1. Check Database (Neon PostgreSQL via Prisma)
  console.log("👉 [1/3] Verifying Database Connection...");
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in .env");
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const userCount = await prisma.user.count();
    const groupCount = await prisma.group.count();
    const postCount = await prisma.post.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true, name: true },
    });

    console.log("   ✅ Database connection SUCCESSFUL!");
    console.log(`      • Users in DB: ${userCount}`);
    console.log(`      • Groups in DB: ${groupCount}`);
    console.log(`      • Posts in DB: ${postCount}`);
    console.log("      • Sample Users:");
    users.forEach((u: { email: string; role: string; name: string }) => console.log(`        - [${u.role}] ${u.name} (${u.email})`));

    await prisma.$disconnect();
    await pool.end();
  } catch (err: any) {
    allPassed = false;
    console.error("   ❌ Database verification FAILED:", err.message);
  }

  console.log();

  // 2. Check Cloudinary
  console.log("👉 [2/3] Verifying Cloudinary API...");
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary credentials missing in .env");
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const pingResult = await cloudinary.api.ping();
    console.log("   ✅ Cloudinary API connection SUCCESSFUL!");
    console.log(`      • Cloud Name: ${cloudName}`);
    console.log(`      • Ping Status: ${pingResult.status}`);

    const usageResult = await cloudinary.api.usage();
    console.log(`      • Credits: ${usageResult.credits?.usage || 0} used / ${usageResult.credits?.credits || "unlimited"}`);
    console.log(`      • Storage: ${Math.round((usageResult.storage?.usage || 0) / 1024)} KB used`);
  } catch (err: any) {
    allPassed = false;
    console.error("   ❌ Cloudinary verification FAILED:", err.message);
  }

  console.log();

  // 3. Check Gemini API
  console.log("👉 [3/3] Verifying Google Gemini API...");
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY missing in .env");
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Respond with only 'GEMINI_OK'.",
    });

    const outputText = response.text ? response.text.trim() : "";
    console.log("   ✅ Gemini API connection SUCCESSFUL!");
    console.log(`      • Model: gemini-2.5-flash`);
    console.log(`      • Test Prompt Response: "${outputText}"`);
  } catch (err: any) {
    allPassed = false;
    console.error("   ❌ Gemini API verification FAILED:", err.message);
  }

  console.log();
  console.log("==========================================");
  if (allPassed) {
    console.log("🎉 ALL SERVICES VERIFIED AND READY TO USE!");
  } else {
    console.log("⚠️ SOME SERVICES ENCOUNTERED ISSUES. SEE ABOVE.");
  }
  console.log("==========================================");
}

verifyAll();
