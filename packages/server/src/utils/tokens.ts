import { createHash, randomBytes } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser } from '../types/auth';

export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
  if (!payload.sub || !payload.email) throw new Error('Invalid token payload');
  return { id: payload.sub, email: payload.email as string, name: (payload.name as string) || '' };
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshTokenMaxAge(): number {
  const match = /^(\d+)([dh])$/.exec(env.refreshTokenTtl);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  return match[2] === 'd' ? amount * 86400000 : amount * 3600000;
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + refreshTokenMaxAge());
}
