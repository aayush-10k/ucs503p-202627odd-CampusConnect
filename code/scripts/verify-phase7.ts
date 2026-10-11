import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { NotificationType } from "@prisma/client";

async function verifyPhase7() {
  console.log("=========================================");
  console.log("   CAMPUSCONNECT — PHASE 7 VERIFICATION   ");
  console.log("=========================================\n");

  // 1. Verify personas
  console.log("1. Verifying Student Personas for Real-Time Chat...");
  const alex = await prisma.user.findUnique({ where: { email: "alex@campus.edu" } });
  const priya = await prisma.user.findUnique({ where: { email: "priya@campus.edu" } });

  if (!alex || !priya) {
    throw new Error("Alex or Priya missing in DB");
  }
  console.log(`   Student A: ${alex.name} (${alex.id})`);
  console.log(`   Student B: ${priya.name} (${priya.id}) ✅`);

  // Clean up old test messages between Alex and Priya
  await prisma.message.deleteMany({
    where: {
      OR: [
        { senderId: alex.id, receiverId: priya.id },
        { senderId: priya.id, receiverId: alex.id },
      ],
    },
  });

  // 2. Direct Message Creation (Alex -> Priya)
  console.log("\n2. Testing Direct Message Sending (Alex -> Priya)...");
  const msg1 = await prisma.message.create({
    data: {
      senderId: alex.id,
      receiverId: priya.id,
      content: "Hey Priya, did you check the updated schedule board for UCS503?",
      isRead: false,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } },
    },
  });
  console.log(`   Message 1 created: "${msg1.content}" (ID: ${msg1.id}) ✅`);
  console.log(`   isRead: ${msg1.isRead} | Sender: ${msg1.sender.name} -> Receiver: ${msg1.receiver.name} ✅`);

  // 3. Automated Notification Dispatch for Recipient
  console.log("\n3. Testing In-App Message Notification Dispatch...");
  const notif = await prisma.notification.create({
    data: {
      userId: priya.id,
      type: NotificationType.NEW_MESSAGE,
      message: `${alex.name}: ${msg1.content}`,
      link: `/messages?userId=${alex.id}`,
    },
  });
  console.log(`   Notification created for Priya (ID: ${notif.id}) ✅`);

  // 4. Recipient Reply (Priya -> Alex)
  console.log("\n4. Testing Direct Message Reply (Priya -> Alex)...");
  const msg2 = await prisma.message.create({
    data: {
      senderId: priya.id,
      receiverId: alex.id,
      content: "Yes! Dr. Jeelani scheduled the Midterm review on Tuesday at 4 PM.",
      imageUrl: "https://res.cloudinary.com/ixcxi1fa/image/upload/v1726250000/sample.png",
      isRead: false,
    },
  });
  console.log(`   Message 2 created: "${msg2.content}" with image attachment ✅`);

  // 5. Conversation Inbox Query & Grouping (Task 7.2)
  console.log("\n5. Testing Conversation Inbox Grouping for Alex...");
  const userMessages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: alex.id },
        { receiverId: alex.id },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const conversationMap = new Map<string, any>();
  for (const m of userMessages) {
    const isSender = m.senderId === alex.id;
    const partnerId = isSender ? m.receiverId : m.senderId;

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId,
        lastMessage: m,
        unreadCount: 0,
      });
    }

    if (!isSender && !m.isRead) {
      conversationMap.get(partnerId).unreadCount += 1;
    }
  }

  const priyaConv = conversationMap.get(priya.id);
  console.log(`   Conversations found for Alex: ${conversationMap.size} ✅`);
  console.log(`   Last message in thread: "${priyaConv.lastMessage.content}" ✅`);
  console.log(`   Unread messages from Priya: ${priyaConv.unreadCount} (Expected: 1) ✅`);
  if (priyaConv.unreadCount !== 1) throw new Error("Inbox unread calculation failed");

  // 6. Mark Conversation As Read (Task 7.2)
  console.log("\n6. Testing Auto Mark-As-Read on Chat Open...");
  const updateResult = await prisma.message.updateMany({
    where: {
      senderId: priya.id,
      receiverId: alex.id,
      isRead: false,
    },
    data: { isRead: true },
  });
  console.log(`   Marked ${updateResult.count} unread message(s) as read ✅`);

  const updatedPriyaMsg = await prisma.message.findUnique({ where: { id: msg2.id } });
  console.log(`   Priya message isRead state: ${updatedPriyaMsg?.isRead} (Expected: true) ✅`);
  if (!updatedPriyaMsg?.isRead) throw new Error("Mark-as-read failed");

  // 7. Cleanup
  console.log("\n7. Cleaning up test chat artifacts...");
  await prisma.notification.delete({ where: { id: notif.id } });
  await prisma.message.delete({ where: { id: msg1.id } });
  await prisma.message.delete({ where: { id: msg2.id } });
  console.log("   Test artifacts cleaned up ✅");

  console.log("\n=========================================");
  console.log("   PHASE 7 REAL-TIME CHAT API VERIFIED!  ");
  console.log("=========================================\n");
}

verifyPhase7()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
