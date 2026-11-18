import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../utils/errors';
import { prisma } from '../../utils/prisma';
import { currentUserId } from '../../types/auth';

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const userId = currentUserId(req);
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 86400000);

    const [courses, tasks, exams] = await Promise.all([
      prisma.course.findMany({ where: { userId } }),
      prisma.task.findMany({
        where: { userId },
        orderBy: { dueAt: 'asc' },
        include: { course: { select: { code: true, color: true } } },
      }),
      prisma.exam.findMany({
        where: { userId },
        orderBy: { startsAt: 'asc' },
        include: { course: { select: { code: true, color: true } } },
      }),
    ]);

    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const upcomingTasks = tasks
      .filter((t) => t.status !== 'COMPLETED' && t.dueAt && t.dueAt >= now)
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt,
        priority: t.priority,
        type: t.type,
        courseId: t.courseId,
        course: t.course,
      }));
    const upcomingExams = exams
      .filter((e) => e.startsAt >= now)
      .slice(0, 6)
      .map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt,
        examType: e.examType,
        courseId: e.courseId,
        course: e.course,
      }));

    const priorityCounts = {
      LOW: tasks.filter((t) => t.priority === 'LOW').length,
      MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
      URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
    };
    const statusCounts = {
      TODO: tasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      COMPLETED: completed,
    };

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now.getTime() + i * 86400000);
      const label = day.toLocaleDateString('en-US', { weekday: 'short' });
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(start.getTime() + 86400000);
      return {
        label,
        date: start.toISOString(),
        tasks: tasks.filter((t) => t.dueAt && t.dueAt >= start && t.dueAt < end).length,
        exams: exams.filter((e) => e.startsAt >= start && e.startsAt < end).length,
      };
    });

    res.json({
      data: {
        totalCourses: courses.length,
        totalTasks: tasks.length,
        completedTasks: completed,
        pendingTasks: tasks.length - completed,
        totalExams: exams.length,
        upcomingExamsCount: exams.filter((e) => e.startsAt >= now && e.startsAt <= inSevenDays).length,
        deadlinesThisWeek: tasks.filter(
          (t) => t.status !== 'COMPLETED' && t.dueAt && t.dueAt >= now && t.dueAt <= inSevenDays,
        ).length,
        completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        priorityCounts,
        statusCounts,
        weeklyActivity: weekDays,
        upcomingTasks,
        upcomingExams,
        courses: courses.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          color: c.color,
          term: c.term,
        })),
      },
    });
  }),
);
