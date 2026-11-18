import { PrismaClient } from '@prisma/client';

const logLevels: ('error' | 'warn')[] =
  process.env.NODE_ENV === 'test'
    ? []
    : process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'];

export const prisma = new PrismaClient({ log: logLevels });
