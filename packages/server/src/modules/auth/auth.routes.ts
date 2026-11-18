import { Router } from 'express';
import { loginSchema, registerSchema } from '@unispace/shared';
import { validateBody } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../utils/errors';
import { isProduction } from '../../config/env';
import { refreshTokenMaxAge } from '../../utils/tokens';
import type { AuthRequest } from '../../types/auth';
import * as service from './auth.service';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: refreshTokenMaxAge(),
  path: '/api/v1/auth',
};

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await service.register(req.body);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    res.status(201).json({ data: { user: result.user, accessToken: result.accessToken } });
  }),
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await service.login(req.body);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    res.json({ data: { user: result.user, accessToken: result.accessToken } });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken as string | undefined;
    const result = await service.refresh(token || '');
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    res.json({ data: { user: result.user, accessToken: result.accessToken } });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await service.logout(req.cookies?.refreshToken as string | undefined);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json({ data: { ok: true } });
  }),
);

authRouter.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    res.json({ data: await service.me(req.user!.id) });
  }),
);
