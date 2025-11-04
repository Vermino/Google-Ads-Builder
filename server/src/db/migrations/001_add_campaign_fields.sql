-- Migration: Add missing campaign fields for Google Ads
-- Created: 2025-11-03

-- Add new columns to campaigns table
ALTER TABLE campaigns ADD COLUMN location TEXT DEFAULT 'United States';
ALTER TABLE campaigns ADD COLUMN start_date TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN end_date TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN final_url TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN path1 TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN path2 TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN global_descriptions TEXT DEFAULT '[]';
