/**
 * Database Types
 * TypeScript type definitions for database entities
 */

export type EntityStatus = 'active' | 'paused' | 'draft';

export interface Campaign {
  id: string;
  name: string;
  budget: number;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface AdGroup {
  id: string;
  campaign_id: string;
  name: string;
  keywords: string[]; // Stored as JSON in DB
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface HeadlineWithCategory {
  text: string;
  category: 'KEYWORD' | 'VALUE' | 'CTA' | 'GENERAL';
}

export interface Ad {
  id: string;
  ad_group_id: string;
  headlines: HeadlineWithCategory[]; // Stored as JSON in DB
  descriptions: string[]; // Stored as JSON in DB
  final_url: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

// Input types (for creating new entities)
export interface CreateCampaignInput {
  name: string;
  budget?: number;
  status?: EntityStatus;
}

export interface UpdateCampaignInput {
  name?: string;
  budget?: number;
  status?: EntityStatus;
}

export interface CreateAdGroupInput {
  campaign_id: string;
  name: string;
  keywords?: string[];
  status?: EntityStatus;
}

export interface UpdateAdGroupInput {
  name?: string;
  keywords?: string[];
  status?: EntityStatus;
}

export interface CreateAdInput {
  ad_group_id: string;
  headlines: HeadlineWithCategory[];
  descriptions: string[];
  final_url: string;
  status?: EntityStatus;
}

export interface UpdateAdInput {
  headlines?: HeadlineWithCategory[];
  descriptions?: string[];
  final_url?: string;
  status?: EntityStatus;
}
