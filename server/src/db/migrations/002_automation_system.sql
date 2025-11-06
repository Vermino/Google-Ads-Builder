-- Migration: Add automation and recommendations system tables
-- Created: 2025-11-05

-- Imports tracking - Track CSV/ZIP imports from Google Ads Editor
CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('csv', 'zip')),
  file_size INTEGER NOT NULL,
  import_type TEXT NOT NULL CHECK(import_type IN ('editor_export', 'performance_report', 'search_terms', 'asset_performance')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  entities_imported INTEGER DEFAULT 0,
  errors TEXT DEFAULT '[]', -- JSON array of error messages
  raw_data TEXT, -- Store original file content for reference
  metadata TEXT DEFAULT '{}', -- JSON object for additional metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Snapshots - Version control for campaigns
CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  snapshot_type TEXT NOT NULL CHECK(snapshot_type IN ('import', 'manual', 'pre_automation', 'scheduled')),
  snapshot_data TEXT NOT NULL, -- JSON snapshot of entire campaign structure
  description TEXT DEFAULT '',
  created_by TEXT DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Performance data - Store metrics from Google Ads reports or Sheets
CREATE TABLE IF NOT EXISTS performance_data (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('campaign', 'ad_group', 'ad', 'keyword', 'asset')),
  entity_id TEXT NOT NULL,
  date_range_start TEXT NOT NULL,
  date_range_end TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  conversions REAL DEFAULT 0,
  ctr REAL DEFAULT 0, -- Click-through rate
  cpc REAL DEFAULT 0, -- Cost per click
  cpa REAL DEFAULT 0, -- Cost per acquisition
  conversion_rate REAL DEFAULT 0,
  impression_share REAL DEFAULT 0,
  quality_score REAL DEFAULT 0,
  search_lost_is_rank REAL DEFAULT 0, -- Lost impression share (rank)
  search_lost_is_budget REAL DEFAULT 0, -- Lost impression share (budget)
  metrics TEXT DEFAULT '{}', -- JSON for additional custom metrics
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Asset performance - Track headline/description performance
CREATE TABLE IF NOT EXISTS asset_performance (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('headline', 'description')),
  asset_text TEXT NOT NULL,
  asset_position INTEGER, -- Position in the ad
  performance_label TEXT CHECK(performance_label IN ('Low', 'Good', 'Best', 'Learning', 'Pending')),
  impressions INTEGER DEFAULT 0,
  combination_impressions INTEGER DEFAULT 0, -- Times shown in any combination
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);

-- Search terms - Track actual search queries
CREATE TABLE IF NOT EXISTS search_terms (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  ad_group_id TEXT NOT NULL,
  keyword_id TEXT,
  search_term TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK(match_type IN ('broad', 'phrase', 'exact')),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  conversions REAL DEFAULT 0,
  is_negative_candidate BOOLEAN DEFAULT 0,
  is_positive_candidate BOOLEAN DEFAULT 0,
  status TEXT CHECK(status IN ('active', 'added_as_negative', 'added_as_positive', 'ignored')) DEFAULT 'active',
  date_range_start TEXT NOT NULL,
  date_range_end TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (ad_group_id) REFERENCES ad_groups(id) ON DELETE CASCADE
);

-- Recommendations - Store automated recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  ad_group_id TEXT,
  ad_id TEXT,
  type TEXT NOT NULL CHECK(type IN (
    'missing_negatives',
    'conflicting_negatives',
    'orphaned_ad_group',
    'budget_pacing',
    'overlapping_keywords',
    'low_quality_score',
    'poor_asset_performance',
    'add_asset_variant',
    'remove_low_asset',
    'unpinned_asset',
    'search_term_negative',
    'search_term_positive',
    'keyword_expansion',
    'bid_adjustment',
    'budget_increase',
    'ad_copy_refresh'
  )),
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_estimate TEXT, -- e.g., "Could save $500/month" or "May increase CTR by 15%"
  action_required TEXT NOT NULL, -- JSON object describing the action
  auto_apply_eligible BOOLEAN DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending', 'applied', 'dismissed', 'scheduled')) DEFAULT 'pending',
  applied_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (ad_group_id) REFERENCES ad_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE
);

-- Automation rules - Define automated actions
CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK(trigger_type IN (
    'scheduled',
    'performance_threshold',
    'budget_threshold',
    'import_completion',
    'manual'
  )),
  trigger_config TEXT NOT NULL, -- JSON config for trigger (e.g., cron schedule, thresholds)
  action_type TEXT NOT NULL CHECK(action_type IN (
    'apply_recommendations',
    'generate_recommendations',
    'pause_low_performers',
    'increase_budget',
    'decrease_budget',
    'add_negatives',
    'add_keywords',
    'refresh_ads',
    'adjust_bids',
    'generate_report',
    'sync_sheets_data'
  )),
  action_config TEXT NOT NULL, -- JSON config for action
  filters TEXT DEFAULT '{}', -- JSON filters (campaigns, ad groups, etc.)
  enabled BOOLEAN DEFAULT 1,
  last_run_at TEXT,
  next_run_at TEXT,
  run_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Automation history - Track executed automations
CREATE TABLE IF NOT EXISTS automation_history (
  id TEXT PRIMARY KEY,
  rule_id TEXT,
  run_type TEXT NOT NULL CHECK(run_type IN ('scheduled', 'manual', 'triggered')),
  status TEXT NOT NULL CHECK(status IN ('started', 'completed', 'failed', 'partial')) DEFAULT 'started',
  entities_affected INTEGER DEFAULT 0,
  changes_made TEXT DEFAULT '[]', -- JSON array of changes
  errors TEXT DEFAULT '[]', -- JSON array of errors
  execution_time_ms INTEGER,
  metadata TEXT DEFAULT '{}', -- JSON for additional data
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE SET NULL
);

-- Negative keywords - Track negative keywords separately
CREATE TABLE IF NOT EXISTS negative_keywords (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  ad_group_id TEXT,
  keyword_text TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK(match_type IN ('broad', 'phrase', 'exact')),
  level TEXT NOT NULL CHECK(level IN ('campaign', 'ad_group')),
  source TEXT CHECK(source IN ('manual', 'automated', 'import', 'recommendation')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (ad_group_id) REFERENCES ad_groups(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_imports_status ON imports(status);
CREATE INDEX IF NOT EXISTS idx_imports_created_at ON imports(created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_campaign_id ON snapshots(campaign_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_data_entity ON performance_data(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_performance_data_date_range ON performance_data(date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_asset_performance_ad_id ON asset_performance(ad_id);
CREATE INDEX IF NOT EXISTS idx_asset_performance_label ON asset_performance(performance_label);
CREATE INDEX IF NOT EXISTS idx_search_terms_campaign_id ON search_terms(campaign_id);
CREATE INDEX IF NOT EXISTS idx_search_terms_ad_group_id ON search_terms(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_search_terms_candidates ON search_terms(is_negative_candidate, is_positive_candidate);
CREATE INDEX IF NOT EXISTS idx_recommendations_campaign_id ON recommendations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_automation_rules_next_run ON automation_rules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_automation_history_rule_id ON automation_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_history_started_at ON automation_history(started_at);
CREATE INDEX IF NOT EXISTS idx_negative_keywords_campaign_id ON negative_keywords(campaign_id);
CREATE INDEX IF NOT EXISTS idx_negative_keywords_ad_group_id ON negative_keywords(ad_group_id);
