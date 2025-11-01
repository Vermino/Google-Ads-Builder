import React from 'react';
import type { AdGroup } from '@/types';
import AdGroupCard from './AdGroupCard';

export interface AdGroupListProps {
  adGroups: AdGroup[];
  onAdGroupClick: (adGroupId: string) => void;
  onAddClick?: () => void;
}

const AdGroupList: React.FC<AdGroupListProps> = ({ adGroups, onAdGroupClick, onAddClick }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Ad Groups ({adGroups.length})</h2>
        </div>
        <button
          onClick={onAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Ad Group</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adGroups.map((adGroup) => (
          <AdGroupCard key={adGroup.id} adGroup={adGroup} onClick={() => onAdGroupClick(adGroup.id)} />
        ))}
      </div>
    </section>
  );
};

export default AdGroupList;
