import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function verifyPhase8AdminApi() {
  console.log("=========================================");
  console.log("   CAMPUSCONNECT — PHASE 8.1 API TEST    ");
  console.log("=========================================\n");

  // 1. Verify Admin User exists
  console.log("1. Verifying Admin account credentials...");
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!admin) {
    throw new Error("No ADMIN user found in database. Run seed first.");
  }
  console.log(`   Found Admin: ${admin.name} (${admin.email}, ID: ${admin.id}) ✅\n`);

  // 2. Test Admin Stats logic
  console.log("2. Testing Platform Admin Stats aggregation...");
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    suspendedUsers,
    totalGroups,
    totalPosts,
    flaggedPosts,
    pendingReports,
    activeInvites,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.group.count(),
    prisma.post.count(),
    prisma.post.count({ where: { isFlagged: true } }),
    prisma.moderationReport.count({ where: { status: "PENDING" } }),
    prisma.inviteToken.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  console.log(`   Total Users: ${totalUsers} (Students: ${totalStudents}, Teachers: ${totalTeachers}, Admins: ${totalAdmins})`);
  console.log(`   Suspended: ${suspendedUsers} | Groups: ${totalGroups} | Posts: ${totalPosts} | Flagged: ${flaggedPosts}`);
  console.log(`   Pending Reports: ${pendingReports} | Active Invites: ${activeInvites} ✅\n`);

  // 3. Test User Management: Creation, Search, Role Update, Suspension, & Delete
  console.log("3. Testing User Directory & Lifecycle Management...");
  const testStudentEmail = `test.user.${Date.now()}@campus.edu`;
  const hashedPassword = await bcrypt.hash("Password123!", 10);
  const testUser = await prisma.user.create({
    data: {
      name: "Temporary Test Student",
      email: testStudentEmail,
      password: hashedPassword,
      role: "STUDENT",
      department: "Computer Science",
      batch: "2026",
      isVerified: true,
      isSuspended: false,
    },
  });
  console.log(`   Created temporary user: ${testUser.name} (${testUser.email}, ID: ${testUser.id}) ✅`);

  // Search filter
  const foundUsers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "Temporary Test", mode: "insensitive" } },
        { email: { contains: "Temporary Test", mode: "insensitive" } },
      ],
    },
  });
  if (foundUsers.length === 0) throw new Error("Search filter failed to find newly created user.");
  console.log(`   Search query found user successfully ✅`);

  // Update role & suspension
  const updatedUser = await prisma.user.update({
    where: { id: testUser.id },
    data: {
      role: "TEACHER",
      isSuspended: true,
    },
  });
  if (updatedUser.role !== "TEACHER" || !updatedUser.isSuspended) {
    throw new Error("Failed to update user role and suspension state.");
  }
  console.log(`   User updated: role=${updatedUser.role}, isSuspended=${updatedUser.isSuspended} ✅`);

  // Deletion
  await prisma.user.delete({ where: { id: testUser.id } });
  const checkDeleted = await prisma.user.findUnique({ where: { id: testUser.id } });
  if (checkDeleted) throw new Error("Failed to delete temporary user.");
  console.log(`   Temporary user deleted successfully ✅\n`);

  // 4. Test Platform Settings (SystemSetting)
  console.log("4. Testing Platform Settings (SystemSetting model)...");
  let setting = await prisma.systemSetting.findUnique({
    where: { id: "default" },
  });

  if (!setting) {
    setting = await prisma.systemSetting.create({
      data: {
        id: "default",
        joinPolicy: "OPEN",
        allowedDomains: "campus.edu,thapar.edu",
        aiModerationEnabled: true,
        aiSensitivity: "MODERATE",
      },
    });
    console.log(`   Initialized default SystemSetting ✅`);
  } else {
    console.log(`   Retrieved existing SystemSetting: joinPolicy=${setting.joinPolicy}, aiSensitivity=${setting.aiSensitivity} ✅`);
  }

  // Update settings
  const modifiedSetting = await prisma.systemSetting.update({
    where: { id: "default" },
    data: {
      joinPolicy: "DOMAIN_RESTRICTED",
      aiSensitivity: "STRICT",
    },
  });
  if (modifiedSetting.joinPolicy !== "DOMAIN_RESTRICTED" || modifiedSetting.aiSensitivity !== "STRICT") {
    throw new Error("Failed to update system settings.");
  }
  console.log(`   Updated SystemSetting: joinPolicy=${modifiedSetting.joinPolicy}, aiSensitivity=${modifiedSetting.aiSensitivity} ✅`);

  // Restore settings
  await prisma.systemSetting.update({
    where: { id: "default" },
    data: {
      joinPolicy: "OPEN",
      aiSensitivity: "MODERATE",
    },
  });
  console.log(`   Restored default settings successfully ✅\n`);

  // 5. Test Moderation Reports Queue
  console.log("5. Testing Moderation Reports Queue...");
  // Find a post and reporter
  const samplePost = await prisma.post.findFirst({
    include: { author: true },
  });
  if (!samplePost) throw new Error("No sample post available for moderation test.");

  const testReport = await prisma.moderationReport.create({
    data: {
      postId: samplePost.id,
      reporterId: admin.id,
      reason: "Automated test report: inappropriate advertising.",
      status: "PENDING",
      aiFlagged: false,
    },
  });
  console.log(`   Created test report: ID ${testReport.id} on Post ${samplePost.id} ✅`);

  // Retrieve reports
  const pendingList = await prisma.moderationReport.findMany({
    where: { status: "PENDING" },
    include: {
      post: { select: { id: true, content: true, isHidden: true, isFlagged: true } },
      reporter: { select: { id: true, name: true, email: true } },
    },
  });
  const foundReport = pendingList.find((r) => r.id === testReport.id);
  if (!foundReport) throw new Error("Report not listed in pending reports.");
  console.log(`   Report successfully listed in pending queue ✅`);

  // Review report: DISMISS
  const resolvedReport = await prisma.moderationReport.update({
    where: { id: testReport.id },
    data: {
      status: "DISMISSED",
      reviewedAt: new Date(),
    },
  });
  if (resolvedReport.status !== "DISMISSED") {
    throw new Error("Failed to update report resolution status.");
  }
  console.log(`   Report updated to status: ${resolvedReport.status} ✅`);

  // Clean up test report
  await prisma.moderationReport.delete({ where: { id: testReport.id } });
  console.log(`   Test report cleaned up ✅\n`);

  console.log("=========================================");
  console.log("   PHASE 8.1 DATA & BUSINESS LOGIC PASS! ");
  console.log("=========================================");
}

verifyPhase8AdminApi().catch((err) => {
  console.error("❌ Phase 8 Verification Error:", err);
  process.exit(1);
});
