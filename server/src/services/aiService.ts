/**
 * AI Service - Multi-Provider Support (Claude & Gemini)
 * Supports both Claude and Google Gemini for ad copy generation
 */

import { config } from '../config/config';
import logger from '../utils/logger.js';

export class AIServiceError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.details = details;
  }
}

export type AIProvider = 'claude' | 'gemini';

export type HeadlineCategory = 'KEYWORD' | 'VALUE' | 'CTA' | 'GENERAL';

export interface HeadlineWithCategory {
  text: string;
  category: HeadlineCategory;
}

interface GenerateAdCopyRequest {
  businessDescription: string;
  targetKeywords?: string[];
  tone?: string;
  callToAction?: string;
  uniqueSellingPoints?: string[];
  targetAudience?: string;
  headlineCount?: number;
  descriptionCount?: number;
}

interface GeneratedAdCopy {
  headlines: HeadlineWithCategory[];
  descriptions: string[];
  generatedAt: string;
}

/**
 * Call Claude API using official API key
 */
async function callClaudeAPI(prompt: string): Promise<string> {
  if (!config.claudeApiKey) {
    throw new AIServiceError('NO_API_KEY', 'Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.claudeApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AIServiceError(
      'CLAUDE_API_ERROR',
      `Claude API error: ${response.status}`,
      { responseText: error }
    );
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Call Google Gemini API
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  if (!config.geminiApiKey) {
    throw new AIServiceError('NO_API_KEY', 'Gemini API key not configured');
  }

  // Gemini uses a different API structure
  // Use gemini-2.5-flash - fast and free with generous limits
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${config.geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    logger.error('Gemini API Error', {
      status: response.status,
      statusText: response.statusText,
      error: error,
    });
    throw new AIServiceError(
      'GEMINI_API_ERROR',
      `Gemini API error: ${response.status}`,
      { responseText: error }
    );
  }

  const data = await response.json();

  // Gemini response structure is different
  if (!data.candidates || data.candidates.length === 0) {
    throw new AIServiceError(
      'GEMINI_NO_RESPONSE',
      'Gemini returned no candidates',
      { response: data }
    );
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Build structured prompt for Google Ads copy generation
 */
function buildAdCopyPrompt(request: GenerateAdCopyRequest): string {
  const {
    businessDescription,
    targetKeywords = [],
    tone = 'professional',
    callToAction = '',
    uniqueSellingPoints = [],
    targetAudience = '',
    headlineCount = 15,
    descriptionCount = 4,
  } = request;

  const keywordsText = targetKeywords.length > 0 ? targetKeywords.join(', ') : 'None provided';
  const uspsText = uniqueSellingPoints.length > 0 ? uniqueSellingPoints.join('\n  • ') : 'None provided';
  const audienceText = targetAudience || 'General audience';
  const ctaText = callToAction || 'None specified';

  return `You are an expert Google Ads copywriter specializing in Responsive Search Ads (RSAs). Generate compelling, conversion-focused ad copy with strategic variety.

## BUSINESS CONTEXT
Business Description: ${businessDescription}
Target Keywords: ${keywordsText}
Target Audience: ${audienceText}
Desired Tone: ${tone}
Call-to-Action: ${ctaText}
Unique Selling Points:
  • ${uspsText}

## TASK
Generate ${headlineCount} unique headlines (distributed across 3 categories) and ${descriptionCount} descriptions for Google Ads Responsive Search Ads.

## HEADLINE STRATEGY - 3 CATEGORIES
Google shows 3 headlines at a time. Create variety across these categories:

### CATEGORY 1: [KEYWORD] - Keyword-Focused (${Math.floor(headlineCount / 3)} headlines)
- Include target keywords naturally
- Problem-focused or benefit-focused
- Optimized for search relevance
Examples: "Gain Instagram Followers Fast", "Affordable Instagram Growth", "Real Instagram Engagement"

### CATEGORY 2: [VALUE] - Value Proposition (${Math.floor(headlineCount / 3)} headlines)
- Highlight unique selling points
- Emphasize differentiators
- Show what makes the business special
Examples: "Expert-Backed Strategies", "Real Followers, Not Bots", "Trusted by 10,000+ Users"

### CATEGORY 3: [CTA] - Call-to-Action & Brand (${Math.floor(headlineCount / 3)} headlines)
- Strong calls-to-action
- Urgency or social proof
- Brand reinforcement
Examples: "Start Growing Today", "Try Risk-Free Now", "Join Happy Customers"

## CRITICAL REQUIREMENTS

### Character Limits (STRICT!)
- HEADLINES: 30 characters or LESS
- DESCRIPTIONS: 90 characters or LESS (aim for 70-85 to be safe)

### Uniqueness Rules
- NO repetitive phrases across headlines (avoid: "Grow Your X", "Boost Your X", "Get More X")
- Each headline must use DIFFERENT messaging angles
- Vary sentence structure and word choice
- Use synonyms and alternative phrasing

### Google Ads Compliance
✅ DO: Proper grammar, specific claims, action verbs, natural keywords
❌ DON'T: Excessive punctuation (!!), ALL CAPS (except acronyms), unproven superlatives, clickbait

## OUTPUT FORMAT
Format EXACTLY as shown. Include category labels [KEYWORD], [VALUE], or [CTA] before each headline.
Generate ${headlineCount} headlines total (${Math.floor(headlineCount / 3)} per category) and ${descriptionCount} descriptions:

HEADLINES:
[First ${Math.floor(headlineCount / 3)} are KEYWORD]
1. [KEYWORD] Headline text here (XX chars)
2. [KEYWORD] Headline text here (XX chars)
...continue to ${Math.floor(headlineCount / 3)}

[Next ${Math.floor(headlineCount / 3)} are VALUE]
${Math.floor(headlineCount / 3) + 1}. [VALUE] Headline text here (XX chars)
${Math.floor(headlineCount / 3) + 2}. [VALUE] Headline text here (XX chars)
...continue to ${Math.floor(headlineCount / 3) * 2}

[Final ${Math.floor(headlineCount / 3)} are CTA]
${Math.floor(headlineCount / 3) * 2 + 1}. [CTA] Headline text here (XX chars)
${Math.floor(headlineCount / 3) * 2 + 2}. [CTA] Headline text here (XX chars)
...continue to ${headlineCount}

DESCRIPTIONS:
1. Description text here (XX chars)
2. Description text here (XX chars)
3. Description text here (XX chars)
4. Description text here (XX chars)
5. Description text here (XX chars)
6. Description text here (XX chars)
7. Description text here (XX chars)
8. Description text here (XX chars)

Now generate the ad copy following ALL requirements above.`;
}

/**
 * Parse AI response into headlines and descriptions with validation
 */
function parseAdCopyResponse(
  response: string,
  expectedHeadlines: number,
  expectedDescriptions: number
): { headlines: HeadlineWithCategory[]; descriptions: string[]; warnings: string[] } {
  const headlines: HeadlineWithCategory[] = [];
  const descriptions: string[] = [];
  const warnings: string[] = [];

  const lines = response.split('\n');
  let section: 'headlines' | 'descriptions' | '' = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (trimmed.match(/^HEADLINES:$/i)) {
      section = 'headlines';
      continue;
    } else if (trimmed.match(/^DESCRIPTIONS:$/i)) {
      section = 'descriptions';
      continue;
    }

    // Match numbered lines with optional category: "1. [KEYWORD] Text here (30 chars)" or "1. Text here"
    const match = trimmed.match(/^\d+\.\s*(?:\[([A-Z]+)\]\s*)?(.+?)(?:\s*\(\d+\s*chars?\))?$/i);
    if (!match) continue;

    const categoryMatch = match[1];
    let text = match[2].trim();

    // Remove any character count notation that might be in the text
    text = text.replace(/\s*\(\d+\s*chars?\)\s*$/i, '').trim();

    // Validate and add to appropriate section
    if (section === 'headlines') {
      // Extract category (default to GENERAL if not specified)
      let category: HeadlineCategory = 'GENERAL';
      if (categoryMatch) {
        const cat = categoryMatch.toUpperCase();
        if (cat === 'KEYWORD' || cat === 'VALUE' || cat === 'CTA') {
          category = cat;
        }
      }

      if (text.length === 0) {
        warnings.push(`Empty headline at line: "${trimmed}"`);
      } else {
        // Accept ALL lengths for manual review
        headlines.push({ text, category });

        // Add warning if over limit
        if (text.length > 30) {
          warnings.push(`⚠️ Headline over limit (${text.length} chars): "${text.substring(0, 40)}..." - Review and adjust manually`);
        }
      }
    } else if (section === 'descriptions') {
      if (text.length === 0) {
        warnings.push(`Empty description at line: "${trimmed}"`);
      } else {
        // Accept ALL lengths for manual review
        descriptions.push(text);

        // Add warning if over limit, but still include it
        if (text.length > 90) {
          warnings.push(`⚠️ Description over limit (${text.length} chars): "${text.substring(0, 50)}..." - Review and adjust manually`);
        }
      }
    }
  }

  // Check if we got the expected counts
  if (headlines.length < expectedHeadlines) {
    warnings.push(`Expected ${expectedHeadlines} headlines but got ${headlines.length}`);
  }
  if (descriptions.length < expectedDescriptions) {
    warnings.push(`Expected ${expectedDescriptions} descriptions but got ${descriptions.length}`);
  }

  return { headlines, descriptions, warnings };
}

/**
 * Generate ad copy using specified AI provider
 */
export async function generateAdCopy(
  request: GenerateAdCopyRequest,
  provider: AIProvider = 'gemini'
): Promise<GeneratedAdCopy> {
  const {
    headlineCount = 30,
    descriptionCount = 8,
  } = request;

  // Build structured prompt
  const prompt = buildAdCopyPrompt(request);

  // Call appropriate AI provider
  let response: string;
  if (provider === 'claude') {
    response = await callClaudeAPI(prompt);
  } else if (provider === 'gemini') {
    response = await callGeminiAPI(prompt);
  } else {
    throw new AIServiceError('INVALID_PROVIDER', `Unknown provider: ${provider}`);
  }

  // Parse and validate response
  const { headlines, descriptions, warnings } = parseAdCopyResponse(
    response,
    headlineCount,
    descriptionCount
  );

  // Log warnings if any
  if (warnings.length > 0) {
    logger.warn(`Ad copy generation warnings (${provider}):`, { warnings });
  }

  // DEBUG: Log what we got from parsing
  logger.debug(`Parsed results: ${headlines.length} headlines, ${descriptions.length} descriptions`, {
    provider,
    headlineCount: headlines.length,
    descriptionCount: descriptions.length,
  });
  logger.debug('Headlines:', { headlines });
  logger.debug('Descriptions:', { descriptions });

  // Throw error if we didn't get enough content
  // Very lenient validation - just need at least 1 of each for manual review
  if (headlines.length < 1 || descriptions.length < 1) {
    throw new AIServiceError(
      'PARSE_ERROR',
      `Failed to generate any valid ad copy. Got ${headlines.length} headlines and ${descriptions.length} descriptions. Please try again.`,
      { warnings, rawResponse: response.substring(0, 500) }
    );
  }

  logger.info(`Returning: ${headlines.slice(0, headlineCount).length} headlines, ${descriptions.slice(0, descriptionCount).length} descriptions`, {
    provider,
    requestedHeadlines: headlineCount,
    requestedDescriptions: descriptionCount,
  });

  return {
    headlines: headlines.slice(0, headlineCount),
    descriptions: descriptions.slice(0, descriptionCount),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get available AI providers
 */
export async function getAvailableProviders(): Promise<AIProvider[]> {
  const providers: AIProvider[] = [];

  if (config.claudeApiKey) {
    providers.push('claude');
  }

  if (config.geminiApiKey) {
    providers.push('gemini');
  }

  return providers;
}

/**
 * Check if a specific provider is available
 */
export async function isProviderAvailable(provider: AIProvider): Promise<boolean> {
  if (provider === 'claude') {
    return !!config.claudeApiKey;
  } else if (provider === 'gemini') {
    return !!config.geminiApiKey;
  }
  return false;
}
