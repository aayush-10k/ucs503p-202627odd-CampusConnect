import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, GroupType, GroupMemberRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing seed data
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.material.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@campus.edu",
      password: hashedPassword,
      role: Role.ADMIN,
      department: "Administration",
      isVerified: true,
      bio: "CampusConnect System Administrator",
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: "Prof. Sarah Johnson",
      email: "teacher@campus.edu",
      password: hashedPassword,
      role: Role.TEACHER,
      department: "Computer Science & Engineering",
      isVerified: true,
      bio: "Assistant Professor, Department of Computer Science. Specializing in Software Engineering.",
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: "Alex Chen",
      email: "alex@campus.edu",
      password: hashedPassword,
      role: Role.STUDENT,
      department: "Computer Science & Engineering",
      batch: "2024",
      isVerified: true,
      bio: "3rd Year CS Student | Full-Stack Dev Enthusiast | Coffee Lover ☕",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@campus.edu",
      password: hashedPassword,
      role: Role.STUDENT,
      department: "Computer Science & Engineering",
      batch: "2024",
      isVerified: true,
      bio: "CS Undergrad | Competitive Programmer | Hackathon Builder 🚀",
    },
  });

  console.log("✅ Users created:");
  console.log("   - Admin:    admin@campus.edu (Password123!)");
  console.log("   - Teacher:  teacher@campus.edu (Password123!)");
  console.log("   - Student1: alex@campus.edu (Password123!)");
  console.log("   - Student2: priya@campus.edu (Password123!)");

  // 2. Create Group
  const group = await prisma.group.create({
    data: {
      name: "CSE Batch 2024",
      description: "Official academic and peer discussion group for CSE Batch 2024 students and faculty.",
      type: GroupType.BATCH,
      isOpen: true,
    },
  });

  // 3. Add Members to Group
  await prisma.groupMember.createMany({
    data: [
      { userId: teacher.id, groupId: group.id, role: GroupMemberRole.ADMIN },
      { userId: admin.id, groupId: group.id, role: GroupMemberRole.ADMIN },
      { userId: student1.id, groupId: group.id, role: GroupMemberRole.MEMBER },
      { userId: student2.id, groupId: group.id, role: GroupMemberRole.MEMBER },
    ],
  });

  console.log("✅ Academic Group created: 'CSE Batch 2024' with 4 members");

  // 4. Create Initial Welcome Post
  const welcomePost = await prisma.post.create({
    data: {
      content: "Welcome to CampusConnect! 🎉 This platform is built for students and faculty to collaborate, share academic resources, discuss coursework, and stay updated on campus events. Feel free to explore and introduce yourself!",
      authorId: teacher.id,
      groupId: group.id,
    },
  });

  // 5. Add a comment and like on the post
  await prisma.comment.create({
    data: {
      content: "Excited to be here! Looking forward to collaborating this semester.",
      authorId: student1.id,
      postId: welcomePost.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: student2.id,
      postId: welcomePost.id,
    },
  });

  // 6. Connect friendship between student1 and student2
  await prisma.friendship.create({
    data: {
      userAId: student1.id,
      userBId: student2.id,
    },
  });

  console.log("✅ Initial welcome post, interaction, and demo friendship created.");
  console.log("🌱 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
