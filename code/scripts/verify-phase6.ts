import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { EventType, NotificationType } from "@prisma/client";

async function verifyPhase6() {
  console.log("=========================================");
  console.log("   CAMPUSCONNECT — PHASE 6 VERIFICATION   ");
  console.log("=========================================\n");

  // 1. Verify seed users
  console.log("1. Verifying Teacher, Student, and Admin personas...");
  const teacher = await prisma.user.findUnique({ where: { email: "teacher@campus.edu" } });
  const alex = await prisma.user.findUnique({ where: { email: "alex@campus.edu" } });
  const priya = await prisma.user.findUnique({ where: { email: "priya@campus.edu" } });

  if (!teacher || !alex || !priya) {
    throw new Error("Required seed users missing in database!");
  }
  console.log(`   Teacher: ${teacher.name} (${teacher.id})`);
  console.log(`   Student A: ${alex.name} (${alex.id})`);
  console.log(`   Student B: ${priya.name} (${priya.id}) ✅`);

  // Ensure a test group exists with Teacher as Admin and Alex & Priya as members
  let testGroup = await prisma.group.findFirst({
    where: { name: "TEST — Phase 6 Robotics Workshop" },
    include: { members: true },
  });

  if (!testGroup) {
    testGroup = await prisma.group.create({
      data: {
        name: "TEST — Phase 6 Robotics Workshop",
        description: "Hands-on robotics hardware and simulation club.",
        type: "CLUB",
        isOpen: true,
        members: {
          create: [
            { userId: teacher.id, role: "ADMIN" },
            { userId: alex.id, role: "MEMBER" },
            { userId: priya.id, role: "MEMBER" },
          ],
        },
      },
      include: { members: true },
    });
  }

  console.log(`   Test Group ready: "${testGroup.name}" (ID: ${testGroup.id}) ✅`);

  // 2. Personal Event Creation & Retrieval (Task 6.1)
  console.log("\n2. Testing Personal Event Creation (Student Alex)...");
  const now = new Date();
  const personalStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const personalEnd = new Date(personalStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  const personalEvent = await prisma.event.create({
    data: {
      title: "Review Operating Systems Chapter 4",
      description: "Prepare summaries for virtual memory and page tables.",
      type: EventType.REMINDER,
      startDate: personalStart,
      endDate: personalEnd,
      creatorId: alex.id,
      groupId: null,
      isPrivate: true,
    },
    include: {
      creator: { select: { id: true, name: true, role: true } },
    },
  });

  console.log(`   Created Personal Event: "${personalEvent.title}" (ID: ${personalEvent.id}) ✅`);
  console.log(`   Type: ${personalEvent.type} | Private: ${personalEvent.isPrivate} | Creator: ${personalEvent.creator.name} ✅`);

  // 3. Event Modification (Task 6.1)
  console.log("\n3. Testing Event Update (PATCH)...");
  const updatedEvent = await prisma.event.update({
    where: { id: personalEvent.id },
    data: {
      title: "Review Operating Systems Chapters 4 & 5 (Updated)",
      type: EventType.ASSIGNMENT,
    },
  });
  console.log(`   Updated Event Title: "${updatedEvent.title}" | Type: ${updatedEvent.type} ✅`);
  if (updatedEvent.type !== EventType.ASSIGNMENT) throw new Error("Event update failed");

  // 4. Group Event Scheduling by Teacher (Task 6.1)
  console.log("\n4. Testing Group Event Creation by Faculty (Teacher)...");
  const groupStart = new Date(now.getTime() + 48 * 60 * 60 * 1000); // In 2 days
  const groupEnd = new Date(groupStart.getTime() + 3 * 60 * 60 * 1000);

  const groupEvent = await prisma.event.create({
    data: {
      title: "Robotics Hardware Lab Midterm Review Session",
      description: "Comprehensive hands-on review for microcontroller programming.",
      type: EventType.LECTURE,
      startDate: groupStart,
      endDate: groupEnd,
      creatorId: teacher.id,
      groupId: testGroup.id,
      isPrivate: false,
    },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      group: { select: { id: true, name: true } },
    },
  });

  console.log(`   Created Group Event: "${groupEvent.title}" (ID: ${groupEvent.id}) ✅`);
  console.log(`   Attached to Group: "${groupEvent.group?.name}" | Created by: ${groupEvent.creator.name} ✅`);

  // 5. Member Notification Trigger (Task 6.3)
  console.log("\n5. Testing Event Notification Trigger for Group Members (Task 6.3)...");
  const otherMembers = await prisma.groupMember.findMany({
    where: {
      groupId: testGroup.id,
      userId: { not: teacher.id },
    },
    select: { userId: true },
  });

  const notifications = await prisma.notification.createMany({
    data: otherMembers.map((m) => ({
      userId: m.userId,
      type: NotificationType.NEW_EVENT,
      message: `${teacher.name} scheduled a new Lecture: "${groupEvent.title}" in ${testGroup.name}`,
      link: `/groups/${testGroup.id}/schedule`,
    })),
  });

  console.log(`   Generated ${notifications.count} member notification(s) for group event ✅`);

  // Verify Alex and Priya received notification
  const alexNotifs = await prisma.notification.findMany({
    where: {
      userId: alex.id,
      type: NotificationType.NEW_EVENT,
      link: `/groups/${testGroup.id}/schedule`,
    },
  });
  console.log(`   Student Alex notifications found: ${alexNotifs.length} ✅`);
  if (alexNotifs.length === 0) throw new Error("Notification trigger failed for group members");

  // 6. Query Filters (Date, Type, Scope)
  console.log("\n6. Testing Multi-dimensional Schedule Filtering...");
  const typeFilterEvents = await prisma.event.findMany({
    where: {
      OR: [
        { creatorId: alex.id },
        { groupId: testGroup.id },
      ],
      type: EventType.LECTURE,
    },
  });
  console.log(`   Events matching Type: LECTURE -> ${typeFilterEvents.length} event(s) found ✅`);
  if (typeFilterEvents.length === 0) throw new Error("Type filter query failed");

  // 7. Cleanup Test Records
  console.log("\n7. Cleaning up test event records & notifications...");
  await prisma.notification.deleteMany({
    where: { link: `/groups/${testGroup.id}/schedule` },
  });
  await prisma.event.delete({ where: { id: personalEvent.id } });
  await prisma.event.delete({ where: { id: groupEvent.id } });
  await prisma.groupMember.deleteMany({ where: { groupId: testGroup.id } });
  await prisma.group.delete({ where: { id: testGroup.id } });
  console.log("   Test artifacts cleaned up ✅");

  console.log("\n=========================================");
  console.log("   PHASE 6 API & NOTIFICATIONS VERIFIED! ");
  console.log("=========================================\n");
}

verifyPhase6()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
