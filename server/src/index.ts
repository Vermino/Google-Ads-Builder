import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import aiRoutes from './routes/ai.routes';
import keywordsRoutes from './routes/keywords.routes';
import campaignRoutes from './routes/campaign.routes';
import adGroupRoutes from './routes/adGroup.routes';
import adRoutes from './routes/ad.routes';
import importRoutes from './routes/import.routes';
import recommendationsRoutes from './routes/recommendations.routes';
import automationRoutes from './routes/automation.routes';
import sheetsRoutes from './routes/sheets.routes';
import scriptRoutes from './routes/script.routes';
import sheetsOAuthRoutes from './routes/sheets-oauth.routes';
import { getAvailableProviders } from './services/aiService';
import { initDatabase } from './db/database';
import { runMigration } from './db/migrate';
import { runDueAutomations } from './services/automationOrchestrator';
import { cleanupExpiredTokens } from './services/tokenCleanup';
import logger from './utils/logger';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Initialize SQLite database (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../data/campaigns.db');
initDatabase(dbPath);

// Run migrations to add any missing columns
runMigration();

// Middleware
// Configure helmet with CSP disabled so we can set custom CSP per route
app.use(helmet({
  contentSecurityPolicy: false, // Disable helmet's CSP to allow custom CSP per route
}));
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', async (_req, res) => {
  const providers = await getAvailableProviders();
  res.json({
    status: 'healthy',
    providers,
    timestamp: new Date().toISOString(),
  });
});

// Routes
// Only apply rate limiting in production
if (config.nodeEnv === 'production') {
  app.use('/api', apiLimiter);
}
app.use('/api/ai', aiRoutes);
app.use('/api/keywords', keywordsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ad-groups', adGroupRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/import', importRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/script', scriptRoutes);
app.use('/api/sheets-oauth', sheetsOAuthRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`, {
    port: PORT,
    environment: config.nodeEnv,
  });
  logger.info(`Client URL: ${config.clientUrl}`);

  const validation = validateConfig();
  if (!validation.valid) {
    logger.warn('Configuration warnings detected:');
    validation.errors.forEach(err => logger.warn(`  - ${err}`));
    logger.warn('Server will start but AI features may not work until configured.');
  } else {
    logger.info('Configuration valid');
  }

  // Start automation scheduler (check every minute)
  logger.info('Automation scheduler started', { interval: '60s' });
  setInterval(async () => {
    try {
      await runDueAutomations();
    } catch (error: any) {
      logger.error('Automation scheduler error', {
        error: error.message,
        stack: error.stack
      });
    }
  }, 60000); // Run every minute

  // Start OAuth token cleanup (check every hour)
  logger.info('OAuth token cleanup started', { interval: '1h' });
  // Run immediately on startup
  cleanupExpiredTokens();
  // Then run every hour
  setInterval(() => {
    cleanupExpiredTokens();
  }, 60 * 60 * 1000); // Run every hour
});
