/**
 * AI Service Configuration
 *
 * NOTE: This configuration is now primarily for reference and validation constants.
 * API keys are NO LONGER stored in the frontend. All AI requests now go through
 * the secure backend API server.
 *
 * The backend API configuration is in .env.local:
 * - VITE_API_URL: Backend server URL
 * - VITE_API_TOKEN: Authentication token for backend API
 */

/**
 * AI Configuration (for reference and constants only)
 */
export const AI_CONFIG = {
  /**
   * Ad Copy Generation Settings
   */
  generation: {
    defaultHeadlineCount: 15,
    defaultDescriptionCount: 4,
    maxHeadlineLength: 30,
    maxDescriptionLength: 90,

    /**
     * Retry settings for API calls
     */
    retry: {
      maxAttempts: 3,
      delayMs: 1000,
    },

    /**
     * Timeout for API calls (milliseconds)
     */
    timeoutMs: 30000,
  },

  /**
   * Google Ads Content Policies
   */
  policies: {
    /**
     * Prohibited characters in ad copy
     */
    prohibitedChars: /[<>{}[\]\\]/,

    /**
     * Maximum punctuation marks allowed
     */
    maxExclamationMarks: 2,
    maxQuestionMarks: 2,

    /**
     * Words that require substantiation
     */
    superlatives: [
      'best',
      'cheapest',
      'fastest',
      'largest',
      'greatest',
      'number one',
      '#1',
      'top',
    ],
  },
} as const;

/**
 * @deprecated API keys are no longer stored in the frontend
 * Use the backend API via apiClient instead
 */
export function validateAIConfig(): {
  isValid: boolean;
  errors: string[];
} {
  console.warn(
    'validateAIConfig is deprecated. Frontend no longer stores API keys. Use backend API instead.'
  );
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * @deprecated API providers are now configured on the backend
 * Use apiClient.getProviders() to check available providers
 */
export function isProviderConfigured(_provider: 'openai' | 'claude'): boolean {
  console.warn(
    'isProviderConfigured is deprecated. Check providers via backend API using apiClient.getProviders()'
  );
  return false;
}
