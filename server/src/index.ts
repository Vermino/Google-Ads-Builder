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
import { join } from 'path';

const app = express();

// Initialize SQLite database
const dbPath = join(__dirname, '../data/campaigns.db');
initDatabase(dbPath);

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
app.use('/api', apiLimiter);
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Client: ${config.clientUrl}`);

  const validation = validateConfig();
  if (!validation.valid) {
    console.log('\n⚠️  Configuration warnings:');
    validation.errors.forEach(err => console.log(`  - ${err}`));
    console.log('\nServer will start but AI features may not work until configured.\n');
  } else {
    console.log('✅ Configuration valid');
  }
});
