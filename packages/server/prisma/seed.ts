import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function at(days: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const email = 'demo@unispase.test';
  const passwordHash = await bcrypt.hash('StudyHard123', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: 'Demo Student', passwordHash },
    create: { email, name: 'Demo Student', passwordHash },
  });

  await prisma.course.deleteMany({ where: { userId: user.id } });

  const [cs, math, design, biology] = await Promise.all([
    prisma.course.create({
      data: { userId: user.id, code: 'CS 301', title: 'Data Structures', instructor: 'Dr. Rivera', color: '#8B5CF6', credits: 4, term: 'Fall 2026' },
    }),
    prisma.course.create({
      data: { userId: user.id, code: 'MATH 220', title: 'Linear Algebra', instructor: 'Prof. Chen', color: '#3B82F6', credits: 3, term: 'Fall 2026' },
    }),
    prisma.course.create({
      data: { userId: user.id, code: 'DES 140', title: 'UX Design Studio', instructor: 'Prof. Adams', color: '#EC4899', credits: 3, term: 'Fall 2026' },
    }),
    prisma.course.create({
      data: { userId: user.id, code: 'BIO 115', title: 'Cell Biology', instructor: 'Dr. Okafor', color: '#10B981', credits: 3, term: 'Fall 2026' },
    }),
  ]);

  await prisma.task.createMany({
    data: [
      { userId: user.id, courseId: cs.id, title: 'Implement binary search tree', description: 'Finish insertion, deletion and traversal methods.', type: 'ASSIGNMENT', priority: 'HIGH', status: 'IN_PROGRESS', dueAt: at(2, 23, 59) },
      { userId: user.id, courseId: math.id, title: 'Problem set 4 — Eigenvalues', type: 'ASSIGNMENT', priority: 'URGENT', status: 'TODO', dueAt: at(1, 18, 0) },
      { userId: user.id, courseId: design.id, title: 'Wireframe final project', description: 'Low-fidelity wireframes for the mobile app.', type: 'ASSIGNMENT', priority: 'MEDIUM', status: 'TODO', dueAt: at(4, 17, 0) },
      { userId: user.id, courseId: biology.id, title: 'Lab report: mitosis', type: 'ASSIGNMENT', priority: 'LOW', status: 'COMPLETED', dueAt: at(-3, 17, 0), completedAt: at(-4, 14, 0) },
      { userId: user.id, courseId: cs.id, title: 'Review graph algorithms', type: 'TASK', priority: 'HIGH', status: 'TODO', dueAt: at(5, 20, 0) },
      { userId: user.id, courseId: math.id, title: 'Read chapter 6 notes', type: 'TASK', priority: 'MEDIUM', status: 'COMPLETED', dueAt: at(-1, 20, 0), completedAt: at(-1, 19, 0) },
      { userId: user.id, courseId: design.id, title: 'Prepare design critique slides', type: 'TASK', priority: 'MEDIUM', status: 'TODO', dueAt: at(6, 12, 0) },
      { userId: user.id, userId: user.id, title: 'Weekly planner review', type: 'TASK', priority: 'LOW', status: 'IN_PROGRESS', dueAt: at(3, 20, 0) },
    ].map(({ userId: _userId, ...rest }) => ({ ...rest, userId: user.id })),
  });

  await prisma.exam.createMany({
    data: [
      { userId: user.id, courseId: cs.id, title: 'Data Structures Midterm', examType: 'MIDTERM', startsAt: at(7, 10, 0), endsAt: at(7, 12, 0), location: 'Science Hall 204', notes: 'Covers trees, graphs and sorting.' },
      { userId: user.id, courseId: math.id, title: 'Linear Algebra Final', examType: 'FINAL', startsAt: at(14, 9, 0), endsAt: at(14, 12, 0), location: 'Math Building 101' },
      { userId: user.id, courseId: biology.id, title: 'Cell Biology Quiz 2', examType: 'QUIZ', startsAt: at(3, 14, 0), endsAt: at(3, 15, 0), location: 'Lab 3' },
    ],
  });

  console.log(`Seeded demo user ${email} with 4 courses, 8 tasks and 3 exams.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
