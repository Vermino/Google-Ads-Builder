import React from 'react';
import { Trash2 } from 'lucide-react';
import type { AdGroup } from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';

export interface AdGroupCardProps {
  adGroup: AdGroup;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onDelete?: () => void;
}

const AdGroupCard: React.FC<AdGroupCardProps> = ({ adGroup, onClick, onDelete }) => {
  const keywordCount = adGroup.keywords.length;
  const adCount = adGroup.ads.length;
  const statusVariant =
    adGroup.status === 'active' ? 'success' :
    adGroup.status === 'draft' ? 'default' :
    'warning';

  return (
    <Card hoverable onClick={onClick} className="transition-transform hover:translate-y-[-2px]">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 pr-2 line-clamp-2">{adGroup.name}</h3>
        {onDelete && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label={`Delete ad group ${adGroup.name}`}
            title="Delete ad group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
        <span>{keywordCount} keywords</span>
        <span>•</span>
        <span>{adCount} ads</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          Max CPC: <span className="font-medium text-gray-900">${adGroup.maxCpc.toFixed(2)}</span>
        </span>
        <Badge variant={statusVariant}>
          {adGroup.status.charAt(0).toUpperCase() + adGroup.status.slice(1)}
        </Badge>
      </div>
    </Card>
  );
};

export default AdGroupCard;
