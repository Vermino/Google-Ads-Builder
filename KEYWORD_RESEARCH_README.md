# Keyword Research Feature - Documentation

## Overview

The Keyword Research feature provides comprehensive keyword discovery, analysis, and management capabilities for Google Ads campaigns. It combines AI-powered suggestions with intelligent keyword expansion algorithms to help users build effective keyword lists.

## Architecture

```
src/
├── services/
│   ├── keywordResearchService.ts       # Core service (900+ lines)
│   ├── keywordResearchService.test.ts  # Unit tests & examples
│   └── keywordResearchService.demo.ts  # Integration examples
└── hooks/
    └── useKeywordResearch.ts           # React hook for UI integration
```

## Features

### 1. AI-Powered Keyword Generation ✨

Uses existing OpenAI/Claude integration to generate contextually relevant keywords based on:
- Seed keywords
- Business description
- Target location
- Industry context

**Example:**
```typescript
const results = await researchKeywords({
  provider: 'openai',
  seedKeywords: ['emergency plumber', 'plumbing repair'],
  businessDescription: '24/7 emergency plumbing service in Boston',
  targetLocation: 'Boston',
  maxResults: 100,
});

console.log(results.suggestions.length); // ~100 keywords
```

### 2. Keyword Expansion (No AI Required) 🚀

Generates keyword variations using proven modifiers:
- **Prefix modifiers**: best, top, cheap, affordable, premium, professional, etc.
- **Suffix modifiers**: near me, online, delivery, service, company, shop, etc.
- **Intent modifiers**: buy, order, hire, get, find, compare, etc.
- **Question modifiers**: how to, what is, where to, best way to, etc.

**Example:**
```typescript
const expanded = expandKeywords(['plumber']);
// Returns: ['best plumber', 'plumber near me', 'hire plumber', ...]
```

### 3. Long-Tail Keyword Generation 📊

Creates specific, high-intent long-tail variations (3-5 words):
- Temporal variations (2025, current year)
- Location-based (in Boston, near me, nearby)
- Commercial intent (buy X online, order X near me)
- Problem-solving (how to choose X, X guide)
- Urgency-based (emergency X, same day X, 24/7 X)

**Example:**
```typescript
const longTail = generateLongTailKeywords('plumber', 'Boston');
// Returns: ['emergency plumber in boston', 'best plumber in boston 2025', ...]
```

### 4. Negative Keyword Suggestions 🚫

Intelligently suggests negative keywords to filter unwanted traffic:
- Common negatives (free, diy, job, career, tutorial)
- Context-specific (cheap, budget for premium products)
- Industry-specific (job, salary for service businesses)

**Example:**
```typescript
const negatives = suggestNegativeKeywords(['premium dog food']);
// Returns: ['free', 'cheap', 'diy', 'job', 'tutorial', ...]
```

### 5. Keyword Relevance Scoring 🎯

Scores keywords 0-100 based on:
- Exact match with business description (30 points)
- Word overlap with context (5 points per word)
- Optimal length 2-4 words (10 points)
- Commercial intent indicators (15 points)
- Location relevance (10 points)
- Penalties for informational keywords (-10 points)

**Example:**
```typescript
const score = scoreKeywordRelevance(
  'emergency plumber near me',
  'Local 24/7 emergency plumbing service',
  'Boston'
);
// Returns: ~85 (high relevance)
```

### 6. Match Type Recommendations 🎲

Automatically recommends appropriate match types:
- **Exact match**: Always enabled for all keywords
- **Phrase match**: Always enabled for all keywords
- **Broad match**: Only enabled for 1-2 word keywords (cost control)

### 7. Keyword Categorization 🏷️

Automatically categorizes keywords:
- **commercial**: High purchase intent (buy, hire, order)
- **local**: Location-based searches (near me, in [city])
- **informational**: Question-based (how to, what is)
- **comparison**: Comparative searches (best, vs, compare)
- **product**: Generic product/service terms

## API Reference

### Main Functions

#### `researchKeywords(request: KeywordResearchRequest): Promise<KeywordResearchResult>`

Performs comprehensive keyword research combining AI generation and expansion.

**Parameters:**
```typescript
interface KeywordResearchRequest {
  provider: 'openai' | 'claude';
  seedKeywords: string[];
  businessDescription?: string;
  targetLocation?: string;
  language?: string;
  maxResults?: number;
  includeLongTail?: boolean;
  includeNegativeKeywords?: boolean;
}
```

