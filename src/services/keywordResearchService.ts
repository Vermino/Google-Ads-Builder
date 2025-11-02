/**
 * Keyword Research Service for Google Ads Campaign Builder
 *
 * Provides AI-powered keyword research, expansion, and analysis capabilities
 * for Google Ads campaigns via backend API.
 *
 * NOTE: This service now uses the backend API instead of direct OpenAI/Claude calls.
 * API keys are stored securely on the server.
 *
 * Features:
 * - AI-powered keyword suggestions via backend API
 * - Keyword expansion with modifiers (prefixes, suffixes, intents)
 * - Long-tail keyword variation generation
 * - Negative keyword suggestions
 * - Keyword relevance scoring
 * - Match type recommendations
 *
 * @module keywordResearchService
 */

import { apiClient, isAPIConfigured } from './apiClient';
import { AIServiceError } from './aiService';
import type { AIProvider } from './aiService';

/* ==================== TYPE DEFINITIONS ==================== */

/**
 * Match types available for Google Ads keywords
 */
export interface MatchTypeSettings {
  /** Exact match - [keyword] */
  exact: boolean;
  /** Phrase match - "keyword" */
  phrase: boolean;
  /** Broad match - keyword */
  broad: boolean;
}

/**
 * Individual keyword suggestion with metadata
 */
export interface KeywordSuggestion {
  /** The keyword text */
  keyword: string;

  /** Recommended match types for this keyword */
  matchTypes: MatchTypeSettings;

  /** Relevance score 0-100 based on business context */
  relevanceScore: number;

  /** Estimated CPC (placeholder for future API integration) */
  estimatedCPC?: number;

  /** Competition level (placeholder for future API integration) */
  competition?: 'Low' | 'Medium' | 'High';

  /** Keyword category (e.g., 'brand', 'product', 'problem-solving') */
  category?: string;

  /** Search volume estimate (placeholder for future API integration) */
  searchVolume?: number;

  /** Whether this is a long-tail keyword (3+ words) */
  isLongTail: boolean;
}

/**
 * Request parameters for keyword research
 */
export interface KeywordResearchRequest {
  /** AI provider to use for keyword generation */
  provider: AIProvider;

  /** Initial seed keywords to expand from */
  seedKeywords: string[];

  /** Business description for context */
  businessDescription?: string;

  /** Target geographic location */
  targetLocation?: string;

  /** Target language (default: 'en') */
  language?: string;

  /** Maximum number of keyword suggestions to return */
  maxResults?: number;

  /** Include long-tail variations (default: true) */
  includeLongTail?: boolean;

  /** Include negative keyword suggestions (default: true) */
  includeNegativeKeywords?: boolean;
}

/**
 * Complete keyword research results
 */
export interface KeywordResearchResult {
  /** Primary keyword suggestions with scores and metadata */
  suggestions: KeywordSuggestion[];

  /** Related search terms */
  relatedTerms: string[];

  /** Long-tail keyword variations */
  longTailVariations: string[];

  /** Suggested negative keywords to filter unwanted traffic */
  negativeKeywords: string[];

  /** Timestamp when research was performed */
  researchedAt: string;

  /** Provider used for AI generation */
  provider: AIProvider;
}

/**
 * Keyword research error codes
 */
export type KeywordResearchErrorCode =
  | 'AI_ERROR'
  | 'INVALID_REQUEST'
  | 'NO_RESULTS'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'UNKNOWN_ERROR';

/**
 * Custom error class for keyword research errors
 */
export class KeywordResearchError extends Error {
  code: KeywordResearchErrorCode;
  details?: any;

  constructor(
    code: KeywordResearchErrorCode,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'KeywordResearchError';
    this.code = code;
    this.details = details;
  }
}

/* ==================== KEYWORD MODIFIERS (Client-side helpers) ==================== */

/**
 * Prefix modifiers to create keyword variations
 */
const KEYWORD_PREFIXES = [
  'best',
  'top',
  'cheap',
  'affordable',
  'premium',
  'professional',
  'local',
  'certified',
  'expert',
  'quality',
  'reliable',
  'trusted',
  'leading',
  'rated',
  'recommended',
];

/**
 * Suffix modifiers to create keyword variations
 */
const KEYWORD_SUFFIXES = [
  'online',
  'near me',
  'delivery',
  'service',
  'services',
  'company',
  'companies',
  'shop',
  'store',
  'provider',
  'providers',
  'specialist',
  'specialists',
  'expert',
  'experts',
  'agency',
];

