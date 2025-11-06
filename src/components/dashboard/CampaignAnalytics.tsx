import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Lightbulb, BarChart3, DollarSign, MousePointerClick } from 'lucide-react';
import type { Campaign } from '@/types';

interface Recommendation {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
}

interface CampaignStats {
  campaignId: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

interface CampaignAnalyticsProps {
  campaign: Campaign;
}

export default function CampaignAnalytics({ campaign }: CampaignAnalyticsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignData();
  }, [campaign.id]);

  const fetchCampaignData = async () => {
    setLoading(true);
    try {
      // Fetch recommendations
      const recsResponse = await fetch(
        `http://localhost:3001/api/recommendations?campaignId=${campaign.id}&status=pending`
      );
      if (recsResponse.ok) {
        const recsData = await recsResponse.json();
        setRecommendations(recsData.slice(0, 3)); // Show top 3
      }

      // Fetch performance stats (mock data if not available)
      const statsResponse = await fetch(
        `http://localhost:3001/api/performance/campaigns/${campaign.id}`
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        // Use mock data for drafts or campaigns without data
        setStats({
          campaignId: campaign.id,
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      // Set default empty stats
      setStats({
        campaignId: campaign.id,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical' || priority === 'high') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Lightbulb className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const isDraft = campaign.status === 'draft';

  return (
    <div className="space-y-4">
      {/* Status Notice */}
      {isDraft && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Campaign is in Draft</h4>
            <p className="text-sm text-blue-700 mt-1">
              This campaign won't receive data until it's set to Active and running in Google Ads.
            </p>
          </div>
        </div>
      )}

      {/* Performance Stats */}
      {stats && !isDraft && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Impressions</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.impressions.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Clicks</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.clicks.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Spend</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              ${stats.spend.toFixed(2)}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>CTR</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.ctr.toFixed(2)}%
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>CPC</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              ${stats.cpc.toFixed(2)}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Conversions</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.conversions}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-gray-900">Recommendations</h4>
            <span className="text-sm text-gray-500">({recommendations.length})</span>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className={`p-1.5 rounded ${getPriorityColor(rec.priority)}`}>
                  {getPriorityIcon(rec.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{rec.description}</p>
                  {rec.impact && (
                    <p className="text-xs text-gray-600 mt-1">Impact: {rec.impact}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => (window.location.href = `/automation?tab=recommendations&campaign=${campaign.id}`)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all recommendations →
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isDraft && recommendations.length === 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
          <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No recommendations at this time</p>
          <p className="text-xs text-gray-500 mt-1">Check back later for optimization suggestions</p>
        </div>
      )}
    </div>
  );
}
