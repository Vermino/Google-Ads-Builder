/**
 * Ad Routes
 * REST API endpoints for ad management
 */

import { Router, Request, Response } from 'express';
import { adRepository, adGroupRepository } from '../db/repositories';
import type { CreateAdInput, UpdateAdInput, EntityStatus } from '../db/types';

const router = Router();

interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
  timestamp?: string;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/ads
 * List all ads
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const ads = adRepository.findAll();

    const response: APIResponse<typeof ads> = {
      success: true,
      data: ads,
      meta: {
        count: ads.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Ads] Error fetching ads:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch ads',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/ads/:id
 * Get ad by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ad = adRepository.findById(id);

    if (!ad) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_NOT_FOUND',
          message: `Ad with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: APIResponse<typeof ad> = {
      success: true,
      data: ad,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Ads] Error fetching ad:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch ad',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/ads
 * Create new ad
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateAdInput = req.body;

    // Validation
    if (!data.ad_group_id || data.ad_group_id.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AD_GROUP_ID',
          message: 'Ad group ID is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if ad group exists
    const adGroup = adGroupRepository.findById(data.ad_group_id);
    if (!adGroup) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_GROUP_NOT_FOUND',
          message: `Ad group with ID ${data.ad_group_id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!Array.isArray(data.headlines) || data.headlines.length < 3) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_HEADLINES',
          message: 'Headlines must be an array with at least 3 items',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!Array.isArray(data.descriptions) || data.descriptions.length < 2) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DESCRIPTIONS',
          message: 'Descriptions must be an array with at least 2 items',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!data.final_url || !isValidUrl(data.final_url)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'A valid final URL is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const validStatuses: EntityStatus[] = ['active', 'paused', 'draft'];
    if (data.status && !validStatuses.includes(data.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const ad = adRepository.create(data);

    const response: APIResponse<typeof ad> = {
      success: true,
      data: ad,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('[Ads] Error creating ad:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create ad',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/ads/:id
 * Update ad
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateAdInput = req.body;

    // Validation
    if (data.headlines !== undefined && (!Array.isArray(data.headlines) || data.headlines.length < 3)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_HEADLINES',
          message: 'Headlines must be an array with at least 3 items',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (data.descriptions !== undefined && (!Array.isArray(data.descriptions) || data.descriptions.length < 2)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DESCRIPTIONS',
          message: 'Descriptions must be an array with at least 2 items',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (data.final_url !== undefined && !isValidUrl(data.final_url)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Final URL must be a valid URL',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const validStatuses: EntityStatus[] = ['active', 'paused', 'draft'];
    if (data.status && !validStatuses.includes(data.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const ad = adRepository.update(id, data);

    if (!ad) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_NOT_FOUND',
          message: `Ad with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: APIResponse<typeof ad> = {
      success: true,
      data: ad,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Ads] Error updating ad:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update ad',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/ads/:id
 * Delete ad
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = adRepository.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_NOT_FOUND',
          message: `Ad with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: APIResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    console.error('[Ads] Error deleting ad:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete ad',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
