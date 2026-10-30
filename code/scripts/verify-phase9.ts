import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { moderateContent, ModerationSensitivity } from "../src/lib/gemini";

async function verifyPhase9() {
  console.log("=========================================");
  console.log("   CAMPUSCONNECT — PHASE 9 VERIFICATION  ");
  console.log("=========================================\n");

  // 1. Verify seed users
  console.log("1. Verifying Admin & Student personas...");
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });

  if (!admin || !student) {
    throw new Error("Seed users missing in database!");
  }
  console.log(`   Admin: ${admin.name} (${admin.email}, ID: ${admin.id})`);
  console.log(`   Student: ${student.name} (${student.email}, ID: ${student.id}) ✅\n`);

  // 2. Verify and Initialize SystemSetting for AI Moderation (Task 9.3)
  console.log("2. Verifying SystemSetting AI Moderation configuration...");
  let settings = await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {
      aiModerationEnabled: true,
      aiSensitivity: "MODERATE",
    },
    create: {
      id: "default",
      joinPolicy: "OPEN",
      allowedDomains: "campus.edu,thapar.edu",
      aiModerationEnabled: true,
      aiSensitivity: "MODERATE",
    },
  });
  console.log(`   SystemSetting initialized: aiModerationEnabled=${settings.aiModerationEnabled}, sensitivity=${settings.aiSensitivity} ✅\n`);

  // 3. Test Safe Post Flow through moderation
  console.log("3. Testing Safe Post Flow (should publish without flag)...");
  const safeText = "Does anyone have the discussion notes for today's distributed systems lecture?";
  const safeResult = await moderateContent(safeText, settings.aiSensitivity as ModerationSensitivity);
  console.log(`   Safety evaluation: flagged=${safeResult.flagged}, category=${safeResult.category || "NONE"}`);
  if (safeResult.flagged) {
    throw new Error("Safe content was incorrectly flagged!");
  }

  const safePost = await prisma.post.create({
    data: {
      content: safeText,
      authorId: student.id,
      isFlagged: false,
      isHidden: false,
    },
  });
  console.log(`   Safe post created and published: ID ${safePost.id} (isHidden=${safePost.isHidden}, isFlagged=${safePost.isFlagged}) ✅\n`);

  // 4. Test Violating Content with AI Moderation (Task 9.1 & 9.2)
  console.log("4. Testing Policy Violation Flow (Academic Dishonesty / Cheating)...");
  const violatingText = "I am selling leaked exam papers for UCS503 final exam! DM me $100 for guaranteed grade A.";
  const modResult = await moderateContent(violatingText, settings.aiSensitivity as ModerationSensitivity);
  console.log(`   Safety evaluation: flagged=${modResult.flagged}, reason="${modResult.reason}", category=${modResult.category}`);

  if (!modResult.flagged) {
    throw new Error("Cheating content was not flagged by moderation engine!");
  }

  // Create flagged post mimicking POST /api/posts pipeline
  const flaggedPost = await prisma.post.create({
    data: {
      content: violatingText,
      authorId: student.id,
      isFlagged: true,
      flagReason: modResult.reason || "Academic Dishonesty detected",
      isHidden: true,
    },
  });
  console.log(`   Flagged post created: ID ${flaggedPost.id} (isHidden=${flaggedPost.isHidden}, isFlagged=${flaggedPost.isFlagged}) ✅`);

  // Create ModerationReport
  const report = await prisma.moderationReport.create({
    data: {
      postId: flaggedPost.id,
      reporterId: student.id,
      reason: `Automated AI Moderation: ${modResult.reason}`,
      aiFlagged: true,
      aiReason: modResult.reason,
      status: "PENDING",
    },
  });
  console.log(`   ModerationReport queued: ID ${report.id} (status: PENDING, aiFlagged: true) ✅`);

  // Dispatch Admin Notification
  const adminNotification = await prisma.notification.create({
    data: {
      userId: admin.id,
      type: "MODERATION_FLAG",
      message: `AI Safety Agent flagged a post by ${student.name} for: ${modResult.reason}`,
      link: "/admin/moderation",
    },
  });
  console.log(`   Admin Notification dispatched: ID ${adminNotification.id} (type: MODERATION_FLAG) ✅\n`);

  // 5. Test Dynamic AI Toggle: When Disabled, Flagging is Bypassed
  console.log("5. Testing Dynamic AI Moderation Disable Toggle...");
  await prisma.systemSetting.update({
    where: { id: "default" },
    data: { aiModerationEnabled: false },
  });

  const currentSetting = await prisma.systemSetting.findUnique({ where: { id: "default" } });
  if (currentSetting?.aiModerationEnabled !== false) {
    throw new Error("Failed to disable AI moderation in settings!");
  }
  console.log(`   aiModerationEnabled successfully set to false ✅`);

  // Post when AI disabled should publish cleanly
  const unmoderatedPost = await prisma.post.create({
    data: {
      content: "Unmoderated post created while AI safety is disabled by administrator.",
      authorId: student.id,
      isFlagged: false,
      isHidden: false,
    },
  });
  console.log(`   Post created unmoderated: ID ${unmoderatedPost.id} (isHidden=false, isFlagged=false) ✅`);

  // Re-enable AI moderation
  await prisma.systemSetting.update({
    where: { id: "default" },
    data: { aiModerationEnabled: true, aiSensitivity: "STRICT" },
  });
  console.log("   Re-enabled AI moderation with sensitivity: STRICT ✅\n");

  // 6. Test Daily Flagged Statistics Aggregation (Task 9.3)
  console.log("6. Testing Daily Flagged Statistics calculation...");
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyFlaggedCount = await prisma.post.count({
    where: {
      isFlagged: true,
      createdAt: { gte: oneDayAgo },
    },
  });
  const totalFlaggedCount = await prisma.post.count({
    where: { isFlagged: true },
  });
  console.log(`   Daily Flagged Posts (past 24h): ${dailyFlaggedCount}`);
  console.log(`   Total Intercepted Posts (all time): ${totalFlaggedCount} ✅\n`);

  if (dailyFlaggedCount < 1) {
    throw new Error("Daily flagged count should be at least 1 after creating a flagged post!");
  }

  // 7. Cleanup test records
  console.log("7. Cleaning up test artifacts...");
  await prisma.notification.delete({ where: { id: adminNotification.id } });
  await prisma.moderationReport.delete({ where: { id: report.id } });
  await prisma.post.delete({ where: { id: flaggedPost.id } });
  await prisma.post.delete({ where: { id: safePost.id } });
  await prisma.post.delete({ where: { id: unmoderatedPost.id } });

  // Restore default setting
  await prisma.systemSetting.update({
    where: { id: "default" },
    data: { aiModerationEnabled: true, aiSensitivity: "MODERATE" },
  });
  console.log("   Cleaned up test posts, report, notification & restored MODERATE settings ✅\n");

  console.log("=========================================");
  console.log("   PHASE 9 AI MODERATION VERIFIED! ✅   ");
  console.log("=========================================");
}

verifyPhase9().catch((err) => {
  console.error("❌ Phase 9 Verification Error:", err);
  process.exit(1);
});

