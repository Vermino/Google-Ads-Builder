/**
 * Error Handling Middleware
 *
 * Centralized error handling for the API server.
 * Converts errors to structured API responses.
 */

import { Request, Response, NextFunction } from 'express';
import type { APIError } from '../types/index.js';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Custom error class for API errors
 */
export class APIErrorClass extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Error handler middleware
 *
 * Catches all errors and returns structured JSON responses
 */
export function errorHandler(
  err: Error | APIErrorClass,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;

  // Determine status code
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: any = undefined;

  // Handle custom API errors
  if (err instanceof APIErrorClass) {
    statusCode = err.statusCode;
    errorCode = err.code;
    errorMessage = err.message;
    errorDetails = err.details;
  }
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = err.message;
  }
  // Handle generic errors
  else if (err instanceof Error) {
    errorMessage = err.message;

    // Check for specific error patterns
    if (err.message.includes('API key')) {
      statusCode = 401;
      errorCode = 'AUTH_ERROR';
    } else if (err.message.includes('rate limit')) {
      statusCode = 429;
      errorCode = 'RATE_LIMIT';
    } else if (err.message.includes('timeout')) {
      statusCode = 408;
      errorCode = 'TIMEOUT';
    }
  }

  // Log error with structured logging
  logger.error(`[${requestId}] Error ${errorCode}:`, {
    requestId,
    statusCode,
    errorCode,
    message: errorMessage,
    details: errorDetails,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });

  // Build error response
  const errorResponse: APIError = {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      details: config.nodeEnv === 'development' ? errorDetails : undefined,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Not found handler
 *
 * Returns 404 for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: APIError = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
}

/**
 * Async handler wrapper
 *
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
