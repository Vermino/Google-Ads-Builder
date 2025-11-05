/**
 * Automation Orchestrator
 *
 * Manages and executes automated workflows for Google Ads management:
 * - Scheduled automations (cron-like)
 * - Event-triggered automations
 * - Manual automation execution
 * - Automation rule management
 * - Execution tracking and history
 */

import { getDatabase } from '../db/database.js';
import { nanoid } from 'nanoid';
import { generateRecommendations, applyRecommendation, getRecommendationsForCampaign } from './recommendationEngine.js';
import { syncPerformanceDataFromSheets, getSheetsConfig } from './sheetsIntegration.js';
import type { Database } from 'better-sqlite3';

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  triggerType: 'scheduled' | 'performance_threshold' | 'budget_threshold' | 'import_completion' | 'manual';
  triggerConfig: any;
  actionType: string;
  actionConfig: any;
  filters?: any;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
}

export interface AutomationExecution {
  id: string;
  ruleId?: string;
  runType: 'scheduled' | 'manual' | 'triggered';
  status: 'started' | 'completed' | 'failed' | 'partial';
  entitiesAffected: number;
  changesMade: any[];
  errors: any[];
  executionTimeMs: number;
  startedAt: string;
  completedAt?: string;
}

/**
 * Create a new automation rule
 */
