/**
 * Keyword Research Service (Server-Side)
 *
 * Provides AI-powered keyword research, expansion, and analysis capabilities
 * for Google Ads campaigns. This is the secure server-side version.
 *
 * @module keywordService
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config, isProviderConfigured } from '../config/config.js';
import { AIServiceError } from './aiService.js';
import type {
  KeywordResearchRequest,
  KeywordResearchResult,
  KeywordSuggestion,
  MatchTypeSettings,
} from '../types/index.js';

/* ==================== KEYWORD MODIFIERS ==================== */

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

/* ==================== AI CLIENT INITIALIZATION ==================== */

let openaiClient: OpenAI | null = null;
let claudeClient: Anthropic | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient && config.openaiApiKey) {
    openaiClient = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  if (!openaiClient) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      'OpenAI API key is not configured'
    );
  }

  return openaiClient;
}

function getClaudeClient(): Anthropic {
  if (!claudeClient && config.anthropicApiKey) {
    claudeClient = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  if (!claudeClient) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      'Claude API key is not configured'
    );
  }

  return claudeClient;
}

/* ==================== AI PROMPT GENERATION ==================== */

function buildKeywordGenerationPrompt(request: KeywordResearchRequest): string {
  const {
    seedKeywords,
    businessDescription = '',
    targetLocation = '',
    maxResults = 100,
  } = request;

  const seedKeywordList = seedKeywords.join(', ');
  const locationContext = targetLocation ? `\nTarget Location: ${targetLocation}` : '';

  return `Generate relevant keywords for a Google Ads campaign.

Business: ${businessDescription}
Seed Keywords: ${seedKeywordList}${locationContext}

Generate ${Math.min(maxResults, 100)} highly relevant keywords that potential customers might use to search for this business. Include:

1. PRODUCT/SERVICE KEYWORDS:
   - Exact product/service names
   - Product categories
   - Service types
   - Branded terms (if applicable)

2. PROBLEM-SOLVING KEYWORDS:
   - "how to..." searches
   - "best way to..." searches
   - Problem statements customers might search

3. COMMERCIAL INTENT KEYWORDS:
   - "buy [product]"
   - "hire [service]"
   - "order [product]"
   - "[service] near me"
   - "compare [product/service]"

4. LONG-TAIL KEYWORDS (3-5 words):
   - Specific, detailed searches
   - Location-based if location provided
   - Year/season specific where relevant

5. COMPARISON KEYWORDS:
   - "[product] vs [alternative]"
   - "best [product/service]"
   - "[product/service] reviews"

REQUIREMENTS:
- Each keyword should be realistic and commonly searched
- Include a mix of short (1-2 words) and long-tail (3-5 words) keywords
- Focus on commercial intent keywords (users ready to buy/hire)
- Make keywords specific to the business description
- Include location-based variations if location is provided
- Output ONLY the keywords, one per line
- NO numbering, bullets, or explanations
- NO duplicate keywords

Keywords:`;
}

/* ==================== AI KEYWORD GENERATION ==================== */

async function callOpenAIForKeywords(prompt: string): Promise<string> {
  const client = getOpenAIClient();

  try {
    const response = await Promise.race([
      client.chat.completions.create({
        model: config.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), config.apiTimeoutMs)
      ),
    ]);

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    if (error.message === 'Request timeout') {
      throw new AIServiceError('TIMEOUT', 'OpenAI request timed out', error);
    }

    if (error.status === 401) {
      throw new AIServiceError('AUTH_ERROR', 'Invalid OpenAI API key', error);
    } else if (error.status === 429) {
      throw new AIServiceError('RATE_LIMIT', 'OpenAI rate limit exceeded', error);
    } else if (error.status === 500 || error.status === 503) {
      throw new AIServiceError('API_ERROR', 'OpenAI service error', error);
    } else {
      throw new AIServiceError('UNKNOWN_ERROR', 'OpenAI error occurred', error);
    }
  }
}

