-- Google Ads Campaign Builder Database Schema
-- SQLite Database Schema

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  budget REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'draft')) DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ad Groups Table
CREATE TABLE IF NOT EXISTS ad_groups (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '[]', -- JSON array of keywords
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'draft')) DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Ads Table
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  ad_group_id TEXT NOT NULL,
  headlines TEXT NOT NULL DEFAULT '[]', -- JSON array of HeadlineWithCategory objects
  descriptions TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  final_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'draft')) DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ad_group_id) REFERENCES ad_groups(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ad_groups_campaign_id ON ad_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_ad_group_id ON ads(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_groups_status ON ad_groups(status);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
