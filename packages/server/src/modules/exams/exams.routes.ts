import { Router } from 'express';
import { dateRangeQuerySchema, examCreateSchema, examUpdateSchema, idParamSchema } from '@unispace/shared';
import { Prisma } from '@prisma/client';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate';
import { authMiddleware, owned } from '../../middleware/auth';
import { asyncHandler } from '../../utils/errors';
import { prisma } from '../../utils/prisma';
import { currentUserId } from '../../types/auth';

export const examsRouter = Router();
examsRouter.use(authMiddleware);

function cleanBody(body: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...body };
  for (const key of ['courseId', 'endsAt', 'location', 'notes']) {
    if (result[key] === '') result[key] = null;
  }
  return result;
}

examsRouter.get(
  '/',
  validateQuery(dateRangeQuerySchema),
  asyncHandler(async (req, res) => {
    const q = (req as unknown as { validatedQuery: Record<string, string | undefined> }).validatedQuery;
    const exams = await prisma.exam.findMany({
      where: {
        userId: currentUserId(req),
        ...(q.from || q.to
          ? {
              startsAt: {
                ...(q.from ? { gte: new Date(q.from) } : {}),
                ...(q.to ? { lte: new Date(q.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { startsAt: 'asc' },
      include: { course: { select: { id: true, code: true, title: true, color: true } } },
    });
    res.json({ data: exams });
  }),
);

examsRouter.post(
  '/',
  validateBody(examCreateSchema),
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.create({
      data: {
        ...(cleanBody(req.body as Record<string, unknown>) as Prisma.ExamUncheckedCreateInput),
        userId: currentUserId(req),
      },
    });
    res.status(201).json({ data: exam });
  }),
);

examsRouter.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    res.json({ data: owned(exam, currentUserId(req)) });
  }),
);

examsRouter.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(examUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.exam.findUnique({ where: { id: req.params.id } });
    owned(existing, currentUserId(req));
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: cleanBody(req.body as Record<string, unknown>),
    });
    res.json({ data: exam });
  }),
);

examsRouter.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.exam.findUnique({ where: { id: req.params.id } });
    owned(existing, currentUserId(req));
    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  }),
);
