/**
 * Keyword Research Routes
 *
 * Endpoints for AI-powered keyword research and analysis
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { strictApiLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, APIErrorClass } from '../middleware/errorHandler.js';
import { researchKeywords } from '../services/keywordService.js';
import type { KeywordResearchRequest, APIResponse } from '../types/index.js';

const router = express.Router();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(strictApiLimiter); // Use strict limiter for AI operations

/**
 * POST /api/keywords/research
 *
 * Perform comprehensive keyword research using AI
 *
 * Request body:
 * {
 *   "provider": "openai" | "claude",
 *   "seedKeywords": string[],
 *   "businessDescription"?: string,
 *   "targetLocation"?: string,
 *   "language"?: string,
 *   "maxResults"?: number,
 *   "includeLongTail"?: boolean,
 *   "includeNegativeKeywords"?: boolean
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "suggestions": KeywordSuggestion[],
 *     "relatedTerms": string[],
 *     "longTailVariations": string[],
 *     "negativeKeywords": string[],
 *     "researchedAt": string,
 *     "provider": "openai" | "claude"
 *   },
 *   "timestamp": string
 * }
 */
router.post(
  '/research',
  asyncHandler(async (req, res) => {
    const request = req.body as KeywordResearchRequest;

    // Validate required fields
    if (!request.seedKeywords || !Array.isArray(request.seedKeywords)) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'seedKeywords is required and must be an array',
        {
          field: 'seedKeywords',
          hint: 'Provide an array of initial keywords to expand from',
          example: ['plumbing', 'emergency plumber'],
        }
      );
    }

    if (request.seedKeywords.length === 0) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'At least one seed keyword is required',
        {
          field: 'seedKeywords',
          received: [],
          hint: 'Provide at least one keyword to start with',
        }
      );
    }

    if (request.seedKeywords.length > 10) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'Maximum 10 seed keywords allowed',
        {
          field: 'seedKeywords',
          received: request.seedKeywords.length,
          max: 10,
        }
      );
    }

    // Validate each keyword
    for (const keyword of request.seedKeywords) {
      if (typeof keyword !== 'string') {
        throw new APIErrorClass(
          400,
          'VALIDATION_ERROR',
          'All seed keywords must be strings',
          {
            field: 'seedKeywords',
            invalidValue: keyword,
          }
        );
      }

      if (keyword.trim().length === 0) {
        throw new APIErrorClass(
          400,
          'VALIDATION_ERROR',
          'Seed keywords cannot be empty',
          {
            field: 'seedKeywords',
          }
        );
      }

      if (keyword.length > 80) {
        throw new APIErrorClass(
          400,
          'VALIDATION_ERROR',
          'Seed keywords must be 80 characters or less',
          {
            field: 'seedKeywords',
            keyword,
            length: keyword.length,
          }
        );
      }
    }

    if (!request.provider) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'provider is required',
        {
          field: 'provider',
          validValues: ['openai', 'claude'],
        }
      );
    }

    if (!['openai', 'claude'].includes(request.provider)) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'Invalid provider. Must be "openai" or "claude"',
        {
          field: 'provider',
          received: request.provider,
          validValues: ['openai', 'claude'],
        }
      );
    }

    // Validate optional fields
    if (request.maxResults && (request.maxResults < 1 || request.maxResults > 500)) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'maxResults must be between 1 and 500',
        {
          field: 'maxResults',
          received: request.maxResults,
        }
      );
    }

    // Perform keyword research
    const result = await researchKeywords(request);

    // Build response
    const response: APIResponse<typeof result> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * POST /api/keywords/expand
 *
 * Quick keyword expansion without AI (faster, no API costs)
 *
 * Request body:
 * {
 *   "keywords": string[],
 *   "maxVariations"?: number
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "expanded": string[],
 *     "count": number
 *   },
 *   "timestamp": string
 * }
 */
router.post(
  '/expand',
  asyncHandler(async (req, res) => {
    const { keywords, maxVariations = 20 } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'keywords array is required',
        {
          field: 'keywords',
          hint: 'Provide an array of keywords to expand',
        }
      );
    }

    // Use the keyword service expansion function
    const { expandKeywords } = await import('../services/keywordService.js');
    const expanded = expandKeywords(keywords, maxVariations);

    const response: APIResponse<any> = {
      success: true,
      data: {
        expanded,
        count: expanded.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * POST /api/keywords/negative
 *
 * Generate negative keyword suggestions
 *
 * Request body:
 * {
 *   "keywords": string[],
 *   "businessType"?: string
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "negativeKeywords": string[],
 *     "count": number
 *   },
 *   "timestamp": string
 * }
 */
router.post(
  '/negative',
  asyncHandler(async (req, res) => {
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'keywords array is required',
        {
          field: 'keywords',
          hint: 'Provide an array of primary keywords',
        }
      );
    }

    // Use the keyword service negative keyword function
    const { suggestNegativeKeywords } = await import('../services/keywordService.js');
    const negativeKeywords = suggestNegativeKeywords(keywords);

    const response: APIResponse<any> = {
      success: true,
      data: {
        negativeKeywords,
        count: negativeKeywords.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;