async function callClaudeForKeywords(prompt: string): Promise<string> {
  const client = getClaudeClient();

  try {
    const response = await Promise.race([
      client.messages.create({
        model: config.claudeModel,
        max_tokens: config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), config.apiTimeoutMs)
      ),
    ]);

    const textContent = response.content.find((block) => block.type === 'text');
    return textContent && 'text' in textContent ? textContent.text : '';
  } catch (error: any) {
    if (error.message === 'Request timeout') {
      throw new AIServiceError('TIMEOUT', 'Claude request timed out', error);
    }

    if (error.status === 401) {
      throw new AIServiceError('AUTH_ERROR', 'Invalid Claude API key', error);
    } else if (error.status === 429) {
      throw new AIServiceError('RATE_LIMIT', 'Claude rate limit exceeded', error);
    } else if (error.status === 500 || error.status === 503) {
      throw new AIServiceError('API_ERROR', 'Claude service error', error);
    } else {
      throw new AIServiceError('UNKNOWN_ERROR', 'Claude error occurred', error);
    }
  }
}

async function generateAIKeywords(request: KeywordResearchRequest): Promise<string[]> {
  // Validate provider is configured
  if (!isProviderConfigured(request.provider)) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      `${request.provider} is not configured on the server`
    );
  }

  // Build prompt
  const prompt = buildKeywordGenerationPrompt(request);

  // Call AI service based on provider
  let response: string;
  if (request.provider === 'openai') {
    response = await callOpenAIForKeywords(prompt);
  } else {
    response = await callClaudeForKeywords(prompt);
  }

  // Parse response - extract keywords line by line
  const keywords = response
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      // Remove empty lines and lines that look like headers/instructions
      if (!line) return false;
      if (line.toLowerCase().startsWith('keyword')) return false;
      if (line.match(/^\d+\./)) return false; // Remove numbered lines
      if (line.startsWith('-')) return false; // Remove bullet points
      if (line.endsWith(':')) return false; // Remove headers
      return true;
    })
    .map((line) => {
      // Clean up the keyword
      line = line.replace(/^\d+\.\s*/, ''); // Remove numbering
      line = line.replace(/^[-*]\s*/, ''); // Remove bullets
      line = line.replace(/^["']|["']$/g, ''); // Remove quotes
      return line.trim().toLowerCase();
    })
    .filter((keyword) => {
      // Validate keyword
      if (keyword.length === 0) return false;
      if (keyword.length > 80) return false; // Google Ads max keyword length
      return true;
    });

  return keywords;
}

/* ==================== KEYWORD EXPANSION ==================== */

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

    // Add the original keyword
    variations.push(keywordLower);
  }

  // Remove duplicates, sort, and limit results
  const unique = Array.from(new Set(variations));
  return unique.slice(0, maxVariations * seedKeywords.length);
}

/* ==================== LONG-TAIL KEYWORD GENERATION ==================== */

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

  // Generic location variations
  longTail.push(`${keyword} near me`);
  longTail.push(`${keyword} in my area`);
  longTail.push(`${keyword} nearby`);
  longTail.push(`local ${keyword} service`);

  // Commercial intent long-tail
  longTail.push(`buy ${keyword} online`);
  longTail.push(`order ${keyword} near me`);
  longTail.push(`${keyword} for sale`);
  longTail.push(`${keyword} price comparison`);
  longTail.push(`cheap ${keyword} online`);
  longTail.push(`affordable ${keyword} service`);

  // Urgency-based long-tail
  longTail.push(`emergency ${keyword}`);
  longTail.push(`same day ${keyword}`);
  longTail.push(`24/7 ${keyword}`);
  longTail.push(`urgent ${keyword} service`);

  return longTail;
}

/* ==================== NEGATIVE KEYWORD SUGGESTIONS ==================== */

export function suggestNegativeKeywords(keywords: string[]): string[] {
  const negatives: string[] = [];

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

  const keywordText = keywords.join(' ').toLowerCase();

  // Premium/Professional businesses - exclude cheap seekers
  if (
    keywordText.includes('premium') ||
    keywordText.includes('professional') ||
    keywordText.includes('luxury')
  ) {
    negatives.push(
      'cheap',
      'cheapest',
      'budget',
      'discount',
      'clearance',
      'used',
      'secondhand'
    );
  }

  negatives.push(...commonNegatives);

  return Array.from(new Set(negatives));
}

/* ==================== KEYWORD RELEVANCE SCORING ==================== */