/**
 * Intent-based modifiers for commercial keywords
 */
const INTENT_MODIFIERS = [
  'buy',
  'order',
  'purchase',
  'hire',
  'get',
  'find',
  'compare',
  'search for',
  'looking for',
  'need',
  'want',
  'book',
  'schedule',
  'request',
];

/**
 * Question-based modifiers for informational searches
 */
const QUESTION_MODIFIERS = [
  'how to',
  'how do i',
  'how can i',
  'what is',
  'what are',
  'where to',
  'where can i',
  'why',
  'when to',
  'when should i',
  'which',
  'best way to',
];

/* ==================== KEYWORD EXPANSION (Local fallback) ==================== */

/**
 * Expand seed keywords with modifiers to create variations
 *
 * Creates keyword variations by adding:
 * - Prefix modifiers (best, top, cheap, etc.)
 * - Suffix modifiers (near me, online, service, etc.)
 * - Intent modifiers (buy, hire, order, etc.)
 * - Question modifiers (how to, what is, etc.)
 *
 * @param seedKeywords - Initial keywords to expand
 * @param maxVariations - Maximum variations to generate per keyword (default: 20)
 * @returns Array of expanded keyword variations
 *
 * @example
 * ```typescript
 * const expanded = expandKeywords(['dog food']);
 * // Returns: ['best dog food', 'dog food online', 'buy dog food', etc.]
 * ```
 */
export function expandKeywords(
  seedKeywords: string[],
  maxVariations: number = 20
): string[] {
  const variations: string[] = [];

  for (const keyword of seedKeywords) {
    const keywordLower = keyword.toLowerCase().trim();

    // Add prefix variations
    for (const prefix of KEYWORD_PREFIXES.slice(0, 5)) {
      variations.push(`${prefix} ${keywordLower}`);
    }

    // Add suffix variations
    for (const suffix of KEYWORD_SUFFIXES.slice(0, 5)) {
      variations.push(`${keywordLower} ${suffix}`);
    }

    // Add intent-based variations
    for (const intent of INTENT_MODIFIERS.slice(0, 5)) {
      variations.push(`${intent} ${keywordLower}`);
    }

    // Add question-based variations (selective)
    for (const question of QUESTION_MODIFIERS.slice(0, 3)) {
      variations.push(`${question} ${keywordLower}`);
    }

    // Add the original keyword
    variations.push(keywordLower);
  }

  // Remove duplicates, sort, and limit results
  const unique = Array.from(new Set(variations));
  return unique.slice(0, maxVariations * seedKeywords.length);
}

/* ==================== LONG-TAIL KEYWORD GENERATION ==================== */

/**
 * Generate long-tail keyword variations (3+ words)
 *
 * Long-tail keywords are more specific, have lower competition,
 * and often convert better than short keywords.
 *
 * @param baseKeyword - Base keyword to create long-tail variations from
 * @param location - Optional location for local variations
 * @returns Array of long-tail keyword variations
 *
 * @example
 * ```typescript
 * const longTail = generateLongTailKeywords('plumber', 'Boston');
 * // Returns: ['emergency plumber near Boston', 'best plumber in Boston 2025', etc.]
 * ```
 */
