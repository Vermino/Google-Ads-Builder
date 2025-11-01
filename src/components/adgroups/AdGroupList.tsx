import React from 'react';
import type { AdGroup } from '@/types';
import AdGroupCard from './AdGroupCard';

export interface AdGroupListProps {
  adGroups: AdGroup[];
  onAdGroupClick: (adGroupId: string) => void;
  onAddClick?: () => void;
  // Multi-select props
  selectedIds?: string[];
  onSelectOne?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  isSelectionMode?: boolean;
}

const AdGroupList: React.FC<AdGroupListProps> = ({
  adGroups,
  onAdGroupClick,
  onAddClick,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  isSelectionMode = false,
}) => {
  const allSelected = adGroups.length > 0 && selectedIds.length === adGroups.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < adGroups.length;

  const handleCardClick = (adGroupId: string, e: React.MouseEvent) => {
    if (isSelectionMode && onSelectOne) {
      e.stopPropagation();
      const isSelected = selectedIds.includes(adGroupId);
      onSelectOne(adGroupId, !isSelected);
    } else {
      onAdGroupClick(adGroupId);
    }
  };

  const handleCheckboxClick = (adGroupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectOne) {
      const isSelected = selectedIds.includes(adGroupId);
      onSelectOne(adGroupId, !isSelected);
    }
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectAll) {
      onSelectAll(e.target.checked);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isSelectionMode && onSelectAll && (
            <div className="flex items-center mr-2">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={handleSelectAllChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                title="Select all ad groups"
              />
            </div>
          )}
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">
            Ad Groups ({adGroups.length})
            {isSelectionMode && selectedIds.length > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                ({selectedIds.length} selected)
              </span>
            )}
          </h2>
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
        {adGroups.map((adGroup) => {
          const isSelected = selectedIds.includes(adGroup.id);
          return (
            <div
              key={adGroup.id}
              className={`relative ${isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
            >
              {isSelectionMode && onSelectOne && (
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    onClick={(e) => handleCheckboxClick(adGroup.id, e)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    title={`Select ${adGroup.name}`}
                  />
                </div>
              )}
              <div className={isSelectionMode ? 'pl-8' : ''}>
                <AdGroupCard
                  adGroup={adGroup}
                  onClick={() => handleCardClick(adGroup.id, {} as React.MouseEvent)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AdGroupList;
