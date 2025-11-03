/**
 * AI Service - Multi-Provider Support (Claude & Gemini)
 * Supports both Claude and Google Gemini for ad copy generation
 */

import { config } from '../config/config';

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
  headlines: string[];
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
    console.error('[Gemini API Error]', {
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

  return `You are an expert Google Ads copywriter. Generate compelling, conversion-focused ad copy that strictly adheres to Google Ads policies and character limits.

## BUSINESS CONTEXT
Business Description: ${businessDescription}
Target Keywords: ${keywordsText}
Target Audience: ${audienceText}
Desired Tone: ${tone}
Call-to-Action: ${ctaText}
Unique Selling Points:
  • ${uspsText}

## TASK
Generate ${headlineCount} unique headlines and ${descriptionCount} unique descriptions for Google Ads Responsive Search Ads.

## STRICT CHARACTER LIMITS - EXTREMELY IMPORTANT!
⚠️⚠️⚠️ CRITICAL - DO NOT EXCEED THESE LIMITS ⚠️⚠️⚠️

HEADLINES: Must be 30 characters or LESS (including spaces and punctuation)
DESCRIPTIONS: Must be 90 characters or LESS (including spaces and punctuation)

Count every character carefully! If a description is 91+ characters, it WILL BE REJECTED.
Keep descriptions SHORT and CONCISE. Aim for 70-85 characters to be safe.

## GOOGLE ADS EDITORIAL GUIDELINES
Your copy MUST follow these rules:
1. ✅ Use proper grammar, spelling, and punctuation
2. ✅ Be clear, specific, and relevant to the business
3. ✅ Include keywords naturally when possible
4. ✅ Use action-oriented language
5. ✅ Highlight unique value propositions
6. ❌ NO excessive punctuation (!!!, ???, etc.)
7. ❌ NO all caps words (except acronyms like "USA")
8. ❌ NO superlatives without proof ("best", "cheapest")
9. ❌ NO misleading claims or clickbait
10. ❌ NO inappropriate spacing or symbols

## BEST PRACTICES
- Vary your headlines for different angles (features, benefits, urgency, social proof)
- Include at least 3 headlines with target keywords
- Use numbers and specifics when possible ("24/7 Support", "Save 30%")
- Create urgency when appropriate ("Limited Time", "Today Only")
- Include the call-to-action in at least 2 headlines
- Make descriptions SHORT, informative and action-oriented (70-85 chars is ideal)
- Front-load important information
- Use abbreviations if needed to stay under limits (& instead of and, etc.)

## OUTPUT FORMAT
You MUST format your response EXACTLY as shown below. Do not include any other text, explanations, or commentary.

HEADLINES:
1. [Headline text here] (XX chars)
2. [Headline text here] (XX chars)
3. [Headline text here] (XX chars)
[Continue for all ${headlineCount} headlines]

DESCRIPTIONS:
1. [Description text here] (XX chars)
2. [Description text here] (XX chars)
[Continue for all ${descriptionCount} descriptions]

Now generate the ad copy following ALL requirements above.`;
}

/**
 * Parse AI response into headlines and descriptions with validation
 */
function parseAdCopyResponse(
  response: string,
  expectedHeadlines: number,
  expectedDescriptions: number
): { headlines: string[]; descriptions: string[]; warnings: string[] } {
  const headlines: string[] = [];
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

    // Match numbered lines: "1. Text here (30 chars)" or "1. Text here"
    const match = trimmed.match(/^\d+\.\s*(.+?)(?:\s*\(\d+\s*chars?\))?$/i);
    if (!match) continue;

    let text = match[1].trim();

    // Remove any character count notation that might be in the text
    text = text.replace(/\s*\(\d+\s*chars?\)\s*$/i, '').trim();

    // Validate and add to appropriate section
    if (section === 'headlines') {
      if (text.length === 0) {
        warnings.push(`Empty headline at line: "${trimmed}"`);
      } else if (text.length > 30) {
        // Try to truncate if slightly too long (up to 35 chars)
        if (text.length <= 35) {
          const originalLength = text.length;
          const truncated = text.substring(0, 30).trim();
          // Try to end at word boundary
          const lastSpace = truncated.lastIndexOf(' ');
          if (lastSpace > 20) {
            text = truncated.substring(0, lastSpace);
          } else {
            text = truncated;
          }
          warnings.push(`Headline auto-truncated from ${originalLength} to ${text.length} chars`);
          headlines.push(text);
        } else {
          warnings.push(`Headline too long (${text.length} chars): "${text.substring(0, 40)}..."`);
        }
      } else {
        headlines.push(text);
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
    headlineCount = 15,
    descriptionCount = 4,
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
    console.warn(`⚠️  Ad copy generation warnings (${provider}):`);
    warnings.forEach(w => console.warn(`   - ${w}`));
  }

  // Throw error if we didn't get enough content
  // Accept results with at least 3 headlines and 2 descriptions (more lenient for Gemini)
  if (headlines.length < 3 || descriptions.length < 2) {
    throw new AIServiceError(
      'PARSE_ERROR',
      `Not enough valid ad copy generated. Got ${headlines.length} headlines and ${descriptions.length} descriptions. Need at least 3 headlines and 2 descriptions.`,
      { warnings, rawResponse: response.substring(0, 500) }
    );
  }

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