export function generateLongTailKeywords(
  baseKeyword: string,
  location?: string
): string[] {
  const longTail: string[] = [];
  const keyword = baseKeyword.toLowerCase().trim();

  // Temporal variations
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  longTail.push(`${keyword} ${currentYear}`);
  longTail.push(`${keyword} ${nextYear}`);
  longTail.push(`best ${keyword} ${currentYear}`);

  // Location-based variations
  if (location) {
    longTail.push(`${keyword} in ${location}`);
    longTail.push(`${keyword} near ${location}`);
    longTail.push(`best ${keyword} in ${location}`);
    longTail.push(`top ${keyword} ${location}`);
    longTail.push(`${keyword} ${location} area`);
    longTail.push(`affordable ${keyword} ${location}`);
  }

  // Generic location variations (always useful)
  longTail.push(`${keyword} near me`);
  longTail.push(`${keyword} in my area`);
  longTail.push(`${keyword} nearby`);
  longTail.push(`local ${keyword} service`);
  longTail.push(`${keyword} online delivery`);

  // Comparative long-tail
  longTail.push(`best ${keyword} for the money`);
  longTail.push(`top rated ${keyword}`);
  longTail.push(`${keyword} comparison`);
  longTail.push(`${keyword} vs alternatives`);
  longTail.push(`${keyword} reviews and ratings`);

  // Problem-solving long-tail
  longTail.push(`how to choose ${keyword}`);
  longTail.push(`${keyword} buying guide`);
  longTail.push(`${keyword} tips and tricks`);
  longTail.push(`what to look for in ${keyword}`);

  // Commercial intent long-tail
  longTail.push(`buy ${keyword} online`);
  longTail.push(`order ${keyword} near me`);
  longTail.push(`${keyword} for sale`);
  longTail.push(`${keyword} price comparison`);
  longTail.push(`cheap ${keyword} online`);
  longTail.push(`affordable ${keyword} service`);
  longTail.push(`${keyword} cost estimate`);
  longTail.push(`${keyword} quote online`);

  // Urgency-based long-tail
  longTail.push(`emergency ${keyword}`);
  longTail.push(`same day ${keyword}`);
  longTail.push(`24/7 ${keyword}`);
  longTail.push(`urgent ${keyword} service`);

  // Quality-focused long-tail
  longTail.push(`professional ${keyword} service`);
  longTail.push(`certified ${keyword} provider`);
  longTail.push(`licensed ${keyword}`);
  longTail.push(`experienced ${keyword}`);

  return longTail;
}

/* ==================== NEGATIVE KEYWORD SUGGESTIONS ==================== */

/**
 * Suggest negative keywords to filter unwanted traffic
 *
 * Negative keywords prevent ads from showing for irrelevant searches,
 * improving ROI by filtering out users with no purchase intent.
 *
 * @param keywords - Primary keywords being targeted
 * @param businessType - Optional business type for context-specific negatives
 * @returns Array of suggested negative keywords
 *
 * @example
 * ```typescript
 * const negatives = suggestNegativeKeywords(
 *   ['premium dog food', 'organic dog treats'],
 *   'ecommerce'
 * );
 * // Returns: ['free', 'diy', 'cheap', 'job', 'salary', etc.]
 * ```
 */
export function suggestNegativeKeywords(
  keywords: string[],
  businessType?: string
): string[] {
  const negatives: string[] = [];

  // Common negative keywords for all businesses
  const commonNegatives = [
    'free',
    'diy',
    'homemade',
    'job',
    'jobs',
    'career',
    'careers',
    'salary',
    'course',
    'courses',
    'class',
    'classes',
    'training',
    'tutorial',
    'tutorials',
    'wikipedia',
    'definition',
    'meaning',
    'how to become',
    'resume',
    'internship',
    'volunteer',
    'donate',
    'donation',
    'charity',
  ];

  // Analyze seed keywords for context
  const keywordText = keywords.join(' ').toLowerCase();

  // Premium/Professional businesses - exclude cheap seekers
  if (
    keywordText.includes('premium') ||
    keywordText.includes('professional') ||
    keywordText.includes('luxury') ||
    keywordText.includes('high-end')
  ) {
    negatives.push(
      'cheap',
      'cheapest',
      'budget',
      'discount',
      'clearance',
      'used',
      'secondhand',
      'bargain'
    );
  }

  // Product/Ecommerce businesses - exclude info seekers
  if (
    keywordText.includes('buy') ||
    keywordText.includes('purchase') ||
    keywordText.includes('shop') ||
    businessType === 'ecommerce'
  ) {
    negatives.push(
      'free download',
      'torrent',
      'crack',
      'pirate',
      'review',
      'reviews',
      'comparison',
      'vs',
      'versus'
    );
  }

  // Service businesses - exclude job seekers
  if (
    keywordText.includes('hire') ||
    keywordText.includes('service') ||
    businessType === 'service'
  ) {
    negatives.push(
      'job',
      'jobs',
      'employment',
      'career',
      'salary',
      'wage',
      'hiring',
      'apply',
      'application',
      'cv',
      'resume'
    );
  }

  // Software/Tech businesses - exclude learning resources
  if (
    keywordText.includes('software') ||
    keywordText.includes('app') ||
    keywordText.includes('platform')
  ) {
    negatives.push(
      'tutorial',
      'course',
      'learn',
      'guide',
      'how to',
      'certification',
      'exam'
    );
  }

  // Add common negatives
  negatives.push(...commonNegatives);

  // Remove duplicates and return
  return Array.from(new Set(negatives));
}

