/**
 * AI Service for Google Ads Copy Generation
 *
 * Provides AI-powered headline and description generation using OpenAI GPT-4 or Claude.
 * Ensures all generated copy complies with Google Ads content policies and character limits.
 *
 * @module aiService
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AI_CONFIG, isProviderConfigured } from '@/config/aiConfig';

/* ==================== TYPE DEFINITIONS ==================== */

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'claude';

/**
 * Tone options for generated ad copy
 */
export type AdTone = 'professional' | 'casual' | 'urgent' | 'friendly';

/**
 * Request parameters for ad copy generation
 */
export interface GenerateAdCopyRequest {
  /** AI provider to use for generation */
  provider: AIProvider;

  /** Business description or product information */
  businessDescription: string;

  /** Target keywords to incorporate (optional) */
  targetKeywords?: string[];

  /** Desired tone of the ad copy (optional) */
  tone?: AdTone;

  /** Call-to-action phrase (optional) */
  callToAction?: string;

  /** Unique selling points (optional) */
  uniqueSellingPoints?: string[];

  /** Target audience description (optional) */
  targetAudience?: string;

  /** Number of headlines to generate (default: 15) */
  headlineCount?: number;

  /** Number of descriptions to generate (default: 4) */
  descriptionCount?: number;
}

/**
 * Generated ad copy response
 */
export interface GeneratedAdCopy {
  /** Generated headlines (max 30 characters each) */
  headlines: string[];

  /** Generated descriptions (max 90 characters each) */
  descriptions: string[];

  /** Timestamp when copy was generated */
  generatedAt: string;

  /** Provider used for generation */
  provider: AIProvider;
}

/**
 * AI service error codes
 */
export type AIErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMIT'
  | 'API_ERROR'
  | 'INVALID_RESPONSE'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

/**
 * AI service error
 */
export interface AIError {
  code: AIErrorCode;
  message: string;
  details?: any;
}

/**
 * Custom error class for AI service errors
 */
export class AIServiceError extends Error {
  code: AIErrorCode;
  details?: any;

  constructor(
    code: AIErrorCode,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.details = details;
  }
}

/* ==================== AI CLIENT INITIALIZATION ==================== */

