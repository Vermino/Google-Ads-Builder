import { useState, useEffect } from 'react';
import { Lightbulb, CheckCircle, XCircle, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

interface Recommendation {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impactEstimate?: string;
  autoApplyEligible: boolean;
  status: string;
}

export default function RecommendationsDashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/recommendations?limit=100');
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      const response = await fetch('http://localhost:3001/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeStructureHygiene: true,
          includeAssetOptimization: true,
          includeQueryMining: true,
          includeBudgetOptimization: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Generated ${data.count} recommendations!`);
        loadRecommendations();
      }
    } catch (error) {
      alert('Failed to generate recommendations');
    } finally {
      setGenerating(false);
    }
  };

  const applyRecommendation = async (id: string) => {
    if (!confirm('Apply this recommendation?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/recommendations/${id}/apply`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Recommendation applied successfully!');
        loadRecommendations();
      } else {
        alert(`Failed to apply: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to apply recommendation');
    }
  };

  const dismissRecommendation = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/recommendations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
      loadRecommendations();
    } catch (error) {
      alert('Failed to dismiss recommendation');
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
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    if (filter === 'all') return rec.status === 'pending';
    if (filter === 'auto-apply') return rec.status === 'pending' && rec.autoApplyEligible;
    return rec.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered optimization suggestions for your campaigns
          </p>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={generating}
          className="flex items-center gap-2"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Recommendations
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'Pending' },
          { id: 'auto-apply', label: 'Auto-Apply Eligible' },
          { id: 'applied', label: 'Applied' },
          { id: 'dismissed', label: 'Dismissed' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filter === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No recommendations found
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all'
              ? 'Generate recommendations to get optimization suggestions'
              : 'Try selecting a different filter'
            }
          </p>
          {filter === 'all' && (
            <Button onClick={generateRecommendations}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Recommendations
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1
                        ${getPriorityColor(rec.priority)}
                      `}
                    >
                      {getPriorityIcon(rec.priority)}
                      {rec.priority.toUpperCase()}
                    </span>
                    {rec.autoApplyEligible && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        ✓ Auto-Apply Safe
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {rec.title}
                  </h3>

                  <p className="text-gray-700 mb-3">
                    {rec.description}
                  </p>

                  {rec.impactEstimate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800 font-medium">
                        💡 Impact: {rec.impactEstimate}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Type: {rec.type.replace(/_/g, ' ')}
                  </div>
                </div>

                {rec.status === 'pending' && (
                  <div className="flex flex-col gap-2">
                    {rec.autoApplyEligible && (
                      <Button
                        onClick={() => applyRecommendation(rec.id)}
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Apply
                      </Button>
                    )}
                    <Button
                      onClick={() => dismissRecommendation(rec.id)}
                      variant="secondary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                )}

                {rec.status === 'applied' && (
                  <div className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Applied</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
