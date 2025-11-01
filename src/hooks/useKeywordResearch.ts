/**
 * useKeywordResearch Hook
 *
 * React hook for keyword research functionality.
 * Provides state management and async handling for keyword research operations.
 *
 * @module useKeywordResearch
 */

import { useState, useCallback } from 'react';
import {
  researchKeywords,
  formatKeywordResearchError,
  exportKeywordsToCsv,
  formatKeywordsForClipboard,
} from '@/services/keywordResearchService';
import type {
  KeywordResearchRequest,
  KeywordResearchResult,
  KeywordSuggestion,
} from '@/services/keywordResearchService';

/**
 * Hook state interface
 */
interface UseKeywordResearchState {
  /** Whether research is currently in progress */
  isResearching: boolean;

  /** Current research results */
  results: KeywordResearchResult | null;

  /** Error message if research failed */
  error: string | null;

  /** Selected keywords for export/addition */
  selectedKeywords: string[];
}

/**
 * Hook return interface
 */
interface UseKeywordResearchReturn extends UseKeywordResearchState {
  /** Perform keyword research */
  research: (request: KeywordResearchRequest) => Promise<void>;

  /** Clear current results and error */
  clearResults: () => void;

  /** Select/deselect a keyword */
  toggleKeywordSelection: (keyword: string) => void;

  /** Select all keywords */
  selectAllKeywords: () => void;

  /** Deselect all keywords */
  deselectAllKeywords: () => void;

  /** Get selected keyword objects */
  getSelectedKeywords: () => KeywordSuggestion[];

  /** Export selected keywords to CSV */
  exportSelectedToCsv: () => string;

  /** Format selected keywords for clipboard */
  formatSelectedForClipboard: () => string;

  /** Get keywords by category */
  getKeywordsByCategory: (category: string) => KeywordSuggestion[];

  /** Get high-relevance keywords (score >= 70) */
  getHighRelevanceKeywords: () => KeywordSuggestion[];

  /** Get long-tail keywords only */
  getLongTailKeywords: () => KeywordSuggestion[];
}

/**
 * React hook for keyword research
 *
 * Manages keyword research state, provides research functionality,
 * and includes utilities for keyword selection and export.
 *
 * @returns Keyword research state and functions
 *
 * @example
 * ```typescript
 * function KeywordResearchComponent() {
 *   const {
 *     research,
 *     isResearching,
 *     results,
 *     error,
 *     selectedKeywords,
 *     toggleKeywordSelection,
 *     exportSelectedToCsv,
 *   } = useKeywordResearch();
 *
 *   const handleResearch = async () => {
 *     await research({
 *       provider: 'openai',
 *       seedKeywords: ['plumbing', 'emergency plumber'],
 *       businessDescription: 'Local emergency plumbing service',
 *       targetLocation: 'Boston',
 *       maxResults: 100,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleResearch} disabled={isResearching}>
 *         Research Keywords
 *       </button>
 *       {error && <div className="error">{error}</div>}
 *       {results && (
 *         <div>
 *           <h3>Found {results.suggestions.length} keywords</h3>
 *           {results.suggestions.map((kw) => (
 *             <div key={kw.keyword}>
 *               <input
 *                 type="checkbox"
 *                 checked={selectedKeywords.includes(kw.keyword)}
 *                 onChange={() => toggleKeywordSelection(kw.keyword)}
 *               />
 *               {kw.keyword} (Score: {kw.relevanceScore})
 *             </div>
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useKeywordResearch(): UseKeywordResearchReturn {
  const [state, setState] = useState<UseKeywordResearchState>({
    isResearching: false,
    results: null,
    error: null,
    selectedKeywords: [],
  });

  /**
   * Perform keyword research
   */
  const research = useCallback(
    async (request: KeywordResearchRequest): Promise<void> => {
      setState((prev) => ({
        ...prev,
        isResearching: true,
        error: null,
      }));

      try {
        const result = await researchKeywords(request);

        setState((prev) => ({
          ...prev,
          isResearching: false,
          results: result,
          error: null,
        }));
      } catch (err: any) {
        const errorMessage = formatKeywordResearchError(err);

        setState((prev) => ({
          ...prev,
          isResearching: false,
          error: errorMessage,
        }));
      }
    },
    []
  );

  /**
   * Clear current results and error
   */
  const clearResults = useCallback(() => {
    setState({
      isResearching: false,
      results: null,
      error: null,
      selectedKeywords: [],
    });
  }, []);

  /**
   * Toggle keyword selection
   */
  const toggleKeywordSelection = useCallback((keyword: string) => {
    setState((prev) => {
      const isSelected = prev.selectedKeywords.includes(keyword);

      return {
        ...prev,
        selectedKeywords: isSelected
          ? prev.selectedKeywords.filter((k) => k !== keyword)
          : [...prev.selectedKeywords, keyword],
      };
    });
  }, []);

  /**
   * Select all keywords
   */
  const selectAllKeywords = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedKeywords: prev.results?.suggestions.map((k) => k.keyword) || [],
    }));
  }, []);

  /**
   * Deselect all keywords
   */
  const deselectAllKeywords = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedKeywords: [],
    }));
  }, []);

  /**
   * Get selected keyword objects
   */
  const getSelectedKeywords = useCallback((): KeywordSuggestion[] => {
    if (!state.results) return [];

    return state.results.suggestions.filter((k) =>
      state.selectedKeywords.includes(k.keyword)
    );
  }, [state.results, state.selectedKeywords]);

  /**
   * Export selected keywords to CSV
   */
  const exportSelectedToCsv = useCallback((): string => {
    const selected = getSelectedKeywords();
    return exportKeywordsToCsv(selected);
  }, [getSelectedKeywords]);

  /**
   * Format selected keywords for clipboard
   */
  const formatSelectedForClipboard = useCallback((): string => {
    const selected = getSelectedKeywords();
    return formatKeywordsForClipboard(selected);
  }, [getSelectedKeywords]);

  /**
   * Get keywords by category
   */
  const getKeywordsByCategory = useCallback(
    (category: string): KeywordSuggestion[] => {
      if (!state.results) return [];

      return state.results.suggestions.filter((k) => k.category === category);
    },
    [state.results]
  );

  /**
   * Get high-relevance keywords (score >= 70)
   */
  const getHighRelevanceKeywords = useCallback((): KeywordSuggestion[] => {
    if (!state.results) return [];

    return state.results.suggestions.filter((k) => k.relevanceScore >= 70);
  }, [state.results]);

  /**
   * Get long-tail keywords only
   */
  const getLongTailKeywords = useCallback((): KeywordSuggestion[] => {
    if (!state.results) return [];

    return state.results.suggestions.filter((k) => k.isLongTail);
  }, [state.results]);

  return {
    // State
    isResearching: state.isResearching,
    results: state.results,
    error: state.error,
    selectedKeywords: state.selectedKeywords,

    // Actions
    research,
    clearResults,
    toggleKeywordSelection,
    selectAllKeywords,
    deselectAllKeywords,

    // Computed values
    getSelectedKeywords,
    exportSelectedToCsv,
    formatSelectedForClipboard,
    getKeywordsByCategory,
    getHighRelevanceKeywords,
    getLongTailKeywords,
  };
}

export default useKeywordResearch;
