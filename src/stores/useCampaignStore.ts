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
import mockCampaigns from '../mock-data/campaigns';

interface CampaignStore {
  campaigns: Campaign[];

  // Campaign CRUD
  getCampaign: (id: string) => Campaign | undefined;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  // Ad Group CRUD
  getAdGroup: (campaignId: string, adGroupId: string) => AdGroup | undefined;
  addAdGroup: (campaignId: string, adGroup: AdGroup) => void;
  updateAdGroup: (campaignId: string, adGroupId: string, updates: Partial<AdGroup>) => void;
  deleteAdGroup: (campaignId: string, adGroupId: string) => void;

  // Keyword CRUD
  addKeyword: (campaignId: string, adGroupId: string, keyword: Keyword) => void;
  updateKeyword: (campaignId: string, adGroupId: string, keywordId: string, updates: Partial<Keyword>) => void;
  deleteKeyword: (campaignId: string, adGroupId: string, keywordId: string) => void;

  // Ad CRUD
  getAd: (campaignId: string, adGroupId: string, adId: string) => ResponsiveSearchAd | undefined;
  addAd: (campaignId: string, adGroupId: string, ad: ResponsiveSearchAd) => void;
  updateAd: (campaignId: string, adGroupId: string, adId: string, updates: Partial<ResponsiveSearchAd>) => void;
  deleteAd: (campaignId: string, adGroupId: string, adId: string) => void;

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
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaigns: mockCampaigns,

  // Campaign CRUD
  getCampaign: (id) => {
    return get().campaigns.find((c) => c.id === id);
  },

  addCampaign: (campaign) => {
    set((state) => ({
      campaigns: [...state.campaigns, campaign],
    }));
  },

  updateCampaign: (id, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }));
  },

  deleteCampaign: (id) => {
    set((state) => ({
      campaigns: state.campaigns.filter((c) => c.id !== id),
    }));
  },

  // Ad Group CRUD
  getAdGroup: (campaignId, adGroupId) => {
    const campaign = get().getCampaign(campaignId);
    return campaign?.adGroups.find((ag) => ag.id === adGroupId);
  },

  addAdGroup: (campaignId, adGroup) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: [...c.adGroups, adGroup],
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },

  updateAdGroup: (campaignId, adGroupId, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? { ...ag, ...updates, updatedAt: new Date().toISOString() }
                  : ag
              ),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }));
  },

  deleteAdGroup: (campaignId, adGroupId) => {
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

  // Ad CRUD
  getAd: (campaignId, adGroupId, adId) => {
    const adGroup = get().getAdGroup(campaignId, adGroupId);
    return adGroup?.ads.find((ad) => ad.id === adId);
  },

  addAd: (campaignId, adGroupId, ad) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              adGroups: c.adGroups.map((ag) =>
                ag.id === adGroupId
                  ? {
                      ...ag,
                      ads: [...ag.ads, ad],
                      updatedAt: new Date().toISOString(),
                    }
                  : ag
              ),
            }
          : c
      ),
    }));
  },

  updateAd: (campaignId, adGroupId, adId, updates) => {
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
                          ? { ...ad, ...updates, updatedAt: new Date().toISOString() }
                          : ad
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

  deleteAd: (campaignId, adGroupId, adId) => {
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
}));

export default useCampaignStore;
