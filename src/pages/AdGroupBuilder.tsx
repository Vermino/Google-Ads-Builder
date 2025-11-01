import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignStore } from '@/stores/useCampaignStore';
import AdGroupSettings from '@/components/adgroups/AdGroupSettings';
import KeywordManager from '@/components/adgroups/KeywordManager';
import AdList from '@/components/ads/AdList';
import type { Keyword } from '@/types';

const AdGroupBuilder: React.FC = () => {
  const { campaignId, adGroupId } = useParams<{ campaignId: string; adGroupId: string }>();
  const navigate = useNavigate();

  const adGroup = useCampaignStore((state) => state.getAdGroup(campaignId!, adGroupId!));
  const updateAdGroup = useCampaignStore((state) => state.updateAdGroup);
  const addKeyword = useCampaignStore((state) => state.addKeyword);
  const updateKeyword = useCampaignStore((state) => state.updateKeyword);
  const deleteKeyword = useCampaignStore((state) => state.deleteKeyword);

  if (!adGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ad Group not found</h2>
          <p className="text-gray-600">The ad group you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(`/campaigns/${campaignId}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Campaign
          </button>
        </div>
      </div>
    );
  }

  const handleAddKeyword = () => {
    const newKeyword: Keyword = {
      id: `kw-${Date.now()}`,
      text: '',
      matchTypes: {
        broad: true,
        phrase: false,
        exact: false,
      },
    };
    addKeyword(campaignId!, adGroupId!, newKeyword);
  };

  const handleAdClick = (adId: string) => {
    navigate(`/campaigns/${campaignId}/ad-groups/${adGroupId}/ads/${adId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/campaigns/${campaignId}`)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="text-sm text-gray-500">Ad Group</div>
                <h1 className="text-xl font-bold text-gray-900">{adGroup.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Save
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdGroupSettings
          adGroup={adGroup}
          onUpdate={(updates) => updateAdGroup(campaignId!, adGroupId!, updates)}
        />

        <KeywordManager
          keywords={adGroup.keywords}
          onAddKeyword={handleAddKeyword}
          onUpdateKeyword={(keywordId, updates) =>
            updateKeyword(campaignId!, adGroupId!, keywordId, updates)
          }
          onDeleteKeyword={(keywordId) =>
            deleteKeyword(campaignId!, adGroupId!, keywordId)
          }
        />

        <AdList ads={adGroup.ads} onAdClick={handleAdClick} />
      </main>
    </div>
  );
};

export default AdGroupBuilder;
