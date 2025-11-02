/**
 * Server Configuration
 *
 * Loads and validates environment variables for the API server.
 */

import dotenv from 'dotenv';
import type { EnvironmentConfig } from '../types/index.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Parse comma-separated environment variable
 */
function parseList(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Parse boolean environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer environment variable
 */
function parseInt(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse float environment variable
 */
function parseFloat(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Environment configuration
 */
export const config: EnvironmentConfig = {
  // Server
  port: parseInt(process.env.PORT, 8000),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS, [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ]),

  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // Auth - support both single token and multiple tokens
  apiAuthToken: process.env.API_AUTH_TOKEN || '',
  apiAuthTokens: process.env.API_AUTH_TOKENS
    ? parseList(process.env.API_AUTH_TOKENS)
    : process.env.API_AUTH_TOKEN
    ? [process.env.API_AUTH_TOKEN]
    : [],

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 100),

  // AI Configuration
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: parseInt(process.env.MAX_TOKENS, 500),
  temperature: parseFloat(process.env.TEMPERATURE, 0.7),
  apiTimeoutMs: parseInt(process.env.API_TIMEOUT_MS, 30000),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logRequests: parseBoolean(process.env.LOG_REQUESTS, true),
};

/**
 * Validate required configuration
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check authentication is configured
  if (config.apiAuthTokens.length === 0) {
    errors.push('API_AUTH_TOKEN or API_AUTH_TOKENS must be configured');
  }

  // Check at least one AI provider is configured
  if (!config.openaiApiKey && !config.anthropicApiKey) {
    errors.push('At least one AI provider API key must be configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
  }

  // Validate OpenAI key format if provided
  if (config.openaiApiKey && !config.openaiApiKey.startsWith('sk-')) {
    errors.push('OPENAI_API_KEY appears to be invalid (should start with "sk-")');
  }

  // Validate Claude key format if provided
  if (config.anthropicApiKey && !config.anthropicApiKey.startsWith('sk-ant-')) {
    errors.push('ANTHROPIC_API_KEY appears to be invalid (should start with "sk-ant-")');
  }

  // Validate port range
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a specific provider is configured
 */
export function isProviderConfigured(provider: 'openai' | 'claude'): boolean {
  if (provider === 'openai') {
    return !!config.openaiApiKey && config.openaiApiKey.startsWith('sk-');
  } else {
    return !!config.anthropicApiKey && config.anthropicApiKey.startsWith('sk-ant-');
  }
}

/**
 * Get available AI providers
 */
export function getAvailableProviders(): ('openai' | 'claude')[] {
  const providers: ('openai' | 'claude')[] = [];

  if (isProviderConfigured('openai')) {
    providers.push('openai');
  }

  if (isProviderConfigured('claude')) {
    providers.push('claude');
  }

  return providers;
}

export default config;
