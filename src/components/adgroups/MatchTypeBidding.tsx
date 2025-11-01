import type { MatchTypeBidModifier } from '@/types';

export interface MatchTypeBiddingProps {
  maxCpc: number;
  matchTypeBidding?: MatchTypeBidModifier;
  onUpdate: (matchTypeBidding: MatchTypeBidModifier) => void;
}

const MatchTypeBidding = ({ maxCpc, matchTypeBidding, onUpdate }: MatchTypeBiddingProps) => {
  // Initialize with default values if not provided
  const bidding: MatchTypeBidModifier = matchTypeBidding || {
    broad: { enabled: false, percentage: -75.00 },
    broadModifier: { enabled: false, percentage: -25.00 },
    phrase: { enabled: true, percentage: 20.00 },
    exact: { enabled: true, percentage: 75.00 },
  };

  const calculatePrice = (enabled: boolean, percentage: number): number => {
    if (!enabled) return maxCpc;
    return maxCpc * (1 + percentage / 100);
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const updateMatchType = (
    matchType: keyof MatchTypeBidModifier,
    updates: Partial<{ enabled: boolean; percentage: number }>
  ) => {
    onUpdate({
      ...bidding,
      [matchType]: { ...bidding[matchType], ...updates },
    });
  };

  const matchTypes: Array<{ key: keyof MatchTypeBidModifier; label: string }> = [
    { key: 'broad', label: 'Broad' },
    { key: 'broadModifier', label: 'Broad Modifier' },
    { key: 'phrase', label: 'Phrase' },
    { key: 'exact', label: 'Exact' },
  ];

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Keywords & Bidding</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Default Max CPC:</span>
          <span className="font-semibold text-gray-900">{formatPrice(maxCpc)}</span>
        </div>
      </div>

      {/* Match Types Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Match Types</th>
              <th className="px-4 py-3 text-center text-sm font-semibold w-32">Enabled</th>
              <th className="px-4 py-3 text-right text-sm font-semibold w-40">Staggered Bidding</th>
              <th className="px-4 py-3 text-right text-sm font-semibold w-32">Calculated CPC</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matchTypes.map(({ key, label }) => {
              const modifier = bidding[key];
              const calculatedPrice = calculatePrice(modifier.enabled, modifier.percentage);

              return (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{label}</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={modifier.enabled ? 'yes' : 'no'}
                      onChange={(e) => updateMatchType(key, { enabled: e.target.value === 'yes' })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={modifier.percentage}
                      onChange={(e) =>
                        updateMatchType(key, { percentage: parseFloat(e.target.value) || 0 })
                      }
                      className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-right"
                      placeholder="0.00"
                    />
                    <span className="ml-1 text-sm text-gray-600">%</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-gray-900">{formatPrice(calculatedPrice)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> When a match type is enabled, the calculated CPC is based on the Default Max CPC + the percentage modifier.
          When disabled, keywords will use the Default Max CPC regardless of the percentage value.
        </p>
      </div>
    </section>
  );
};

export default MatchTypeBidding;
