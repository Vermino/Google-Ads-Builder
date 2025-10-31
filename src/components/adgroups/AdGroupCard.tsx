import React from 'react';
import type { AdGroup } from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';

export interface AdGroupCardProps {
  adGroup: AdGroup;
  onClick?: () => void;
}

const AdGroupCard: React.FC<AdGroupCardProps> = ({ adGroup, onClick }) => {
  const keywordCount = adGroup.keywords.length;
  const adCount = adGroup.ads.length;
  const statusVariant = adGroup.status === 'active' ? 'success' : 'default';

  return (
    <Card hoverable onClick={onClick} className="transition-transform hover:translate-y-[-2px]">
      <h3 className="font-semibold text-gray-900 mb-2">{adGroup.name}</h3>
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
