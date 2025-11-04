import React from 'react';
import type { Campaign, GlobalDescription } from '@/types';
import CharacterCounter from '@/components/common/CharacterCounter';
import { CHAR_LIMITS } from '@/utils/constants';

export interface GlobalDescriptionsProps {
  campaign: Campaign;
  onUpdateDescription: (descriptionId: string, updates: Partial<GlobalDescription>) => void;
  onUpdateCampaign: (updates: Partial<Campaign>) => void;
}

const GlobalDescriptions: React.FC<GlobalDescriptionsProps> = ({ campaign, onUpdateDescription, onUpdateCampaign }) => {
  return (
    <>
      {/* Global Descriptions */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Global Descriptions</h2>
          <span className="text-sm text-gray-500">(used across all ads)</span>
        </div>

        <div className="space-y-4">
          {campaign.globalDescriptions.map((desc, index) => (
            <div key={desc.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description #{index + 1}
              </label>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor={`desc-${desc.id}-line1`} className="text-xs text-gray-500">Line 1</label>
                    <CharacterCounter current={desc.line1.length} limit={CHAR_LIMITS.DESCRIPTION} />
                  </div>
                  <input
                    id={`desc-${desc.id}-line1`}
                    name={`desc-${desc.id}-line1`}
                    type="text"
                    value={desc.line1}
                    onChange={(e) => onUpdateDescription(desc.id, { line1: e.target.value })}
                    maxLength={CHAR_LIMITS.DESCRIPTION}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label htmlFor={`desc-${desc.id}-line2`} className="text-xs text-gray-500">Line 2</label>
                    <CharacterCounter current={desc.line2.length} limit={CHAR_LIMITS.DESCRIPTION} />
                  </div>
                  <input
                    id={`desc-${desc.id}-line2`}
                    name={`desc-${desc.id}-line2`}
                    type="text"
                    value={desc.line2}
                    onChange={(e) => onUpdateDescription(desc.id, { line2: e.target.value })}
                    maxLength={CHAR_LIMITS.DESCRIPTION}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* URL Paths */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">URL Paths</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="campaign-path1" className="block text-sm font-medium text-gray-700">Path 1</label>
              <CharacterCounter current={campaign.path1?.length || 0} limit={CHAR_LIMITS.PATH} />
            </div>
            <input
              id="campaign-path1"
              name="campaign-path1"
              type="text"
              value={campaign.path1 || ''}
              onChange={(e) => onUpdateCampaign({ path1: e.target.value })}
              maxLength={CHAR_LIMITS.PATH}
              placeholder="e.g., products"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="campaign-path2" className="block text-sm font-medium text-gray-700">Path 2</label>
              <CharacterCounter current={campaign.path2?.length || 0} limit={CHAR_LIMITS.PATH} />
            </div>
            <input
              id="campaign-path2"
              name="campaign-path2"
              type="text"
              value={campaign.path2 || ''}
              onChange={(e) => onUpdateCampaign({ path2: e.target.value })}
              maxLength={CHAR_LIMITS.PATH}
              placeholder="e.g., sale"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default GlobalDescriptions;
