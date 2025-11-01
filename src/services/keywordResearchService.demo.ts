/**
 * Keyword Research Service Demo & Integration Examples
 *
 * This file demonstrates how to integrate the keyword research service
 * into your Google Ads Campaign Builder application.
 *
 * For UI Designer: Use these patterns to build the keyword research interface.
 */

import {
  researchKeywords,
  expandKeywords,
  generateLongTailKeywords,
  suggestNegativeKeywords,
  scoreKeywordRelevance,
  exportKeywordsToCsv,
  formatKeywordsForClipboard,
} from './keywordResearchService';
import type {
  KeywordResearchRequest,
  KeywordResearchResult,
  KeywordSuggestion,
} from './keywordResearchService';
import type { AIProvider } from './aiService';

/* ==================== INTEGRATION PATTERNS ==================== */

/**
 * Pattern 1: Full AI-Powered Research
 *
 * Use this when you have AI configured and want comprehensive results.
 */
export async function fullAIResearch(
  provider: AIProvider,
  seedKeywords: string[],
  businessDescription: string,
  targetLocation?: string
): Promise<KeywordResearchResult> {
  const request: KeywordResearchRequest = {
    provider,
    seedKeywords,
    businessDescription,
    targetLocation,
    maxResults: 100,
    includeLongTail: true,
    includeNegativeKeywords: true,
  };

  try {
    const results = await researchKeywords(request);
    console.log(`✓ Found ${results.suggestions.length} keywords`);
    console.log(`✓ Top keyword: ${results.suggestions[0].keyword}`);
    console.log(`✓ Relevance score: ${results.suggestions[0].relevanceScore}`);
    return results;
  } catch (error: any) {
    console.error('Research failed:', error.message);
    throw error;
  }
}

/**
 * Pattern 2: Expansion-Only (No AI Required)
 *
 * Use this when AI is not configured or you want instant results.
 */
export function expansionOnlyResearch(
  seedKeywords: string[],
  businessDescription: string,
  targetLocation?: string
): KeywordSuggestion[] {
  // 1. Expand seed keywords
  const expanded = expandKeywords(seedKeywords, 20);

  // 2. Generate long-tail variations
  const longTail: string[] = [];
  seedKeywords.forEach((keyword) => {
    longTail.push(...generateLongTailKeywords(keyword, targetLocation));
  });

  // 3. Combine and deduplicate
  const allKeywords = [...new Set([...expanded, ...longTail, ...seedKeywords])];

  // 4. Score and filter
  const scored: KeywordSuggestion[] = allKeywords
    .map((keyword) => ({
      keyword,
      matchTypes: {
        exact: true,
        phrase: true,
        broad: keyword.split(' ').length <= 2,
      },
      relevanceScore: scoreKeywordRelevance(
        keyword,
        businessDescription,
        targetLocation
      ),
      category: categorizeKeyword(keyword),
      isLongTail: keyword.split(' ').length >= 3,
    }))
    .filter((k) => k.relevanceScore >= 40)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 100);

  return scored;
}

/**
 * Helper: Categorize keyword
 */
function categorizeKeyword(keyword: string): string {
  const lower = keyword.toLowerCase();

  if (
    lower.startsWith('how to') ||
    lower.startsWith('what is') ||
    lower.includes('guide')
  ) {
    return 'informational';
  }

  if (lower.includes('near me') || lower.includes('local')) {
    return 'local';
  }

  if (
    lower.includes('buy') ||
    lower.includes('hire') ||
    lower.includes('order')
  ) {
    return 'commercial';
  }

  if (lower.includes('best') || lower.includes('vs')) {
    return 'comparison';
  }

  return 'product';
}

/**
 * Pattern 3: Hybrid Approach (AI + Expansion)
 *
 * Try AI first, fall back to expansion if it fails.
 */
