// Headline entity for Responsive Search Ads
export interface Headline {
  id: string;
  text: string;
  pinned?: boolean;
  pinnedPosition?: number;
}

// Description entity for Responsive Search Ads
export interface Description {
  id: string;
  text: string;
  pinned?: boolean;
  pinnedPosition?: number;
}

// Keyword entity (simplified - match types controlled at ad group level)
export interface Keyword {
  id: string;
  text: string;
  maxCpc?: number; // Optional override for this specific keyword
}

// Individual match type bid settings
export interface MatchTypeModifier {
  enabled: boolean;
  percentage: number; // e.g., -75.00, 20.00, 75.00
}

// Match type bid modifiers for ad group
export interface MatchTypeBidModifier {
  broad: MatchTypeModifier;
  broadModifier: MatchTypeModifier;  // Legacy +keyword syntax (deprecated but still used)
  phrase: MatchTypeModifier;
  exact: MatchTypeModifier;
}

// Responsive Search Ad entity
export interface ResponsiveSearchAd {
  id: string;
  adGroupId: string;
  name: string;
  status: 'enabled' | 'paused' | 'disabled';
  finalUrl: string;
  path1?: string;
  path2?: string;
  headlines: Headline[];
  descriptions: Description[];
  createdAt: string;
  updatedAt: string;
}

// Ad Group entity
export interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  maxCpc: number;
  matchTypeBidding?: MatchTypeBidModifier; // Optional match type bid adjustments
  keywords: Keyword[];
  ads: ResponsiveSearchAd[];
  createdAt: string;
  updatedAt: string;
}

// Global Description (used at campaign level)
export interface GlobalDescription {
  id: string;
  line1: string;
  line2: string;
}

// Campaign entity
export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'ended';
  startDate: string;
  endDate?: string;
  budget: number;
  location: string;
  finalUrl: string;
  path1?: string;
  path2?: string;
  globalDescriptions: GlobalDescription[];
  adGroups: AdGroup[];
  createdAt: string;
  updatedAt: string;
}

// Statistics for dashboard display
export interface CampaignStats {
  totalAdGroups: number;
  totalAds: number;
  totalKeywords: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

// Form data types for React Hook Form
export interface CampaignFormData {
  name: string;
  status: Campaign['status'];
  startDate: string;
  endDate?: string;
  budget: number;
  location: string;
  finalUrl: string;
  path1?: string;
  path2?: string;
}

export interface AdGroupFormData {
  name: string;
  status: AdGroup['status'];
  maxCpc: number;
}

export interface AdFormData {
  name: string;
  status: ResponsiveSearchAd['status'];
  finalUrl: string;
  path1?: string;
  path2?: string;
}
