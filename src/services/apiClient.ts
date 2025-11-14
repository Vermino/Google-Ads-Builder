/**
 * API Client for Backend Server Communication
 *
 * Handles all communication with the backend API server.
 * Replaces direct OpenAI/Claude API calls from the browser.
 *
 * @module apiClient
 */

/* ==================== TYPE DEFINITIONS ==================== */

/**
 * API Configuration
 */
interface APIConfig {
  baseUrl: string;
  authToken: string;
}

/**
 * API Error Response
 */
interface APIErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

/**
 * Health Check Response
 */
interface HealthCheckResponse {
  status: string;
  timestamp?: string;
}

/**
 * Available Providers Response
 */
interface ProvidersResponse {
  providers: string[];
}

/**
 * Generate Ad Copy Request
 */
interface GenerateAdCopyRequest {
  provider: 'openai' | 'claude';
  businessDescription: string;
  targetKeywords?: string[];
  tone?: 'professional' | 'casual' | 'urgent' | 'friendly';
  callToAction?: string;
  uniqueSellingPoints?: string[];
  targetAudience?: string;
  headlineCount?: number;
  descriptionCount?: number;
}

/**
 * Generate Ad Copy Response
 */
interface GenerateAdCopyResponse {
  headlines: string[];
  descriptions: string[];
  generatedAt?: string;
}

/**
 * Keyword Research Request
 */
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

/**
 * Keyword Research Response
 */
interface KeywordResearchResponse {
  suggestions: any[];
  relatedTerms: string[];
  longTailVariations: string[];
  negativeKeywords: string[];
}

/**
 * Keyword Expansion Request
 */
interface KeywordExpansionRequest {
  seedKeywords: string[];
}

/**
 * Keyword Expansion Response
 */
interface KeywordExpansionResponse {
  keywords: string[];
}

/* ==================== API CLIENT CLASS ==================== */

/**
 * API Client for backend communication
 */
class APIClient {
  private baseUrl: string;
  private authToken: string;

  constructor(config: APIConfig) {
    this.baseUrl = config.baseUrl;
    this.authToken = config.authToken;
  }

  /**
   * Make a generic API request
   * @param endpoint - API endpoint path
   * @param options - Fetch options
   * @returns Response data
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: APIErrorResponse = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(error.message || error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      // Re-throw with better error message
      throw new Error(
        error.message || 'Failed to connect to API server. Please ensure the backend is running.'
      );
    }
  }

  /* ==================== AI GENERATION ENDPOINTS ==================== */

  /**
   * Generate ad copy (headlines and descriptions)
   * @param request - Generation request parameters
   * @returns Generated ad copy
   */
  async generateAdCopy(request: GenerateAdCopyRequest): Promise<GenerateAdCopyResponse> {
    const response = await this.request<{ success: boolean; data: GenerateAdCopyResponse }>('/api/ai/generate-copy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  /**
   * Get available AI providers
   * @returns List of available providers
   */
  async getProviders(): Promise<ProvidersResponse> {
    const response = await this.request<{ success: boolean; data: ProvidersResponse }>('/api/ai/providers');
    return response.data;
  }

  /* ==================== KEYWORD RESEARCH ENDPOINTS ==================== */

  /**
   * Research keywords using AI
   * @param request - Keyword research request
   * @returns Keyword research results
   */
  async researchKeywords(request: KeywordResearchRequest): Promise<KeywordResearchResponse> {
    const response = await this.request<{ success: boolean; data: KeywordResearchResponse }>('/api/keywords/research', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  /**
   * Expand keywords (quick expansion without AI)
   * @param request - Keyword expansion request
   * @returns Expanded keywords
   */
  async expandKeywords(request: KeywordExpansionRequest): Promise<KeywordExpansionResponse> {
    const response = await this.request<{ success: boolean; data: KeywordExpansionResponse }>('/api/keywords/expand', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  /* ==================== HEALTH CHECK ==================== */

  /**
   * Check API server health
   * @returns Health status
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/health');
  }

  /* ==================== OAUTH ENDPOINTS ==================== */

  /**
   * Disconnect Claude token
   * @returns Success response
   */
  async disconnectClaude(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/oauth/disconnect', {
      method: 'DELETE',
    });
  }
}

/* ==================== CONFIGURATION ==================== */

/**
 * Get API configuration from environment variables
 */
function getAPIConfig(): APIConfig {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const authToken = import.meta.env.VITE_API_TOKEN || '';

  return {
    baseUrl,
    authToken,
  };
}

/**
 * Get API base URL for direct fetch calls
 * Use this when you need to make manual fetch calls instead of using the apiClient methods
 */
export function getAPIBaseURL(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

/* ==================== EXPORTS ==================== */

/**
 * Singleton API client instance
 */
export const apiClient = new APIClient(getAPIConfig());

/**
 * Check if API is properly configured
 * @returns true if API URL and token are configured
 */
export function isAPIConfigured(): boolean {
  const config = getAPIConfig();
  return !!config.authToken && !!config.baseUrl;
}

/**
 * Get API configuration for debugging
 * @returns API configuration (with token hidden)
 */
export function getAPIConfigDebug() {
  const config = getAPIConfig();
  return {
    baseUrl: config.baseUrl,
    hasToken: !!config.authToken,
    tokenPrefix: config.authToken ? config.authToken.substring(0, 8) + '...' : 'none',
  };
}

/**
 * Export types for use in other services
 */
export type {
  GenerateAdCopyRequest,
  GenerateAdCopyResponse,
  KeywordResearchRequest,
  KeywordResearchResponse,
  KeywordExpansionRequest,
  KeywordExpansionResponse,
  ProvidersResponse,
  HealthCheckResponse,
};
