import { z } from 'zod';

/* ------------------------------ Common ------------------------------ */

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const dateRangeQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

/* ------------------------------- Auth ------------------------------- */

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/* ------------------------------ Courses ----------------------------- */

export const courseCreateSchema = z.object({
  code: z.string().trim().min(1, 'Course code is required').max(30),
  title: z.string().trim().min(1, 'Title is required').max(120),
  instructor: z.string().trim().max(120).optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value')
    .default('#8B5CF6'),
  credits: z.number().int().min(0).max(30).optional(),
  term: z.string().trim().max(60).optional().or(z.literal('')),
});

export const courseUpdateSchema = courseCreateSchema.partial();

/* ------------------------------- Tasks ------------------------------ */

export const taskTypeSchema = z.enum(['ASSIGNMENT', 'TASK']);
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']);

const optionalDateTime = z
  .string()
  .datetime({ offset: true })
  .optional()
  .or(z.literal(''));

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  type: taskTypeSchema.default('ASSIGNMENT'),
  priority: prioritySchema.default('MEDIUM'),
  status: taskStatusSchema.default('TODO'),
  courseId: z.string().uuid().optional().or(z.literal('')),
  dueAt: optionalDateTime,
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const taskQuerySchema = dateRangeQuerySchema.extend({
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  courseId: z.string().uuid().optional(),
});

/* ------------------------------- Exams ------------------------------ */

export const examTypeSchema = z.enum(['MIDTERM', 'FINAL', 'QUIZ', 'OTHER']);

export const examCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  courseId: z.string().uuid().optional().or(z.literal('')),
  examType: examTypeSchema.default('MIDTERM'),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: optionalDateTime,
  location: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const examUpdateSchema = examCreateSchema.partial();

/* -------------------------------- AI -------------------------------- */

export const studyPlanRequestSchema = z.object({
  days: z.number().int().min(1).max(14).default(7),
  hoursPerDay: z.number().min(0.5).max(12).default(2),
  focusCourseId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

/* ------------------------------- Types ------------------------------ */

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type ExamCreateInput = z.infer<typeof examCreateSchema>;
export type ExamUpdateInput = z.infer<typeof examUpdateSchema>;
export type StudyPlanRequest = z.infer<typeof studyPlanRequestSchema>;

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED'] as const;
