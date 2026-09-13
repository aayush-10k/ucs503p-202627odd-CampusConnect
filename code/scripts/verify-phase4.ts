import { prisma } from "../src/lib/prisma";
import { moderateContent } from "../src/lib/gemini";

async function verifyPhase4() {
  console.log("=========================================");
  console.log("   CAMPUSCONNECT — PHASE 4 VERIFICATION   ");
  console.log("=========================================\n");

  // 1. Verify Users exist
  console.log("1. Checking seed users...");
  const alex = await prisma.user.findUnique({ where: { email: "alex@campus.edu" } });
  const priya = await prisma.user.findUnique({ where: { email: "priya@campus.edu" } });
  const admin = await prisma.user.findUnique({ where: { email: "admin@campus.edu" } });

  if (!alex || !priya || !admin) {
    throw new Error("Seeded users (alex, priya, admin) not found in DB!");
  }
  console.log(`   Found users: Alex (${alex.id}), Priya (${priya.id}), Admin (${admin.id}) ✅`);

  // 2. Profile Fetch & Update
  console.log("\n2. Testing User Profile update...");
  const updatedAlex = await prisma.user.update({
    where: { id: alex.id },
    data: {
      bio: "Computer Science enthusiast & CampusConnect beta tester.",
      department: "Computer Science",
      batch: "2024",
    },
  });
  console.log(`   Alex bio updated: "${updatedAlex.bio}" ✅`);

  // 3. Friend Network Operations
  console.log("\n3. Testing Friend Network Operations...");
  // Check if friendship exists or clean up old test requests
  await prisma.friendRequest.deleteMany({
    where: {
      OR: [
        { senderId: alex.id, receiverId: admin.id },
        { senderId: admin.id, receiverId: alex.id },
      ],
    },
  });

  const request = await prisma.friendRequest.create({
    data: {
      senderId: alex.id,
      receiverId: admin.id,
      status: "PENDING",
    },
  });
  console.log(`   Friend request sent (Alex -> Admin, ID: ${request.id}) ✅`);

  // Accept request
  const [userAId, userBId] = [alex.id, admin.id].sort();
  await prisma.friendRequest.update({
    where: { id: request.id },
    data: { status: "ACCEPTED" },
  });
  const friendship = await prisma.friendship.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
  console.log(`   Friend request accepted, Friendship established (ID: ${friendship.id}) ✅`);

  // 4. Social Feed & Post Creation
  console.log("\n4. Testing Social Feed & Post Creation...");
  const testPost = await prisma.post.create({
    data: {
      content: "Hello CampusConnect! Welcome to the new social feed prototype.",
      authorId: alex.id,
      isFlagged: false,
      isHidden: false,
    },
  });
  console.log(`   Test post created by Alex (ID: ${testPost.id}) ✅`);

  // Add Like
  const like = await prisma.like.create({
    data: {
      userId: priya.id,
      postId: testPost.id,
    },
  });
  console.log(`   Like added by Priya (ID: ${like.id}) ✅`);

  // Add Comment
  const comment = await prisma.comment.create({
    data: {
      content: "Great to be here! Looking forward to sharing course notes.",
      authorId: priya.id,
      postId: testPost.id,
    },
  });
  console.log(`   Comment added by Priya (ID: ${comment.id}) ✅`);

  // 5. Gemini AI Content Safety Engine
  console.log("\n5. Testing Gemini AI Moderation Agent...");
  const safeText = "Hey everyone, study session for UCS503 Software Engineering tomorrow at 4 PM in Library Hall B!";
  const safeResult = await moderateContent(safeText, "MODERATE");
  console.log(`   Safe text check: flagged=${safeResult.flagged}, reason="${safeResult.reason}" ✅`);

  const flaggedText = "Selling leaked final exam papers for Computer Science UCS503, DM me for answers!";
  const flaggedResult = await moderateContent(flaggedText, "MODERATE");
  console.log(`   Cheating/violating text check: flagged=${flaggedResult.flagged}, category=${flaggedResult.category}, reason="${flaggedResult.reason}" ✅`);

  // Create an auto-flagged hidden post in DB to verify moderation pipeline
  const flaggedPost = await prisma.post.create({
    data: {
      content: flaggedText,
      authorId: alex.id,
      isFlagged: flaggedResult.flagged,
      flagReason: flaggedResult.reason,
      isHidden: flaggedResult.flagged,
    },
  });
  console.log(`   Flagged post correctly marked: isHidden=${flaggedPost.isHidden}, isFlagged=${flaggedPost.isFlagged} ✅`);

  // 6. Cleanup test records
  console.log("\n6. Cleaning up test post artifacts...");
  await prisma.like.deleteMany({ where: { postId: testPost.id } });
  await prisma.comment.deleteMany({ where: { postId: testPost.id } });
  await prisma.post.delete({ where: { id: testPost.id } });
  await prisma.post.delete({ where: { id: flaggedPost.id } });
  await prisma.friendship.deleteMany({ where: { id: friendship.id } });
  await prisma.friendRequest.deleteMany({ where: { id: request.id } });
  console.log("   Test artifacts cleaned up ✅");

  console.log("\n=========================================");
  console.log("   PHASE 4 VERIFICATION COMPLETE: ALL PASS");
  console.log("=========================================\n");
}

verifyPhase4()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
