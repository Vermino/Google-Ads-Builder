/**
 * Campaign Service - Backend API Integration
 *
 * Handles all campaign, ad group, and ad CRUD operations
 * with the SQLite-backed REST API.
 *
 * @module campaignService
 */

import { apiClient } from './apiClient';
import type { Campaign, AdGroup, ResponsiveSearchAd } from '../types';

/* ==================== TYPE DEFINITIONS ==================== */

/**
 * Backend API Response Wrapper
 */
interface APIResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

type BackendEntityStatus = 'active' | 'paused' | 'draft';

/**
 * Backend Campaign Entity (without nested ad groups)
 */
interface BackendCampaign {
  id: string;
  name: string;
  budget: number;
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  updated_at: string;
  // Additional fields from frontend
  startDate?: string;
  endDate?: string;
  location?: string;
  finalUrl?: string;
  path1?: string;
  path2?: string;
  globalDescriptions?: any[];
}

/**
 * Backend Ad Group Entity
 */
interface BackendAdGroup {
  id: string;
  campaign_id: string;
  name: string;
  keywords: string[];
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  updated_at: string;
  // Additional fields from frontend
  maxCpc?: number;
  matchTypeBidding?: any;
}

/**
 * Backend Ad Entity
 */
interface BackendAd {
  id: string;
  ad_group_id: string;
  headlines: { text: string; category: string }[];
  descriptions: string[];
  final_url: string;
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  updated_at: string;
  // Additional fields from frontend
  name?: string;
  path1?: string;
  path2?: string;
}

interface BackendAdGroupDuplicate {
  ad_group: BackendAdGroup;
  ads: BackendAd[];
}

/* ==================== TRANSFORMATION FUNCTIONS ==================== */

/**
 * Transform backend campaign to frontend format
 */
function transformCampaign(backendCampaign: BackendCampaign, adGroups: AdGroup[] = []): Campaign {
  return {
    id: backendCampaign.id,
    name: backendCampaign.name,
    status: backendCampaign.status === 'draft' ? 'paused' : backendCampaign.status as 'active' | 'paused' | 'ended',
    budget: backendCampaign.budget,
    startDate: backendCampaign.startDate || backendCampaign.created_at,
    endDate: backendCampaign.endDate,
    location: backendCampaign.location || 'United States',
    finalUrl: backendCampaign.finalUrl || '',
    path1: backendCampaign.path1,
    path2: backendCampaign.path2,
    globalDescriptions: backendCampaign.globalDescriptions || [],
    adGroups,
    createdAt: backendCampaign.created_at,
    updatedAt: backendCampaign.updated_at,
  };
}

/**
 * Transform backend ad group to frontend format
 */
function transformAdGroup(backendAdGroup: BackendAdGroup, ads: ResponsiveSearchAd[] = []): AdGroup {
  // Parse keywords if they're stored as JSON string
  let keywords = backendAdGroup.keywords;
  if (typeof keywords === 'string') {
    try {
      keywords = JSON.parse(keywords);
    } catch {
      keywords = [];
    }
  }

  // Transform keywords array to proper format with IDs
  const keywordsArray = Array.isArray(keywords)
    ? keywords.map((kw, idx) =>
        typeof kw === 'string'
          ? { id: `kw-${backendAdGroup.id}-${idx}`, text: kw }
          : kw
      )
    : [];

  return {
    id: backendAdGroup.id,
    campaignId: backendAdGroup.campaign_id,
    name: backendAdGroup.name,
    status: backendAdGroup.status === 'draft' ? 'paused' : backendAdGroup.status as 'active' | 'paused',
    maxCpc: backendAdGroup.maxCpc || 2.0,
    matchTypeBidding: backendAdGroup.matchTypeBidding,
    keywords: keywordsArray,
    ads,
    createdAt: backendAdGroup.created_at,
    updatedAt: backendAdGroup.updated_at,
  };
}

/**
 * Transform backend ad to frontend format
 */
