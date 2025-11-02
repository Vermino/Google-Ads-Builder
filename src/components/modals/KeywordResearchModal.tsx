import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import KeywordResearchResults from '@/components/keywords/KeywordResearchResults';
import NegativeKeywordsPanel from '@/components/keywords/NegativeKeywordsPanel';
import { useKeywordResearch } from '@/hooks/useKeywordResearch';
import { exportKeywordsToCsv } from '@/services/keywordResearchService';
import type { AIProvider } from '@/services/aiService';
import type { MatchTypeSettings } from '@/services/keywordResearchService';
import { Loader2, Download, AlertCircle } from 'lucide-react';

export interface KeywordResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKeywords: (
    keywords: Array<{
      text: string;
      matchTypes: MatchTypeSettings;
    }>
  ) => void;
  /** Pre-fill seed keywords from existing keywords */
  initialKeywords?: string[];
  /** Business context for better AI generation */
  businessContext?: string;
}

type Phase = 'input' | 'results';

/**
 * Modal for AI-powered keyword research
 *
 * Features:
 * - Input phase: Collect seed keywords, business description, location
 * - Results phase: Display keywords, negative keywords, filtering, sorting
 * - Match type selection for each keyword
 * - CSV export
 * - Add selected keywords to ad group
 */
const KeywordResearchModal: React.FC<KeywordResearchModalProps> = ({
  isOpen,
  onClose,
  onAddKeywords,
  initialKeywords = [],
  businessContext = '',
}) => {
  const [phase, setPhase] = useState<Phase>('input');

  // Form state
  const [seedKeywords, setSeedKeywords] = useState(initialKeywords.join(', '));
  const [businessDescription, setBusinessDescription] = useState(businessContext);
  const [targetLocation, setTargetLocation] = useState('United States');
  const [maxResults, setMaxResults] = useState(100);
  const [provider, setProvider] = useState<AIProvider>('openai');

  // Research hook
  const {
    research,
    isResearching,
    results,
    error,
    selectedKeywords,
    toggleKeywordSelection,
    selectAllKeywords,
    deselectAllKeywords,
  } = useKeywordResearch();

  // Match type settings for each keyword
  const [matchTypeSettings, setMatchTypeSettings] = useState<
    Record<string, MatchTypeSettings>
  >({});

  // Selected negative keywords
  const [selectedNegatives, setSelectedNegatives] = useState<string[]>([]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('input');
      setSeedKeywords(initialKeywords.join(', '));
      setBusinessDescription(businessContext);
      setMatchTypeSettings({});
      setSelectedNegatives([]);
    }
  }, [isOpen, initialKeywords, businessContext]);

  // Initialize match type settings when results arrive
  useEffect(() => {
    if (results) {
      const settings: Record<string, MatchTypeSettings> = {};
      results.suggestions.forEach((suggestion) => {
        settings[suggestion.keyword] = { ...suggestion.matchTypes };
      });
      setMatchTypeSettings(settings);
    }
  }, [results]);

  const handleResearch = async () => {
    const seeds = seedKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (seeds.length === 0) {
      return;
    }

    await research({
      provider,
      seedKeywords: seeds,
      businessDescription,
      targetLocation: targetLocation || undefined,
      maxResults,
      includeLongTail: true,
      includeNegativeKeywords: true,
    });

    if (!error) {
      setPhase('results');
    }
  };

  const handleMatchTypeChange = (
    keyword: string,
    matchType: 'exact' | 'phrase' | 'broad',
    enabled: boolean
  ) => {
    setMatchTypeSettings((prev) => ({
      ...prev,
      [keyword]: {
        ...prev[keyword],
        [matchType]: enabled,
      },
    }));
  };

  const handleToggleNegative = (keyword: string) => {
    setSelectedNegatives((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleExportCSV = () => {
    if (!results) return;

    const selectedSuggestions = results.suggestions.filter((s) =>
      selectedKeywords.includes(s.keyword)
    );

    // Apply user's match type settings
    const suggestionsWithUserSettings = selectedSuggestions.map((s) => ({
      ...s,
      matchTypes: matchTypeSettings[s.keyword] || s.matchTypes,
    }));

    const csv = exportKeywordsToCsv(suggestionsWithUserSettings);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword-research-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddToAdGroup = () => {
    if (!results) return;

    const keywordsToAdd = selectedKeywords.map((keyword) => ({
      text: keyword,
      matchTypes: matchTypeSettings[keyword] || { exact: true, phrase: true, broad: false },
    }));

    onAddKeywords(keywordsToAdd);
    onClose();
  };

  const handleBack = () => {
    setPhase('input');
  };

  const canResearch =
    seedKeywords.trim().length > 0 && maxResults >= 50 && maxResults <= 200;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={phase === 'input' ? 'Keyword Research' : 'Research Results'}
      size="xl"
      footer={
        phase === 'input' ? (
          <>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isResearching}
            >
              Cancel
            </button>
            <button
              onClick={handleResearch}
              disabled={!canResearch || isResearching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isResearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Researching...</span>
                </>
              ) : (
                <span>Research Keywords</span>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleExportCSV}
              disabled={selectedKeywords.length === 0}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleAddToAdGroup}
              disabled={selectedKeywords.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedKeywords.length > 0 ? selectedKeywords.length : ''} to Ad
              Group
            </button>
          </>
        )
      }
    >
      {phase === 'input' ? (
        /* INPUT PHASE */
        <div className="space-y-4">
          {/* Seed Keywords */}
          <div>
            <label
              htmlFor="seed-keywords"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Seed Keywords <span className="text-red-500">*</span>
            </label>
            <input
              id="seed-keywords"
              type="text"
              value={seedKeywords}
              onChange={(e) => setSeedKeywords(e.target.value)}
              placeholder="organic dog food, healthy pet treats"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isResearching}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter keywords separated by commas
            </p>
          </div>

          {/* Business Description */}
          <div>
            <label
              htmlFor="business-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Business Description{' '}
              <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="business-description"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Describe your business to help AI generate more relevant keywords"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isResearching}
            />
            <p className="mt-1 text-xs text-gray-500">
              Helps AI generate more relevant keywords
            </p>
          </div>

          {/* Target Location */}
          <div>
            <label
              htmlFor="target-location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Target Location <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="target-location"
              type="text"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              placeholder="United States"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isResearching}
            />
          </div>

          {/* AI Provider */}
          <div>
            <label
              htmlFor="ai-provider"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              AI Provider
            </label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isResearching}
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="claude">Claude (Anthropic)</option>
            </select>
          </div>

          {/* Maximum Results */}
          <div>
            <label
              htmlFor="max-results"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Maximum Results
            </label>
            <input
              id="max-results"
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 100)}
              min={50}
              max={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isResearching}
            />
            <p className="mt-1 text-xs text-gray-500">Between 50 and 200</p>
          </div>

          {/* Loading state */}
          {isResearching && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Researching keywords...
                  </p>
                  <p className="text-xs text-blue-700">
                    This usually takes 10-20 seconds
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* RESULTS PHASE */
        <div className="space-y-4">
          {/* Success message */}
          {results && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Found <strong>{results.suggestions.length} keywords</strong> and{' '}
                <strong>{results.negativeKeywords.length} negative keywords</strong>
              </p>
            </div>
          )}

          {/* Keyword Results */}
          {results && (
            <KeywordResearchResults
              keywords={results.suggestions}
              selectedKeywords={selectedKeywords}
              onToggleKeyword={toggleKeywordSelection}
              onSelectAll={selectAllKeywords}
              onDeselectAll={deselectAllKeywords}
              matchTypeSettings={matchTypeSettings}
              onMatchTypeChange={handleMatchTypeChange}
            />
          )}

          {/* Negative Keywords Panel */}
          {results && results.negativeKeywords.length > 0 && (
            <NegativeKeywordsPanel
              negativeKeywords={results.negativeKeywords}
              selectedNegatives={selectedNegatives}
              onToggleNegative={handleToggleNegative}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default KeywordResearchModal;
