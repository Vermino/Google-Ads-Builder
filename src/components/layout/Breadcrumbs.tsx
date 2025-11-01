import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useCampaignStore } from '@/stores/useCampaignStore';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { campaignId, adGroupId, adId } = useParams<{
    campaignId?: string;
    adGroupId?: string;
    adId?: string;
  }>();

  const getCampaign = useCampaignStore((state) => state.getCampaign);
  const getAdGroup = useCampaignStore((state) => state.getAdGroup);
  const getAd = useCampaignStore((state) => state.getAd);

  // Build breadcrumb items
  const breadcrumbs: { label: string; path: string; active: boolean }[] = [
    { label: 'Dashboard', path: '/', active: location.pathname === '/' },
  ];

  if (campaignId) {
    const campaign = getCampaign(campaignId);
    breadcrumbs.push({
      label: campaign?.name || 'Campaign',
      path: `/campaigns/${campaignId}`,
      active: location.pathname === `/campaigns/${campaignId}`,
    });
  }

  if (campaignId && adGroupId) {
    const adGroup = getAdGroup(campaignId, adGroupId);
    breadcrumbs.push({
      label: adGroup?.name || 'Ad Group',
      path: `/campaigns/${campaignId}/ad-groups/${adGroupId}`,
      active: location.pathname === `/campaigns/${campaignId}/ad-groups/${adGroupId}`,
    });
  }

  if (campaignId && adGroupId && adId) {
    const ad = getAd(campaignId, adGroupId, adId);
    breadcrumbs.push({
      label: ad?.name || 'Ad',
      path: `/campaigns/${campaignId}/ad-groups/${adGroupId}/ads/${adId}`,
      active: true,
    });
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {crumb.active ? (
            <span className="font-medium text-gray-900">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-blue-600 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
