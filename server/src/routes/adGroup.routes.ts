/**
 * Ad Group Routes
 * REST API endpoints for ad group management
 */

import { Router, Request, Response } from 'express';
import { adGroupRepository, campaignRepository, adRepository } from '../db/repositories';
import type { CreateAdGroupInput, UpdateAdGroupInput, EntityStatus } from '../db/types';

const router = Router();

interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
  timestamp?: string;
}

/**
 * GET /api/ad-groups
 * List all ad groups
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const adGroups = adGroupRepository.findAll();

    const response: APIResponse<typeof adGroups> = {
      success: true,
      data: adGroups,
      meta: {
        count: adGroups.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    console.error('[AdGroups] Error fetching ad groups:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch ad groups',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/ad-groups/:id
 * Get ad group by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adGroup = adGroupRepository.findById(id);

    if (!adGroup) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_GROUP_NOT_FOUND',
          message: `Ad group with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: APIResponse<typeof adGroup> = {
      success: true,
      data: adGroup,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    console.error('[AdGroups] Error fetching ad group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch ad group',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/ad-groups/:id/ads
 * Get ads for an ad group
 */
router.get('/:id/ads', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if ad group exists
    const adGroup = adGroupRepository.findById(id);
    if (!adGroup) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_GROUP_NOT_FOUND',
          message: `Ad group with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const ads = adRepository.findByAdGroupId(id);

    const response: APIResponse<typeof ads> = {
      success: true,
      data: ads,
      meta: {
        ad_group_id: id,
        count: ads.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    console.error('[AdGroups] Error fetching ads:', error);
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
 * POST /api/ad-groups
 * Create new ad group
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateAdGroupInput = req.body;

    // Validation
    if (!data.campaign_id || data.campaign_id.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CAMPAIGN_ID',
          message: 'Campaign ID is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if campaign exists
    const campaign = campaignRepository.findById(data.campaign_id);
    if (!campaign) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: `Campaign with ID ${data.campaign_id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!data.name || data.name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'Ad group name is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (data.keywords && (!Array.isArray(data.keywords) || data.keywords.length === 0)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_KEYWORDS',
          message: 'Keywords must be a non-empty array if provided',
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

    const adGroup = adGroupRepository.create(data);

    const response: APIResponse<typeof adGroup> = {
      success: true,
      data: adGroup,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('[AdGroups] Error creating ad group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create ad group',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/ad-groups/:id
 * Update ad group
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateAdGroupInput = req.body;

    // Validation
    if (data.name !== undefined && data.name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'Ad group name cannot be empty',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (data.keywords !== undefined && (!Array.isArray(data.keywords) || data.keywords.length === 0)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_KEYWORDS',
          message: 'Keywords must be a non-empty array',
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

    const adGroup = adGroupRepository.update(id, data);

    if (!adGroup) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_GROUP_NOT_FOUND',
          message: `Ad group with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: APIResponse<typeof adGroup> = {
      success: true,
      data: adGroup,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    console.error('[AdGroups] Error updating ad group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update ad group',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/ad-groups/:id
 * Delete ad group (cascades to ads)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = adGroupRepository.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_GROUP_NOT_FOUND',
          message: `Ad group with ID ${id} not found`,
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
    console.error('[AdGroups] Error deleting ad group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete ad group',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
