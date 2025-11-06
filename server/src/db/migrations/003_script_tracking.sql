-- Script configuration table
CREATE TABLE IF NOT EXISTS script_configs (
  account_id TEXT PRIMARY KEY,
  spreadsheet_id TEXT,
  backend_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Script sync history (heartbeat tracking)
CREATE TABLE IF NOT EXISTS script_syncs (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  summary TEXT NOT NULL, -- JSON: { totalCampaigns, totalAdGroups, etc. }
  data_counts TEXT NOT NULL, -- JSON: { campaigns: 10, keywords: 234, etc. }
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Script errors
CREATE TABLE IF NOT EXISTS script_errors (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  error TEXT NOT NULL,
  stack TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_script_syncs_account_id ON script_syncs(account_id);
CREATE INDEX IF NOT EXISTS idx_script_syncs_timestamp ON script_syncs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_script_errors_account_id ON script_errors(account_id);
CREATE INDEX IF NOT EXISTS idx_script_errors_timestamp ON script_errors(timestamp DESC);
