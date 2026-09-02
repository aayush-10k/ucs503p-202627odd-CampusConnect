import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { authOptions } from "../src/lib/auth";
import { uploadFile, deleteFile } from "../src/lib/cloudinary";

async function verifyPhase2Tasks() {
  console.log("==========================================");
  console.log("🧪 VERIFYING TASKS 2.1 – 2.4");
  console.log("==========================================\n");

  let allPassed = true;

  // 1. Verify Task 2.1: Prisma Client Singleton
  console.log("👉 [Task 2.1] Testing Prisma Client Singleton...");
  try {
    const userCount = await prisma.user.count();
    console.log(`   ✅ prisma singleton functional! Total users: ${userCount}`);
  } catch (err: any) {
    allPassed = false;
    console.error("   ❌ Task 2.1 Failed:", err.message);
  }

  console.log();

  // 2. Verify Task 2.2 & 2.3: NextAuth Config & Type Extensions
  console.log("👉 [Task 2.2 & 2.3] Testing NextAuth Credentials Authorize...");
  try {
    const credentialsProvider = authOptions.providers.find(
      (p: any) => p.id === "credentials" || p.name === "credentials"
    ) as any;

    if (!credentialsProvider || typeof credentialsProvider.authorize !== "function") {
      throw new Error("Credentials provider authorize function not found in authOptions.");
    }

    const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;

    // Test successful login with seeded Admin
    const authResult = await authorizeFn({
      email: "admin@campus.edu",
      password: "Password123!",
    });

    if (!authResult || authResult.email !== "admin@campus.edu" || authResult.role !== "ADMIN") {
      throw new Error(`Unexpected authorize result: ${JSON.stringify(authResult)}`);
    }

    console.log("   ✅ NextAuth authorize successful for seeded Admin:");
    console.log(`      • ID: ${authResult.id}`);
    console.log(`      • Name: ${authResult.name}`);
    console.log(`      • Email: ${authResult.email}`);
    console.log(`      • Role: ${authResult.role}`);

    // Test rejection with wrong password
    let failedAsExpected = false;
    try {
      await authorizeFn({
        email: "admin@campus.edu",
        password: "WrongPassword!",
      });
    } catch {
      failedAsExpected = true;
    }

    if (!failedAsExpected) {
      throw new Error("Authorize did NOT reject invalid password!");
    }
    console.log("   ✅ NextAuth authorize successfully rejected invalid credentials.");
  } catch (err: any) {
    allPassed = false;
    console.error("   ❌ Task 2.2 / 2.3 Failed:", err.message);
  }

  console.log();

  // 3. Verify Task 2.4: Cloudinary Helper
  console.log("👉 [Task 2.4] Testing Cloudinary uploadFile and deleteFile...");
  try {
    // 1x1 transparent GIF base64
    const testBase64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const uploadResult = await uploadFile(testBase64, "campusconnect/test");

    console.log("   ✅ uploadFile successful:");
    console.log(`      • URL: ${uploadResult.url}`);
    console.log(`      • Public ID: ${uploadResult.publicId}`);

    // Clean up test file
    const deleteResult = await deleteFile(uploadResult.publicId);
    console.log(`   ✅ deleteFile cleanup successful: result="${deleteResult.result}"`);
  } catch (err: any) {
    allPassed = false;
    console.error("   ❌ Task 2.4 Failed:", err.message);
  }

  console.log();
  console.log("==========================================");
  if (allPassed) {
    console.log("🎉 TASKS 2.1, 2.2, 2.3, 2.4 VERIFIED SUCCESSFULLY!");
  } else {
    console.log("⚠️ SOME TASKS FAILED VERIFICATION. SEE LOGS ABOVE.");
  }
  console.log("==========================================");

  await prisma.$disconnect();
}

verifyPhase2Tasks();
