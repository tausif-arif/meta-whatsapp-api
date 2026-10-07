import type { Response } from 'express';

export class ApiResponse {
  static send<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    errors?: unknown,
  ): Response {
    const body: Record<string, unknown> = {
      success: statusCode < 400,
      message,
    };
    if (data !== undefined) body.data = data;
    if (errors !== undefined) body.errors = errors;
    return res.status(statusCode).json(body);
  }

  static success<T>(res: Response, data?: T, message = 'Success', statusCode = 200): Response {
    return ApiResponse.send(res, statusCode, message, data);
  }

  static created<T>(res: Response, data?: T, message = 'Created'): Response {
    return ApiResponse.send(res, 201, message, data);
  }

  static error(res: Response, statusCode: number, message: string, errors?: unknown): Response {
    return ApiResponse.send(res, statusCode, message, undefined, errors);
  }
}