function transformAd(backendAd: BackendAd): ResponsiveSearchAd {
  // Parse headlines if needed
  let headlines = backendAd.headlines;
  if (typeof headlines === 'string') {
    try {
      headlines = JSON.parse(headlines);
    } catch {
      headlines = [];
    }
  }

  // Transform headlines to proper format with IDs
  const headlinesArray = Array.isArray(headlines)
    ? headlines.map((h, idx) => ({
        id: `hl-${backendAd.id}-${idx}`,
        text: typeof h === 'string' ? h : h.text || '',
        pinned: false,
      }))
    : [];

  // Parse descriptions if needed
  let descriptions = backendAd.descriptions;
  if (typeof descriptions === 'string') {
    try {
      descriptions = JSON.parse(descriptions);
    } catch {
      descriptions = [];
    }
  }

  // Transform descriptions to proper format with IDs
  const descriptionsArray = Array.isArray(descriptions)
    ? descriptions.map((d, idx) => ({
        id: `desc-${backendAd.id}-${idx}`,
        text: typeof d === 'string' ? d : d.text || d,
        pinned: false,
      }))
    : [];

  return {
    id: backendAd.id,
    adGroupId: backendAd.ad_group_id,
    name: backendAd.name || `Ad ${backendAd.id}`,
    status: backendAd.status === 'draft' ? 'disabled' : backendAd.status === 'active' ? 'enabled' : 'paused',
    finalUrl: backendAd.final_url,
    path1: backendAd.path1,
    path2: backendAd.path2,
    headlines: headlinesArray,
    descriptions: descriptionsArray,
    createdAt: backendAd.created_at,
    updatedAt: backendAd.updated_at,
  };
}

/**
 * Transform frontend campaign to backend format
 */
function transformCampaignToBackend(campaign: Partial<Campaign>): Partial<BackendCampaign> {
  return {
    id: campaign.id,
    name: campaign.name,
    budget: campaign.budget,
    status: campaign.status === 'ended' ? 'paused' : campaign.status as 'active' | 'paused' | 'draft',
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    location: campaign.location,
    finalUrl: campaign.finalUrl,
    path1: campaign.path1,
    path2: campaign.path2,
    globalDescriptions: campaign.globalDescriptions,
  };
}

/**
 * Transform frontend ad group to backend format
 */
function transformAdGroupToBackend(adGroup: Partial<AdGroup>): Partial<BackendAdGroup> {
  // Extract just the text from keywords for backend storage
  const keywordsArray = adGroup.keywords
    ? adGroup.keywords.map(kw => typeof kw === 'string' ? kw : kw.text)
    : [];

  return {
    id: adGroup.id,
    campaign_id: adGroup.campaignId,
    name: adGroup.name,
    keywords: keywordsArray as any,
    status: adGroup.status as 'active' | 'paused' | 'draft',
    maxCpc: adGroup.maxCpc,
    matchTypeBidding: adGroup.matchTypeBidding,
  };
}

/**
 * Transform frontend ad to backend format
 */
function transformAdToBackend(ad: Partial<ResponsiveSearchAd>): Partial<BackendAd> {
  // Extract headlines text and category
  const headlines = ad.headlines
    ? ad.headlines.map(h => ({ text: h.text, category: 'general' }))
    : [];

  // Extract descriptions text
  const descriptions = ad.descriptions
    ? ad.descriptions.map(d => d.text)
    : [];

  return {
    id: ad.id,
    ad_group_id: ad.adGroupId,
    headlines: headlines as any,
    descriptions: descriptions as any,
    final_url: ad.finalUrl || '',
    status: ad.status === 'enabled' ? 'active' : ad.status === 'disabled' ? 'draft' : 'paused',
    name: ad.name,
    path1: ad.path1,
    path2: ad.path2,
  };
}

function mapAdStatusToBackend(status: ResponsiveSearchAd['status']): BackendEntityStatus {
  switch (status) {
    case 'enabled':
      return 'active';
    case 'paused':
      return 'paused';
    case 'disabled':
    default:
      return 'draft';
  }
}

/* ==================== CAMPAIGN CRUD ==================== */

/**
 * Fetch all campaigns with nested ad groups and ads
 */
export async function fetchCampaigns(): Promise<Campaign[]> {
  try {
    // Fetch all campaigns
    const campaignsResponse = await apiClient.request<APIResponse<BackendCampaign[]>>('/api/campaigns');
    const backendCampaigns = campaignsResponse.data;

    // Fetch and nest ad groups and ads for each campaign
    const campaigns = await Promise.all(
      backendCampaigns.map(async (backendCampaign) => {
        try {
          // Fetch ad groups for this campaign
          const adGroupsResponse = await apiClient.request<APIResponse<BackendAdGroup[]>>(
            `/api/campaigns/${backendCampaign.id}/ad-groups`
          );
          const backendAdGroups = adGroupsResponse.data;

          // Fetch ads for each ad group
          const adGroups = await Promise.all(
            backendAdGroups.map(async (backendAdGroup) => {
              try {
                const adsResponse = await apiClient.request<APIResponse<BackendAd[]>>(
                  `/api/ad-groups/${backendAdGroup.id}/ads`
                );
                const backendAds = adsResponse.data;
                const ads = backendAds.map(transformAd);
                return transformAdGroup(backendAdGroup, ads);
              } catch (error) {
                console.error(`Failed to fetch ads for ad group ${backendAdGroup.id}:`, error);
                return transformAdGroup(backendAdGroup, []);
              }
            })
          );

          return transformCampaign(backendCampaign, adGroups);
        } catch (error) {
          console.error(`Failed to fetch ad groups for campaign ${backendCampaign.id}:`, error);
          return transformCampaign(backendCampaign, []);
        }
      })
    );

    return campaigns;
  } catch (error: any) {
    console.error('Failed to fetch campaigns:', error);
    throw new Error(error.message || 'Failed to fetch campaigns from API');
  }
}