export async function hybridResearch(
  provider: AIProvider,
  seedKeywords: string[],
  businessDescription: string,
  targetLocation?: string
): Promise<KeywordSuggestion[]> {
  try {
    // Try AI-powered research first
    const result = await fullAIResearch(
      provider,
      seedKeywords,
      businessDescription,
      targetLocation
    );
    return result.suggestions;
  } catch (error) {
    // Fall back to expansion-only
    console.warn('AI research failed, using expansion only');
    return expansionOnlyResearch(
      seedKeywords,
      businessDescription,
      targetLocation
    );
  }
}

/* ==================== UI INTEGRATION EXAMPLES ==================== */

/**
 * Example 1: Ad Group Keyword Research Modal
 *
 * Integration: Add "Research Keywords" button to Ad Group Builder
 */
export const adGroupKeywordResearchExample = {
  // Initial state
  initialState: {
    seedKeywords: [],
    businessDescription: '',
    isResearching: false,
    results: null as KeywordResearchResult | null,
    selectedKeywords: [] as string[],
  },

  // Handler for research button click
  async handleResearch(
    provider: AIProvider,
    seedKeywords: string[],
    businessDescription: string,
    targetLocation?: string
  ) {
    const request: KeywordResearchRequest = {
      provider,
      seedKeywords,
      businessDescription,
      targetLocation,
      maxResults: 100,
      includeLongTail: true,
      includeNegativeKeywords: true,
    };

    const results = await researchKeywords(request);
    return results;
  },

  // Handler for adding selected keywords to ad group
  handleAddKeywordsToAdGroup(
    selectedKeywords: KeywordSuggestion[],
    adGroupId: string
  ) {
    // Convert to ad group keyword format
    const keywords = selectedKeywords.map((k) => ({
      id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: k.keyword,
      maxCpc: undefined, // Will use ad group default
    }));

    console.log(`Adding ${keywords.length} keywords to ad group ${adGroupId}`);
    return keywords;
  },

  // Handler for exporting keywords
  handleExportKeywords(keywords: KeywordSuggestion[]) {
    const csv = exportKeywordsToCsv(keywords);

    // Create download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keywords-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },
};

/**
 * Example 2: Keyword Filter and Sort UI
 *
 * Integration: Show keywords with filters and sorting
 */
export const keywordFilterExample = {
  // Filter by category
  filterByCategory(
    keywords: KeywordSuggestion[],
    category: string
  ): KeywordSuggestion[] {
    return keywords.filter((k) => k.category === category);
  },

  // Filter by relevance score
  filterByRelevance(
    keywords: KeywordSuggestion[],
    minScore: number
  ): KeywordSuggestion[] {
    return keywords.filter((k) => k.relevanceScore >= minScore);
  },

  // Filter by keyword type
  filterByType(
    keywords: KeywordSuggestion[],
    type: 'short' | 'long-tail'
  ): KeywordSuggestion[] {
    if (type === 'long-tail') {
      return keywords.filter((k) => k.isLongTail);
    } else {
      return keywords.filter((k) => !k.isLongTail);
    }
  },

  // Sort options
  sortKeywords(
    keywords: KeywordSuggestion[],
    sortBy: 'relevance' | 'alphabetical' | 'length'
  ): KeywordSuggestion[] {
    const sorted = [...keywords];

    switch (sortBy) {
      case 'relevance':
        return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);

      case 'alphabetical':
        return sorted.sort((a, b) => a.keyword.localeCompare(b.keyword));

      case 'length':
        return sorted.sort((a, b) => a.keyword.length - b.keyword.length);

      default:
        return sorted;
    }
  },

  // Get statistics
  getStatistics(keywords: KeywordSuggestion[]) {
    return {
      total: keywords.length,
      longTail: keywords.filter((k) => k.isLongTail).length,
      avgRelevance:
        keywords.reduce((sum, k) => sum + k.relevanceScore, 0) /
        keywords.length,
      byCategory: {
        commercial: keywords.filter((k) => k.category === 'commercial').length,
        local: keywords.filter((k) => k.category === 'local').length,
        informational: keywords.filter((k) => k.category === 'informational')
          .length,
        comparison: keywords.filter((k) => k.category === 'comparison').length,
        product: keywords.filter((k) => k.category === 'product').length,
      },
    };
  },
};