/* ==================== KEYWORD RELEVANCE SCORING ==================== */

/**
 * Score keyword relevance based on business context
 *
 * Scoring factors:
 * - Exact match with business description (30 points)
 * - Word overlap with business context (5 points per word)
 * - Optimal keyword length 2-4 words (10 points)
 * - Commercial intent indicators (15 points)
 * - Location match if applicable (10 points)
 *
 * @param keyword - The keyword to score
 * @param businessContext - Business description for context
 * @param targetLocation - Optional target location
 * @returns Relevance score 0-100
 *
 * @example
 * ```typescript
 * const score = scoreKeywordRelevance(
 *   'emergency plumber near me',
 *   'Local 24/7 emergency plumbing service',
 *   'Boston'
 * );
 * // Returns: ~85 (high relevance)
 * ```
 */
export function scoreKeywordRelevance(
  keyword: string,
  businessContext: string,
  targetLocation?: string
): number {
  let score = 50; // Base score

  const keywordLower = keyword.toLowerCase().trim();
  const contextLower = businessContext.toLowerCase();

  // 1. Exact phrase match in business context
  if (contextLower.includes(keywordLower)) {
    score += 30;
  }

  // 2. Word overlap scoring
  const keywordWords = keywordLower.split(' ').filter((w) => w.length > 2);
  const contextWords = contextLower.split(' ').filter((w) => w.length > 2);
  const overlap = keywordWords.filter((w) => contextWords.includes(w)).length;
  score += overlap * 5;

  // 3. Optimal length bonus (2-4 words is ideal)
  const wordCount = keywordWords.length;
  if (wordCount >= 2 && wordCount <= 4) {
    score += 10;
  } else if (wordCount === 1) {
    score -= 5; // Penalize single words (too broad)
  } else if (wordCount > 5) {
    score -= 5; // Penalize very long keywords (too specific)
  }

  // 4. Commercial intent scoring
  const commercialWords = [
    'buy',
    'order',
    'purchase',
    'hire',
    'get',
    'service',
    'book',
    'schedule',
    'quote',
    'estimate',
  ];
  const hasCommercialIntent = commercialWords.some((w) =>
    keywordLower.includes(w)
  );
  if (hasCommercialIntent) {
    score += 15;
  }

  // 5. Location relevance
  if (targetLocation) {
    const locationLower = targetLocation.toLowerCase();
    if (
      keywordLower.includes(locationLower) ||
      keywordLower.includes('near me') ||
      keywordLower.includes('local') ||
      keywordLower.includes('nearby')
    ) {
      score += 10;
    }
  }

  // 6. Penalty for question-based keywords (lower commercial intent)
  if (
    keywordLower.startsWith('how to') ||
    keywordLower.startsWith('what is') ||
    keywordLower.startsWith('why')
  ) {
    score -= 10;
  }

  // Cap at 100
  return Math.min(Math.max(score, 0), 100);
}

/* ==================== MATCH TYPE RECOMMENDATIONS ==================== */

/**
 * Recommend match types for a keyword based on characteristics
 *
 * Rules:
 * - Exact match: Always enabled for all keywords
 * - Phrase match: Always enabled for all keywords
 * - Broad match: Only for 1-2 word keywords to control costs
 *
 * @param keyword - The keyword to analyze
 * @returns Recommended match type settings
 */
function recommendMatchTypes(keyword: string): MatchTypeSettings {
  const wordCount = keyword.trim().split(' ').length;

  return {
    exact: true, // Always enable exact match
    phrase: true, // Always enable phrase match
    broad: wordCount <= 2, // Only broad match for short keywords
  };
}

/* ==================== KEYWORD CATEGORIZATION ==================== */

/**
 * Categorize a keyword based on its characteristics
 *
 * Categories:
 * - brand: Contains brand-specific terms
 * - product: Product or service names
 * - commercial: High purchase intent
 * - informational: Question-based or learning intent
 * - local: Location-based searches
 * - comparison: Comparative searches
 *
 * @param keyword - The keyword to categorize
 * @returns Keyword category
 */
