import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { AppError } from '../utils/errors';

function parse(schema: ZodTypeAny, value: unknown, source: string) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'VALIDATION_ERROR', `Invalid ${source}`, result.error.flatten());
  }
  return result.data;
}

export const validateBody =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = parse(schema, req.body ?? {}, 'body');
      next();
    } catch (error) {
      next(error);
    }
  };

export const validateQuery =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = parse(schema, req.query ?? {}, 'query') as Record<string, unknown>;
      Object.defineProperty(req, 'validatedQuery', { value: parsed, writable: true });
      next();
    } catch (error) {
      next(error);
    }
  };

export const validateParams =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      Object.defineProperty(req, 'params', { value: parse(schema, req.params, 'params'), writable: true });
      next();
    } catch (error) {
      next(error);
    }
  };
