/**
 * Authentication Middleware
 *
 * Validates Bearer tokens for API requests.
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config.js';
import { APIErrorClass } from './errorHandler.js';

/**
 * Authenticate Bearer token from Authorization header
 *
 * Expected header format: "Authorization: Bearer <token>"
 *
 * @throws {APIErrorClass} 401 if token is missing or invalid
 */
export function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Extract Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new APIErrorClass(
      401,
      'AUTH_REQUIRED',
      'Authentication required. Please provide a Bearer token in the Authorization header.',
      {
        hint: 'Add header: Authorization: Bearer <your-token>',
      }
    );
  }

  // Parse Bearer token
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new APIErrorClass(
      401,
      'INVALID_AUTH_FORMAT',
      'Invalid Authorization header format. Expected "Bearer <token>"',
      {
        received: authHeader,
        expected: 'Bearer <token>',
      }
    );
  }

  const token = parts[1];

  // Validate token against configured tokens
  const validTokens = config.apiAuthTokens;

  if (validTokens.length === 0) {
    throw new APIErrorClass(
      500,
      'AUTH_NOT_CONFIGURED',
      'Server authentication is not configured',
      {
        hint: 'Administrator: Set API_AUTH_TOKEN or API_AUTH_TOKENS environment variable',
      }
    );
  }

  if (!validTokens.includes(token)) {
    throw new APIErrorClass(
      403,
      'INVALID_TOKEN',
      'Invalid authentication token',
      {
        hint: 'Check your API token configuration',
      }
    );
  }

  // Token is valid - continue to next middleware
  next();
}

/**
 * Optional authentication middleware
 *
 * Validates token if provided, but allows requests without tokens.
 * Useful for endpoints that have both authenticated and public access.
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // If no auth header, skip validation
  if (!authHeader) {
    return next();
  }

  // If auth header exists, validate it
  try {
    authenticateToken(req, res, next);
  } catch (error) {
    next(error);
  }
}

/**
 * Check if request is authenticated
 *
 * Utility function to check if a request has valid authentication
 */
export function isAuthenticated(req: Request): boolean {
  const authHeader = req.headers.authorization;

  if (!authHeader) return false;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return false;

  const token = parts[1];
  return config.apiAuthTokens.includes(token);
}