function categorizeKeyword(keyword: string): string {
  const lower = keyword.toLowerCase();

  // Check for question/informational keywords
  if (
    lower.startsWith('how to') ||
    lower.startsWith('what is') ||
    lower.startsWith('why') ||
    lower.includes('guide') ||
    lower.includes('tutorial')
  ) {
    return 'informational';
  }

  // Check for local keywords
  if (
    lower.includes('near me') ||
    lower.includes('nearby') ||
    lower.includes('local') ||
    lower.includes('in my area')
  ) {
    return 'local';
  }

  // Check for comparison keywords
  if (
    lower.includes('vs') ||
    lower.includes('versus') ||
    lower.includes('compare') ||
    lower.includes('best') ||
    lower.includes('top')
  ) {
    return 'comparison';
  }

  // Check for commercial keywords
  if (
    lower.includes('buy') ||
    lower.includes('order') ||
    lower.includes('purchase') ||
    lower.includes('hire') ||
    lower.includes('book')
  ) {
    return 'commercial';
  }

  // Default to product category
  return 'product';
}

/* ==================== MAIN RESEARCH FUNCTION ==================== */

/**
 * Perform comprehensive keyword research via backend API
 *
 * This is the main entry point for keyword research. It uses the backend API
 * for AI-powered keyword generation and combines it with local expansion.
 *
 * @param request - Keyword research request parameters
 * @returns Complete keyword research results
 *
 * @throws {KeywordResearchError} If research fails
 *
 * @example
 * ```typescript
 * const results = await researchKeywords({
 *   provider: 'openai',
 *   seedKeywords: ['emergency plumber', 'plumbing repair'],
 *   businessDescription: '24/7 emergency plumbing service in Boston',
 *   targetLocation: 'Boston',
 *   maxResults: 100,
 *   includeLongTail: true,
 *   includeNegativeKeywords: true,
 * });
 *
 * console.log('Found', results.suggestions.length, 'keywords');
 * console.log('Top keyword:', results.suggestions[0].keyword);
 * console.log('Relevance:', results.suggestions[0].relevanceScore);
 * ```
 */
export async function researchKeywords(
  request: KeywordResearchRequest
): Promise<KeywordResearchResult> {
  try {
    // Validate request
    if (!request.seedKeywords || request.seedKeywords.length === 0) {
      throw new KeywordResearchError(
        'INVALID_REQUEST',
        'At least one seed keyword is required'
      );
    }

    // Check if API is configured
    if (!isAPIConfigured()) {
      throw new KeywordResearchError(
        'AI_ERROR',
        'API not configured. Please check your environment variables (.env.local).'
      );
    }

    const {
      seedKeywords,
      businessDescription = '',
      targetLocation,
      maxResults = 100,
      includeLongTail = true,
      includeNegativeKeywords = true,
    } = request;

    // 1. Call backend API for AI-powered keyword research
    let apiKeywords: string[] = [];
    let apiRelatedTerms: string[] = [];
    let apiLongTailVariations: string[] = [];
    let apiNegativeKeywords: string[] = [];

    try {
      const response = await apiClient.researchKeywords({
        provider: request.provider,
        seedKeywords,
        businessDescription,
        targetLocation,
        language: request.language,
        maxResults,
        includeLongTail,
        includeNegativeKeywords,
      });

      // Extract API results
      apiKeywords = response.suggestions?.map(s => s.keyword) || [];
      apiRelatedTerms = response.relatedTerms || [];
      apiLongTailVariations = response.longTailVariations || [];
      apiNegativeKeywords = response.negativeKeywords || [];
    } catch (error) {
      // If API fails, continue with local expansion only
      console.warn('API keyword research failed, using local expansion only:', error);
    }

    // 2. Expand seed keywords locally (as fallback/supplement)
    const expandedKeywords = expandKeywords(seedKeywords, 20);

    // 3. Generate long-tail variations locally
    const longTailKeywords: string[] = [];
    if (includeLongTail) {
      for (const keyword of seedKeywords) {
        longTailKeywords.push(...generateLongTailKeywords(keyword, targetLocation));
      }
    }

    // 4. Combine all keyword sources and deduplicate
    const allKeywords = [
      ...apiKeywords,
      ...expandedKeywords,
      ...longTailKeywords,
      ...seedKeywords,
    ];

    const uniqueKeywords = Array.from(new Set(allKeywords.map((k) => k.toLowerCase())));

    // 5. Score and filter keywords
    const scoredKeywords: KeywordSuggestion[] = uniqueKeywords
      .map((keyword) => {
        const relevanceScore = scoreKeywordRelevance(
          keyword,
          businessDescription,
          targetLocation
        );

        return {
          keyword,
          matchTypes: recommendMatchTypes(keyword),
          relevanceScore,
          category: categorizeKeyword(keyword),
          isLongTail: keyword.split(' ').length >= 3,
        };
      })
      .filter((k) => k.relevanceScore >= 40) // Filter low-relevance keywords
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
      .slice(0, maxResults); // Limit results

    // 6. Generate related terms (top 20 keywords)
    const relatedTerms = Array.from(new Set([
      ...apiRelatedTerms,
      ...scoredKeywords
        .filter((k) => !k.isLongTail)
        .slice(0, 20)
        .map((k) => k.keyword)
    ])).slice(0, 20);

    // 7. Extract long-tail variations
    const longTailVariations = Array.from(new Set([
      ...apiLongTailVariations,
      ...scoredKeywords
        .filter((k) => k.isLongTail)
        .slice(0, 50)
        .map((k) => k.keyword)
    ])).slice(0, 50);

    // 8. Generate negative keywords
    const negativeKeywords = includeNegativeKeywords
      ? Array.from(new Set([
          ...apiNegativeKeywords,
          ...suggestNegativeKeywords(seedKeywords)
        ]))
      : [];

    // 9. Validate results
    if (scoredKeywords.length === 0) {
      throw new KeywordResearchError(
        'NO_RESULTS',
        'No relevant keywords found. Try different seed keywords or business description.'
      );
    }

    // 10. Return complete results
    return {
      suggestions: scoredKeywords,
      relatedTerms,
      longTailVariations,
      negativeKeywords,
      researchedAt: new Date().toISOString(),
      provider: request.provider,
    };
  } catch (error: any) {
    // Handle errors
    if (error instanceof KeywordResearchError) {
      throw error;
    }

    if (error instanceof AIServiceError) {
      throw new KeywordResearchError(
        'AI_ERROR',
        'Failed to generate keyword suggestions using AI',
        error
      );
    }

    throw new KeywordResearchError(
      'UNKNOWN_ERROR',
      'Keyword research failed unexpectedly',
      error
    );
  }
}

