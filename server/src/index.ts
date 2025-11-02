/**
 * Google Ads Campaign Builder API Server
 *
 * Secure backend API proxy for AI services.
 * Keeps API keys safe on the server and provides authenticated endpoints.
 *
 * @module server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig, getAvailableProviders } from './config/config.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import aiRoutes from './routes/ai.routes.js';
import keywordsRoutes from './routes/keywords.routes.js';

const app = express();

/* ==================== CONFIGURATION VALIDATION ==================== */

console.log('🔧 Validating server configuration...');
const configValidation = validateConfig();

if (!configValidation.isValid) {
  console.error('\n❌ Configuration errors:');
  configValidation.errors.forEach((error) => {
    console.error(`  - ${error}`);
  });
  console.error('\nPlease fix the configuration errors in .env file and restart.\n');
  process.exit(1);
}

console.log('✅ Configuration valid');

/* ==================== MIDDLEWARE ==================== */

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (config.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (in development)
if (config.logRequests) {
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

/* ==================== HEALTH CHECK ==================== */

/**
 * GET /health
 *
 * Server health check endpoint
 */
app.get('/health', (_req, res) => {
  const providers = getAvailableProviders();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv,
      aiProviders: {
        available: providers,
        openai: providers.includes('openai'),
        claude: providers.includes('claude'),
      },
    },
  });
});

/**
 * GET /
 *
 * API information endpoint
 */
app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Google Ads Campaign Builder API',
      version: '1.0.0',
      description: 'Secure API proxy for AI-powered ad copy generation and keyword research',
      endpoints: {
        health: 'GET /health',
        ai: {
          generateCopy: 'POST /api/ai/generate-copy',
          providers: 'GET /api/ai/providers',
          health: 'GET /api/ai/health',
        },
        keywords: {
          research: 'POST /api/keywords/research',
          expand: 'POST /api/keywords/expand',
          negative: 'POST /api/keywords/negative',
        },
      },
      authentication: 'Bearer token required (Authorization: Bearer <token>)',
      documentation: 'See README.md for full API documentation',
    },
  });
});

/* ==================== API ROUTES ==================== */

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// AI copy generation routes
app.use('/api/ai', aiRoutes);

// Keyword research routes
app.use('/api/keywords', keywordsRoutes);

/* ==================== ERROR HANDLING ==================== */

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

/* ==================== SERVER STARTUP ==================== */

const PORT = config.port;

app.listen(PORT, () => {
  console.log('\n🚀 ===== SERVER STARTED =====');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📱 Allowed origins: ${config.allowedOrigins.join(', ')}`);

  const providers = getAvailableProviders();
  console.log(`\n🤖 AI Providers:`);
  console.log(`  - OpenAI: ${providers.includes('openai') ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  - Claude:  ${providers.includes('claude') ? '✅ Configured' : '❌ Not configured'}`);

  if (providers.length === 0) {
    console.log('\n⚠️  WARNING: No AI providers configured!');
    console.log('   Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env file');
  }

  console.log(`\n🔐 Authentication:`);
  console.log(`  - Tokens configured: ${config.apiAuthTokens.length}`);

  console.log(`\n🛡️  Rate Limiting:`);
  console.log(`  - Window: ${config.rateLimitWindowMs / 1000 / 60} minutes`);
  console.log(`  - Max requests: ${config.rateLimitMaxRequests} per window`);

  console.log(`\n📚 API Endpoints:`);
  console.log(`  - Health:          GET  http://localhost:${PORT}/health`);
  console.log(`  - Generate Copy:   POST http://localhost:${PORT}/api/ai/generate-copy`);
  console.log(`  - Research KWs:    POST http://localhost:${PORT}/api/keywords/research`);
  console.log(`  - Providers:       GET  http://localhost:${PORT}/api/ai/providers`);

  console.log('\n✨ Server ready to accept requests!');
  console.log('============================\n');
});

/* ==================== GRACEFUL SHUTDOWN ==================== */

process.on('SIGTERM', () => {
  console.log('\n📛 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📛 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
