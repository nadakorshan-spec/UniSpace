import { Router } from 'express';
import { dateRangeQuerySchema } from '@unispace/shared';
import { validateQuery } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../utils/errors';
import { prisma } from '../../utils/prisma';
import { currentUserId } from '../../types/auth';

export const calendarRouter = Router();
calendarRouter.use(authMiddleware);

calendarRouter.get(
  '/',
  validateQuery(dateRangeQuerySchema),
  asyncHandler(async (req, res) => {
    const q = (req as unknown as { validatedQuery: Record<string, string | undefined> }).validatedQuery;
    const range = {
      ...(q.from ? { gte: new Date(q.from) } : {}),
      ...(q.to ? { lte: new Date(q.to) } : {}),
    };
    const hasRange = Boolean(q.from || q.to);
    const userId = currentUserId(req);

    const [tasks, exams] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          ...(hasRange ? { dueAt: range } : {}),
        },
        include: { course: { select: { code: true, color: true } } },
      }),
      prisma.exam.findMany({
        where: {
          userId,
          ...(hasRange && (range.gte || range.lte) ? { startsAt: range } : {}),
        },
        include: { course: { select: { code: true, color: true } } },
      }),
    ]);

    const events = [
      ...tasks
        .filter((t) => t.dueAt)
        .map((t) => ({
          id: t.id,
          kind: 'TASK' as const,
          title: t.title,
          start: t.dueAt!.toISOString(),
          end: t.dueAt!.toISOString(),
          color: t.course?.color || '#8B5CF6',
          courseCode: t.course?.code || null,
          priority: t.priority,
          status: t.status,
          type: t.type,
        })),
      ...exams.map((e) => ({
        id: e.id,
        kind: 'EXAM' as const,
        title: e.title,
        start: e.startsAt.toISOString(),
        end: (e.endsAt || e.startsAt).toISOString(),
        color: e.course?.color || '#3B82F6',
        courseCode: e.course?.code || null,
        examType: e.examType,
        location: e.location,
      })),
    ].sort((a, b) => a.start.localeCompare(b.start));

    res.json({ data: events, meta: { count: events.length } });
  }),
);