/**
 * Fetch a single campaign with nested data
 */
export async function fetchCampaign(id: string): Promise<Campaign> {
  try {
    const response = await apiClient.request<APIResponse<BackendCampaign>>(`/api/campaigns/${id}`);
    const backendCampaign = response.data;

    // Fetch ad groups
    const adGroupsResponse = await apiClient.request<APIResponse<BackendAdGroup[]>>(
      `/api/campaigns/${id}/ad-groups`
    );
    const backendAdGroups = adGroupsResponse.data;

    // Fetch ads for each ad group
    const adGroups = await Promise.all(
      backendAdGroups.map(async (backendAdGroup) => {
        const adsResponse = await apiClient.request<APIResponse<BackendAd[]>>(
          `/api/ad-groups/${backendAdGroup.id}/ads`
        );
        const backendAds = adsResponse.data;
        const ads = backendAds.map(transformAd);
        return transformAdGroup(backendAdGroup, ads);
      })
    );

    return transformCampaign(backendCampaign, adGroups);
  } catch (error: any) {
    console.error(`Failed to fetch campaign ${id}:`, error);
    throw new Error(error.message || `Failed to fetch campaign ${id}`);
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
  try {
    const backendCampaign = transformCampaignToBackend(campaign);
    const response = await apiClient.request<APIResponse<BackendCampaign>>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(backendCampaign),
    });
    return transformCampaign(response.data, []);
  } catch (error: any) {
    console.error('Failed to create campaign:', error);
    throw new Error(error.message || 'Failed to create campaign');
  }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
  try {
    const backendUpdates = transformCampaignToBackend(updates);
    const response = await apiClient.request<APIResponse<BackendCampaign>>(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendUpdates),
    });

    // Fetch full campaign with nested data
    return fetchCampaign(id);
  } catch (error: any) {
    console.error(`Failed to update campaign ${id}:`, error);
    throw new Error(error.message || `Failed to update campaign ${id}`);
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<void> {
  try {
    await apiClient.request<APIResponse<void>>(`/api/campaigns/${id}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`Failed to delete campaign ${id}:`, error);
    throw new Error(error.message || `Failed to delete campaign ${id}`);
  }
}

/* ==================== AD GROUP CRUD ==================== */

/**
 * Create a new ad group
 */
export async function createAdGroup(adGroup: Partial<AdGroup>): Promise<AdGroup> {
  try {
    const backendAdGroup = transformAdGroupToBackend(adGroup);
    const response = await apiClient.request<APIResponse<BackendAdGroup>>('/api/ad-groups', {
      method: 'POST',
      body: JSON.stringify(backendAdGroup),
    });
    return transformAdGroup(response.data, []);
  } catch (error: any) {
    console.error('Failed to create ad group:', error);
    throw new Error(error.message || 'Failed to create ad group');
  }
}

/**
 * Update an existing ad group
 */
export async function updateAdGroup(id: string, updates: Partial<AdGroup>): Promise<AdGroup> {
  try {
    const backendUpdates = transformAdGroupToBackend(updates);
    const response = await apiClient.request<APIResponse<BackendAdGroup>>(`/api/ad-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendUpdates),
    });

    // Fetch ads for this ad group
    const adsResponse = await apiClient.request<APIResponse<BackendAd[]>>(
      `/api/ad-groups/${id}/ads`
    );
    const ads = adsResponse.data.map(transformAd);

    return transformAdGroup(response.data, ads);
  } catch (error: any) {
    console.error(`Failed to update ad group ${id}:`, error);
    throw new Error(error.message || `Failed to update ad group ${id}`);
  }
}

/**
 * Delete an ad group
 */