**Returns:**
```typescript
interface KeywordResearchResult {
  suggestions: KeywordSuggestion[];
  relatedTerms: string[];
  longTailVariations: string[];
  negativeKeywords: string[];
  researchedAt: string;
  provider: AIProvider;
}
```

#### `expandKeywords(seedKeywords: string[], maxVariations?: number): string[]`

Expands seed keywords with modifiers (no AI required).

#### `generateLongTailKeywords(baseKeyword: string, location?: string): string[]`

Generates long-tail keyword variations.

#### `suggestNegativeKeywords(keywords: string[], businessType?: string): string[]`

Suggests negative keywords for filtering unwanted traffic.

#### `scoreKeywordRelevance(keyword: string, businessContext: string, targetLocation?: string): number`

Scores keyword relevance 0-100 based on business context.

### Utility Functions

#### `exportKeywordsToCsv(keywords: KeywordSuggestion[]): string`

Exports keywords to CSV format for download.

#### `formatKeywordsForClipboard(keywords: KeywordSuggestion[]): string`

Formats keywords with match type notation for Google Ads Editor import.

## React Hook Usage

### `useKeywordResearch()`

React hook providing state management and utilities for keyword research.

**Example:**
```typescript
import { useKeywordResearch } from '@/hooks/useKeywordResearch';

function KeywordResearchModal() {
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
  } = useKeywordResearch();

  const handleResearch = async () => {
    await research({
      provider: 'openai',
      seedKeywords: ['plumbing', 'emergency plumber'],
      businessDescription: 'Local plumbing service',
      targetLocation: 'Boston',
      maxResults: 100,
    });
  };

  return (
    <div>
      <button onClick={handleResearch} disabled={isResearching}>
        Research Keywords
      </button>
      {error && <div className="error">{error}</div>}
      {results && (
        <div>
          <h3>Found {results.suggestions.length} keywords</h3>
          {results.suggestions.map((kw) => (
            <div key={kw.keyword}>
              <input
                type="checkbox"
                checked={selectedKeywords.includes(kw.keyword)}
                onChange={() => toggleKeywordSelection(kw.keyword)}
              />
              {kw.keyword} (Score: {kw.relevanceScore})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Integration Guide

### Step 1: Add Research Button to Ad Group Builder

```typescript
// In AdGroupBuilder.tsx or KeywordManager.tsx
import { useState } from 'react';
import { KeywordResearchModal } from '@/components/keyword-research/KeywordResearchModal';

function AdGroupBuilder() {
  const [showResearchModal, setShowResearchModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowResearchModal(true)}>
        Research Keywords
      </button>

      {showResearchModal && (
        <KeywordResearchModal
          adGroupId={adGroup.id}
          onAddKeywords={handleAddKeywords}
          onClose={() => setShowResearchModal(false)}
        />
      )}
    </div>
  );
}
```

### Step 2: Create Keyword Research Modal Component

See `keywordResearchService.demo.ts` for complete component structure example.

Key sections:
1. **Input Section**: Seed keywords, business description, AI provider selection
2. **Results Section**: Keyword list with checkboxes, relevance scores, categories
3. **Filter Section**: Filter by category, relevance score, long-tail vs short
4. **Negative Keywords Section**: Display suggested negative keywords
5. **Action Buttons**: Export CSV, Copy to clipboard, Add to ad group

### Step 3: Handle Adding Keywords to Ad Group

```typescript
const handleAddKeywords = (keywords: KeywordSuggestion[]) => {
  // Convert to ad group keyword format
  const adGroupKeywords = keywords.map(k => ({
    id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: k.keyword,
    maxCpc: undefined, // Use ad group default
  }));

  // Add to store
  adGroupKeywords.forEach(keyword => {
    useCampaignStore.getState().addKeyword(
      campaignId,
      adGroupId,
      keyword
    );
  });
};
```

## Usage Examples

### Example 1: E-commerce Product Campaign

```typescript
const results = await researchKeywords({
  provider: 'openai',
  seedKeywords: ['organic dog food', 'natural pet food'],
  businessDescription: 'Premium organic dog food brand with free shipping',
  targetLocation: 'United States',
  maxResults: 100,
});

