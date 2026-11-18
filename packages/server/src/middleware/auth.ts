import { NextFunction, Response } from 'express';
import { prisma } from '../utils/prisma';
import { notFound, unauthorized } from '../utils/errors';
import { verifyAccessToken } from '../utils/tokens';
import { AuthRequest, AuthUser } from '../types/auth';

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorized('Missing or invalid authorization header'));
    return;
  }
  try {
    const user: AuthUser = verifyAccessToken(header.slice(7).trim());
    req.user = user;
    next();
  } catch {
    next(unauthorized('Invalid or expired access token'));
  }
}

/** Returns the resource only when it belongs to the authenticated user. */
export function owned<T extends { userId: string }>(resource: T | null, userId: string): T {
  if (!resource || resource.userId !== userId) throw notFound();
  return resource;
}
