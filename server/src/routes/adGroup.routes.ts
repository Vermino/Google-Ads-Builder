/**
 * Ad Group Routes
 * REST API endpoints for ad group management
 */

import { Router, Request, Response } from 'express';
import { adGroupRepository, campaignRepository, adRepository } from '../db/repositories';
import type {
  CreateAdGroupInput,
  UpdateAdGroupInput,
  EntityStatus,
  AdGroup as DbAdGroup,
  Ad as DbAd,
} from '../db/types';

const router = Router();

interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
  timestamp?: string;
}

function generateCopyName(baseName: string, existingNames: Set<string>): string {
  const baseCopy = `${baseName} (Copy)`;
  if (!existingNames.has(baseCopy)) {
    existingNames.add(baseCopy);
    return baseCopy;
  }

  let counter = 2;
  while (true) {
    const candidate = `${baseName} (Copy ${counter})`;
    if (!existingNames.has(candidate)) {
      existingNames.add(candidate);
      return candidate;
    }
    counter += 1;
  }
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

    if (data.keywords && !Array.isArray(data.keywords)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_KEYWORDS',
          message: 'Keywords must be an array if provided',
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

    if (data.keywords !== undefined && !Array.isArray(data.keywords)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_KEYWORDS',
          message: 'Keywords must be an array',
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

/**
 * POST /api/ad-groups/bulk/duplicate
 * Duplicate multiple ad groups (including their ads)
 */
router.post('/bulk/duplicate', async (req: Request, res: Response) => {
  try {
    const { campaignId, adGroupIds } = req.body as {
      campaignId?: string;
      adGroupIds?: string[];
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

    if (!Array.isArray(adGroupIds) || adGroupIds.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AD_GROUP_IDS',
          message: 'adGroupIds must be a non-empty array',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const campaign = campaignRepository.findById(campaignId);
    if (!campaign) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: `Campaign with ID ${campaignId} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const existingNames = new Set(
      adGroupRepository
        .findByCampaignId(campaignId)
        .map((adGroup) => adGroup.name)
    );

    const duplicates: Array<{ ad_group: DbAdGroup; ads: DbAd[] }> = [];

    for (const id of adGroupIds) {
      const original = adGroupRepository.findById(id);
      if (!original || original.campaign_id !== campaignId) {
        res.status(404).json({
          success: false,
          error: {
            code: 'AD_GROUP_NOT_FOUND',
            message: `Ad group with ID ${id} not found in campaign ${campaignId}`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const copyName = generateCopyName(original.name, existingNames);
      const createdAdGroup = adGroupRepository.create({
        campaign_id: campaignId,
        name: copyName,
        keywords: original.keywords,
        status: original.status as EntityStatus,
      });

      const originalAds = adRepository.findByAdGroupId(id);
      const createdAds = originalAds.map((ad) =>
        adRepository.create({
          ad_group_id: createdAdGroup.id,
          headlines: ad.headlines,
          descriptions: ad.descriptions,
          final_url: ad.final_url,
          status: ad.status as EntityStatus,
        })
      );

      duplicates.push({
        ad_group: createdAdGroup,
        ads: createdAds,
      });
    }

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
    console.error('[AdGroups] Error duplicating ad groups:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DUPLICATE_FAILED',
        message: 'Failed to duplicate ad groups',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/ad-groups/bulk/status
 * Update status for multiple ad groups
 */
router.patch('/bulk/status', async (req: Request, res: Response) => {
  try {
    const { campaignId, adGroupIds, status } = req.body as {
      campaignId?: string;
      adGroupIds?: string[];
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

    if (!Array.isArray(adGroupIds) || adGroupIds.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AD_GROUP_IDS',
          message: 'adGroupIds must be a non-empty array',
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

    const invalidIds = adGroupIds.filter((id) => {
      const adGroup = adGroupRepository.findById(id);
      return !adGroup || adGroup.campaign_id !== campaignId;
    });

    if (invalidIds.length > 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AD_GROUP_NOT_FOUND',
          message: `Some ad groups were not found in campaign ${campaignId}`,
          details: { invalidIds },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const updatedAdGroups = adGroupRepository.updateStatusBulk(adGroupIds, status);
    campaignRepository.touch(campaignId);

    res.json({
      success: true,
      data: updatedAdGroups,
      meta: {
        updated: updatedAdGroups.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[AdGroups] Error updating ad group status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_STATUS_FAILED',
        message: 'Failed to update ad group statuses',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
