import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import type { KeywordSuggestion } from '@/services/keywordResearchService';

export interface KeywordResearchResultsProps {
  /** Keyword suggestions from research */
  keywords: KeywordSuggestion[];
  /** Selected keyword texts */
  selectedKeywords: string[];
  /** Callback when keyword selection changes */
  onToggleKeyword: (keyword: string) => void;
  /** Callback to select all visible keywords */
  onSelectAll: () => void;
  /** Callback to deselect all keywords */
  onDeselectAll: () => void;
  /** Match type settings for each keyword */
  matchTypeSettings: Record<
    string,
    { exact: boolean; phrase: boolean; broad: boolean }
  >;
  /** Callback when match type changes */
  onMatchTypeChange: (
    keyword: string,
    matchType: 'exact' | 'phrase' | 'broad',
    enabled: boolean
  ) => void;
}

type SortOption = 'relevance' | 'alphabetical' | 'length';
type CategoryFilter = 'all' | string;

/**
 * Display and manage keyword research results
 *
 * Features:
 * - Checkbox selection
 * - Match type toggles for each keyword
 * - Relevance score display (color-coded)
 * - Category tags
 * - Search/filter
 * - Sort by relevance, alphabetical, or length
 * - Character count
 */
const KeywordResearchResults: React.FC<KeywordResearchResultsProps> = ({
  keywords,
  selectedKeywords,
  onToggleKeyword,
  onSelectAll,
  onDeselectAll,
  matchTypeSettings,
  onMatchTypeChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(keywords.map((k) => k.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [keywords]);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let filtered = keywords;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((k) => k.keyword.toLowerCase().includes(query));
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((k) => k.category === categoryFilter);
    }

    // Apply sort
    const sorted = [...filtered];
    if (sortBy === 'relevance') {
      sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sortBy === 'alphabetical') {
      sorted.sort((a, b) => a.keyword.localeCompare(b.keyword));
    } else if (sortBy === 'length') {
      sorted.sort((a, b) => a.keyword.length - b.keyword.length);
    }

    return sorted;
  }, [keywords, searchQuery, categoryFilter, sortBy]);

  // Get relevance score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-700 bg-green-100';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-gray-700 bg-gray-100';
  };

  // Get category badge color
  const getCategoryColor = (category?: string): string => {
    switch (category?.toLowerCase()) {
      case 'commercial':
        return 'bg-blue-100 text-blue-700';
      case 'local':
        return 'bg-purple-100 text-purple-700';
      case 'informational':
        return 'bg-orange-100 text-orange-700';
      case 'comparison':
        return 'bg-pink-100 text-pink-700';
      case 'product':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const allVisible = filteredKeywords.length > 0;
  const allVisibleSelected =
    allVisible &&
    filteredKeywords.every((k) => selectedKeywords.includes(k.keyword));

  const handleToggleAllVisible = () => {
    if (allVisibleSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other'}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          aria-label="Sort keywords"
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="alphabetical">Sort: A-Z</option>
          <option value="length">Sort: Length</option>
        </select>
      </div>

      {/* Selection summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={handleToggleAllVisible}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 font-medium">
              {selectedKeywords.length > 0
                ? `${selectedKeywords.length} selected`
                : 'Select all'}
            </span>
          </label>
        </div>
        <div className="text-gray-500">
          {filteredKeywords.length} keyword{filteredKeywords.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Keywords List */}
      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
        {filteredKeywords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No keywords found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredKeywords.map((keyword) => {
              const isSelected = selectedKeywords.includes(keyword.keyword);
              const matchTypes =
                matchTypeSettings[keyword.keyword] || keyword.matchTypes;

              return (
                <div
                  key={keyword.keyword}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Keyword header with checkbox and score */}
                  <div className="flex items-start gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleKeyword(keyword.keyword)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Select ${keyword.keyword}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 break-all">
                          {keyword.keyword}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({keyword.keyword.length} chars)
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreColor(
                            keyword.relevanceScore
                          )}`}
                        >
                          Score: {keyword.relevanceScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Match type toggles */}
                  <div className="ml-7 mb-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={matchTypes.exact}
                          onChange={(e) =>
                            onMatchTypeChange(
                              keyword.keyword,
                              'exact',
                              e.target.checked
                            )
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">Exact</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={matchTypes.phrase}
                          onChange={(e) =>
                            onMatchTypeChange(
                              keyword.keyword,
                              'phrase',
                              e.target.checked
                            )
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">Phrase</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={matchTypes.broad}
                          onChange={(e) =>
                            onMatchTypeChange(
                              keyword.keyword,
                              'broad',
                              e.target.checked
                            )
                          }
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">Broad</span>
                      </label>
                    </div>
                  </div>

                  {/* Category and metadata */}
                  <div className="ml-7 flex flex-wrap items-center gap-2">
                    {keyword.category && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                          keyword.category
                        )}`}
                      >
                        {keyword.category
                          ? keyword.category.charAt(0).toUpperCase() +
                            keyword.category.slice(1)
                          : 'Other'}
                      </span>
                    )}
                    {keyword.isLongTail && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                        Long-tail
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={onSelectAll}
          disabled={filteredKeywords.length === 0}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Select All
        </button>
        <button
          onClick={onDeselectAll}
          disabled={selectedKeywords.length === 0}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Deselect All
        </button>
      </div>
    </div>
  );
};

export default KeywordResearchResults;
