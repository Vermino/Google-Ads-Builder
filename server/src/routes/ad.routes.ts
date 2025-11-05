/**
 * Ad Routes
 * REST API endpoints for ad management
 */

import { Router, Request, Response } from 'express';
import { adRepository, adGroupRepository, campaignRepository } from '../db/repositories';
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

/**
 * POST /api/ads/bulk/duplicate
 * Duplicate multiple ads within an ad group
 */
router.post('/bulk/duplicate', async (req: Request, res: Response) => {
  try {
    const { campaignId, adGroupId, adIds } = req.body as {
      campaignId?: string;
      adGroupId?: string;
      adIds?: string[];
    };

    if (!campaignId || typeof campaignId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CAMPAIGN_ID',
          message: 'campaignId must be provided as a string',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!adGroupId || typeof adGroupId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AD_GROUP_ID',
          message: 'adGroupId must be provided as a string',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!Array.isArray(adIds) || adIds.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AD_IDS',
          message: 'adIds must be a non-empty array',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const adGroup = adGroupRepository.findById(adGroupId);
    if (!adGroup || adGroup.campaign_id !== campaignId) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_GROUP_NOT_FOUND',
          message: `Ad group ${adGroupId} not found in campaign ${campaignId}`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const duplicates = [];
    for (const adId of adIds) {
      const original = adRepository.findById(adId);
      if (!original || original.ad_group_id !== adGroupId) {
        res.status(404).json({
          success: false,
          error: {
            code: 'AD_NOT_FOUND',
            message: `Ad ${adId} not found in ad group ${adGroupId}`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const createdAd = adRepository.create({
        ad_group_id: adGroupId,
        headlines: original.headlines,
        descriptions: original.descriptions,
        final_url: original.final_url,
        status: original.status as EntityStatus,
      });

      duplicates.push(createdAd);
    }

    adGroupRepository.touch(adGroupId);
    campaignRepository.touch(campaignId);

    res.status(201).json({
      success: true,
      data: duplicates,
      meta: {
        count: duplicates.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Ads] Error duplicating ads:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DUPLICATE_FAILED',
        message: 'Failed to duplicate ads',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/ads/bulk/status
 * Update status for multiple ads
 */
router.patch('/bulk/status', async (req: Request, res: Response) => {
  try {
    const { campaignId, adGroupId, adIds, status } = req.body as {
      campaignId?: string;
      adGroupId?: string;
      adIds?: string[];
      status?: EntityStatus;
    };

    if (!campaignId || typeof campaignId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CAMPAIGN_ID',
          message: 'campaignId must be provided as a string',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!adGroupId || typeof adGroupId !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AD_GROUP_ID',
          message: 'adGroupId must be provided as a string',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!Array.isArray(adIds) || adIds.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AD_IDS',
          message: 'adIds must be a non-empty array',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const validStatuses: EntityStatus[] = ['active', 'paused', 'draft'];
    if (!status || !validStatuses.includes(status)) {
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

    const adGroup = adGroupRepository.findById(adGroupId);
    if (!adGroup || adGroup.campaign_id !== campaignId) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_GROUP_NOT_FOUND',
          message: `Ad group ${adGroupId} not found in campaign ${campaignId}`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const invalidIds = adIds.filter((id) => {
      const ad = adRepository.findById(id);
      return !ad || ad.ad_group_id !== adGroupId;
    });

    if (invalidIds.length > 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_NOT_FOUND',
          message: `Some ads were not found in ad group ${adGroupId}`,
          details: { invalidIds },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const updatedAds = adRepository.updateStatusBulk(adIds, status);
    adGroupRepository.touch(adGroupId);
    campaignRepository.touch(campaignId);

    res.json({
      success: true,
      data: updatedAds,
      meta: {
        updated: updatedAds.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Ads] Error updating ad status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_STATUS_FAILED',
        message: 'Failed to update ad statuses',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
