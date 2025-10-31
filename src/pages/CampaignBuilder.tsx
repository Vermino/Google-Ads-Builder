import React from 'react';
import { useCampaignStore } from '@/stores/useCampaignStore';
import CampaignSettings from '@/components/campaigns/CampaignSettings';
import GlobalDescriptions from '@/components/campaigns/GlobalDescriptions';
import AdGroupList from '@/components/adgroups/AdGroupList';

// For now, hardcode to first campaign until routing is added
const DEMO_CAMPAIGN_ID = '1';

const CampaignBuilder: React.FC = () => {
  const campaign = useCampaignStore((state) => state.getCampaign(DEMO_CAMPAIGN_ID));
  const updateCampaign = useCampaignStore((state) => state.updateCampaign);
  const updateGlobalDescription = useCampaignStore((state) => state.updateGlobalDescription);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign not found</h2>
          <p className="text-gray-600">The campaign you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleAdGroupClick = (adGroupId: string) => {
    console.log('Navigate to ad group builder:', adGroupId);
    // React Router will be added in Ticket #9
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => console.log('Navigate back to dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="text-sm text-gray-500">Campaign</div>
                <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
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
        <CampaignSettings
          campaign={campaign}
          onUpdate={(updates) => updateCampaign(DEMO_CAMPAIGN_ID, updates)}
        />

        <GlobalDescriptions
          campaign={campaign}
          onUpdateDescription={(descId, updates) => updateGlobalDescription(DEMO_CAMPAIGN_ID, descId, updates)}
          onUpdateCampaign={(updates) => updateCampaign(DEMO_CAMPAIGN_ID, updates)}
        />

        <AdGroupList adGroups={campaign.adGroups} onAdGroupClick={handleAdGroupClick} />
      </main>
    </div>
  );
};

export default CampaignBuilder;
