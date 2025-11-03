/**
 * AI Service for Google Ads Copy Generation
 *
 * Provides AI-powered headline and description generation via backend API.
 * Ensures all generated copy complies with Google Ads content policies and character limits.
 *
 * NOTE: This service now uses the backend API instead of direct OpenAI/Claude calls.
 * API keys are stored securely on the server.
 *
 * @module aiService
 */

import { apiClient, isAPIConfigured } from './apiClient';

/* ==================== TYPE DEFINITIONS ==================== */

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'claude' | 'gemini';

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
 * Headline category for RSA positioning strategy
 */
export type HeadlineCategory = 'KEYWORD' | 'VALUE' | 'CTA' | 'GENERAL';

/**
 * Headline with category metadata
 */
export interface HeadlineWithCategory {
  /** Headline text */
  text: string;
  /** Category for positioning strategy */
  category: HeadlineCategory;
}

/**
 * Generated ad copy response
 */
export interface GeneratedAdCopy {
  /** Generated headlines with categories */
  headlines: HeadlineWithCategory[];

  /** Generated descriptions (max 90 characters each) */
  descriptions: string[];

  /** Timestamp when copy was generated */
  generatedAt: string;

  /** Provider used for generation */
  provider?: AIProvider;
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

/* ==================== VALIDATION (Client-side) ==================== */

/**
 * Maximum character lengths for Google Ads
 */
const MAX_HEADLINE_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 90;

/**
 * Google Ads content policy patterns
 */
const PROHIBITED_CHARS_REGEX = /[<>{}[\]\\]/;
const MAX_EXCLAMATION_MARKS = 2;
const MAX_QUESTION_MARKS = 2;

/**
 * Validate headline compliance with Google Ads policies
 * @param headline - The headline to validate
 * @returns true if valid, false otherwise
 */
export function validateHeadline(headline: string): boolean {
  // Allow any length for manual review - user will see warnings in UI
  if (headline.length === 0) {
    return false;
  }

  // Prohibited characters check
  if (PROHIBITED_CHARS_REGEX.test(headline)) {
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
 * @param description - The description to validate
 * @returns true if valid, false otherwise
 */
export function validateDescription(description: string): boolean {
  // Allow any length for manual review - user will see warnings in UI
  if (description.length === 0) {
    return false;
  }

  // Prohibited characters check
  if (PROHIBITED_CHARS_REGEX.test(description)) {
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
 * Generate headlines using AI via backend API
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
  // Check if API is configured
  if (!isAPIConfigured()) {
    throw new AIServiceError(
      'API_ERROR',
      'API not configured. Please check your environment variables (.env.local).'
    );
  }

  try {
    // Call backend API
    const response = await apiClient.generateAdCopy({
      provider: request.provider,
      businessDescription: request.businessDescription,
      targetKeywords: request.targetKeywords,
      tone: request.tone,
      callToAction: request.callToAction,
      uniqueSellingPoints: request.uniqueSellingPoints,
      targetAudience: request.targetAudience,
      headlineCount: request.headlineCount || 15,
      descriptionCount: 0, // Only need headlines
    });

    const headlines = response.headlines || [];

    // Validate generated headlines
    const validHeadlines = headlines.filter((h) => validateHeadline(h));

    if (validHeadlines.length === 0) {
      throw new AIServiceError(
        'INVALID_RESPONSE',
        'No valid headlines generated. Please try again.'
      );
    }

    return validHeadlines;
  } catch (error: any) {
    // Convert API errors to AIServiceError
    if (error instanceof AIServiceError) {
      throw error;
    }

    throw new AIServiceError(
      'API_ERROR',
      error.message || 'Failed to generate headlines',
      error
    );
  }
}

/**
 * Generate descriptions using AI via backend API
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
  // Check if API is configured
  if (!isAPIConfigured()) {
    throw new AIServiceError(
      'API_ERROR',
      'API not configured. Please check your environment variables (.env.local).'
    );
  }

  try {
    // Call backend API
    const response = await apiClient.generateAdCopy({
      provider: request.provider,
      businessDescription: request.businessDescription,
      targetKeywords: request.targetKeywords,
      tone: request.tone,
      callToAction: request.callToAction,
      uniqueSellingPoints: request.uniqueSellingPoints,
      targetAudience: request.targetAudience,
      headlineCount: 0, // Only need descriptions
      descriptionCount: request.descriptionCount || 4,
    });

    const descriptions = response.descriptions || [];

    // Validate generated descriptions
    const validDescriptions = descriptions.filter((d) => validateDescription(d));

    if (validDescriptions.length === 0) {
      throw new AIServiceError(
        'INVALID_RESPONSE',
        'No valid descriptions generated. Please try again.'
      );
    }

    return validDescriptions;
  } catch (error: any) {
    // Convert API errors to AIServiceError
    if (error instanceof AIServiceError) {
      throw error;
    }

    throw new AIServiceError(
      'API_ERROR',
      error.message || 'Failed to generate descriptions',
      error
    );
  }
}

/**
 * Generate complete ad copy (headlines + descriptions) via backend API
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
  // Check if API is configured
  if (!isAPIConfigured()) {
    throw new AIServiceError(
      'API_ERROR',
      'API not configured. Please check your environment variables (.env.local).'
    );
  }

  try {
    // Call backend API for complete generation
    const response = await apiClient.generateAdCopy({
      provider: request.provider,
      businessDescription: request.businessDescription,
      targetKeywords: request.targetKeywords,
      tone: request.tone,
      callToAction: request.callToAction,
      uniqueSellingPoints: request.uniqueSellingPoints,
      targetAudience: request.targetAudience,
      headlineCount: request.headlineCount || 15,
      descriptionCount: request.descriptionCount || 4,
    });

    // Validate results
    console.log('🔍 Backend response:', {
      headlines: response.headlines?.length || 0,
      descriptions: response.descriptions?.length || 0
    });

    const validHeadlines = (response.headlines || []).filter((h) => validateHeadline(h.text));
    const validDescriptions = (response.descriptions || []).filter((d) => validateDescription(d));

    console.log('✅ After validation:', {
      validHeadlines: validHeadlines.length,
      validDescriptions: validDescriptions.length,
      headlines: validHeadlines,
      descriptions: validDescriptions
    });

    if (validHeadlines.length === 0 && validDescriptions.length === 0) {
      throw new AIServiceError(
        'INVALID_RESPONSE',
        'No valid ad copy generated. Please try again.'
      );
    }

    return {
      headlines: validHeadlines,
      descriptions: validDescriptions,
      generatedAt: response.generatedAt || new Date().toISOString(),
      provider: request.provider,
    };
  } catch (error: any) {
    // Convert API errors to AIServiceError
    if (error instanceof AIServiceError) {
      throw error;
    }

    throw new AIServiceError(
      'API_ERROR',
      error.message || 'Failed to generate ad copy',
      error
    );
  }
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
 * Check if AI service is available
 * @returns true if backend API is configured
 */
export async function isAIServiceAvailable(): Promise<boolean> {
  if (!isAPIConfigured()) {
    return false;
  }

  try {
    const providers = await apiClient.getProviders();
    return providers.providers && providers.providers.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get available AI providers from backend
 * @returns Array of configured providers
 */
export async function getAvailableProviders(): Promise<AIProvider[]> {
  if (!isAPIConfigured()) {
    return [];
  }

  try {
    const result = await apiClient.getProviders();
    return result.providers.filter(
      (p): p is AIProvider => p === 'openai' || p === 'claude' || p === 'gemini'
    );
  } catch {
    return [];
  }
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
        return 'Authentication failed. Please contact administrator.';
      case 'RATE_LIMIT':
        return 'Rate limit exceeded. Please try again in a few moments.';
      case 'API_ERROR':
        return 'AI service is temporarily unavailable. Please ensure the backend server is running.';
      case 'PROVIDER_NOT_CONFIGURED':
        return 'AI provider is not configured on the server.';
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