/* ==================== UTILITY FUNCTIONS ==================== */

/**
 * Format error message for user display
 * @param error - The error to format
 * @returns User-friendly error message
 */
export function formatKeywordResearchError(error: unknown): string {
  if (error instanceof KeywordResearchError) {
    switch (error.code) {
      case 'AI_ERROR':
        return 'Failed to generate AI keyword suggestions. Using keyword expansion only.';
      case 'INVALID_REQUEST':
        return 'Invalid keyword research request. Please provide at least one seed keyword.';
      case 'NO_RESULTS':
        return 'No relevant keywords found. Try different seed keywords or business description.';
      case 'PROVIDER_NOT_CONFIGURED':
        return 'AI provider is not configured on the server.';
      default:
        return 'Keyword research failed. Please try again.';
    }
  }

  return 'An unexpected error occurred during keyword research.';
}

/**
 * Export keywords to CSV format
 * @param keywords - Keywords to export
 * @returns CSV string
 */
export function exportKeywordsToCsv(keywords: KeywordSuggestion[]): string {
  const headers = [
    'Keyword',
    'Relevance Score',
    'Category',
    'Exact Match',
    'Phrase Match',
    'Broad Match',
    'Is Long Tail',
  ];

  const rows = keywords.map((k) => [
    k.keyword,
    k.relevanceScore.toString(),
    k.category || '',
    k.matchTypes.exact ? 'Yes' : 'No',
    k.matchTypes.phrase ? 'Yes' : 'No',
    k.matchTypes.broad ? 'Yes' : 'No',
    k.isLongTail ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Copy keywords to clipboard (formatted for Google Ads Editor)
 * @param keywords - Keywords to copy
 * @returns Formatted string for clipboard
 */
export function formatKeywordsForClipboard(keywords: KeywordSuggestion[]): string {
  return keywords
    .map((k) => {
      const matchTypes = [];
      if (k.matchTypes.exact) matchTypes.push(`[${k.keyword}]`);
      if (k.matchTypes.phrase) matchTypes.push(`"${k.keyword}"`);
      if (k.matchTypes.broad) matchTypes.push(k.keyword);
      return matchTypes.join('\n');
    })
    .join('\n');
}

/* ==================== EXPORTS ==================== */

export default {
  researchKeywords,
  expandKeywords,
  generateLongTailKeywords,
  suggestNegativeKeywords,
  scoreKeywordRelevance,
  formatKeywordResearchError,
  exportKeywordsToCsv,
  formatKeywordsForClipboard,
};
