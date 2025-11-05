import React from 'react';
import type { Campaign } from '@/types';
import CampaignCard from './CampaignCard';

export interface CampaignListProps {
  campaigns: Campaign[];
  onCampaignClick: (campaignId: string) => void;
  onDelete?: (campaignId: string) => void;
}

const CampaignList: React.FC<CampaignListProps> = ({ campaigns, onCampaignClick, onDelete }) => {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-24 h-24 mx-auto text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
        <p className="text-gray-600 mb-4">Create your first campaign to get started</p>
        <button
          onClick={() => console.log('Create new campaign')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Create Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onClick={() => onCampaignClick(campaign.id)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CampaignList;
