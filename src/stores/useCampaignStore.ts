import { create } from 'zustand';
import type {
  Campaign,
  AdGroup,
  ResponsiveSearchAd,
  Keyword,
  Headline,
  Description,
  GlobalDescription,
} from '../types';
import * as campaignService from '../services/campaignService';

interface CampaignStore {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;

  // Data Loading
  loadCampaigns: () => Promise<void>;
  refreshCampaign: (id: string) => Promise<void>;

  // Campaign CRUD
  getCampaign: (id: string) => Campaign | undefined;
  addCampaign: (campaign: Campaign) => Promise<Campaign>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;

  // Ad Group CRUD
  getAdGroup: (campaignId: string, adGroupId: string) => AdGroup | undefined;
  addAdGroup: (campaignId: string, adGroup: AdGroup) => Promise<void>;
  updateAdGroup: (campaignId: string, adGroupId: string, updates: Partial<AdGroup>) => Promise<void>;
  deleteAdGroup: (campaignId: string, adGroupId: string) => Promise<void>;

  // Keyword CRUD
  addKeyword: (campaignId: string, adGroupId: string, keyword: Keyword) => void;
  updateKeyword: (campaignId: string, adGroupId: string, keywordId: string, updates: Partial<Keyword>) => void;
  deleteKeyword: (campaignId: string, adGroupId: string, keywordId: string) => void;

  // Bulk Keyword Operations
  addKeywords: (campaignId: string, adGroupId: string, keywords: Keyword[]) => void;

  // Ad CRUD
  getAd: (campaignId: string, adGroupId: string, adId: string) => ResponsiveSearchAd | undefined;
  addAd: (campaignId: string, adGroupId: string, ad: ResponsiveSearchAd) => Promise<void>;
  updateAd: (campaignId: string, adGroupId: string, adId: string, updates: Partial<ResponsiveSearchAd>) => Promise<void>;
  deleteAd: (campaignId: string, adGroupId: string, adId: string) => Promise<void>;

  // Headline Management
  addHeadline: (campaignId: string, adGroupId: string, adId: string, headline: Headline) => void;
  updateHeadline: (campaignId: string, adGroupId: string, adId: string, headlineId: string, updates: Partial<Headline>) => void;
  deleteHeadline: (campaignId: string, adGroupId: string, adId: string, headlineId: string) => void;

  // Description Management
  addDescription: (campaignId: string, adGroupId: string, adId: string, description: Description) => void;
  updateDescription: (campaignId: string, adGroupId: string, adId: string, descriptionId: string, updates: Partial<Description>) => void;
  deleteDescription: (campaignId: string, adGroupId: string, adId: string, descriptionId: string) => void;

  // Global Description Management
  updateGlobalDescription: (campaignId: string, descriptionId: string, updates: Partial<GlobalDescription>) => void;

  // Bulk Ad Group Operations
  deleteAdGroups: (campaignId: string, adGroupIds: string[]) => Promise<void>;
  duplicateAdGroups: (campaignId: string, adGroupIds: string[]) => void;
  updateAdGroupsStatus: (campaignId: string, adGroupIds: string[], status: AdGroup['status']) => void;

  // Bulk Ad Operations
  deleteAds: (campaignId: string, adGroupId: string, adIds: string[]) => Promise<void>;
  duplicateAds: (campaignId: string, adGroupId: string, adIds: string[]) => void;
  updateAdsStatus: (campaignId: string, adGroupId: string, adIds: string[], status: ResponsiveSearchAd['status']) => void;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: [],
  loading: false,
  error: null,

