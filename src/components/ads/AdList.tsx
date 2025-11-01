import React from 'react';
import type { ResponsiveSearchAd } from '@/types';
import AdCard from './AdCard';

export interface AdListProps {
  ads: ResponsiveSearchAd[];
  onAdClick: (adId: string) => void;
  onAddClick?: () => void;
  // Multi-select props
  selectedIds?: string[];
  onSelectOne?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  isSelectionMode?: boolean;
}

const AdList: React.FC<AdListProps> = ({
  ads,
  onAdClick,
  onAddClick,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  isSelectionMode = false,
}) => {
  const allSelected = ads.length > 0 && selectedIds.length === ads.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < ads.length;

  const handleCardClick = (adId: string, e: React.MouseEvent) => {
    if (isSelectionMode && onSelectOne) {
      e.stopPropagation();
      const isSelected = selectedIds.includes(adId);
      onSelectOne(adId, !isSelected);
    } else {
      onAdClick(adId);
    }
  };

  const handleCheckboxClick = (adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectOne) {
      const isSelected = selectedIds.includes(adId);
      onSelectOne(adId, !isSelected);
    }
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectAll) {
      onSelectAll(e.target.checked);
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isSelectionMode && onSelectAll && ads.length > 0 && (
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
                title="Select all ads"
              />
            </div>
          )}
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">
            Responsive Search Ads ({ads.length})
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
          <span>Add Ad</span>
        </button>
      </div>

      {ads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No ads yet. Click "Add Ad" to create your first ad.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => {
            const isSelected = selectedIds.includes(ad.id);
            return (
              <div
                key={ad.id}
                className={`relative ${isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
              >
                {isSelectionMode && onSelectOne && (
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      onClick={(e) => handleCheckboxClick(ad.id, e)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      title={`Select ${ad.name}`}
                    />
                  </div>
                )}
                <div className={isSelectionMode ? 'pl-8' : ''}>
                  <AdCard
                    ad={ad}
                    onClick={() => handleCardClick(ad.id, {} as React.MouseEvent)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AdList;
