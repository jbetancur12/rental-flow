import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';

export function errorHandler(err: any, req: Request, res: Response) {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  const error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500,
    code: err.code || 'INTERNAL_ERROR'
  };

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        error.message = 'Resource already exists';
        error.status = 409;
        error.code = 'DUPLICATE_RESOURCE';
        break;
      case 'P2025':
        error.message = 'Resource not found';
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        break;
      case 'P2003':
        error.message = 'Referenced resource not found';
        error.status = 400;
        error.code = 'FOREIGN_KEY_VIOLATION';
        break;
      default:
        error.message = 'Database error';
        error.status = 500;
        error.code = 'DATABASE_ERROR';
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    error.message = 'Validation Error';
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
    error.code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
    error.code = 'TOKEN_EXPIRED';
  }

  // Rate limiting error
  if (err.status === 429) {
    error.message = 'Too many requests';
    error.status = 429;
    error.code = 'RATE_LIMIT_EXCEEDED';
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.status = 413;
    error.code = 'FILE_TOO_LARGE';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field';
    error.status = 400;
    error.code = 'UNEXPECTED_FILE';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal Server Error';
  }

  res.status(error.status).json({
    error: error.message,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
}