/**
 * Example 3: Negative Keyword Management UI
 *
 * Integration: Show suggested negative keywords with explanations
 */
export const negativeKeywordExample = {
  // Get negative keywords with explanations
  getNegativeKeywordsWithReasons(seedKeywords: string[]): Array<{
    keyword: string;
    reason: string;
  }> {
    const negatives = suggestNegativeKeywords(seedKeywords);

    return negatives.map((keyword) => {
      let reason = 'Common non-commercial term';

      if (keyword === 'free') {
        reason = 'Filters users looking for free solutions';
      } else if (['job', 'jobs', 'career'].includes(keyword)) {
        reason = 'Filters job seekers instead of customers';
      } else if (['course', 'tutorial', 'guide'].includes(keyword)) {
        reason = 'Filters users seeking educational content';
      } else if (['cheap', 'budget', 'discount'].includes(keyword)) {
        reason = 'Filters price-focused shoppers (for premium products)';
      }

      return { keyword, reason };
    });
  },

  // Handler for adding negative keywords
  handleAddNegativeKeywords(
    negativeKeywords: string[],
    adGroupId: string
  ) {
    console.log(
      `Adding ${negativeKeywords.length} negative keywords to ad group ${adGroupId}`
    );
    // In real implementation, would call store.addNegativeKeywords()
    return negativeKeywords;
  },
};

/**
 * Example 4: Copy to Clipboard with Match Types
 *
 * Integration: Quick copy button for Google Ads Editor import
 */
