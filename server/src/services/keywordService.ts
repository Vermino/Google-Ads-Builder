/**
 * Keyword Research Service - Claude Web API Integration
 */

import { config } from '../config/config';
import { AIServiceError } from './aiService';

interface KeywordResearchRequest {
  seedKeywords: string[];
  businessDescription?: string;
  targetLocation?: string;
  maxResults?: number;
}

interface KeywordSuggestion {
  keyword: string;
  matchTypes: {
    exact: boolean;
    phrase: boolean;
    broad: boolean;
  };
  relevanceScore: number;
}

interface KeywordResearchResult {
  suggestions: KeywordSuggestion[];
  relatedTerms: string[];
  longTailVariations: string[];
  negativeKeywords: string[];
}

/**
 * Call Claude's web API
 */
async function callClaudeWebAPI(prompt: string): Promise<string> {
  const sessionToken = config.claudeSessionToken;

  if (!sessionToken) {
    throw new AIServiceError('NO_TOKEN', 'Claude session token not configured');
  }

  const response = await fetch('https://claude.ai/api/append_message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sessionKey=${sessionToken}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      timezone: 'America/New_York',
      model: 'claude-3-5-sonnet-20241022',
    }),
  });

  if (!response.ok) {
    throw new AIServiceError('API_ERROR', `Claude API error: ${response.status}`);
  }

  return response.text();
}

/**
 * Research keywords using Claude
 */
export async function researchKeywords(request: KeywordResearchRequest): Promise<KeywordResearchResult> {
  const { seedKeywords, businessDescription = '', maxResults = 100 } = request;

  const prompt = `Generate keyword suggestions for a Google Ads campaign.

Seed Keywords: ${seedKeywords.join(', ')}
Business: ${businessDescription}

Generate 50 relevant keywords for Google Ads. Include:
- Exact matches and variations
- Long-tail keywords (3-5 words)
- Commercial intent keywords

Output just the keywords, one per line.`;

  const result = await callClaudeWebAPI(prompt);

  // Parse keywords from response
  const keywords = result
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.length > 2)
    .slice(0, maxResults);

  // Create suggestions
  const suggestions: KeywordSuggestion[] = keywords.map((keyword) => ({
    keyword,
    matchTypes: {
      exact: true,
      phrase: keyword.split(' ').length > 1,
      broad: keyword.split(' ').length <= 2,
    },
    relevanceScore: 75, // Placeholder
  }));

  return {
    suggestions,
    relatedTerms: keywords.slice(0, 20),
    longTailVariations: keywords.filter((k) => k.split(' ').length >= 3).slice(0, 30),
    negativeKeywords: ['free', 'cheap', 'diy'],
  };
}
