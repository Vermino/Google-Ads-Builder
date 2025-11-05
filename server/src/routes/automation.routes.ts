/**
 * Automation API Routes
 * Handles automation rule management and execution
 */

import express, { Request, Response } from 'express';
import {
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  getAutomationRules,
  getAutomationRule,
  executeAutomation,
  getAutomationHistory,
} from '../services/automationOrchestrator.js';

const router = express.Router();

/**
 * GET /api/automation/rules
 * Get all automation rules
 */
router.get('/rules', (req: Request, res: Response) => {
  try {
    const enabledOnly = req.query.enabledOnly === 'true';
    const rules = getAutomationRules(enabledOnly);

    res.json({
      success: true,
      count: rules.length,
      rules,
    });

  } catch (error) {
    console.error('Error fetching automation rules:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rules',
    });
  }
});

/**
 * GET /api/automation/rules/:id
 * Get a specific automation rule
 */
router.get('/rules/:id', (req: Request, res: Response) => {
  try {
    const rule = getAutomationRule(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Automation rule not found',
      });
    }

    res.json({
      success: true,
      rule,
    });

  } catch (error) {
    console.error('Error fetching automation rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rule',
    });
  }
});

/**
 * POST /api/automation/rules
 * Create a new automation rule
 */
router.post('/rules', (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      triggerType,
      triggerConfig,
      actionType,
      actionConfig,
      filters,
      enabled = true,
    } = req.body;

    // Validation
    if (!name || !triggerType || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'name, triggerType, and actionType are required',
      });
    }

    const validTriggerTypes = ['scheduled', 'performance_threshold', 'budget_threshold', 'import_completion', 'manual'];
    if (!validTriggerTypes.includes(triggerType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid triggerType. Must be one of: ${validTriggerTypes.join(', ')}`,
      });
    }

    const validActionTypes = [
      'apply_recommendations',
      'pause_low_performers',
      'increase_budget',
      'decrease_budget',
      'add_negatives',
      'add_keywords',
      'refresh_ads',
      'adjust_bids',
      'generate_report',
      'sync_sheets_data',
      'generate_recommendations',
    ];

    if (!validActionTypes.includes(actionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid actionType. Must be one of: ${validActionTypes.join(', ')}`,
      });
    }

    const rule = createAutomationRule({
      name,
      description,
      triggerType,
      triggerConfig: triggerConfig || {},
      actionType,
      actionConfig: actionConfig || {},
      filters: filters || {},
      enabled,
    });

    res.status(201).json({
      success: true,
      rule,
    });

  } catch (error) {
    console.error('Error creating automation rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create rule',
    });
  }
});

/**
 * PATCH /api/automation/rules/:id
 * Update an automation rule
 */
router.patch('/rules/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = updateAutomationRule(id, updates);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Automation rule not found or no changes made',
      });
    }

    const updatedRule = getAutomationRule(id);

    res.json({
      success: true,
      rule: updatedRule,
    });

  } catch (error) {
    console.error('Error updating automation rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update rule',
    });
  }
});

/**
 * DELETE /api/automation/rules/:id
 * Delete an automation rule
 */
router.delete('/rules/:id', (req: Request, res: Response) => {
  try {
    const success = deleteAutomationRule(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Automation rule not found',
      });
    }

    res.json({
      success: true,
      message: 'Automation rule deleted',
    });

  } catch (error) {
    console.error('Error deleting automation rule:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete rule',
    });
  }
});

/**
 * POST /api/automation/rules/:id/execute
 * Execute an automation rule manually
 */
router.post('/rules/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const execution = await executeAutomation(id, 'manual');

    res.json({
      success: execution.status === 'completed',
      execution,
    });

  } catch (error) {
    console.error('Error executing automation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute automation',
    });
  }
});

/**
 * GET /api/automation/history
 * Get automation execution history
 */
router.get('/history', (req: Request, res: Response) => {
  try {
    const ruleId = req.query.ruleId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = getAutomationHistory(ruleId, limit);

    res.json({
      success: true,
      count: history.length,
      history,
    });

  } catch (error) {
    console.error('Error fetching automation history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch history',
    });
  }
});

