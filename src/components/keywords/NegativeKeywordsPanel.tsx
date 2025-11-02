import React, { useState } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';

export interface NegativeKeywordsPanelProps {
  /** Suggested negative keywords */
  negativeKeywords: string[];
  /** Currently selected negative keywords */
  selectedNegatives: string[];
  /** Callback when selection changes */
  onToggleNegative: (keyword: string) => void;
  /** Callback when user wants to add selected negatives */
  onAddSelected?: () => void;
}

/**
 * Collapsible panel showing suggested negative keywords
 *
 * Displays AI-suggested negative keywords that can help filter
 * out irrelevant traffic and improve campaign ROI.
 */
const NegativeKeywordsPanel: React.FC<NegativeKeywordsPanelProps> = ({
  negativeKeywords,
  selectedNegatives,
  onToggleNegative,
  onAddSelected,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (negativeKeywords.length === 0) {
    return null;
  }

  const handleSelectAll = () => {
    // Select all if not all are selected, otherwise deselect all
    if (selectedNegatives.length < negativeKeywords.length) {
      negativeKeywords.forEach((kw) => {
        if (!selectedNegatives.includes(kw)) {
          onToggleNegative(kw);
        }
      });
    } else {
      selectedNegatives.forEach((kw) => {
        if (negativeKeywords.includes(kw)) {
          onToggleNegative(kw);
        }
      });
    }
  };

  const allSelected = negativeKeywords.every((kw) =>
    selectedNegatives.includes(kw)
  );

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="negative-keywords-content"
      >
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-amber-900">
            Negative Keywords ({negativeKeywords.length})
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-700" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-700" aria-hidden="true" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div id="negative-keywords-content" className="px-4 pb-4">
          <p className="text-xs text-amber-700 mb-3">
            Add these to filter irrelevant traffic and improve ROI
          </p>

          {/* Negative keywords list */}
          <div className="max-h-48 overflow-y-auto space-y-1.5 mb-3">
            {negativeKeywords.map((keyword) => {
              const isSelected = selectedNegatives.includes(keyword);
              return (
                <label
                  key={keyword}
                  className="flex items-start space-x-2 p-2 rounded hover:bg-amber-100 cursor-pointer group transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleNegative(keyword)}
                    className="mt-0.5 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500 focus:ring-offset-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 break-all">
                      {keyword}
                    </span>
                    <p className="text-xs text-gray-500">
                      Filters searches containing "{keyword}"
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
            <button
              onClick={handleSelectAll}
              className="text-xs text-amber-700 hover:text-amber-800 font-medium transition-colors"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            {onAddSelected && selectedNegatives.length > 0 && (
              <button
                onClick={onAddSelected}
                className="ml-auto text-xs px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 font-medium transition-colors"
              >
                Add {selectedNegatives.length} Selected
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NegativeKeywordsPanel;