export function scoreKeywordRelevance(
  keyword: string,
  businessContext: string,
  targetLocation?: string
): number {
  let score = 50; // Base score

  const keywordLower = keyword.toLowerCase().trim();
  const contextLower = businessContext.toLowerCase();

  // 1. Exact phrase match
  if (contextLower.includes(keywordLower)) {
    score += 30;
  }

  // 2. Word overlap scoring
  const keywordWords = keywordLower.split(' ').filter((w) => w.length > 2);
  const contextWords = contextLower.split(' ').filter((w) => w.length > 2);
  const overlap = keywordWords.filter((w) => contextWords.includes(w)).length;
  score += overlap * 5;

  // 3. Optimal length bonus (2-4 words)
  const wordCount = keywordWords.length;
  if (wordCount >= 2 && wordCount <= 4) {
    score += 10;
  } else if (wordCount === 1) {
    score -= 5;
  } else if (wordCount > 5) {
    score -= 5;
  }

  // 4. Commercial intent scoring
  const commercialWords = ['buy', 'order', 'purchase', 'hire', 'get', 'service', 'book'];
  const hasCommercialIntent = commercialWords.some((w) => keywordLower.includes(w));
  if (hasCommercialIntent) {
    score += 15;
  }

  // 5. Location relevance
  if (targetLocation) {
    const locationLower = targetLocation.toLowerCase();
    if (
      keywordLower.includes(locationLower) ||
      keywordLower.includes('near me') ||
      keywordLower.includes('local')
    ) {
      score += 10;
    }
  }

  return Math.min(Math.max(score, 0), 100);
}

/* ==================== MATCH TYPE RECOMMENDATIONS ==================== */

function recommendMatchTypes(keyword: string): MatchTypeSettings {
  const wordCount = keyword.trim().split(' ').length;

  return {
    exact: true,
    phrase: true,
    broad: wordCount <= 2,
  };
}

/* ==================== KEYWORD CATEGORIZATION ==================== */

function categorizeKeyword(keyword: string): string {
  const lower = keyword.toLowerCase();

  if (
    lower.startsWith('how to') ||
    lower.startsWith('what is') ||
    lower.includes('guide')
  ) {
    return 'informational';
  }

  if (
    lower.includes('near me') ||
    lower.includes('nearby') ||
    lower.includes('local')
  ) {
    return 'local';
  }

  if (
    lower.includes('vs') ||
    lower.includes('compare') ||
    lower.includes('best')
  ) {
    return 'comparison';
  }

  if (
    lower.includes('buy') ||
    lower.includes('order') ||
    lower.includes('purchase')
  ) {
    return 'commercial';
  }

  return 'product';
}

/* ==================== MAIN RESEARCH FUNCTION ==================== */

export async function researchKeywords(
  request: KeywordResearchRequest
): Promise<KeywordResearchResult> {
  // Validate request
  if (!request.seedKeywords || request.seedKeywords.length === 0) {
    throw new AIServiceError(
      'VALIDATION_ERROR',
      'At least one seed keyword is required'
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

  // 1. Generate AI-powered keyword suggestions
  let aiKeywords: string[] = [];
  try {
    aiKeywords = await generateAIKeywords(request);
  } catch (error) {
    console.warn('AI keyword generation failed, using expansion only:', error);
  }

  // 2. Expand seed keywords with modifiers
  const expandedKeywords = expandKeywords(seedKeywords, 20);

  // 3. Generate long-tail variations
  const longTailKeywords: string[] = [];
  if (includeLongTail) {
    for (const keyword of seedKeywords) {
      longTailKeywords.push(...generateLongTailKeywords(keyword, targetLocation));
    }
  }

  // 4. Combine and deduplicate
  const allKeywords = [
    ...aiKeywords,
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
    .filter((k) => k.relevanceScore >= 40)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  // 6. Generate related terms
  const relatedTerms = scoredKeywords
    .filter((k) => !k.isLongTail)
    .slice(0, 20)
    .map((k) => k.keyword);

  // 7. Extract long-tail variations
  const longTailVariations = scoredKeywords
    .filter((k) => k.isLongTail)
    .slice(0, 50)
    .map((k) => k.keyword);

  // 8. Generate negative keywords
  const negativeKeywords = includeNegativeKeywords
    ? suggestNegativeKeywords(seedKeywords)
    : [];

  return {
    suggestions: scoredKeywords,
    relatedTerms,
    longTailVariations,
    negativeKeywords,
    researchedAt: new Date().toISOString(),
    provider: request.provider,
  };
}
