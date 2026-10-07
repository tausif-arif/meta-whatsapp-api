import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { logger } from '../../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  return ApiResponse.error(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err: { message: err.message, statusCode: err.statusCode, details: err.details } }, err.message);
    } else {
      logger.warn({ err: { message: err.message, statusCode: err.statusCode } }, err.message);
    }
    return ApiResponse.error(res, err.statusCode, err.message, err.details);
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'body';
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return ApiResponse.error(res, 400, 'Validation failed', fieldErrors);
  }

  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return ApiResponse.error(res, status, err.message);
  }

  if (err instanceof SyntaxError && 'status' in err && (err as unknown as { status: number }).status === 400) {
    return ApiResponse.error(res, 400, 'Malformed JSON body');
  }

  logger.error({ err }, 'Unhandled error');
  return ApiResponse.error(res, 500, 'Internal server error');
};
