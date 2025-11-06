import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database.js';
import {
  generateMasterScript,
  saveScriptConfig,
  getScriptConfig,
  getScriptStatus
} from '../services/scriptGenerator.js';
import { importCampaignsFromScriptData, importPerformanceFromScriptData } from '../services/importService.js';

const router = express.Router();

/**
 * POST /api/script/generate
 * Generate the master data collection script
 */
router.post('/generate', (req, res) => {
  try {
    const { spreadsheetId, backendUrl, accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    if (!backendUrl) {
      return res.status(400).json({ error: 'backendUrl is required' });
    }

    const config = {
      spreadsheetId: spreadsheetId || '',
      backendUrl,
      accountId
    };

    // Generate the script
    const script = generateMasterScript(config);

    // Save configuration to database
    const db = getDatabase();
    saveScriptConfig(db, config);

    res.json({
      success: true,
      script,
      config
    });
  } catch (error: any) {
    console.error('Error generating script:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/script/sync
 * Receive data from the Google Ads script
 */
router.post('/sync', async (req, res) => {
  try {
    const data = req.body;

    if (!data.accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    console.log(`📡 Received sync from account: ${data.accountId}`);
    console.log(`   Campaigns: ${data.campaigns?.length || 0}`);
    console.log(`   Ad Groups: ${data.adGroups?.length || 0}`);
    console.log(`   Keywords: ${data.keywords?.length || 0}`);
    console.log(`   Ads: ${data.ads?.length || 0}`);
    console.log(`   Search Terms: ${data.searchTerms?.length || 0}`);

    const db = getDatabase();

    // Save sync record (heartbeat)
    const syncId = uuidv4();
    const syncStmt = db.prepare(`
      INSERT INTO script_syncs (id, account_id, timestamp, summary, data_counts)
      VALUES (?, ?, ?, ?, ?)
    `);

    syncStmt.run(
      syncId,
      data.accountId,
      data.timestamp,
      JSON.stringify(data.summary),
      JSON.stringify({
        campaigns: data.campaigns?.length || 0,
        adGroups: data.adGroups?.length || 0,
        keywords: data.keywords?.length || 0,
        ads: data.ads?.length || 0,
        searchTerms: data.searchTerms?.length || 0
      })
    );

    // Import campaign data into our database
    if (data.campaigns && data.campaigns.length > 0) {
      await importCampaignsFromScriptData(db, data);
    }

    // Import performance data
    if (data.performance || data.campaigns) {
      await importPerformanceFromScriptData(db, data);
    }

    res.json({
      success: true,
      summary: {
        received: data.summary,
        imported: {
          campaigns: data.campaigns?.length || 0,
          adGroups: data.adGroups?.length || 0,
          keywords: data.keywords?.length || 0,
          ads: data.ads?.length || 0,
          searchTerms: data.searchTerms?.length || 0
        }
      },
      message: 'Data synced successfully'
    });
  } catch (error: any) {
    console.error('Error processing sync:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/script/error
 * Receive error from the Google Ads script
 */
router.post('/error', (req, res) => {
  try {
    const { accountId, timestamp, error, stack } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    console.error(`❌ Script error from account ${accountId}:`, error);

    const db = getDatabase();
    const errorId = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO script_errors (id, account_id, timestamp, error, stack)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(errorId, accountId, timestamp, error, stack || null);

    res.json({ success: true, message: 'Error logged' });
  } catch (error: any) {
    console.error('Error logging script error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/script/status/:accountId
 * Get script status (health check, last sync, etc.)
 */
router.get('/status/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;

    const db = getDatabase();
    const status = getScriptStatus(db, accountId);

    res.json(status);
  } catch (error: any) {
    console.error('Error getting script status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/script/config/:accountId
 * Get script configuration
 */
router.get('/config/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;

    const db = getDatabase();
    const config = getScriptConfig(db, accountId);

    if (!config) {
      return res.status(404).json({ error: 'Script not configured for this account' });
    }

    res.json(config);
  } catch (error: any) {
    console.error('Error getting script config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/script/history/:accountId
 * Get sync history for an account
 */
router.get('/history/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, timestamp, summary, data_counts
      FROM script_syncs
      WHERE account_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const syncs = stmt.all(accountId, limit) as any[];

    const history = syncs.map(sync => ({
      id: sync.id,
      timestamp: sync.timestamp,
      summary: JSON.parse(sync.summary),
      dataCounts: JSON.parse(sync.data_counts)
    }));

    res.json(history);
  } catch (error: any) {
    console.error('Error getting script history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