  // Data Loading
  loadCampaigns: async () => {
    set({ loading: true, error: null });
    try {
      const campaigns = await campaignService.fetchCampaigns();
      set({ campaigns, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load campaigns', loading: false });
      console.error('Failed to load campaigns:', error);
    }
  },

  refreshCampaign: async (id) => {
    try {
      const campaign = await campaignService.fetchCampaign(id);
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? campaign : c)),
      }));
    } catch (error: any) {
      console.error(`Failed to refresh campaign ${id}:`, error);
    }
  },

  // Campaign CRUD
  getCampaign: (id) => {
    return get().campaigns.find((c) => c.id === id);
  },

  addCampaign: async (campaign) => {
    set({ loading: true, error: null });
    try {
      const newCampaign = await campaignService.createCampaign(campaign);
      set((state) => ({
        campaigns: [...state.campaigns, newCampaign],
        loading: false,
      }));
      return newCampaign; // Return the campaign with backend-generated ID
    } catch (error: any) {
      set({ error: error.message || 'Failed to create campaign', loading: false });
      throw error;
    }
  },

  updateCampaign: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedCampaign = await campaignService.updateCampaign(id, updates);
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? updatedCampaign : c)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update campaign', loading: false });
      throw error;
    }
  },

  deleteCampaign: async (id) => {
    set({ loading: true, error: null });
    try {
      await campaignService.deleteCampaign(id);
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete campaign', loading: false });
      throw error;
    }
  },

  // Ad Group CRUD
  getAdGroup: (campaignId, adGroupId) => {
    const campaign = get().getCampaign(campaignId);
    return campaign?.adGroups.find((ag) => ag.id === adGroupId);
  },

  addAdGroup: async (campaignId, adGroup) => {
    try {
      const newAdGroup = await campaignService.createAdGroup({ ...adGroup, campaignId });
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                adGroups: [...c.adGroups, newAdGroup],
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      }));
      return newAdGroup;
    } catch (error: any) {
      console.error('Failed to create ad group:', error);
      throw error;
    }
  },

  updateAdGroup: async (campaignId, adGroupId, updates) => {
    try {
      const updatedAdGroup = await campaignService.updateAdGroup(adGroupId, updates);
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                adGroups: c.adGroups.map((ag) => (ag.id === adGroupId ? updatedAdGroup : ag)),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Failed to update ad group:', error);
      throw error;
    }
  },

  deleteAdGroup: async (campaignId, adGroupId) => {
    try {
      await campaignService.deleteAdGroup(adGroupId);
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                adGroups: c.adGroups.filter((ag) => ag.id !== adGroupId),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Failed to delete ad group:', error);
      throw error;
    }
  },

  // Keyword CRUD
  addKeyword: (campaignId, adGroupId, keyword) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      keywords: [...ag.keywords, keyword],
                      updatedAt: new Date().toISOString(),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  updateKeyword: (campaignId, adGroupId, keywordId, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      keywords: ag.keywords.map((k) =>
                        k.id === keywordId ? { ...k, ...updates } : k
                      ),
                      updatedAt: new Date().toISOString(),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  deleteKeyword: (campaignId, adGroupId, keywordId) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      keywords: ag.keywords.filter((k) => k.id !== keywordId),
                      updatedAt: new Date().toISOString(),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  // Bulk Keyword Operations
  addKeywords: (campaignId, adGroupId, keywords) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      keywords: [...ag.keywords, ...keywords],
                      updatedAt: new Date().toISOString(),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  // Ad CRUD
  getAd: (campaignId, adGroupId, adId) => {
    const adGroup = get().getAdGroup(campaignId, adGroupId);
    return adGroup?.ads.find((ad) => ad.id === adId);
  },

  addAd: async (campaignId, adGroupId, ad) => {
    try {
      const newAd = await campaignService.createAd({ ...ad, adGroupId });
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                adGroups: c.adGroups.map((ag) =>
                  ag.id === adGroupId
                    ? {
                        ...ag,
                        ads: [...ag.ads, newAd],
                        updatedAt: new Date().toISOString(),
                      }
                    : ag
                ),
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Failed to create ad:', error);
      throw error;
    }
  },

  updateAd: async (campaignId, adGroupId, adId, updates) => {
    try {
      const updatedAd = await campaignService.updateAd(adId, updates);
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                adGroups: c.adGroups.map((ag) =>
                  ag.id === adGroupId
                    ? {
                        ...ag,
                        ads: ag.ads.map((ad) => (ad.id === adId ? updatedAd : ad)),
                        updatedAt: new Date().toISOString(),
                      }
                    : ag
                ),
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Failed to update ad:', error);
      throw error;
    }
  },

  deleteAd: async (campaignId, adGroupId, adId) => {
    try {
      await campaignService.deleteAd(adId);
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                adGroups: c.adGroups.map((ag) =>
                  ag.id === adGroupId
                    ? {
                        ...ag,
                        ads: ag.ads.filter((ad) => ad.id !== adId),
                        updatedAt: new Date().toISOString(),
                      }
                    : ag
                ),
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Failed to delete ad:', error);
      throw error;
    }
  },

  // Headline Management
  addHeadline: (campaignId, adGroupId, adId, headline) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      ads: ag.ads.map((ad) =>
                        ad.id === adId
                          ? {
                              ...ad,
                              headlines: [...ad.headlines, headline],
                              updatedAt: new Date().toISOString(),
                            }
                          : ad
                      ),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  updateHeadline: (campaignId, adGroupId, adId, headlineId, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      ads: ag.ads.map((ad) =>
                        ad.id === adId
                          ? {
                              ...ad,
                              headlines: ad.headlines.map((h) =>
                                h.id === headlineId ? { ...h, ...updates } : h
                              ),
                              updatedAt: new Date().toISOString(),
                            }
                          : ad
                      ),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  deleteHeadline: (campaignId, adGroupId, adId, headlineId) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      ads: ag.ads.map((ad) =>
                        ad.id === adId
                          ? {
                              ...ad,
                              headlines: ad.headlines.filter((h) => h.id !== headlineId),
                              updatedAt: new Date().toISOString(),
                            }
                          : ad
                      ),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  // Description Management
  addDescription: (campaignId, adGroupId, adId, description) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      ads: ag.ads.map((ad) =>
                        ad.id === adId
                          ? {
                              ...ad,
                              descriptions: [...ad.descriptions, description],
                              updatedAt: new Date().toISOString(),
                            }
                          : ad
                      ),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  updateDescription: (campaignId, adGroupId, adId, descriptionId, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      ads: ag.ads.map((ad) =>
                        ad.id === adId
                          ? {
                              ...ad,
                              descriptions: ad.descriptions.map((d) =>
                                d.id === descriptionId ? { ...d, ...updates } : d
                              ),
                              updatedAt: new Date().toISOString(),
                            }
                          : ad
                      ),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  deleteDescription: (campaignId, adGroupId, adId, descriptionId) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      ads: ag.ads.map((ad) =>
                        ad.id === adId
                          ? {
                              ...ad,
                              descriptions: ad.descriptions.filter((d) => d.id !== descriptionId),
                              updatedAt: new Date().toISOString(),
                            }
                          : ad
                      ),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  // Global Description Management
  updateGlobalDescription: (campaignId, descriptionId, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              globalDescriptions: c.globalDescriptions.map((gd) =>
                gd.id === descriptionId ? { ...gd, ...updates } : gd
              ),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },

  // Bulk Ad Group Operations
  deleteAdGroups: async (campaignId, adGroupIds) => {
    try {
      // Delete all ad groups in parallel
      await Promise.all(adGroupIds.map((id) => campaignService.deleteAdGroup(id)));

      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                adGroups: c.adGroups.filter((ag) => !adGroupIds.includes(ag.id)),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Failed to delete ad groups:', error);
      throw error;
    }
  },

  duplicateAdGroups: (campaignId, adGroupIds) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) => {
        if (c.id !== campaignId) return c;

        const adGroupsToDuplicate = c.adGroups.filter((ag) => adGroupIds.includes(ag.id));
        const duplicates = adGroupsToDuplicate.map((ag) => ({
          ...ag,
          id: `ag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${ag.name} (Copy)`,
          ads: ag.ads.map((ad) => ({
            ...ad,
            id: `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })),
          keywords: ag.keywords.map((kw) => ({
            ...kw,
            id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        return {
          ...c,
          adGroups: [...c.adGroups, ...duplicates],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  updateAdGroupsStatus: (campaignId, adGroupIds, status) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                adGroupIds.includes(ag.id)
                  ? { ...ag, status, updatedAt: new Date().toISOString() }
                  : ag
              ),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },

  // Bulk Ad Operations
  deleteAds: async (campaignId, adGroupId, adIds) => {
    try {
      // Delete all ads in parallel
      await Promise.all(adIds.map((id) => campaignService.deleteAd(id)));

      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                adGroups: c.adGroups.map((ag) =>
                  ag.id === adGroupId
                    ? {
                        ...ag,
                        ads: ag.ads.filter((ad) => !adIds.includes(ad.id)),
                        updatedAt: new Date().toISOString(),
                      }
                    : ag
                ),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Failed to delete ads:', error);
      throw error;
    }
  },

  duplicateAds: (campaignId, adGroupId, adIds) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) => {
        if (c.id !== campaignId) return c;

        return {
          ...c,
          adGroups: c.adGroups.map((ag) => {
            if (ag.id !== adGroupId) return ag;

            const adsToDuplicate = ag.ads.filter((ad) => adIds.includes(ad.id));
            const duplicates = adsToDuplicate.map((ad) => ({
              ...ad,
              id: `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: `${ad.name} (Copy)`,
              headlines: ad.headlines.map((h) => ({
                ...h,
                id: `hl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              })),
              descriptions: ad.descriptions.map((d) => ({
                ...d,
                id: `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              })),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));

            return {
              ...ag,
              ads: [...ag.ads, ...duplicates],
              updatedAt: new Date().toISOString(),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  updateAdsStatus: (campaignId, adGroupId, adIds, status) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      ads: ag.ads.map((ad) =>
                        adIds.includes(ad.id)
                          ? { ...ad, status, updatedAt: new Date().toISOString() }
                          : ad
                      ),
                      updatedAt: new Date().toISOString(),
                    }
                  : ag
              ),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },
}));

export default useCampaignStore;
