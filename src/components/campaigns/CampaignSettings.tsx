import React from 'react';
import type { Campaign } from '@/types';
import Input from '@/components/common/Input';

export interface CampaignSettingsProps {
  campaign: Campaign;
  onUpdate: (updates: Partial<Campaign>) => void;
}

const CampaignSettings: React.FC<CampaignSettingsProps> = ({ campaign, onUpdate }) => {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900">Campaign Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Campaign Name"
          value={campaign.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <Input
          label="Start Date"
          type="date"
          value={campaign.startDate}
          onChange={(e) => onUpdate({ startDate: e.target.value })}
        />
        <Input
          label="Daily Budget ($)"
          type="number"
          value={campaign.budget.toString()}
          onChange={(e) => onUpdate({ budget: parseFloat(e.target.value) || 0 })}
        />
        <Input
          label="Target Location"
          value={campaign.location}
          onChange={(e) => onUpdate({ location: e.target.value })}
        />
        <div className="md:col-span-2">
          <Input
            label="Final URL"
            type="url"
            value={campaign.finalUrl}
            onChange={(e) => onUpdate({ finalUrl: e.target.value })}
            placeholder="https://example.com"
          />
        </div>
      </div>
    </section>
  );
};

export default CampaignSettings;
