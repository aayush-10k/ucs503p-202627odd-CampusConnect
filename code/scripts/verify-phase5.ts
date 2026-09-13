import { prisma } from "../src/lib/prisma";

async function verifyPhase5() {
  console.log("=========================================");
  console.log("   CAMPUSCONNECT — PHASE 5 VERIFICATION   ");
  console.log("=========================================\n");

  // 1. Verify seed users
  console.log("1. Verifying Teacher, Student, and Admin users...");
  const teacher = await prisma.user.findUnique({ where: { email: "teacher@campus.edu" } });
  const alex = await prisma.user.findUnique({ where: { email: "alex@campus.edu" } });
  const admin = await prisma.user.findUnique({ where: { email: "admin@campus.edu" } });

  if (!teacher || !alex || !admin) {
    throw new Error("Required test users (teacher, alex, admin) missing in database!");
  }
  console.log(`   Found Teacher: ${teacher.name} (${teacher.id})`);
  console.log(`   Found Student: ${alex.name} (${alex.id})`);
  console.log(`   Found Admin: ${admin.name} (${admin.id}) ✅`);

  // Clean up any previous test artifacts
  const existingTestGroup = await prisma.group.findFirst({
    where: { name: "TEST — UCS503 Distributed Systems Lab" },
  });
  if (existingTestGroup) {
    await prisma.material.deleteMany({ where: { groupId: existingTestGroup.id } });
    await prisma.groupMember.deleteMany({ where: { groupId: existingTestGroup.id } });
    await prisma.group.delete({ where: { id: existingTestGroup.id } });
  }

  // 2. Test Group Creation by Teacher
  console.log("\n2. Testing Academic Group Creation (Teacher)...");
  const testGroup = await prisma.group.create({
    data: {
      name: "TEST — UCS503 Distributed Systems Lab",
      description: "Hands-on laboratory sessions for distributed computing and microservices architecture.",
      type: "LAB",
      isOpen: true,
      members: {
        create: {
          userId: teacher.id,
          role: "ADMIN",
        },
      },
    },
    include: {
      members: true,
      _count: { select: { members: true } },
    },
  });

  console.log(`   Created Group: "${testGroup.name}" (ID: ${testGroup.id}) ✅`);
  console.log(`   Type: ${testGroup.type} | Open: ${testGroup.isOpen} ✅`);
  console.log(`   Creator Member Role: ${testGroup.members[0].role} ✅`);

  // 3. Test Student Joining Group
  console.log("\n3. Testing Student Enrollment (Join Open Group)...");
  const alexMembership = await prisma.groupMember.create({
    data: {
      userId: alex.id,
      groupId: testGroup.id,
      role: "MEMBER",
    },
  });
  console.log(`   Student Alex Chen joined group (Membership ID: ${alexMembership.id}, Role: ${alexMembership.role}) ✅`);

  const memberCount = await prisma.groupMember.count({
    where: { groupId: testGroup.id },
  });
  console.log(`   Total group members after join: ${memberCount} (Expected: 2) ✅`);
  if (memberCount !== 2) throw new Error(`Expected 2 members, found ${memberCount}`);

  // 4. Test Role Modification (Promote Student to Admin)
  console.log("\n4. Testing Member Role Management (Promote to Admin)...");
  const promotedMembership = await prisma.groupMember.update({
    where: {
      userId_groupId: {
        userId: alex.id,
        groupId: testGroup.id,
      },
    },
    data: { role: "ADMIN" },
  });
  console.log(`   Alex Chen promoted to: ${promotedMembership.role} ✅`);
  if (promotedMembership.role !== "ADMIN") throw new Error("Failed to promote user to ADMIN");

  // 5. Test Course Material Upload / Recording
  console.log("\n5. Testing Course Material Hub (Upload & Repository)...");
  const testMaterial = await prisma.material.create({
    data: {
      title: "Lab 01 — Architectural Paradigms & RPC.pdf",
      description: "Comprehensive laboratory assignment and starter code instructions for gRPC.",
      fileUrl: "https://res.cloudinary.com/ixcxi1fa/image/upload/v1726250000/sample.pdf",
      fileType: "PDF",
      folder: "Lab Manuals",
      groupId: testGroup.id,
      uploaderId: teacher.id,
    },
    include: {
      uploader: {
        select: { id: true, name: true, role: true },
      },
      group: {
        select: { id: true, name: true },
      },
    },
  });
  console.log(`   Created Material: "${testMaterial.title}" (ID: ${testMaterial.id}) ✅`);
  console.log(`   Folder: "${testMaterial.folder}" | FileType: ${testMaterial.fileType} ✅`);
  console.log(`   Uploaded by: ${testMaterial.uploader.name} (${testMaterial.uploader.role}) ✅`);

  // Second material in different folder
  const testMaterial2 = await prisma.material.create({
    data: {
      title: "Lecture 01 — CAP Theorem and Consistency Models.pptx",
      description: "Slide deck for Distributed Systems Theory class.",
      fileUrl: "https://res.cloudinary.com/ixcxi1fa/image/upload/v1726250000/sample.pptx",
      fileType: "PPT",
      folder: "Lectures",
      groupId: testGroup.id,
      uploaderId: teacher.id,
    },
  });
  console.log(`   Created Material: "${testMaterial2.title}" in folder "${testMaterial2.folder}" ✅`);

  // 6. Test Folder & Search Filters
  console.log("\n6. Testing Material Queries (Folder & Search Filters)...");
  const labMaterials = await prisma.material.findMany({
    where: {
      groupId: testGroup.id,
      folder: "Lab Manuals",
    },
  });
  console.log(`   Filtered by folder 'Lab Manuals': found ${labMaterials.length} file(s) ✅`);
  if (labMaterials.length !== 1) throw new Error("Folder filter failed");

  const searchResults = await prisma.material.findMany({
    where: {
      groupId: testGroup.id,
      title: { contains: "CAP Theorem", mode: "insensitive" },
    },
  });
  console.log(`   Search query 'CAP Theorem': found ${searchResults.length} file(s) ✅`);
  if (searchResults.length !== 1) throw new Error("Search filter failed");

  const distinctFolders = await prisma.material.findMany({
    where: { groupId: testGroup.id },
    select: { folder: true },
    distinct: ["folder"],
  });
  const folderNames = distinctFolders.map((f) => f.folder);
  console.log(`   Distinct group folders: [${folderNames.join(", ")}] ✅`);

  // 7. Test Material Deletion
  console.log("\n7. Testing Material Deletion...");
  await prisma.material.delete({ where: { id: testMaterial.id } });
  await prisma.material.delete({ where: { id: testMaterial2.id } });
  const remainingMaterials = await prisma.material.count({ where: { groupId: testGroup.id } });
  console.log(`   Deleted materials, remaining: ${remainingMaterials} ✅`);
  if (remainingMaterials !== 0) throw new Error("Failed to delete materials");

  // 8. Test Group Deletion & Cascades
  console.log("\n8. Testing Group Cascade Deletion...");
  await prisma.group.delete({ where: { id: testGroup.id } });
  const groupAfterDelete = await prisma.group.findUnique({ where: { id: testGroup.id } });
  const orphanedMembers = await prisma.groupMember.count({ where: { groupId: testGroup.id } });
  console.log(`   Group removed: ${groupAfterDelete === null} | Orphaned members: ${orphanedMembers} ✅`);
  if (groupAfterDelete !== null || orphanedMembers !== 0) throw new Error("Cascade deletion failed");

  console.log("\n=========================================");
  console.log("   PHASE 5 VERIFICATION COMPLETE: ALL PASS");
  console.log("=========================================\n");
}

verifyPhase5()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
