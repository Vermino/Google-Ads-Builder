import dotenv from 'dotenv';
dotenv.config();

// Mutable config object that can be updated at runtime
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5174',

  // AI Provider API Keys
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Auth
  authToken: process.env.API_AUTH_TOKEN || '',
  apiAuthTokens: process.env.API_AUTH_TOKEN ? [process.env.API_AUTH_TOKEN] : [],

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
};

// Validation
export function validateConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.authToken) {
    errors.push('API_AUTH_TOKEN not set');
  }

  if (!config.claudeApiKey && !config.geminiApiKey) {
    warnings.push('No AI providers configured. Set CLAUDE_API_KEY or GEMINI_API_KEY in .env');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Check if Claude is configured
export function isClaudeConfigured(): boolean {
  return !!config.claudeApiKey;
}

// Check if Gemini is configured
export function isGeminiConfigured(): boolean {
  return !!config.geminiApiKey;
}