export async function deleteAdGroup(id: string): Promise<void> {
  try {
    await apiClient.request<APIResponse<void>>(`/api/ad-groups/${id}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`Failed to delete ad group ${id}:`, error);
    throw new Error(error.message || `Failed to delete ad group ${id}`);
  }
}

/**
 * Duplicate multiple ad groups and their nested ads
 */
export async function duplicateAdGroups(
  campaignId: string,
  adGroupIds: string[]
): Promise<AdGroup[]> {
  try {
    const response = await apiClient.request<APIResponse<BackendAdGroupDuplicate[]>>(
      '/api/ad-groups/bulk/duplicate',
      {
        method: 'POST',
        body: JSON.stringify({ campaignId, adGroupIds }),
      }
    );

    return response.data.map(({ ad_group, ads }) =>
      transformAdGroup(ad_group, ads.map(transformAd))
    );
  } catch (error: any) {
    console.error('Failed to duplicate ad groups:', error);
    throw new Error(error.message || 'Failed to duplicate ad groups');
  }
}

/**
 * Bulk update ad group status values
 */
export async function updateAdGroupsStatus(
  campaignId: string,
  adGroupIds: string[],
  status: AdGroup['status']
): Promise<AdGroup[]> {
  try {
    const backendStatus: BackendEntityStatus = status === 'active' ? 'active' : 'paused';
    const response = await apiClient.request<APIResponse<BackendAdGroup[]>>(
      '/api/ad-groups/bulk/status',
      {
        method: 'PATCH',
        body: JSON.stringify({ campaignId, adGroupIds, status: backendStatus }),
      }
    );

    return await Promise.all(
      response.data.map(async (backendAdGroup) => {
        try {
          const adsResponse = await apiClient.request<APIResponse<BackendAd[]>>(
            `/api/ad-groups/${backendAdGroup.id}/ads`
          );
          const ads = adsResponse.data.map(transformAd);
          return transformAdGroup(backendAdGroup, ads);
        } catch (error) {
          console.error(
            `Failed to fetch ads for updated ad group ${backendAdGroup.id}:`,
            error
          );
          return transformAdGroup(backendAdGroup, []);
        }
      })
    );
  } catch (error: any) {
    console.error('Failed to update ad group statuses:', error);
    throw new Error(error.message || 'Failed to update ad group statuses');
  }
}

/* ==================== AD CRUD ==================== */

/**
 * Create a new ad
 */
export async function createAd(ad: Partial<ResponsiveSearchAd>): Promise<ResponsiveSearchAd> {
  try {
    const backendAd = transformAdToBackend(ad);
    const response = await apiClient.request<APIResponse<BackendAd>>('/api/ads', {
      method: 'POST',
      body: JSON.stringify(backendAd),
    });
    return transformAd(response.data);
  } catch (error: any) {
    console.error('Failed to create ad:', error);
    throw new Error(error.message || 'Failed to create ad');
  }
}

/**
 * Update an existing ad
 */
export async function updateAd(id: string, updates: Partial<ResponsiveSearchAd>): Promise<ResponsiveSearchAd> {
  try {
    const backendUpdates = transformAdToBackend(updates);
    const response = await apiClient.request<APIResponse<BackendAd>>(`/api/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendUpdates),
    });
    return transformAd(response.data);
  } catch (error: any) {
    console.error(`Failed to update ad ${id}:`, error);
    throw new Error(error.message || `Failed to update ad ${id}`);
  }
}

/**
 * Delete an ad
 */
export async function deleteAd(id: string): Promise<void> {
  try {
    await apiClient.request<APIResponse<void>>(`/api/ads/${id}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`Failed to delete ad ${id}:`, error);
    throw new Error(error.message || `Failed to delete ad ${id}`);
  }
}

/**
 * Duplicate multiple ads within an ad group
 */
export async function duplicateAds(
  campaignId: string,
  adGroupId: string,
  adIds: string[]
): Promise<ResponsiveSearchAd[]> {
  try {
    const response = await apiClient.request<APIResponse<BackendAd[]>>(
      '/api/ads/bulk/duplicate',
      {
        method: 'POST',
        body: JSON.stringify({ campaignId, adGroupId, adIds }),
      }
    );

    return response.data.map(transformAd);
  } catch (error: any) {
    console.error('Failed to duplicate ads:', error);
    throw new Error(error.message || 'Failed to duplicate ads');
  }
}

/**
 * Bulk update ad status values
 */
export async function updateAdsStatus(
  campaignId: string,
  adGroupId: string,
  adIds: string[],
  status: ResponsiveSearchAd['status']
): Promise<ResponsiveSearchAd[]> {
  try {
    const backendStatus = mapAdStatusToBackend(status);
    const response = await apiClient.request<APIResponse<BackendAd[]>>(
      '/api/ads/bulk/status',
      {
        method: 'PATCH',
        body: JSON.stringify({
          campaignId,
          adGroupId,
          adIds,
          status: backendStatus,
        }),
      }
    );

    return response.data.map(transformAd);
  } catch (error: any) {
    console.error('Failed to update ad statuses:', error);
    throw new Error(error.message || 'Failed to update ad statuses');
  }
}
