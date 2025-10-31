import React from 'react';
import type { Campaign } from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';

export interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onClick }) => {
  // Calculate stats
  const totalAdGroups = campaign.adGroups.length;
  const totalKeywords = campaign.adGroups.reduce((sum, ag) => sum + ag.keywords.length, 0);
  const totalAds = campaign.adGroups.reduce((sum, ag) => sum + ag.ads.length, 0);

  // Format start date
  const startDate = new Date(campaign.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Get status badge variant
  const statusVariant = campaign.status === 'active' ? 'success' : 'default';

  return (
    <Card hoverable onClick={onClick} className="transition-transform hover:translate-y-[-2px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {campaign.name}
          </h3>
        </div>
        <Badge variant={statusVariant}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </Badge>
      </div>

      {/* Stats */}
      <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>{totalAdGroups} Ad Groups</span>
        </div>
        <span>•</span>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>{totalKeywords} Keywords</span>
        </div>
        <span>•</span>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <span>{totalAds} Ads</span>
        </div>
      </div>

      {/* Details */}
      <div className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100 space-y-1">
        <div className="flex justify-between">
          <span>Start Date:</span>
          <span className="font-medium">{startDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Daily Budget:</span>
          <span className="font-medium">${campaign.budget}/day</span>
        </div>
        <div className="flex justify-between">
          <span>Location:</span>
          <span className="font-medium">{campaign.location}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('Edit campaign:', campaign.id);
          }}
          className="flex-1 bg-white border border-gray-300 text-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('Export campaign:', campaign.id);
          }}
          className="flex-1 bg-white border border-gray-300 text-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Export
        </button>
      </div>
    </Card>
  );
};

export default CampaignCard;
