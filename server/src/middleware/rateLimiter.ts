/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse by limiting request rates.
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

/**
 * Standard API rate limiter
 *
 * Limits requests to prevent abuse while allowing normal usage.
 * Default: 100 requests per 15 minutes per IP address.
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      details: {
        retryAfter: Math.ceil(config.rateLimitWindowMs / 1000 / 60), // minutes
      },
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use IP address as key
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  // Skip successful requests in count (only count on error)
  skipSuccessfulRequests: false,
  // Skip failed requests in count
  skipFailedRequests: false,
});

/**
 * Strict rate limiter for expensive AI operations
 *
 * More restrictive limits for resource-intensive endpoints.
 * Default: 20 requests per 15 minutes per IP address.
 */
export const strictApiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: Math.floor(config.rateLimitMaxRequests / 5), // 1/5th of standard limit
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many AI generation requests. Please wait before trying again.',
      details: {
        retryAfter: Math.ceil(config.rateLimitWindowMs / 1000 / 60), // minutes
      },
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

/**
 * Authentication rate limiter
 *
 * Protects authentication endpoints from brute force attacks.
 * Very strict: 5 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
      details: {
        retryAfter: Math.ceil(config.rateLimitWindowMs / 1000 / 60), // minutes
      },
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth
});
