import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import aiRoutes from './routes/ai.routes';
import keywordsRoutes from './routes/keywords.routes';
import claudeRoutes from './routes/claude.routes';
import campaignRoutes from './routes/campaign.routes';
import adGroupRoutes from './routes/adGroup.routes';
import adRoutes from './routes/ad.routes';
import { getAvailableProviders } from './services/aiService';
import { initDatabase } from './db/database';
import { runMigration } from './db/migrate';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger';

const app = express();

// Initialize SQLite database (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../data/campaigns.db');
initDatabase(dbPath);

// Run migrations to add any missing columns
runMigration();

// Middleware
app.use(helmet());
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
app.use('/api/claude', claudeRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ad-groups', adGroupRoutes);
app.use('/api/ads', adRoutes);

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
});
