/**
 * AI Copy Generation Routes
 *
 * Endpoints for AI-powered ad copy generation
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { strictApiLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, APIErrorClass } from '../middleware/errorHandler.js';
import { generateAdCopy, getAvailableProviders } from '../services/aiService.js';
import type { GenerateAdCopyRequest, APIResponse } from '../types/index.js';

const router = express.Router();

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(strictApiLimiter); // Use strict limiter for AI operations

/**
 * POST /api/ai/generate-copy
 *
 * Generate complete ad copy (headlines + descriptions) using AI
 *
 * Request body:
 * {
 *   "provider": "openai" | "claude",
 *   "businessDescription": string,
 *   "targetKeywords"?: string[],
 *   "tone"?: "professional" | "casual" | "urgent" | "friendly",
 *   "callToAction"?: string,
 *   "uniqueSellingPoints"?: string[],
 *   "targetAudience"?: string,
 *   "headlineCount"?: number,
 *   "descriptionCount"?: number
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "headlines": string[],
 *     "descriptions": string[],
 *     "generatedAt": string,
 *     "provider": "openai" | "claude"
 *   },
 *   "timestamp": string
 * }
 */
router.post(
  '/generate-copy',
  asyncHandler(async (req, res) => {
    const request = req.body as GenerateAdCopyRequest;

    // Validate required fields
    if (!request.businessDescription) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'businessDescription is required',
        {
          field: 'businessDescription',
          hint: 'Provide a description of the business or product',
        }
      );
    }

    if (!request.provider) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'provider is required',
        {
          field: 'provider',
          validValues: ['openai', 'claude'],
          hint: 'Specify which AI provider to use',
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
    if (request.tone && !['professional', 'casual', 'urgent', 'friendly'].includes(request.tone)) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'Invalid tone value',
        {
          field: 'tone',
          received: request.tone,
          validValues: ['professional', 'casual', 'urgent', 'friendly'],
        }
      );
    }

    if (request.headlineCount && (request.headlineCount < 1 || request.headlineCount > 30)) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'headlineCount must be between 1 and 30',
        {
          field: 'headlineCount',
          received: request.headlineCount,
        }
      );
    }

    if (request.descriptionCount && (request.descriptionCount < 1 || request.descriptionCount > 10)) {
      throw new APIErrorClass(
        400,
        'VALIDATION_ERROR',
        'descriptionCount must be between 1 and 10',
        {
          field: 'descriptionCount',
          received: request.descriptionCount,
        }
      );
    }

    // Generate ad copy
    const result = await generateAdCopy(request);

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
 * GET /api/ai/providers
 *
 * Get list of available AI providers
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "providers": ["openai", "claude"],
 *     "default": "openai"
 *   },
 *   "timestamp": string
 * }
 */
router.get(
  '/providers',
  asyncHandler(async (_req, res) => {
    const providers = getAvailableProviders();

    if (providers.length === 0) {
      throw new APIErrorClass(
        503,
        'NO_PROVIDERS_AVAILABLE',
        'No AI providers are currently configured on the server',
        {
          hint: 'Administrator: Configure OPENAI_API_KEY or ANTHROPIC_API_KEY',
        }
      );
    }

    const response: APIResponse<any> = {
      success: true,
      data: {
        providers,
        default: providers[0], // First available provider
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/ai/health
 *
 * Health check for AI services
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": "healthy",
 *     "providers": {
 *       "openai": true,
 *       "claude": false
 *     }
 *   },
 *   "timestamp": string
 * }
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const providers = getAvailableProviders();

    const response: APIResponse<any> = {
      success: true,
      data: {
        status: providers.length > 0 ? 'healthy' : 'unavailable',
        providers: {
          openai: providers.includes('openai'),
          claude: providers.includes('claude'),
        },
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;