export function createAutomationRule(rule: Omit<AutomationRule, 'id' | 'runCount' | 'lastRunAt' | 'nextRunAt'>): AutomationRule {
  const db = getDatabase();
  const id = nanoid();

  const nextRunAt = rule.triggerType === 'scheduled'
    ? calculateNextRun(rule.triggerConfig)
    : null;

  db.prepare(`
    INSERT INTO automation_rules (
      id, name, description, trigger_type, trigger_config,
      action_type, action_config, filters, enabled, next_run_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    rule.name,
    rule.description || null,
    rule.triggerType,
    JSON.stringify(rule.triggerConfig),
    rule.actionType,
    JSON.stringify(rule.actionConfig),
    JSON.stringify(rule.filters || {}),
    rule.enabled ? 1 : 0,
    nextRunAt
  );

  return {
    id,
    ...rule,
    runCount: 0,
    nextRunAt: nextRunAt || undefined,
  };
}

/**
 * Update an automation rule
 */
export function updateAutomationRule(id: string, updates: Partial<AutomationRule>): boolean {
  const db = getDatabase();

  const setParts: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setParts.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setParts.push('description = ?');
    values.push(updates.description);
  }
  if (updates.triggerConfig !== undefined) {
    setParts.push('trigger_config = ?');
    values.push(JSON.stringify(updates.triggerConfig));

    if (updates.triggerType === 'scheduled') {
      const nextRunAt = calculateNextRun(updates.triggerConfig);
      setParts.push('next_run_at = ?');
      values.push(nextRunAt);
    }
  }
  if (updates.actionConfig !== undefined) {
    setParts.push('action_config = ?');
    values.push(JSON.stringify(updates.actionConfig));
  }
  if (updates.filters !== undefined) {
    setParts.push('filters = ?');
    values.push(JSON.stringify(updates.filters));
  }
  if (updates.enabled !== undefined) {
    setParts.push('enabled = ?');
    values.push(updates.enabled ? 1 : 0);
  }

  if (setParts.length === 0) return false;

  setParts.push('updated_at = datetime(\'now\')');
  values.push(id);

  const result = db.prepare(`
    UPDATE automation_rules SET ${setParts.join(', ')} WHERE id = ?
  `).run(...values);

  return result.changes > 0;
}

/**
 * Delete an automation rule
 */
export function deleteAutomationRule(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM automation_rules WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Get all automation rules
 */
export function getAutomationRules(enabledOnly: boolean = false): AutomationRule[] {
  const db = getDatabase();

  const query = enabledOnly
    ? 'SELECT * FROM automation_rules WHERE enabled = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM automation_rules ORDER BY created_at DESC';

  const rows = db.prepare(query).all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    triggerType: row.trigger_type,
    triggerConfig: JSON.parse(row.trigger_config),
    actionType: row.action_type,
    actionConfig: JSON.parse(row.action_config),
    filters: JSON.parse(row.filters || '{}'),
    enabled: row.enabled === 1,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    runCount: row.run_count,
  }));
}

/**
 * Get a single automation rule
 */
export function getAutomationRule(id: string): AutomationRule | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    triggerType: row.trigger_type,
    triggerConfig: JSON.parse(row.trigger_config),
    actionType: row.action_type,
    actionConfig: JSON.parse(row.action_config),
    filters: JSON.parse(row.filters || '{}'),
    enabled: row.enabled === 1,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    runCount: row.run_count,
  };
}

/**
 * Execute an automation rule
 */
export async function executeAutomation(
  ruleId: string,
  runType: 'scheduled' | 'manual' | 'triggered' = 'manual'
): Promise<AutomationExecution> {
  const db = getDatabase();
  const rule = getAutomationRule(ruleId);

  if (!rule) {
    throw new Error(`Automation rule ${ruleId} not found`);
  }

  const executionId = nanoid();
  const startTime = Date.now();

  const execution: AutomationExecution = {
    id: executionId,
    ruleId,
    runType,
    status: 'started',
    entitiesAffected: 0,
    changesMade: [],
    errors: [],
    executionTimeMs: 0,
    startedAt: new Date().toISOString(),
  };

  // Record execution start
  db.prepare(`
    INSERT INTO automation_history (id, rule_id, run_type, status, started_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(executionId, ruleId, runType, 'started', execution.startedAt);

  try {
    // Execute based on action type
    switch (rule.actionType) {
      case 'apply_recommendations':
        await executeApplyRecommendations(db, rule, execution);
        break;

      case 'pause_low_performers':
        await executePauseLowPerformers(db, rule, execution);
        break;

      case 'add_negatives':
        await executeAddNegatives(db, rule, execution);
        break;

      case 'add_keywords':
        await executeAddKeywords(db, rule, execution);
        break;

      case 'adjust_bids':
        await executeAdjustBids(db, rule, execution);
        break;

      case 'increase_budget':
      case 'decrease_budget':
        await executeAdjustBudget(db, rule, execution);
        break;

      case 'refresh_ads':
        await executeRefreshAds(db, rule, execution);
        break;

      case 'generate_report':
        await executeGenerateReport(db, rule, execution);
        break;

      case 'sync_sheets_data':
        await executeSyncSheetsData(db, rule, execution);
        break;

      case 'generate_recommendations':
        await executeGenerateRecommendations(db, rule, execution);
        break;

      default:
        throw new Error(`Unknown action type: ${rule.actionType}`);
    }

    execution.status = execution.errors.length === 0 ? 'completed' : 'partial';
    execution.executionTimeMs = Date.now() - startTime;
    execution.completedAt = new Date().toISOString();

  } catch (error) {
    execution.status = 'failed';
    execution.errors.push({
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    execution.executionTimeMs = Date.now() - startTime;
    execution.completedAt = new Date().toISOString();
  }

  // Update execution record
  db.prepare(`
    UPDATE automation_history
    SET status = ?, entities_affected = ?, changes_made = ?,
        errors = ?, execution_time_ms = ?, completed_at = ?
    WHERE id = ?
  `).run(
    execution.status,
    execution.entitiesAffected,
    JSON.stringify(execution.changesMade),
    JSON.stringify(execution.errors),
    execution.executionTimeMs,
    execution.completedAt,
    executionId
  );

  // Update rule stats
  const nextRunAt = rule.triggerType === 'scheduled'
    ? calculateNextRun(rule.triggerConfig)
    : null;

  db.prepare(`
    UPDATE automation_rules
    SET last_run_at = ?, next_run_at = ?, run_count = run_count + 1
    WHERE id = ?
  `).run(execution.completedAt, nextRunAt, ruleId);

  return execution;
}

/**
 * Execute: Apply recommendations
 */
async function executeApplyRecommendations(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  const { autoApplyOnly = true, priorities = ['critical', 'high'] } = rule.actionConfig;

  // Get campaigns from filters
  const campaignIds = rule.filters?.campaignIds || [];
  const campaigns = campaignIds.length > 0
    ? db.prepare(`SELECT id FROM campaigns WHERE id IN (${campaignIds.map(() => '?').join(',')})`).all(...campaignIds)
    : db.prepare('SELECT id FROM campaigns WHERE status = ?').all('active');

  for (const campaign of campaigns as any[]) {
    const recommendations = getRecommendationsForCampaign(campaign.id, 'pending');

    for (const rec of recommendations) {
      if (autoApplyOnly && !rec.autoApplyEligible) continue;
      if (!priorities.includes(rec.priority)) continue;

      try {
        const result = await applyRecommendation(rec.id);

        if (result.success) {
          execution.changesMade.push({
            type: 'recommendation_applied',
            recommendationId: rec.id,
            recommendationType: rec.type,
            campaignId: campaign.id,
          });
          execution.entitiesAffected++;
        } else {
          execution.errors.push({
            message: `Failed to apply recommendation ${rec.id}: ${result.message}`,
            recommendationId: rec.id,
          });
        }
      } catch (error) {
        execution.errors.push({
          message: `Error applying recommendation ${rec.id}: ${error instanceof Error ? error.message : String(error)}`,
          recommendationId: rec.id,
        });
      }
    }
  }
}

/**
 * Execute: Pause low performers
 */
async function executePauseLowPerformers(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  const {
    entityType = 'ad_group',
    ctrThreshold = 0.01,
    minImpressions = 1000,
    dateRangeDays = 7,
  } = rule.actionConfig;

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - dateRangeDays);
  const dateStr = dateThreshold.toISOString().split('T')[0];

  if (entityType === 'ad_group') {
    const lowPerformers = db.prepare(`
      SELECT DISTINCT ag.id, ag.name, ag.campaign_id, pd.ctr, pd.impressions
      FROM ad_groups ag
      INNER JOIN performance_data pd ON pd.entity_type = 'ad_group' AND pd.entity_id = ag.id
      WHERE ag.status = 'active'
        AND pd.date_range_start >= ?
        AND pd.ctr < ?
        AND pd.impressions >= ?
    `).all(dateStr, ctrThreshold, minImpressions) as any[];

    for (const adGroup of lowPerformers) {
      db.prepare(`
        UPDATE ad_groups SET status = 'paused', updated_at = datetime('now') WHERE id = ?
      `).run(adGroup.id);

      execution.changesMade.push({
        type: 'ad_group_paused',
        adGroupId: adGroup.id,
        adGroupName: adGroup.name,
        campaignId: adGroup.campaign_id,
        reason: `Low CTR: ${(adGroup.ctr * 100).toFixed(2)}%`,
      });
      execution.entitiesAffected++;
    }
  } else if (entityType === 'ad') {
    const lowPerformers = db.prepare(`
      SELECT DISTINCT a.id, ag.name as ad_group_name, ag.campaign_id, pd.ctr, pd.impressions
      FROM ads a
      INNER JOIN ad_groups ag ON a.ad_group_id = ag.id
      INNER JOIN performance_data pd ON pd.entity_type = 'ad' AND pd.entity_id = a.id
      WHERE a.status = 'active'
        AND pd.date_range_start >= ?
        AND pd.ctr < ?
        AND pd.impressions >= ?
    `).all(dateStr, ctrThreshold, minImpressions) as any[];

    for (const ad of lowPerformers) {
      db.prepare(`
        UPDATE ads SET status = 'paused', updated_at = datetime('now') WHERE id = ?
      `).run(ad.id);

      execution.changesMade.push({
        type: 'ad_paused',
        adId: ad.id,
        adGroupName: ad.ad_group_name,
        campaignId: ad.campaign_id,
        reason: `Low CTR: ${(ad.ctr * 100).toFixed(2)}%`,
      });
      execution.entitiesAffected++;
    }
  }
}

/**
 * Execute: Add negative keywords
 */
async function executeAddNegatives(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  const {
    negativeKeywords = [],
    campaignIds = [],
    matchType = 'phrase',
  } = rule.actionConfig;

  const campaigns = campaignIds.length > 0
    ? db.prepare(`SELECT id FROM campaigns WHERE id IN (${campaignIds.map(() => '?').join(',')})`).all(...campaignIds)
    : db.prepare('SELECT id FROM campaigns WHERE status = ?').all('active');

  for (const campaign of campaigns as any[]) {
    for (const keyword of negativeKeywords) {
      // Check if already exists
      const exists = db.prepare(`
        SELECT id FROM negative_keywords
        WHERE campaign_id = ? AND keyword_text = ? AND match_type = ?
      `).get(campaign.id, keyword, matchType);

      if (!exists) {
        db.prepare(`
          INSERT INTO negative_keywords (id, campaign_id, keyword_text, match_type, level, source)
          VALUES (?, ?, ?, ?, 'campaign', 'automated')
        `).run(nanoid(), campaign.id, keyword, matchType);

        execution.changesMade.push({
          type: 'negative_keyword_added',
          campaignId: campaign.id,
          keyword,
          matchType,
        });
        execution.entitiesAffected++;
      }
    }
  }
}

/**
 * Execute: Add keywords
 */
async function executeAddKeywords(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  const { adGroupId, keywords } = rule.actionConfig;

  if (!adGroupId || !keywords || keywords.length === 0) {
    execution.errors.push({ message: 'Missing adGroupId or keywords in action config' });
    return;
  }

  const adGroup = db.prepare('SELECT keywords FROM ad_groups WHERE id = ?').get(adGroupId) as { keywords: string } | undefined;

  if (!adGroup) {
    execution.errors.push({ message: `Ad group ${adGroupId} not found` });
    return;
  }

  const existingKeywords = JSON.parse(adGroup.keywords || '[]');

  for (const keyword of keywords) {
    if (!existingKeywords.some((k: any) => k.text === keyword)) {
      existingKeywords.push({
        id: nanoid(),
        text: keyword,
      });

      execution.changesMade.push({
        type: 'keyword_added',
        adGroupId,
        keyword,
      });
      execution.entitiesAffected++;
    }
  }

  db.prepare(`
    UPDATE ad_groups SET keywords = ?, updated_at = datetime('now') WHERE id = ?
  `).run(JSON.stringify(existingKeywords), adGroupId);
}

/**
 * Execute: Adjust bids
 */
async function executeAdjustBids(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  // Bid adjustment would require storing bid data
  execution.errors.push({ message: 'Bid adjustment not yet implemented' });
}

/**
 * Execute: Adjust budget
 */
async function executeAdjustBudget(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  const { campaignIds = [], adjustmentPercent = 10 } = rule.actionConfig;
  const multiplier = rule.actionType === 'increase_budget' ? (1 + adjustmentPercent / 100) : (1 - adjustmentPercent / 100);

  const campaigns = campaignIds.length > 0
    ? db.prepare(`SELECT id, name, budget FROM campaigns WHERE id IN (${campaignIds.map(() => '?').join(',')})`).all(...campaignIds)
    : db.prepare('SELECT id, name, budget FROM campaigns WHERE status = ?').all('active');

  for (const campaign of campaigns as any[]) {
    const newBudget = Math.round(campaign.budget * multiplier * 100) / 100;

    db.prepare(`
      UPDATE campaigns SET budget = ?, updated_at = datetime('now') WHERE id = ?
    `).run(newBudget, campaign.id);

    execution.changesMade.push({
      type: 'budget_adjusted',
      campaignId: campaign.id,
      campaignName: campaign.name,
      oldBudget: campaign.budget,
      newBudget,
      adjustmentType: rule.actionType,
    });
    execution.entitiesAffected++;
  }
}

/**
 * Execute: Refresh ads
 */
async function executeRefreshAds(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  // Ad refresh would require AI generation
  execution.errors.push({ message: 'Ad refresh not yet implemented - requires AI integration' });
}

/**
 * Execute: Generate report
 */
async function executeGenerateReport(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  execution.errors.push({ message: 'Report generation not yet implemented' });
}

/**
 * Execute: Sync Google Sheets data
 */
async function executeSyncSheetsData(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  const sheetsConfig = getSheetsConfig();

  if (!sheetsConfig) {
    execution.errors.push({ message: 'Google Sheets not configured' });
    return;
  }

  const { dateRangeDays = 7 } = rule.actionConfig;
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - dateRangeDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const result = await syncPerformanceDataFromSheets(sheetsConfig, startDate, endDate);

    execution.changesMade.push({
      type: 'sheets_synced',
      performanceRecords: result.performanceRecords,
      searchTerms: result.searchTerms,
      assetRecords: result.assetRecords,
    });
    execution.entitiesAffected += result.performanceRecords + result.searchTerms + result.assetRecords;

    if (result.errors.length > 0) {
      execution.errors.push(...result.errors.map(e => ({ message: e })));
    }
  } catch (error) {
    execution.errors.push({
      message: `Error syncing sheets: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Execute: Generate recommendations
 */
async function executeGenerateRecommendations(
  db: Database,
  rule: AutomationRule,
  execution: AutomationExecution
): Promise<void> {
  const { campaignIds = [] } = rule.actionConfig;

  try {
    const recommendations = await generateRecommendations({
      campaignIds: campaignIds.length > 0 ? campaignIds : undefined,
    });

    execution.changesMade.push({
      type: 'recommendations_generated',
      count: recommendations.length,
    });
    execution.entitiesAffected = recommendations.length;
  } catch (error) {
    execution.errors.push({
      message: `Error generating recommendations: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Calculate next run time for scheduled automations
 */
function calculateNextRun(triggerConfig: any): string | null {
  const { schedule } = triggerConfig;

  if (!schedule) return null;

  // Simple scheduling: 'daily', 'weekly', 'hourly'
  const now = new Date();

  switch (schedule) {
    case 'hourly':
      now.setHours(now.getHours() + 1);
      break;
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    default:
      return null;
  }

  return now.toISOString();
}

/**
 * Check and run due automations (called by scheduler)
 */
export async function runDueAutomations(): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const dueRules = db.prepare(`
    SELECT id FROM automation_rules
    WHERE enabled = 1
      AND trigger_type = 'scheduled'
      AND next_run_at IS NOT NULL
      AND next_run_at <= ?
  `).all(now) as Array<{ id: string }>;

  for (const rule of dueRules) {
    try {
      await executeAutomation(rule.id, 'scheduled');
    } catch (error) {
      console.error(`Error executing automation ${rule.id}:`, error);
    }
  }
}

/**
 * Get automation execution history
 */
export function getAutomationHistory(ruleId?: string, limit: number = 50): AutomationExecution[] {
  const db = getDatabase();

  const query = ruleId
    ? 'SELECT * FROM automation_history WHERE rule_id = ? ORDER BY started_at DESC LIMIT ?'
    : 'SELECT * FROM automation_history ORDER BY started_at DESC LIMIT ?';

  const params = ruleId ? [ruleId, limit] : [limit];
  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(row => ({
    id: row.id,
    ruleId: row.rule_id,
    runType: row.run_type,
    status: row.status,
    entitiesAffected: row.entities_affected,
    changesMade: JSON.parse(row.changes_made || '[]'),
    errors: JSON.parse(row.errors || '[]'),
    executionTimeMs: row.execution_time_ms,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }));
}

export default {
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  getAutomationRules,
  getAutomationRule,
  executeAutomation,
  runDueAutomations,
  getAutomationHistory,
};
