import { Router } from 'express';
import { idParamSchema, taskCreateSchema, taskQuerySchema, taskUpdateSchema } from '@unispace/shared';
import { Prisma } from '@prisma/client';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate';
import { authMiddleware, owned } from '../../middleware/auth';
import { asyncHandler } from '../../utils/errors';
import { prisma } from '../../utils/prisma';
import { currentUserId } from '../../types/auth';

export const tasksRouter = Router();
tasksRouter.use(authMiddleware);

function cleanBody(body: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...body };
  for (const key of ['description', 'courseId', 'dueAt']) {
    if (result[key] === '') result[key] = null;
  }
  if (result.completedAt === '') result.completedAt = null;
  return result;
}

tasksRouter.get(
  '/',
  validateQuery(taskQuerySchema),
  asyncHandler(async (req, res) => {
    const q = (req as unknown as { validatedQuery: Record<string, string | undefined> }).validatedQuery;
    const userId = currentUserId(req);
    const dueAt = q.from || q.to ? {} : undefined;
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        ...(q.status ? { status: q.status as never } : {}),
        ...(q.priority ? { priority: q.priority as never } : {}),
        ...(q.courseId ? { courseId: q.courseId } : {}),
        ...(q.from || q.to
          ? { dueAt: { ...(q.from ? { gte: new Date(q.from) } : {}), ...(q.to ? { lte: new Date(q.to) } : {}) } }
          : {}),
        ...(dueAt || {}),
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
      include: { course: { select: { id: true, code: true, title: true, color: true } } },
    });
    res.json({ data: tasks });
  }),
);

tasksRouter.post(
  '/',
  validateBody(taskCreateSchema),
  asyncHandler(async (req, res) => {
    const task = await prisma.task.create({
      data: {
        ...(cleanBody(req.body as Record<string, unknown>) as Prisma.TaskUncheckedCreateInput),
        userId: currentUserId(req),
        ...(req.body.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
    res.status(201).json({ data: task });
  }),
);

tasksRouter.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    res.json({ data: owned(task, currentUserId(req)) });
  }),
);

tasksRouter.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(taskUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    owned(existing, currentUserId(req));
    const body = cleanBody(req.body as Record<string, unknown>);
    if (body.status === 'COMPLETED') body.completedAt = new Date();
    if (body.status && body.status !== 'COMPLETED') body.completedAt = null;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json({ data: task });
  }),
);

tasksRouter.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    owned(existing, currentUserId(req));
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  }),
);