export const clipboardExample = {
  // Copy keywords with match type notation
  async copyToClipboard(keywords: KeywordSuggestion[]): Promise<void> {
    const formatted = formatKeywordsForClipboard(keywords);

    try {
      await navigator.clipboard.writeText(formatted);
      console.log('✓ Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: show in modal for manual copy
      alert(`Copy these keywords:\n\n${formatted}`);
    }
  },

  // Preview what will be copied
  previewClipboard(keywords: KeywordSuggestion[]): string {
    return formatKeywordsForClipboard(keywords.slice(0, 5));
  },
};

/* ==================== SAMPLE UI COMPONENT STRUCTURE ==================== */

/**
 * Example React Component Structure (Pseudo-code)
 *
 * For UI Designer: This shows how to structure the keyword research modal
 */
export const KeywordResearchModalStructure = `
// KeywordResearchModal.tsx
import { useState } from 'react';
import { useKeywordResearch } from '@/hooks/useKeywordResearch';
import type { AIProvider } from '@/services/aiService';

export function KeywordResearchModal({
  adGroupId,
  onAddKeywords,
  onClose
}) {
  const {
    research,
    isResearching,
    results,
    error,
    selectedKeywords,
    toggleKeywordSelection,
    selectAllKeywords,
    getSelectedKeywords,
    exportSelectedToCsv,
    getHighRelevanceKeywords,
    getLongTailKeywords,
  } = useKeywordResearch();

  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  const [businessDescription, setBusinessDescription] = useState('');
  const [provider, setProvider] = useState<AIProvider>('openai');

  const handleResearch = async () => {
    await research({
      provider,
      seedKeywords,
      businessDescription,
      maxResults: 100,
    });
  };

  const handleAddSelected = () => {
    const selected = getSelectedKeywords();
    onAddKeywords(selected);
    onClose();
  };

  return (
    <Modal>
      <div className="keyword-research-modal">
        {/* Input Section */}
        <section className="research-inputs">
          <h2>Keyword Research</h2>

          <div className="seed-keywords">
            <label>Seed Keywords</label>
            <input
              type="text"
              placeholder="Enter keywords (comma-separated)"
              onChange={(e) => setSeedKeywords(e.target.value.split(','))}
            />
          </div>

          <div className="business-description">
            <label>Business Description</label>
            <textarea
              placeholder="Describe your business or product..."
              onChange={(e) => setBusinessDescription(e.target.value)}
            />
          </div>

          <button onClick={handleResearch} disabled={isResearching}>
            {isResearching ? 'Researching...' : 'Research Keywords'}
          </button>
        </section>

        {/* Results Section */}
        {results && (
          <section className="research-results">
            <div className="results-header">
              <h3>Found {results.suggestions.length} Keywords</h3>
              <div className="actions">
                <button onClick={selectAllKeywords}>Select All</button>
                <button onClick={() => exportSelectedToCsv()}>Export CSV</button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
              <button>All ({results.suggestions.length})</button>
              <button>High Relevance ({getHighRelevanceKeywords().length})</button>
              <button>Long-tail ({getLongTailKeywords().length})</button>
            </div>

            {/* Keyword List */}
            <div className="keyword-list">
              {results.suggestions.map((kw) => (
                <div key={kw.keyword} className="keyword-item">
                  <input
                    type="checkbox"
                    checked={selectedKeywords.includes(kw.keyword)}
                    onChange={() => toggleKeywordSelection(kw.keyword)}
                  />
                  <span className="keyword-text">{kw.keyword}</span>
                  <span className="relevance-score">{kw.relevanceScore}</span>
                  <span className="category">{kw.category}</span>
                </div>
              ))}
            </div>

            {/* Negative Keywords */}
            {results.negativeKeywords.length > 0 && (
              <div className="negative-keywords">
                <h4>Suggested Negative Keywords</h4>
                <div className="negative-list">
                  {results.negativeKeywords.map((neg) => (
                    <span key={neg} className="negative-badge">{neg}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Footer Actions */}
        <footer className="modal-footer">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleAddSelected}
            disabled={selectedKeywords.length === 0}
          >
            Add {selectedKeywords.length} Keywords
          </button>
        </footer>
      </div>
    </Modal>
  );
}
`;

/* ==================== REAL-WORLD EXAMPLES ==================== */

/**
 * Example: E-commerce Product Campaign
 */
export async function ecommerceExample() {
  const results = await fullAIResearch(
    'openai',
    ['organic dog food', 'natural pet food'],
    'Premium organic dog food brand with free shipping nationwide',
    'United States'
  );

  console.log('\n=== E-commerce Campaign Keywords ===');
  console.log(`Total keywords: ${results.suggestions.length}`);
  console.log(
    `Commercial intent keywords: ${results.suggestions.filter((k) => k.category === 'commercial').length}`
  );
  console.log(`Top 5 keywords:`);
  results.suggestions.slice(0, 5).forEach((k, i) => {
    console.log(
      `${i + 1}. ${k.keyword} (score: ${k.relevanceScore}, category: ${k.category})`
    );
  });
}

/**
 * Example: Local Service Business
 */
export async function localServiceExample() {
  const results = await fullAIResearch(
    'openai',
    ['emergency plumber', 'plumbing repair'],
    '24/7 emergency plumbing service serving Boston and surrounding areas',
    'Boston'
  );

  console.log('\n=== Local Service Keywords ===');
  console.log(`Total keywords: ${results.suggestions.length}`);
  console.log(
    `Local keywords: ${results.suggestions.filter((k) => k.category === 'local').length}`
  );
  console.log(`Long-tail keywords: ${results.longTailVariations.length}`);
  console.log(`Negative keywords: ${results.negativeKeywords.length}`);
}

/**
 * Example: B2B SaaS Product
 */
export async function b2bSaasExample() {
  const results = await fullAIResearch(
    'openai',
    ['project management software', 'team collaboration tool'],
    'Cloud-based project management platform for remote teams',
    'Worldwide'
  );

  console.log('\n=== B2B SaaS Keywords ===');
  console.log(`Total keywords: ${results.suggestions.length}`);
  console.log(
    `High-relevance (70+): ${results.suggestions.filter((k) => k.relevanceScore >= 70).length}`
  );
  console.log(`Top keyword: ${results.suggestions[0].keyword}`);
}

export default {
  fullAIResearch,
  expansionOnlyResearch,
  hybridResearch,
  adGroupKeywordResearchExample,
  keywordFilterExample,
  negativeKeywordExample,
  clipboardExample,
};