/**
 * GET /api/automation/stats
 * Get automation statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const { getDatabase } = require('../db/database.js');
    const db = getDatabase();

    const stats = {
      totalRules: 0,
      enabledRules: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgExecutionTimeMs: 0,
      nextScheduled: null as string | null,
    };

    // Total rules
    const totalRulesRow = db.prepare('SELECT COUNT(*) as count FROM automation_rules').get() as { count: number };
    stats.totalRules = totalRulesRow.count;

    // Enabled rules
    const enabledRulesRow = db.prepare('SELECT COUNT(*) as count FROM automation_rules WHERE enabled = 1').get() as { count: number };
    stats.enabledRules = enabledRulesRow.count;

    // Total executions
    const totalExecRow = db.prepare('SELECT COUNT(*) as count FROM automation_history').get() as { count: number };
    stats.totalExecutions = totalExecRow.count;

    // Successful executions
    const successExecRow = db.prepare('SELECT COUNT(*) as count FROM automation_history WHERE status = ?').get('completed') as { count: number };
    stats.successfulExecutions = successExecRow.count;

    // Failed executions
    const failedExecRow = db.prepare('SELECT COUNT(*) as count FROM automation_history WHERE status = ?').get('failed') as { count: number };
    stats.failedExecutions = failedExecRow.count;

    // Average execution time
    const avgTimeRow = db.prepare(`
      SELECT AVG(execution_time_ms) as avg
      FROM automation_history
      WHERE execution_time_ms IS NOT NULL
    `).get() as { avg: number | null };

    stats.avgExecutionTimeMs = avgTimeRow.avg || 0;

    // Next scheduled
    const nextScheduledRow = db.prepare(`
      SELECT next_run_at
      FROM automation_rules
      WHERE enabled = 1 AND next_run_at IS NOT NULL
      ORDER BY next_run_at ASC
      LIMIT 1
    `).get() as { next_run_at: string } | undefined;

    stats.nextScheduled = nextScheduledRow?.next_run_at || null;

    res.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('Error fetching automation stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    });
  }
});

/**
 * POST /api/automation/templates
 * Get pre-built automation templates
 */
router.get('/templates', (req: Request, res: Response) => {
  const templates = [
    {
      name: 'Daily Recommendations',
      description: 'Generate and auto-apply safe recommendations daily',
      triggerType: 'scheduled',
      triggerConfig: { schedule: 'daily' },
      actionType: 'apply_recommendations',
      actionConfig: { autoApplyOnly: true, priorities: ['critical', 'high'] },
    },
    {
      name: 'Weekly Performance Review',
      description: 'Pause low-performing ad groups weekly',
      triggerType: 'scheduled',
      triggerConfig: { schedule: 'weekly' },
      actionType: 'pause_low_performers',
      actionConfig: { entityType: 'ad_group', ctrThreshold: 0.01, minImpressions: 1000 },
    },
    {
      name: 'Auto-Sync Google Sheets',
      description: 'Sync performance data from Google Sheets daily',
      triggerType: 'scheduled',
      triggerConfig: { schedule: 'daily' },
      actionType: 'sync_sheets_data',
      actionConfig: { dateRangeDays: 7 },
    },
    {
      name: 'Add Common Negatives',
      description: 'Add common negative keywords to all active campaigns',
      triggerType: 'manual',
      triggerConfig: {},
      actionType: 'add_negatives',
      actionConfig: {
        negativeKeywords: ['free', 'cheap', 'download', 'torrent', 'crack'],
        matchType: 'phrase',
      },
    },
    {
      name: 'Budget Increase for Winners',
      description: 'Increase budget for high-performing campaigns',
      triggerType: 'performance_threshold',
      triggerConfig: { conversionRateThreshold: 0.05 },
      actionType: 'increase_budget',
      actionConfig: { adjustmentPercent: 20 },
    },
  ];

  res.json({
    success: true,
    templates,
  });
});

export default router;
