// Character limit constants for Google Ads
export const CHAR_LIMITS = {
  HEADLINE: 30,
  DESCRIPTION: 90,
  PATH: 15,
} as const;

// Maximum counts for ad assets
export const MAX_COUNTS = {
  HEADLINES: 15,
  DESCRIPTIONS: 4,
  PATHS: 2,
} as const;

// Match types for keywords
export const MATCH_TYPES = {
  BROAD: 'broad',
  PHRASE: 'phrase',
  EXACT: 'exact',
} as const;

// Campaign statuses
export const CAMPAIGN_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended',
} as const;

// Ad Group statuses
export const ADGROUP_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
} as const;

// Ad statuses
export const AD_STATUS = {
  ENABLED: 'enabled',
  PAUSED: 'paused',
  DISABLED: 'disabled',
} as const;