let openaiClient: OpenAI | null = null;
let claudeClient: Anthropic | null = null;

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient && AI_CONFIG.openai.apiKey) {
    openaiClient = new OpenAI({
      apiKey: AI_CONFIG.openai.apiKey,
      dangerouslyAllowBrowser: true, // For client-side use (consider proxy in production)
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

/**
 * Initialize Claude client
 */
function getClaudeClient(): Anthropic {
  if (!claudeClient && AI_CONFIG.claude.apiKey) {
    claudeClient = new Anthropic({
      apiKey: AI_CONFIG.claude.apiKey,
      dangerouslyAllowBrowser: true,
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

/* ==================== PROMPT TEMPLATES ==================== */

/**
 * Generate prompt for headline creation
 */
function buildHeadlinePrompt(request: GenerateAdCopyRequest): string {
  const count = request.headlineCount || AI_CONFIG.generation.defaultHeadlineCount;
  const keywords = request.targetKeywords?.join(', ') || 'N/A';
  const tone = request.tone || 'professional';
  const audience = request.targetAudience || 'general audience';

  return `Generate ${count} unique Google Ads headlines for the following business:

Business: ${request.businessDescription}
Keywords: ${keywords}
Tone: ${tone}
Target Audience: ${audience}

Requirements:
- Each headline must be EXACTLY 30 characters or less (including spaces)
- Include power words and action verbs
- Incorporate keywords naturally where possible
- Be compelling and click-worthy
- No superlatives without proof (e.g., "best", "cheapest")
- No trademark or copyright violations
- Follow Google Ads editorial guidelines
- No prohibited characters: < > { } [ ] \\
- Maximum 2 exclamation marks per headline
- Output ONLY the headlines, one per line
- Number each headline (1-${count})

Headlines:`;
}

/**
 * Generate prompt for description creation
 */
function buildDescriptionPrompt(request: GenerateAdCopyRequest): string {
  const count = request.descriptionCount || AI_CONFIG.generation.defaultDescriptionCount;
  const keywords = request.targetKeywords?.join(', ') || 'N/A';
  const usps = request.uniqueSellingPoints?.join(', ') || 'N/A';
  const cta = request.callToAction || 'Learn More';
  const tone = request.tone || 'professional';

  return `Generate ${count} unique Google Ads descriptions for the following business:

Business: ${request.businessDescription}
Keywords: ${keywords}
Unique Selling Points: ${usps}
Call to Action: ${cta}
Tone: ${tone}

Requirements:
- Each description must be EXACTLY 90 characters or less (including spaces)
- Include a clear call-to-action
- Highlight unique selling points
- Be specific and valuable
- No superlatives without proof
- Follow Google Ads editorial guidelines
- No prohibited characters: < > { } [ ] \\
- Output ONLY the descriptions, one per line
- Number each description (1-${count})

Descriptions:`;
}

/* ==================== AI API CALLS ==================== */

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string): Promise<string> {
  const client = getOpenAIClient();

  try {
    const response = await Promise.race([
      client.chat.completions.create({
        model: AI_CONFIG.openai.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: AI_CONFIG.openai.maxTokens,
        temperature: AI_CONFIG.openai.temperature,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), AI_CONFIG.generation.timeoutMs)
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

/**
 * Call Claude API
 */
async function callClaude(prompt: string): Promise<string> {
  const client = getClaudeClient();

  try {
    const response = await Promise.race([
      client.messages.create({
        model: AI_CONFIG.claude.model,
        max_tokens: AI_CONFIG.claude.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), AI_CONFIG.generation.timeoutMs)
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

/* ==================== RESPONSE PARSING ==================== */

/**
 * Parse and validate headlines from AI response
 */
function parseHeadlines(response: string): string[] {
  const lines = response.split('\n').filter((line) => line.trim());

  const headlines = lines
    .map((line) => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
    .filter((line) => line.length > 0)
    .map((line) => {
      // Remove markdown formatting
      line = line.replace(/\*\*/g, '').replace(/\*/g, '');
      // Remove quotes if present
      line = line.replace(/^["']|["']$/g, '');
      return line.trim();
    })
    .filter((line) => validateHeadline(line));

  return headlines;
}

/**
 * Parse and validate descriptions from AI response
 */
function parseDescriptions(response: string): string[] {
  const lines = response.split('\n').filter((line) => line.trim());

  const descriptions = lines
    .map((line) => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
    .filter((line) => line.length > 0)
    .map((line) => {
      // Remove markdown formatting
      line = line.replace(/\*\*/g, '').replace(/\*/g, '');
      // Remove quotes if present
      line = line.replace(/^["']|["']$/g, '');
      return line.trim();
    })
    .filter((line) => validateDescription(line));

  return descriptions;
}

/* ==================== VALIDATION ==================== */

/**
 * Validate headline compliance with Google Ads policies
 * @param headline - The headline to validate
 * @returns true if valid, false otherwise
 */
export function validateHeadline(headline: string): boolean {
  // Length check
  if (headline.length === 0 || headline.length > AI_CONFIG.generation.maxHeadlineLength) {
    return false;
  }

  // Prohibited characters check
  if (AI_CONFIG.policies.prohibitedChars.test(headline)) {
    return false;
  }

  // Excessive punctuation check
  const exclamationCount = (headline.match(/!/g) || []).length;
  const questionCount = (headline.match(/\?/g) || []).length;

  if (exclamationCount > AI_CONFIG.policies.maxExclamationMarks) {
    return false;
  }

  if (questionCount > AI_CONFIG.policies.maxQuestionMarks) {
    return false;
  }

  // Check for excessive capitalization (all caps)
  const words = headline.split(' ');
  const allCapsWords = words.filter(
    (word) => word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word)
  );
  if (allCapsWords.length > words.length / 2) {
    return false;
  }

  return true;
}

/**
 * Validate description compliance with Google Ads policies
 * @param description - The description to validate
 * @returns true if valid, false otherwise
 */
export function validateDescription(description: string): boolean {
  // Length check
  if (
    description.length === 0 ||
    description.length > AI_CONFIG.generation.maxDescriptionLength
  ) {
    return false;
  }

  // Prohibited characters check
  if (AI_CONFIG.policies.prohibitedChars.test(description)) {
    return false;
  }

  // Excessive punctuation check
  const exclamationCount = (description.match(/!/g) || []).length;
  const questionCount = (description.match(/\?/g) || []).length;

  if (exclamationCount > AI_CONFIG.policies.maxExclamationMarks) {
    return false;
  }

  if (questionCount > AI_CONFIG.policies.maxQuestionMarks) {
    return false;
  }

  return true;
}

/**
 * Sanitize ad copy to ensure compliance
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export function sanitizeAdCopy(text: string, maxLength: number): string {
  // Remove prohibited characters
  text = text.replace(/[<>{}[\]\\]/g, '');

  // Trim to max length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim();
    // Try to end at a word boundary
    const lastSpace = text.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      text = text.substring(0, lastSpace);
    }
  }

  return text.trim();
}

/* ==================== MAIN SERVICE FUNCTIONS ==================== */

/**
 * Generate headlines using AI
 *
 * @param request - Generation request parameters
 * @returns Array of generated headlines (max 30 characters each)
 *
 * @example
 * ```typescript
 * const headlines = await generateHeadlines({
 *   provider: 'openai',
 *   businessDescription: 'Premium organic dog food',
 *   targetKeywords: ['organic dog food', 'healthy pets'],
 *   headlineCount: 15,
 * });
 * ```
 */
export async function generateHeadlines(
  request: GenerateAdCopyRequest
): Promise<string[]> {
  // Validate provider is configured
  if (!isProviderConfigured(request.provider)) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      `${request.provider} is not configured. Please add API key to .env.local`
    );
  }

  // Build prompt
  const prompt = buildHeadlinePrompt(request);

  // Call AI provider
  let response: string;
  if (request.provider === 'openai') {
    response = await callOpenAI(prompt);
  } else {
    response = await callClaude(prompt);
  }

  // Parse and validate response
  const headlines = parseHeadlines(response);

  if (headlines.length === 0) {
    throw new AIServiceError(
      'INVALID_RESPONSE',
      'No valid headlines generated. Please try again.'
    );
  }

  return headlines;
}

/**
 * Generate descriptions using AI
 *
 * @param request - Generation request parameters
 * @returns Array of generated descriptions (max 90 characters each)
 *
 * @example
 * ```typescript
 * const descriptions = await generateDescriptions({
 *   provider: 'openai',
 *   businessDescription: 'Premium organic dog food',
 *   callToAction: 'Order Today',
 *   descriptionCount: 4,
 * });
 * ```
 */
export async function generateDescriptions(
  request: GenerateAdCopyRequest
): Promise<string[]> {
  // Validate provider is configured
  if (!isProviderConfigured(request.provider)) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      `${request.provider} is not configured. Please add API key to .env.local`
    );
  }

  // Build prompt
  const prompt = buildDescriptionPrompt(request);

  // Call AI provider
  let response: string;
  if (request.provider === 'openai') {
    response = await callOpenAI(prompt);
  } else {
    response = await callClaude(prompt);
  }

  // Parse and validate response
  const descriptions = parseDescriptions(response);

  if (descriptions.length === 0) {
    throw new AIServiceError(
      'INVALID_RESPONSE',
      'No valid descriptions generated. Please try again.'
    );
  }

  return descriptions;
}

/**
 * Generate complete ad copy (headlines + descriptions)
 *
 * @param request - Generation request parameters
 * @returns Complete generated ad copy
 *
 * @example
 * ```typescript
 * const adCopy = await generateAdCopy({
 *   provider: 'openai',
 *   businessDescription: 'Premium organic dog food delivery service',
 *   targetKeywords: ['organic dog food', 'healthy dog food', 'dog food delivery'],
 *   tone: 'professional',
 *   callToAction: 'Order Today',
 *   uniqueSellingPoints: [
 *     'Free shipping',
 *     '100% organic ingredients',
 *     'Vet approved'
 *   ],
 *   targetAudience: 'Dog owners who care about nutrition',
 *   headlineCount: 15,
 *   descriptionCount: 4,
 * });
 *
 * console.log('Headlines:', adCopy.headlines);
 * console.log('Descriptions:', adCopy.descriptions);
 * ```
 */
export async function generateAdCopy(
  request: GenerateAdCopyRequest
): Promise<GeneratedAdCopy> {
  // Generate headlines and descriptions in parallel
  const [headlines, descriptions] = await Promise.all([
    generateHeadlines(request),
    generateDescriptions(request),
  ]);

  return {
    headlines,
    descriptions,
    generatedAt: new Date().toISOString(),
    provider: request.provider,
  };
}

/**
 * Regenerate specific headlines
 * Useful when user wants more headline variations
 *
 * @param request - Generation request parameters
 * @param count - Number of additional headlines to generate
 * @returns Array of new headlines
 */
export async function regenerateHeadlines(
  request: GenerateAdCopyRequest,
  count: number = 5
): Promise<string[]> {
  return generateHeadlines({
    ...request,
    headlineCount: count,
  });
}

/**
 * Regenerate specific descriptions
 * Useful when user wants more description variations
 *
 * @param request - Generation request parameters
 * @param count - Number of additional descriptions to generate
 * @returns Array of new descriptions
 */
export async function regenerateDescriptions(
  request: GenerateAdCopyRequest,
  count: number = 2
): Promise<string[]> {
  return generateDescriptions({
    ...request,
    descriptionCount: count,
  });
}

/* ==================== UTILITY FUNCTIONS ==================== */

/**
 * Check if any AI provider is configured
 * @returns true if at least one provider is configured
 */
export function isAIServiceAvailable(): boolean {
  return isProviderConfigured('openai') || isProviderConfigured('claude');
}

/**
 * Get available AI providers
 * @returns Array of configured providers
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  if (isProviderConfigured('openai')) {
    providers.push('openai');
  }

  if (isProviderConfigured('claude')) {
    providers.push('claude');
  }

  return providers;
}

/**
 * Format error message for user display
 * @param error - The error to format
 * @returns User-friendly error message
 */
export function formatAIError(error: unknown): string {
  if (error instanceof AIServiceError) {
    switch (error.code) {
      case 'AUTH_ERROR':
        return 'Authentication failed. Please check your API key configuration.';
      case 'RATE_LIMIT':
        return 'Rate limit exceeded. Please try again in a few moments.';
      case 'API_ERROR':
        return 'AI service is temporarily unavailable. Please try again later.';
      case 'PROVIDER_NOT_CONFIGURED':
        return 'AI provider is not configured. Please add your API key.';
      case 'INVALID_RESPONSE':
        return 'Failed to generate valid ad copy. Please try again.';
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  return 'An unknown error occurred. Please try again.';
}

/* ==================== EXPORTS ==================== */

export default {
  generateHeadlines,
  generateDescriptions,
  generateAdCopy,
  regenerateHeadlines,
  regenerateDescriptions,
  validateHeadline,
  validateDescription,
  isAIServiceAvailable,
  getAvailableProviders,
  formatAIError,
};
