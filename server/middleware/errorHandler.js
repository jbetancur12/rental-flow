import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500,
    code: err.code || 'INTERNAL_ERROR'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = 'Validation Error';
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    error.details = Object.values(err.errors).map(val => val.message);
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

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    error.message = 'Resource already exists';
    error.status = 409;
    error.code = 'DUPLICATE_RESOURCE';
  }

  if (err.code === '23503') { // Foreign key violation
    error.message = 'Referenced resource not found';
    error.status = 400;
    error.code = 'FOREIGN_KEY_VIOLATION';
  }

  if (err.code === '23502') { // Not null violation
    error.message = 'Required field missing';
    error.status = 400;
    error.code = 'REQUIRED_FIELD_MISSING';
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
    delete error.stack;
  }

  res.status(error.status).json({
    error: error.message,
    code: error.code,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
}