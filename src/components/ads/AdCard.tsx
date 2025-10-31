import React from 'react';
import type { ResponsiveSearchAd } from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';

export interface AdCardProps {
  ad: ResponsiveSearchAd;
  onClick?: () => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, onClick }) => {
  const headlineCount = ad.headlines.length;
  const descriptionCount = ad.descriptions.length;

  const statusVariant =
    ad.status === 'enabled' ? 'success' :
    ad.status === 'paused' ? 'default' : 'default';

  return (
    <Card hoverable onClick={onClick} className="transition-transform hover:translate-y-[-2px]">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{ad.name}</h3>
        <Badge variant={statusVariant}>
          {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
        </Badge>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        <div className="flex items-center space-x-4">
          <span>{headlineCount} headlines</span>
          <span>•</span>
          <span>{descriptionCount} descriptions</span>
        </div>
      </div>

      {/* Preview of first headline */}
      {ad.headlines.length > 0 && (
        <div className="text-xs text-gray-500 mb-2 truncate">
          {ad.headlines[0].text}
        </div>
      )}

      {/* Final URL */}
      <div className="text-xs text-gray-500 truncate">
        {ad.finalUrl}
      </div>
    </Card>
  );
};

export default AdCard;
