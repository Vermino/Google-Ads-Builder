import React, { useState } from 'react';
import { Copy, Check, RefreshCw, ArrowRight } from 'lucide-react';
import { CHAR_LIMITS } from '@/utils/constants';
import type { HeadlineWithCategory, HeadlineCategory } from '@/services/aiService';

export interface AIGenerationResultsProps {
  headlines: HeadlineWithCategory[];
  descriptions: string[];
  onUseSelected: (selectedHeadlines: string[], selectedDescriptions: string[]) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

// Category badge colors and metadata
const CATEGORY_STYLES: Record<HeadlineCategory, { bg: string; text: string; label: string; tooltip: string }> = {
  KEYWORD: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Keyword',
    tooltip: 'Position 1: Keyword-focused headline for search relevance'
  },
  VALUE: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Value',
    tooltip: 'Position 2: Value proposition and differentiator'
  },
  CTA: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'CTA',
    tooltip: 'Position 3: Call-to-action or brand reinforcement'
  },
  GENERAL: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'General',
    tooltip: 'General headline'
  }
};

const AIGenerationResults: React.FC<AIGenerationResultsProps> = ({
  headlines,
  descriptions,
  onUseSelected,
  onRegenerate,
  isRegenerating = false,
}) => {
  const [selectedHeadlines, setSelectedHeadlines] = useState<Set<string>>(new Set());
  const [selectedDescriptions, setSelectedDescriptions] = useState<Set<string>>(new Set());
  const [copiedType, setCopiedType] = useState<'headlines' | 'descriptions' | null>(null);

  // Toggle individual headline selection
  const toggleHeadline = (headlineText: string) => {
    const newSelected = new Set(selectedHeadlines);
    if (newSelected.has(headlineText)) {
      newSelected.delete(headlineText);
    } else {
      newSelected.add(headlineText);
    }
    setSelectedHeadlines(newSelected);
  };

  // Toggle individual description selection
  const toggleDescription = (description: string) => {
    const newSelected = new Set(selectedDescriptions);
    if (newSelected.has(description)) {
      newSelected.delete(description);
    } else {
      newSelected.add(description);
    }
    setSelectedDescriptions(newSelected);
  };

  // Select all headlines
  const selectAllHeadlines = () => {
    setSelectedHeadlines(new Set(headlines.map(h => h.text)));
  };

  // Deselect all headlines
  const deselectAllHeadlines = () => {
    setSelectedHeadlines(new Set());
  };

  // Select all descriptions
  const selectAllDescriptions = () => {
    setSelectedDescriptions(new Set(descriptions));
  };

  // Deselect all descriptions
  const deselectAllDescriptions = () => {
    setSelectedDescriptions(new Set());
  };

  // Copy selected items to clipboard
  const copySelected = async (type: 'headlines' | 'descriptions') => {
    const items = type === 'headlines' ? Array.from(selectedHeadlines) : Array.from(selectedDescriptions);
    const text = items.join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Handle use selected button
  const handleUseSelected = () => {
    onUseSelected(Array.from(selectedHeadlines), Array.from(selectedDescriptions));
  };

  // Get character count color
  const getCharCountColor = (length: number, limit: number): string => {
    const percentage = (length / limit) * 100;
    if (percentage <= 80) return 'text-green-600';
    if (percentage <= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const hasSelections = selectedHeadlines.size > 0 || selectedDescriptions.size > 0;

  return (
    <div className="space-y-6">
      {/* Headlines Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Headlines ({headlines.length})
          </h3>
          <div className="flex items-center space-x-2">
            {selectedHeadlines.size === headlines.length ? (
              <button
                onClick={deselectAllHeadlines}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                Deselect All
              </button>
            ) : (
              <button
                onClick={selectAllHeadlines}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
            )}
            <button
              onClick={() => copySelected('headlines')}
              disabled={selectedHeadlines.size === 0}
              className="inline-flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedType === 'headlines' ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedType === 'headlines' ? 'Copied!' : 'Copy Selected'}</span>
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-80 overflow-y-auto">
          {headlines.map((headline, index) => {
            const isSelected = selectedHeadlines.has(headline.text);
            const charCount = headline.text.length;
            const colorClass = getCharCountColor(charCount, CHAR_LIMITS.HEADLINE);
            const categoryStyle = CATEGORY_STYLES[headline.category];

            return (
              <label
                key={index}
                className={`flex items-start p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleHeadline(headline.text)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm text-gray-900 break-words">{headline.text}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Category Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
                      title={categoryStyle.tooltip}
                    >
                      {categoryStyle.label}
                    </span>

                    {/* Character Count */}
                    <div className={`text-xs font-medium ${colorClass}`}>
                      {charCount}/{CHAR_LIMITS.HEADLINE}
                    </div>

                    {/* Over Limit Warning */}
                    {charCount > CHAR_LIMITS.HEADLINE && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Over limit - trim to {CHAR_LIMITS.HEADLINE}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Descriptions Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Descriptions ({descriptions.length})
          </h3>
          <div className="flex items-center space-x-2">
            {selectedDescriptions.size === descriptions.length ? (
              <button
                onClick={deselectAllDescriptions}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                Deselect All
              </button>
            ) : (
              <button
                onClick={selectAllDescriptions}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
            )}
            <button
              onClick={() => copySelected('descriptions')}
              disabled={selectedDescriptions.size === 0}
              className="inline-flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copiedType === 'descriptions' ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedType === 'descriptions' ? 'Copied!' : 'Copy Selected'}</span>
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-80 overflow-y-auto">
          {descriptions.map((description, index) => {
            const isSelected = selectedDescriptions.has(description);
            const charCount = description.length;
            const colorClass = getCharCountColor(charCount, CHAR_LIMITS.DESCRIPTION);

            return (
              <label
                key={index}
                className={`flex items-start p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleDescription(description)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm text-gray-900 break-words">{description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`text-xs font-medium ${colorClass}`}>
                      {charCount}/{CHAR_LIMITS.DESCRIPTION}
                    </div>
                    {charCount > CHAR_LIMITS.DESCRIPTION && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Over limit - trim to {CHAR_LIMITS.DESCRIPTION}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
        </button>

        <button
          onClick={handleUseSelected}
          disabled={!hasSelections}
          className="inline-flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>
            Use Selected
            {hasSelections &&
              ` (${selectedHeadlines.size + selectedDescriptions.size})`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIGenerationResults;
