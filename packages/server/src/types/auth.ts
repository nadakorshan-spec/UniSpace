import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function currentUserId(req: Request): string {
  const user = (req as AuthRequest).user;
  if (!user) throw new Error('Unauthenticated request');
  return user.id;
}
