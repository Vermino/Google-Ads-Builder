/**
 * Campaign Routes
 * REST API endpoints for campaign management
 */

import { Router, Request, Response } from 'express';
import { campaignRepository, adGroupRepository } from '../db/repositories';
import type { CreateCampaignInput, UpdateCampaignInput, EntityStatus } from '../db/types';
import logger from '../utils/logger.js';

const router = Router();

interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
  timestamp?: string;
}

/**
 * GET /api/campaigns
 * List all campaigns
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const campaigns = campaignRepository.findAll();

    const response: APIResponse<typeof campaigns> = {
      success: true,
      data: campaigns,
      meta: {
        count: campaigns.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    logger.error('[Campaigns] Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch campaigns',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/campaigns/search?q=query
 * Search campaigns by name
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const campaigns = campaignRepository.searchByName(query);

    const response: APIResponse<typeof campaigns> = {
      success: true,
      data: campaigns,
      meta: {
        query,
        count: campaigns.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    logger.error('[Campaigns] Error searching campaigns:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: 'Failed to search campaigns',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = campaignRepository.findById(id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: `Campaign with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: APIResponse<typeof campaign> = {
      success: true,
      data: campaign,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    logger.error('[Campaigns] Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch campaign',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/campaigns/:id/ad-groups
 * Get ad groups for a campaign
 */
router.get('/:id/ad-groups', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if campaign exists
    const campaign = campaignRepository.findById(id);
    if (!campaign) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: `Campaign with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const adGroups = adGroupRepository.findByCampaignId(id);

    const response: APIResponse<typeof adGroups> = {
      success: true,
      data: adGroups,
      meta: {
        campaign_id: id,
        count: adGroups.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    logger.error('[Campaigns] Error fetching ad groups:', error);
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
 * POST /api/campaigns
 * Create new campaign
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateCampaignInput = req.body;

    // Validation
    if (!data.name || data.name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'Campaign name is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (data.budget !== undefined && (typeof data.budget !== 'number' || data.budget < 0)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BUDGET',
          message: 'Budget must be a number greater than or equal to 0',
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

    const campaign = campaignRepository.create(data);

    const response: APIResponse<typeof campaign> = {
      success: true,
      data: campaign,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('[Campaigns] Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create campaign',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/campaigns/:id
 * Update campaign
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateCampaignInput = req.body;

    // Validation
    if (data.name !== undefined && data.name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'Campaign name cannot be empty',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (data.budget !== undefined && (typeof data.budget !== 'number' || data.budget < 0)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BUDGET',
          message: 'Budget must be a number greater than or equal to 0',
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

    const campaign = campaignRepository.update(id, data);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: `Campaign with ID ${id} not found`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: APIResponse<typeof campaign> = {
      success: true,
      data: campaign,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    logger.error('[Campaigns] Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update campaign',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign (cascades to ad groups and ads)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = campaignRepository.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: `Campaign with ID ${id} not found`,
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
    logger.error('[Campaigns] Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete campaign',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
