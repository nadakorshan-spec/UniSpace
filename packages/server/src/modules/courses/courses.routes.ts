import { Router } from 'express';
import { courseCreateSchema, courseUpdateSchema, idParamSchema } from '@unispace/shared';
import { Prisma } from '@prisma/client';
import { validateBody, validateParams } from '../../middleware/validate';
import { authMiddleware, owned } from '../../middleware/auth';
import { asyncHandler, conflict } from '../../utils/errors';
import { prisma } from '../../utils/prisma';
import { currentUserId } from '../../types/auth';

export const coursesRouter = Router();
coursesRouter.use(authMiddleware);

coursesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const courses = await prisma.course.findMany({
      where: { userId: currentUserId(req) },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tasks: true, exams: true } },
      },
    });
    res.json({ data: courses });
  }),
);

coursesRouter.post(
  '/',
  validateBody(courseCreateSchema),
  asyncHandler(async (req, res) => {
    const body = { ...req.body, instructor: req.body.instructor || null, term: req.body.term || null };
    try {
      const course = await prisma.course.create({
        data: { ...body, userId: currentUserId(req) },
      });
      res.status(201).json({ data: course });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('A course with this code already exists');
      }
      throw error;
    }
  }),
);

coursesRouter.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    res.json({ data: owned(course, currentUserId(req)) });
  }),
);

coursesRouter.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(courseUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    owned(existing, currentUserId(req));
    const body = req.body as Record<string, unknown>;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        ...body,
        instructor: body.instructor === '' ? null : (body.instructor as string | undefined),
        term: body.term === '' ? null : (body.term as string | undefined),
      },
    });
    res.json({ data: course });
  }),
);

coursesRouter.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
    owned(existing, currentUserId(req));
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  }),
);
