/**
 * Shared TypeScript types for the API server
 */

/* ==================== AI PROVIDER TYPES ==================== */

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'claude';

/**
 * Tone options for generated ad copy
 */
export type AdTone = 'professional' | 'casual' | 'urgent' | 'friendly';

/* ==================== REQUEST TYPES ==================== */

/**
 * Request parameters for ad copy generation
 */
export interface GenerateAdCopyRequest {
  provider: AIProvider;
  businessDescription: string;
  targetKeywords?: string[];
  tone?: AdTone;
  callToAction?: string;
  uniqueSellingPoints?: string[];
  targetAudience?: string;
  headlineCount?: number;
  descriptionCount?: number;
}

/**
 * Request parameters for keyword research
 */
export interface KeywordResearchRequest {
  provider: AIProvider;
  seedKeywords: string[];
  businessDescription?: string;
  targetLocation?: string;
  language?: string;
  maxResults?: number;
  includeLongTail?: boolean;
  includeNegativeKeywords?: boolean;
}

/* ==================== RESPONSE TYPES ==================== */

/**
 * Generated ad copy response
 */
export interface GeneratedAdCopy {
  headlines: string[];
  descriptions: string[];
  generatedAt: string;
  provider: AIProvider;
}

/**
 * Match type settings for keywords
 */
export interface MatchTypeSettings {
  exact: boolean;
  phrase: boolean;
  broad: boolean;
}

/**
 * Individual keyword suggestion
 */
export interface KeywordSuggestion {
  keyword: string;
  matchTypes: MatchTypeSettings;
  relevanceScore: number;
  estimatedCPC?: number;
  competition?: 'Low' | 'Medium' | 'High';
  category?: string;
  searchVolume?: number;
  isLongTail: boolean;
}

/**
 * Keyword research results
 */
export interface KeywordResearchResult {
  suggestions: KeywordSuggestion[];
  relatedTerms: string[];
  longTailVariations: string[];
  negativeKeywords: string[];
  researchedAt: string;
  provider: AIProvider;
}

/* ==================== ERROR TYPES ==================== */

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
 * Structured API error response
 */
export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Successful API response
 */
export interface APIResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/* ==================== CONFIGURATION TYPES ==================== */

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];

  // API Keys
  openaiApiKey: string;
  anthropicApiKey: string;

  // Auth
  apiAuthToken: string;
  apiAuthTokens: string[];

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // AI Config
  openaiModel: string;
  claudeModel: string;
  maxTokens: number;
  temperature: number;
  apiTimeoutMs: number;

  // Logging
  logLevel: string;
  logRequests: boolean;
}
