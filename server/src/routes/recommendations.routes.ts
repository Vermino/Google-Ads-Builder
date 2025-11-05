/**
 * Recommendations API Routes
 * Handles recommendation generation, retrieval, and application
 */

import express, { Request, Response } from 'express';
import {
  generateRecommendations,
  applyRecommendation,
  getRecommendationsForCampaign,
} from '../services/recommendationEngine.js';
import { getDatabase } from '../db/database.js';

const router = express.Router();

/**
 * POST /api/recommendations/generate
 * Generate recommendations for campaigns
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const options = {
      campaignIds: req.body.campaignIds,
      includeStructureHygiene: req.body.includeStructureHygiene !== false,
      includeAssetOptimization: req.body.includeAssetOptimization !== false,
      includeQueryMining: req.body.includeQueryMining !== false,
      includeBudgetOptimization: req.body.includeBudgetOptimization !== false,
      minImpressionsThreshold: req.body.minImpressionsThreshold || 100,
      dateRangeStart: req.body.dateRangeStart,
      dateRangeEnd: req.body.dateRangeEnd,
    };

    const recommendations = await generateRecommendations(options);

    res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate recommendations',
    });
  }
});

/**
 * GET /api/recommendations
 * Get all recommendations, optionally filtered
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    const { status, priority, campaignId, type, limit = '100' } = req.query;

    let query = 'SELECT * FROM recommendations WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    if (campaignId) {
      query += ' AND campaign_id = ?';
      params.push(campaignId);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY priority DESC, created_at DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const rows = db.prepare(query).all(...params) as any[];

    const recommendations = rows.map(row => ({
      id: row.id,
      campaignId: row.campaign_id,
      adGroupId: row.ad_group_id,
      adId: row.ad_id,
      type: row.type,
      priority: row.priority,
      title: row.title,
      description: row.description,
      impactEstimate: row.impact_estimate,
      actionRequired: JSON.parse(row.action_required),
      autoApplyEligible: row.auto_apply_eligible === 1,
      status: row.status,
      appliedAt: row.applied_at,
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recommendations',
    });
  }
});

/**
 * GET /api/recommendations/campaign/:campaignId
 * Get recommendations for a specific campaign
 */
router.get('/campaign/:campaignId', (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { status } = req.query;

    const recommendations = getRecommendationsForCampaign(campaignId, status as string);

    res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });

  } catch (error) {
    console.error('Error fetching campaign recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recommendations',
    });
  }
});

/**
 * GET /api/recommendations/stats
 * Get recommendation statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    const stats = {
      total: 0,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      autoApplyEligible: 0,
    };

    // Total count
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM recommendations').get() as { count: number };
    stats.total = totalRow.count;

    // By status
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM recommendations
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    for (const row of byStatus) {
      stats.byStatus[row.status] = row.count;
    }

    // By priority
    const byPriority = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM recommendations
      GROUP BY priority
    `).all() as Array<{ priority: string; count: number }>;

    for (const row of byPriority) {
      stats.byPriority[row.priority] = row.count;
    }

    // By type
    const byType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM recommendations
      GROUP BY type
      ORDER BY count DESC
      LIMIT 10
    `).all() as Array<{ type: string; count: number }>;

    for (const row of byType) {
      stats.byType[row.type] = row.count;
    }

    // Auto-apply eligible
    const autoApplyRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM recommendations
      WHERE auto_apply_eligible = 1 AND status = 'pending'
    `).get() as { count: number };

    stats.autoApplyEligible = autoApplyRow.count;

    res.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('Error fetching recommendation stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    });
  }
});

/**
 * POST /api/recommendations/:id/apply
 * Apply a specific recommendation
 */
router.post('/:id/apply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await applyRecommendation(id);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }

  } catch (error) {
    console.error('Error applying recommendation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply recommendation',
    });
  }
});

/**
 * POST /api/recommendations/apply-bulk
 * Apply multiple recommendations
 */
router.post('/apply-bulk', async (req: Request, res: Response) => {
  try {
    const { recommendationIds } = req.body;

    if (!Array.isArray(recommendationIds) || recommendationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'recommendationIds must be a non-empty array',
      });
    }

    const results = {
      applied: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const id of recommendationIds) {
      try {
        const result = await applyRecommendation(id);
        if (result.success) {
          results.applied++;
        } else {
          results.failed++;
          results.errors.push(`${id}: ${result.message}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: results.failed === 0,
      results,
    });

  } catch (error) {
    console.error('Error applying bulk recommendations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply recommendations',
    });
  }
});

/**
 * PATCH /api/recommendations/:id/status
 * Update recommendation status (dismiss, schedule, etc.)
 */
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'applied', 'dismissed', 'scheduled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, applied, dismissed, or scheduled',
      });
    }

    const db = getDatabase();

    const result = db.prepare(`
      UPDATE recommendations
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found',
      });
    }

    res.json({
      success: true,
      message: 'Recommendation status updated',
    });

  } catch (error) {
    console.error('Error updating recommendation status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    });
  }
});

/**
 * DELETE /api/recommendations/:id
 * Delete a recommendation
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const result = db.prepare('DELETE FROM recommendations WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation not found',
      });
    }

    res.json({
      success: true,
      message: 'Recommendation deleted',
    });

  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete recommendation',
    });
  }
});

export default router;
