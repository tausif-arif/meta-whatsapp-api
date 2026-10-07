export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational = true;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized', details?: unknown): ApiError {
    return new ApiError(401, message, details);
  }

  static forbidden(message = 'Forbidden', details?: unknown): ApiError {
    return new ApiError(403, message, details);
  }

  static notFound(message = 'Resource not found', details?: unknown): ApiError {
    return new ApiError(404, message, details);
  }

  static conflict(message = 'Conflict', details?: unknown): ApiError {
    return new ApiError(409, message, details);
  }

  static tooMany(message = 'Too many requests', details?: unknown): ApiError {
    return new ApiError(429, message, details);
  }

  static upstream(message = 'Upstream Meta API error', details?: unknown): ApiError {
    return new ApiError(502, message, details);
  }

  static unavailable(message = 'Service unavailable: Meta API is not configured', details?: unknown): ApiError {
    return new ApiError(503, message, details);
  }

  static internal(message = 'Internal server error', details?: unknown): ApiError {
    return new ApiError(500, message, details);
  }
}