// Filter commercial intent keywords
const commercialKeywords = results.suggestions.filter(
  k => k.category === 'commercial'
);
```

### Example 2: Local Service Business

```typescript
const results = await researchKeywords({
  provider: 'openai',
  seedKeywords: ['emergency plumber', 'plumbing repair'],
  businessDescription: '24/7 emergency plumbing service',
  targetLocation: 'Boston',
  maxResults: 100,
});

// Get high-relevance local keywords
const localKeywords = results.suggestions.filter(
  k => k.category === 'local' && k.relevanceScore >= 70
);
```

### Example 3: Expansion-Only (No AI)

```typescript
// When AI is not configured or you want instant results
const seedKeywords = ['dog food', 'pet supplies'];

// Expand with modifiers
const expanded = expandKeywords(seedKeywords, 20);

// Generate long-tail
const longTail = seedKeywords.flatMap(kw =>
  generateLongTailKeywords(kw, 'New York')
);

// Combine and score
const allKeywords = [...expanded, ...longTail];
const scored = allKeywords.map(keyword => ({
  keyword,
  relevanceScore: scoreKeywordRelevance(
    keyword,
    'Pet supplies store in New York'
  ),
}));
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const results = await researchKeywords(request);
} catch (error) {
  if (error instanceof KeywordResearchError) {
    switch (error.code) {
      case 'AI_ERROR':
        // AI service failed, try expansion-only fallback
        break;
      case 'PROVIDER_NOT_CONFIGURED':
        // Show message to configure API key
        break;
      case 'NO_RESULTS':
        // Suggest trying different seed keywords
        break;
    }
  }
}
```

## Performance Considerations

### AI Credits Usage

- Each `researchKeywords()` call makes **2 AI API calls** (headlines + descriptions equivalent)
- Consider using expansion-only mode for instant results without API costs
- Implement caching for frequently researched seed keywords

### Optimization Tips

1. **Use expansion-only for quick research**: No AI required, instant results
2. **Limit maxResults**: Default 100 is good, higher values increase processing time
3. **Cache results**: Store research results in localStorage for session persistence
4. **Debounce research calls**: If triggered by user typing, debounce by 500ms

## Testing

Run tests:
```bash
npm test keywordResearchService.test.ts
```

View examples:
```bash
npm run demo:keywords
```

## Future Enhancements

### Planned Features

1. **Search Volume Data**: Integration with Google Keyword Planner API (when authenticated)
2. **CPC Estimates**: Real-time cost-per-click estimates via API
3. **Competition Analysis**: Keyword difficulty scoring
4. **Trend Analysis**: Seasonal keyword trends
5. **Keyword Grouping**: Automatic ad group suggestions based on keyword themes
6. **Performance Predictions**: Estimated impressions/clicks based on historical data

### API Integration Points

The service includes placeholders for future API integration:
- `estimatedCPC`: Will populate from Google Keyword Planner API
- `competition`: Will populate from API (Low/Medium/High)
- `searchVolume`: Will populate from API

## Troubleshooting

### Common Issues

**Issue**: "Provider not configured" error
- **Solution**: Add OpenAI or Claude API key to `.env.local`

**Issue**: No keywords generated
- **Solution**: Try different seed keywords or use expansion-only mode

**Issue**: Low relevance scores
- **Solution**: Provide more detailed business description for better context matching

**Issue**: AI request timeout
- **Solution**: Reduce maxResults or try again (API may be experiencing high load)

## Support & Documentation

- **Service Documentation**: See JSDoc comments in `keywordResearchService.ts`
- **Integration Examples**: See `keywordResearchService.demo.ts`
- **Unit Tests**: See `keywordResearchService.test.ts`
- **React Hook**: See `useKeywordResearch.ts`

## Summary

The Keyword Research feature provides:
- ✅ AI-powered keyword generation (OpenAI/Claude)
- ✅ Intelligent keyword expansion (no AI required)
- ✅ Long-tail keyword variations
- ✅ Negative keyword suggestions
- ✅ Relevance scoring algorithm
- ✅ Match type recommendations
- ✅ Automatic categorization
- ✅ CSV export
- ✅ Clipboard copy with match types
- ✅ React hook for easy UI integration
- ✅ Comprehensive error handling
- ✅ Full TypeScript support
- ✅ Extensive documentation

**Total Lines of Code**: 900+ lines (service) + 250+ lines (hook) + tests + examples

Ready for UI integration by the UI Designer!
