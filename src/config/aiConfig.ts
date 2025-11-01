/**
 * AI Service Configuration
 *
 * Configuration for OpenAI and Claude API integrations.
 * Manages API keys, model settings, and generation parameters.
 */

export const AI_CONFIG = {
  /**
   * OpenAI Configuration
   */
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',
    maxTokens: 500,
    temperature: 0.7,
  },

  /**
   * Claude (Anthropic) Configuration
   */
  claude: {
    apiKey: import.meta.env.VITE_CLAUDE_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 500,
  },

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
 * Validate AI configuration
 * @returns true if configuration is valid
 */
export function validateAIConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!AI_CONFIG.openai.apiKey && !AI_CONFIG.claude.apiKey) {
    errors.push('At least one AI provider API key must be configured');
  }

  if (AI_CONFIG.openai.apiKey && !AI_CONFIG.openai.apiKey.startsWith('sk-')) {
    errors.push('OpenAI API key appears to be invalid');
  }

  if (AI_CONFIG.claude.apiKey && !AI_CONFIG.claude.apiKey.startsWith('sk-ant-')) {
    errors.push('Claude API key appears to be invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a specific provider is configured
 * @param provider - The AI provider to check
 * @returns true if the provider is configured with a valid API key
 */
export function isProviderConfigured(provider: 'openai' | 'claude'): boolean {
  if (provider === 'openai') {
    return !!AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey.startsWith('sk-');
  } else {
    return !!AI_CONFIG.claude.apiKey && AI_CONFIG.claude.apiKey.startsWith('sk-ant-');
  }
}
