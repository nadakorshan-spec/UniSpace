import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env, isProduction } from './config/env';
import { AppError } from './utils/errors';
import { authRouter } from './modules/auth/auth.routes';
import { coursesRouter } from './modules/courses/courses.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';
import { examsRouter } from './modules/exams/exams.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { calendarRouter } from './modules/calendar/calendar.routes';
import { aiRouter } from './modules/ai/ai.routes';

// Vite falls back to the next free port when 5173 is occupied. Keep both
// local ports (and their 127.0.0.1 forms) available during development only.
const DEV_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // In production only the explicitly configured CORS_ORIGIN values are trusted.
  const allowedOrigins = isProduction
    ? env.corsOrigins
    : Array.from(new Set([...env.corsOrigins, ...DEV_CORS_ORIGINS]));

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new AppError(403, 'CORS_FORBIDDEN', 'Origin not allowed'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'unispase-api' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
  });
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/refresh', authLimiter);

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/courses', coursesRouter);
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/exams', examsRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/calendar', calendarRouter);
  app.use('/api/v1/ai', aiRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
      });
      return;
    }
    if (error instanceof ZodError) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() } });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const status = error.code === 'P2002' ? 409 : error.code === 'P2025' ? 404 : 400;
      res.status(status).json({ error: { code: error.code, message: 'Database request could not be completed' } });
      return;
    }
    console.error('[unexpected error]', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: isProduction ? 'Internal server error' : String(error instanceof Error ? error.message : error),
      },
    });
  });

  return app;
}
