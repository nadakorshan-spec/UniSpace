import { Prisma } from '@prisma/client';
import { LoginInput, RegisterInput } from '@unispace/shared';
import { conflict, unauthorized } from '../../utils/errors';
import { hashPassword, verifyPassword } from '../../utils/password';
import { prisma } from '../../utils/prisma';
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
} from '../../utils/tokens';

export function publicUser(user: { id: string; email: string; name: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

async function issueTokens(user: { id: string; email: string; name: string }) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
      },
    });
    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw conflict('An account with this email already exists');
    }
    throw error;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw unauthorized('Invalid email or password');
  }
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(token: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw unauthorized('Invalid or expired refresh token');
  }
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });
  const tokens = await issueTokens(record.user);
  return { user: publicUser(record.user), ...tokens };
}

export async function logout(token?: string) {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized();
  return publicUser(user);
}
