/**
 * AI Service for Google Ads Copy Generation (Server-Side)
 *
 * Provides AI-powered headline and description generation using OpenAI GPT-4 or Claude.
 * This is the secure server-side version that keeps API keys safe.
 *
 * @module aiService
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config, isProviderConfigured } from '../config/config.js';
import type {
  AIProvider,
  GenerateAdCopyRequest,
  GeneratedAdCopy,
  AIErrorCode,
} from '../types/index.js';

/* ==================== CUSTOM ERROR CLASS ==================== */

/**
 * Custom error class for AI service errors
 */
export class AIServiceError extends Error {
  code: AIErrorCode;
  details?: any;

  constructor(code: AIErrorCode, message: string, details?: any) {
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
 * Initialize OpenAI client (server-side, secure)
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient && config.openaiApiKey) {
    openaiClient = new OpenAI({
      apiKey: config.openaiApiKey,
      // NO dangerouslyAllowBrowser - this is server-side!
    });
  }

  if (!openaiClient) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      'OpenAI API key is not configured on the server'
    );
  }

  return openaiClient;
}

/**
 * Initialize Claude client (server-side, secure)
 */
function getClaudeClient(): Anthropic {
  if (!claudeClient && config.anthropicApiKey) {
    claudeClient = new Anthropic({
      apiKey: config.anthropicApiKey,
      // NO dangerouslyAllowBrowser - this is server-side!
    });
  }

  if (!claudeClient) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      'Claude API key is not configured on the server'
    );
  }

  return claudeClient;
}

/* ==================== PROMPT TEMPLATES ==================== */

/**
 * Generate prompt for headline creation
 */
function buildHeadlinePrompt(request: GenerateAdCopyRequest): string {
  const count = request.headlineCount || 15;
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
  const count = request.descriptionCount || 4;
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
        model: config.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          config.apiTimeoutMs
        )
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
        model: config.claudeModel,
        max_tokens: config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          config.apiTimeoutMs
        )
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

const PROHIBITED_CHARS = /[<>{}[\]\\]/;
const MAX_EXCLAMATION_MARKS = 2;
const MAX_QUESTION_MARKS = 2;
const MAX_HEADLINE_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 90;

/**
 * Validate headline compliance with Google Ads policies
 */
export function validateHeadline(headline: string): boolean {
  // Length check
  if (headline.length === 0 || headline.length > MAX_HEADLINE_LENGTH) {
    return false;
  }

  // Prohibited characters check
  if (PROHIBITED_CHARS.test(headline)) {
    return false;
  }

  // Excessive punctuation check
  const exclamationCount = (headline.match(/!/g) || []).length;
  const questionCount = (headline.match(/\?/g) || []).length;

  if (exclamationCount > MAX_EXCLAMATION_MARKS) {
    return false;
  }

  if (questionCount > MAX_QUESTION_MARKS) {
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
 */
export function validateDescription(description: string): boolean {
  // Length check
  if (description.length === 0 || description.length > MAX_DESCRIPTION_LENGTH) {
    return false;
  }

  // Prohibited characters check
  if (PROHIBITED_CHARS.test(description)) {
    return false;
  }

  // Excessive punctuation check
  const exclamationCount = (description.match(/!/g) || []).length;
  const questionCount = (description.match(/\?/g) || []).length;

  if (exclamationCount > MAX_EXCLAMATION_MARKS) {
    return false;
  }

  if (questionCount > MAX_QUESTION_MARKS) {
    return false;
  }

  return true;
}

/* ==================== MAIN SERVICE FUNCTIONS ==================== */

/**
 * Generate headlines using AI
 */
export async function generateHeadlines(
  request: GenerateAdCopyRequest
): Promise<string[]> {
  // Validate provider is configured
  if (!isProviderConfigured(request.provider)) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      `${request.provider} is not configured on the server. Contact administrator.`
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
 */
export async function generateDescriptions(
  request: GenerateAdCopyRequest
): Promise<string[]> {
  // Validate provider is configured
  if (!isProviderConfigured(request.provider)) {
    throw new AIServiceError(
      'PROVIDER_NOT_CONFIGURED',
      `${request.provider} is not configured on the server. Contact administrator.`
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
 * Main entry point for ad copy generation
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

/* ==================== UTILITY FUNCTIONS ==================== */

/**
 * Check if any AI provider is configured
 */
export function isAIServiceAvailable(): boolean {
  return isProviderConfigured('openai') || isProviderConfigured('claude');
}

/**
 * Get available AI providers
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
