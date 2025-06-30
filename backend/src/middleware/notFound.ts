import { Request, Response, NextFunction } from 'express';

export function notFound(req: Request, res: Response, next: NextFunction) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  (error as any).status = 404;
  (error as any).code = 'NOT_FOUND';
  next(error);
}