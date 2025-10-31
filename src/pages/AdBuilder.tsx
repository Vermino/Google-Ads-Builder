import React from 'react';
import { useCampaignStore } from '@/stores/useCampaignStore';
import HeadlineInput from '@/components/ads/HeadlineInput';
import DescriptionInput from '@/components/ads/DescriptionInput';
import AdPreview from '@/components/ads/AdPreview';
import CharacterCounter from '@/components/common/CharacterCounter';
import { CHAR_LIMITS, MAX_COUNTS } from '@/utils/constants';
import type { Headline, Description } from '@/types';

// For now, hardcode to first campaign, first ad group, and first ad until routing is added
const DEMO_CAMPAIGN_ID = '1';
const DEMO_ADGROUP_ID = 'ag1';
const DEMO_AD_ID = 'ad1';

const AdBuilder: React.FC = () => {
  const ad = useCampaignStore((state) => state.getAd(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID));
  const updateAd = useCampaignStore((state) => state.updateAd);
  const addHeadline = useCampaignStore((state) => state.addHeadline);
  const updateHeadline = useCampaignStore((state) => state.updateHeadline);
  const deleteHeadline = useCampaignStore((state) => state.deleteHeadline);
  const addDescription = useCampaignStore((state) => state.addDescription);
  const updateDescription = useCampaignStore((state) => state.updateDescription);
  const deleteDescription = useCampaignStore((state) => state.deleteDescription);

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ad not found</h2>
          <p className="text-gray-600">The ad you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleAddHeadline = () => {
    if (ad.headlines.length >= MAX_COUNTS.HEADLINES) {
      alert(`Maximum ${MAX_COUNTS.HEADLINES} headlines allowed`);
      return;
    }

    const newHeadline: Headline = {
      id: `h-${Date.now()}`,
      text: '',
    };
    addHeadline(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, newHeadline);
  };

  const handleAddDescription = () => {
    if (ad.descriptions.length >= MAX_COUNTS.DESCRIPTIONS) {
      alert(`Maximum ${MAX_COUNTS.DESCRIPTIONS} descriptions allowed`);
      return;
    }

    const newDescription: Description = {
      id: `d-${Date.now()}`,
      text: '',
    };
    addDescription(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, newDescription);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => console.log('Navigate back to ad group builder')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="text-sm text-gray-500">Responsive Search Ad</div>
                <h1 className="text-xl font-bold text-gray-900">{ad.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Save
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate with AI</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Ad Form */}
          <div>
            {/* URL Settings */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">URL Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final URL</label>
                  <input
                    type="url"
                    value={ad.finalUrl}
                    onChange={(e) =>
                      updateAd(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, { finalUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Path 1</label>
                      <CharacterCounter current={ad.path1?.length || 0} limit={CHAR_LIMITS.PATH} />
                    </div>
                    <input
                      type="text"
                      value={ad.path1 || ''}
                      onChange={(e) =>
                        updateAd(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, { path1: e.target.value })
                      }
                      maxLength={CHAR_LIMITS.PATH}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Path 2</label>
                      <CharacterCounter current={ad.path2?.length || 0} limit={CHAR_LIMITS.PATH} />
                    </div>
                    <input
                      type="text"
                      value={ad.path2 || ''}
                      onChange={(e) =>
                        updateAd(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, { path2: e.target.value })
                      }
                      maxLength={CHAR_LIMITS.PATH}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Headlines */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Headlines ({ad.headlines.length}/{MAX_COUNTS.HEADLINES})
                </h2>
                <button
                  onClick={handleAddHeadline}
                  disabled={ad.headlines.length >= MAX_COUNTS.HEADLINES}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Headline</span>
                </button>
              </div>

              <div className="space-y-3">
                {ad.headlines.map((headline, index) => (
                  <HeadlineInput
                    key={headline.id}
                    headline={headline}
                    index={index}
                    onUpdate={(text) =>
                      updateHeadline(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, headline.id, text)
                    }
                    onDelete={() => deleteHeadline(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, headline.id)}
                  />
                ))}
              </div>
            </section>

            {/* Descriptions */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Descriptions ({ad.descriptions.length}/{MAX_COUNTS.DESCRIPTIONS})
                </h2>
                <button
                  onClick={handleAddDescription}
                  disabled={ad.descriptions.length >= MAX_COUNTS.DESCRIPTIONS}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Description</span>
                </button>
              </div>

              <div className="space-y-3">
                {ad.descriptions.map((description, index) => (
                  <DescriptionInput
                    key={description.id}
                    description={description}
                    index={index}
                    onUpdate={(text) =>
                      updateDescription(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, description.id, text)
                    }
                    onDelete={() =>
                      deleteDescription(DEMO_CAMPAIGN_ID, DEMO_ADGROUP_ID, DEMO_AD_ID, description.id)
                    }
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Ad Preview */}
          <div>
            <AdPreview ad={ad} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdBuilder;
