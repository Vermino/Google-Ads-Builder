/**
 * Google Sheets Integration API Routes
 * Handles Google Sheets configuration and data synchronization
 */

import express, { Request, Response } from 'express';
import {
  saveSheetsConfig,
  getSheetsConfig,
  syncPerformanceDataFromSheets,
  generateGoogleAdsScript,
} from '../services/sheetsIntegration.js';

const router = express.Router();

/**
 * GET /api/sheets/config
 * Get current Google Sheets configuration
 */
router.get('/config', (req: Request, res: Response) => {
  try {
    const config = getSheetsConfig();

    if (!config) {
      return res.json({
        success: true,
        configured: false,
        config: null,
      });
    }

    // Don't send private key to frontend
    const safeConfig = {
      spreadsheetId: config.spreadsheetId,
      serviceAccountEmail: config.serviceAccountEmail,
      performanceSheetName: config.performanceSheetName,
      searchTermsSheetName: config.searchTermsSheetName,
      assetPerformanceSheetName: config.assetPerformanceSheetName,
    };

    res.json({
      success: true,
      configured: true,
      config: safeConfig,
    });

  } catch (error) {
    console.error('Error fetching Sheets config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch configuration',
    });
  }
});

/**
 * POST /api/sheets/config
 * Save Google Sheets configuration
 */
router.post('/config', (req: Request, res: Response) => {
  try {
    const {
      spreadsheetId,
      serviceAccountEmail,
      privateKey,
      performanceSheetName,
      searchTermsSheetName,
      assetPerformanceSheetName,
    } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        error: 'spreadsheetId is required',
      });
    }

    // Service account credentials are optional but recommended
    if (!serviceAccountEmail && !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Either serviceAccountEmail and privateKey are required for authentication',
      });
    }

    saveSheetsConfig({
      spreadsheetId,
      serviceAccountEmail,
      privateKey,
      performanceSheetName: performanceSheetName || 'Performance',
      searchTermsSheetName: searchTermsSheetName || 'SearchTerms',
      assetPerformanceSheetName: assetPerformanceSheetName || 'AssetPerformance',
    });

    res.json({
      success: true,
      message: 'Google Sheets configuration saved',
    });

  } catch (error) {
    console.error('Error saving Sheets config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save configuration',
    });
  }
});

/**
 * POST /api/sheets/sync
 * Manually trigger synchronization from Google Sheets
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const config = getSheetsConfig();

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Google Sheets not configured. Please configure it first.',
      });
    }

    const { dateRangeDays = 7 } = req.body;

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - dateRangeDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const result = await syncPerformanceDataFromSheets(config, startDate, endDate);

    res.json({
      success: result.success,
      result,
    });

  } catch (error) {
    console.error('Error syncing Sheets data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync data',
    });
  }
});

/**
 * GET /api/sheets/script
 * Generate Google Ads Script for the user to install
 */
router.get('/script', (req: Request, res: Response) => {
  try {
    const config = getSheetsConfig();

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Google Sheets not configured. Please configure it first.',
      });
    }

    const script = generateGoogleAdsScript({
      spreadsheetId: config.spreadsheetId,
      performanceSheetName: config.performanceSheetName || 'Performance',
      searchTermsSheetName: config.searchTermsSheetName || 'SearchTerms',
      assetPerformanceSheetName: config.assetPerformanceSheetName || 'AssetPerformance',
    });

    res.json({
      success: true,
      script,
    });

  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate script',
    });
  }
});

/**
 * DELETE /api/sheets/config
 * Remove Google Sheets configuration
 */
router.delete('/config', (req: Request, res: Response) => {
  try {
    const { getDatabase } = require('../db/database.js');
    const db = getDatabase();

    db.prepare('DELETE FROM sheets_configs').run();

    res.json({
      success: true,
      message: 'Google Sheets configuration removed',
    });

  } catch (error) {
    console.error('Error removing Sheets config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove configuration',
    });
  }
});

/**
 * GET /api/sheets/setup-guide
 * Get setup instructions for Google Sheets integration
 */
router.get('/setup-guide', (req: Request, res: Response) => {
  const guide = {
    title: 'Google Sheets Integration Setup Guide',
    steps: [
      {
        step: 1,
        title: 'Create a Google Cloud Service Account',
        instructions: [
          'Go to Google Cloud Console (console.cloud.google.com)',
          'Create a new project or select an existing one',
          'Enable the Google Sheets API',
          'Go to IAM & Admin > Service Accounts',
          'Create a new service account',
          'Create a JSON key for the service account',
          'Download the JSON key file',
        ],
      },
      {
        step: 2,
        title: 'Create Google Sheets Spreadsheet',
        instructions: [
          'Create a new Google Sheets spreadsheet',
          'Copy the spreadsheet ID from the URL',
          'Share the spreadsheet with the service account email (found in JSON key)',
          'Give it "Editor" permissions',
        ],
      },
      {
        step: 3,
        title: 'Configure in Google Ads Builder',
        instructions: [
          'Enter the spreadsheet ID',
          'Enter the service account email (client_email from JSON)',
          'Enter the private key (private_key from JSON)',
          'Optionally customize sheet names',
          'Save configuration',
        ],
      },
      {
        step: 4,
        title: 'Install Google Ads Script',
        instructions: [
          'Go to your Google Ads account',
          'Navigate to Tools & Settings > Bulk Actions > Scripts',
          'Click the + button to create a new script',
          'Copy the generated script from the "Get Script" endpoint',
          'Paste it into the Google Ads Script editor',
          'Authorize the script',
          'Schedule it to run daily',
        ],
      },
      {
        step: 5,
        title: 'Test the Integration',
        instructions: [
          'Run the Google Ads Script manually first',
          'Wait for it to populate the Google Sheets',
          'Use the "Sync Now" button in Google Ads Builder',
          'Verify that performance data appears in your campaigns',
        ],
      },
    ],
    tips: [
      'The service account needs "Editor" access to the spreadsheet',
      'Make sure the spreadsheet ID is correct (it\'s in the URL)',
      'The private key should include the BEGIN/END markers',
      'Sheet names must match exactly between script and configuration',
      'Run the script daily for best results',
    ],
  };

  res.json({
    success: true,
    guide,
  });
});

export default router;
