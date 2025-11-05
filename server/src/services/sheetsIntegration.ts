/**
 * Google Sheets Integration Service
 *
 * Integrates with Google Sheets API to fetch performance data
 * populated by Google Ads Scripts. This is an easier alternative
 * to the Google Ads API for accessing performance metrics.
 *
 * Setup:
 * 1. Create a Google Ads Script that exports data to Google Sheets
 * 2. Configure the Sheet ID and credentials in this service
 * 3. Schedule automatic data pulls
 */

import { google, sheets_v4 } from 'googleapis';
import { getDatabase } from '../db/database.js';
import { nanoid } from 'nanoid';
import { importPerformanceData, importSearchTerms } from './importService.js';

export interface SheetsConfig {
  spreadsheetId: string;
  credentialsPath?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
  performanceSheetName?: string;
  searchTermsSheetName?: string;
  assetPerformanceSheetName?: string;
}

export interface SheetsSyncResult {
  success: boolean;
  performanceRecords: number;
  searchTerms: number;
  assetRecords: number;
  errors: string[];
}

/**
 * Get authenticated Google Sheets client
 */
async function getSheetsClient(config: SheetsConfig): Promise<sheets_v4.Sheets> {
  let auth;

  if (config.serviceAccountEmail && config.privateKey) {
    // Service account authentication (recommended for automation)
    auth = new google.auth.JWT({
      email: config.serviceAccountEmail,
      key: config.privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  } else if (config.credentialsPath) {
    // OAuth2 authentication (for user-based access)
    // This would require a more complex setup with token refresh
    throw new Error('OAuth2 authentication not yet implemented. Please use service account.');
  } else {
    throw new Error('No authentication credentials provided');
  }

  await auth.authorize();

  return google.sheets({ version: 'v4', auth });
}

/**
 * Fetch performance data from Google Sheets
 */
export async function syncPerformanceDataFromSheets(
  config: SheetsConfig,
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<SheetsSyncResult> {
  const errors: string[] = [];
  let performanceRecords = 0;
  let searchTerms = 0;
  let assetRecords = 0;

  try {
    const sheets = await getSheetsClient(config);

    // Fetch performance data sheet
    if (config.performanceSheetName) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: `${config.performanceSheetName}!A:Z`,
        });

        const rows = response.data.values;
        if (rows && rows.length > 0) {
          // Convert to CSV format
          const csv = rows.map(row => row.join(',')).join('\n');

          // Import using existing import service
          const result = await importPerformanceData(csv, dateRangeStart, dateRangeEnd);
          performanceRecords = result.stats.performanceRecordsCreated;

          if (result.errors.length > 0) {
            errors.push(...result.errors.map(e => e.message));
          }
        }
      } catch (error) {
        errors.push(`Error fetching performance data: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Fetch search terms sheet
    if (config.searchTermsSheetName) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: `${config.searchTermsSheetName}!A:Z`,
        });

        const rows = response.data.values;
        if (rows && rows.length > 0) {
          const csv = rows.map(row => row.join(',')).join('\n');

          const result = await importSearchTerms(csv, dateRangeStart, dateRangeEnd);
          searchTerms = result.stats.searchTermsCreated;

          if (result.errors.length > 0) {
            errors.push(...result.errors.map(e => e.message));
          }
        }
      } catch (error) {
        errors.push(`Error fetching search terms: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Fetch asset performance sheet
    if (config.assetPerformanceSheetName) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: `${config.assetPerformanceSheetName}!A:Z`,
        });

        const rows = response.data.values;
        if (rows && rows.length > 1) {
          // Parse asset performance data
          assetRecords = await importAssetPerformanceFromRows(rows, dateRangeStart, dateRangeEnd);
        }
      } catch (error) {
        errors.push(`Error fetching asset performance: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      performanceRecords,
      searchTerms,
      assetRecords,
      errors,
    };

  } catch (error) {
    errors.push(`Fatal error syncing with Google Sheets: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      performanceRecords: 0,
      searchTerms: 0,
      assetRecords: 0,
      errors,
    };
  }
}

/**
 * Import asset performance data from sheet rows
 */
async function importAssetPerformanceFromRows(
  rows: any[][],
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<number> {
  const db = getDatabase();
  const headers = rows[0].map((h: string) => h.toLowerCase().trim());
  let recordsCreated = 0;

  const getColumnIndex = (name: string) => {
    const variations = [
      name,
      name.replace(/_/g, ' '),
      name.replace(/ /g, '_'),
    ];

    for (const variation of variations) {
      const index = headers.findIndex(h => h === variation.toLowerCase());
      if (index !== -1) return index;
    }
    return -1;
  };

  const campaignIdx = getColumnIndex('campaign');
  const adGroupIdx = getColumnIndex('ad_group');
  const adIdx = getColumnIndex('ad');
  const assetTypeIdx = getColumnIndex('asset_type');
  const assetTextIdx = getColumnIndex('asset_text');
  const performanceLabelIdx = getColumnIndex('performance_label');
  const impressionsIdx = getColumnIndex('impressions');

  if (campaignIdx === -1 || assetTypeIdx === -1 || assetTextIdx === -1) {
    throw new Error('Required columns not found in asset performance sheet');
  }

  db.transaction(() => {
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const campaignName = row[campaignIdx];
      const adGroupName = adGroupIdx !== -1 ? row[adGroupIdx] : null;
      const assetType = row[assetTypeIdx]?.toLowerCase();
      const assetText = row[assetTextIdx];
      const performanceLabel = performanceLabelIdx !== -1 ? row[performanceLabelIdx] : null;
      const impressions = impressionsIdx !== -1 ? parseInt(row[impressionsIdx] || '0') : 0;

      if (!campaignName || !assetType || !assetText) continue;

      // Find campaign
      const campaign = db.prepare(`
        SELECT id FROM campaigns WHERE name = ?
      `).get(campaignName) as { id: string } | undefined;

      if (!campaign) continue;

      // Find ad group if specified
      let adGroupId = null;
      if (adGroupName) {
        const adGroup = db.prepare(`
          SELECT id FROM ad_groups WHERE campaign_id = ? AND name = ?
        `).get(campaign.id, adGroupName) as { id: string } | undefined;

        if (adGroup) adGroupId = adGroup.id;
      }

      // Find matching ad
      const ads = adGroupId
        ? db.prepare(`SELECT * FROM ads WHERE ad_group_id = ?`).all(adGroupId)
        : db.prepare(`
            SELECT a.* FROM ads a
            INNER JOIN ad_groups ag ON a.ad_group_id = ag.id
            WHERE ag.campaign_id = ?
          `).all(campaign.id);

      for (const ad of ads as any[]) {
        const headlines = JSON.parse(ad.headlines || '[]');
        const descriptions = JSON.parse(ad.descriptions || '[]');

        let found = false;

        if (assetType === 'headline') {
          const headlineIndex = headlines.findIndex(
            (h: any) => h.text.toLowerCase() === assetText.toLowerCase()
          );
          if (headlineIndex !== -1) {
            found = true;

            db.prepare(`
              INSERT OR REPLACE INTO asset_performance (
                id, ad_id, asset_type, asset_text, asset_position,
                performance_label, impressions, combination_impressions
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              nanoid(),
              ad.id,
              'headline',
              assetText,
              headlineIndex + 1,
              performanceLabel,
              impressions,
              impressions
            );

            recordsCreated++;
            break;
          }
        } else if (assetType === 'description') {
          const descriptionIndex = descriptions.findIndex(
            (d: any) => d.text.toLowerCase() === assetText.toLowerCase()
          );
          if (descriptionIndex !== -1) {
            found = true;

            db.prepare(`
              INSERT OR REPLACE INTO asset_performance (
                id, ad_id, asset_type, asset_text, asset_position,
                performance_label, impressions, combination_impressions
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              nanoid(),
              ad.id,
              'description',
              assetText,
              descriptionIndex + 1,
              performanceLabel,
              impressions,
              impressions
            );

            recordsCreated++;
            break;
          }
        }

        if (found) break;
      }
    }
  })();

  return recordsCreated;
}

/**
 * Generate a sample Google Ads Script for users to add to their Google Ads account
 */
export function generateGoogleAdsScript(sheetsConfig: {
  spreadsheetId: string;
  performanceSheetName: string;
  searchTermsSheetName: string;
  assetPerformanceSheetName: string;
}): string {
  return `
/**
 * Google Ads Script to Export Performance Data to Google Sheets
 *
 * Setup:
 * 1. Create a new Google Ads Script in your Google Ads account
 * 2. Copy this entire script
 * 3. Update the SPREADSHEET_ID below
 * 4. Schedule to run daily
 */

// Configuration
const SPREADSHEET_ID = '${sheetsConfig.spreadsheetId}';
const DATE_RANGE = 'LAST_7_DAYS';

function main() {
  Logger.log('Starting Google Ads data export...');

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Export campaign performance
  exportCampaignPerformance(spreadsheet);

  // Export search terms
  exportSearchTerms(spreadsheet);

  // Export asset performance
  exportAssetPerformance(spreadsheet);

  Logger.log('Export completed successfully!');
}

function exportCampaignPerformance(spreadsheet) {
  const sheet = getOrCreateSheet(spreadsheet, '${sheetsConfig.performanceSheetName}');

  // Clear existing data
  sheet.clear();

  // Headers
  const headers = [
    'Campaign', 'Ad Group', 'Impressions', 'Clicks', 'Cost',
    'Conversions', 'CTR', 'Avg. CPC', 'Cost / conv.', 'Conv. rate',
    'Impr. share', 'Search lost IS (rank)', 'Search lost IS (budget)', 'Quality score'
  ];
  sheet.appendRow(headers);

  // Query campaign performance
  const query = \`
    SELECT
      CampaignName,
      AdGroupName,
      Impressions,
      Clicks,
      Cost,
      Conversions,
      Ctr,
      AverageCpc,
      CostPerConversion,
      ConversionRate,
      SearchImpressionShare,
      SearchRankLostImpressionShare,
      SearchBudgetLostImpressionShare,
      QualityScore
    FROM ADGROUP_PERFORMANCE_REPORT
    WHERE CampaignStatus = 'ENABLED' AND AdGroupStatus = 'ENABLED'
    DURING \${DATE_RANGE}
  \`;

  const report = AdsApp.report(query);
  const rows = report.rows();

  while (rows.hasNext()) {
    const row = rows.next();
    sheet.appendRow([
      row['CampaignName'],
      row['AdGroupName'],
      row['Impressions'],
      row['Clicks'],
      row['Cost'],
      row['Conversions'],
      row['Ctr'],
      row['AverageCpc'],
      row['CostPerConversion'],
      row['ConversionRate'],
      row['SearchImpressionShare'],
      row['SearchRankLostImpressionShare'],
      row['SearchBudgetLostImpressionShare'],
      row['QualityScore']
    ]);
  }

  Logger.log(\`Exported \${sheet.getLastRow() - 1} campaign performance rows\`);
}

function exportSearchTerms(spreadsheet) {
  const sheet = getOrCreateSheet(spreadsheet, '${sheetsConfig.searchTermsSheetName}');

  sheet.clear();

  const headers = [
    'Search term', 'Match type', 'Campaign', 'Ad group',
    'Impressions', 'Clicks', 'Cost', 'Conversions'
  ];
  sheet.appendRow(headers);

  const query = \`
    SELECT
      Query,
      QueryMatchTypeWithVariant,
      CampaignName,
      AdGroupName,
      Impressions,
      Clicks,
      Cost,
      Conversions
    FROM SEARCH_QUERY_PERFORMANCE_REPORT
    WHERE Impressions > 10
    DURING \${DATE_RANGE}
  \`;

  const report = AdsApp.report(query);
  const rows = report.rows();

  while (rows.hasNext()) {
    const row = rows.next();
    sheet.appendRow([
      row['Query'],
      row['QueryMatchTypeWithVariant'],
      row['CampaignName'],
      row['AdGroupName'],
      row['Impressions'],
      row['Clicks'],
      row['Cost'],
      row['Conversions']
    ]);
  }

  Logger.log(\`Exported \${sheet.getLastRow() - 1} search term rows\`);
}

function exportAssetPerformance(spreadsheet) {
  const sheet = getOrCreateSheet(spreadsheet, '${sheetsConfig.assetPerformanceSheetName}');

  sheet.clear();

  const headers = [
    'Campaign', 'Ad Group', 'Asset Type', 'Asset Text',
    'Performance Label', 'Impressions'
  ];
  sheet.appendRow(headers);

  // Iterate through campaigns and responsive search ads
  const campaigns = AdsApp.campaigns()
    .withCondition('Status = ENABLED')
    .get();

  while (campaigns.hasNext()) {
    const campaign = campaigns.next();
    const campaignName = campaign.getName();

    const adGroups = campaign.adGroups()
      .withCondition('Status = ENABLED')
      .get();

    while (adGroups.hasNext()) {
      const adGroup = adGroups.next();
      const adGroupName = adGroup.getName();

      const ads = adGroup.ads()
        .withCondition('Type = RESPONSIVE_SEARCH_AD')
        .withCondition('Status = ENABLED')
        .get();

      while (ads.hasNext()) {
        const ad = ads.next();
        const rsa = ad.asType().expandedTextAd() || ad.asType().responsiveSearchAd();

        // Export headlines
        const headlines = rsa.headlines() || [];
        for (let i = 0; i < headlines.length; i++) {
          const headline = headlines[i];
          sheet.appendRow([
            campaignName,
            adGroupName,
            'headline',
            headline.getText(),
            headline.getAssetPerformanceLabel() || 'Learning',
            '0' // Impressions not available per asset in scripts
          ]);
        }

        // Export descriptions
        const descriptions = rsa.descriptions() || [];
        for (let i = 0; i < descriptions.length; i++) {
          const description = descriptions[i];
          sheet.appendRow([
            campaignName,
            adGroupName,
            'description',
            description.getText(),
            description.getAssetPerformanceLabel() || 'Learning',
            '0'
          ]);
        }
      }
    }
  }

  Logger.log(\`Exported \${sheet.getLastRow() - 1} asset performance rows\`);
}

function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}
`.trim();
}

/**
 * Save Sheets configuration to database
 */
export function saveSheetsConfig(config: SheetsConfig): void {
  const db = getDatabase();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS sheets_configs (
      id TEXT PRIMARY KEY,
      spreadsheet_id TEXT NOT NULL,
      service_account_email TEXT,
      private_key TEXT,
      performance_sheet_name TEXT,
      search_terms_sheet_name TEXT,
      asset_performance_sheet_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  const existing = db.prepare('SELECT id FROM sheets_configs LIMIT 1').get() as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE sheets_configs
      SET spreadsheet_id = ?, service_account_email = ?, private_key = ?,
          performance_sheet_name = ?, search_terms_sheet_name = ?,
          asset_performance_sheet_name = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      config.spreadsheetId,
      config.serviceAccountEmail || null,
      config.privateKey || null,
      config.performanceSheetName || 'Performance',
      config.searchTermsSheetName || 'SearchTerms',
      config.assetPerformanceSheetName || 'AssetPerformance',
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO sheets_configs (
        id, spreadsheet_id, service_account_email, private_key,
        performance_sheet_name, search_terms_sheet_name, asset_performance_sheet_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      nanoid(),
      config.spreadsheetId,
      config.serviceAccountEmail || null,
      config.privateKey || null,
      config.performanceSheetName || 'Performance',
      config.searchTermsSheetName || 'SearchTerms',
      config.assetPerformanceSheetName || 'AssetPerformance'
    );
  }
}

/**
 * Get saved Sheets configuration
 */
export function getSheetsConfig(): SheetsConfig | null {
  const db = getDatabase();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS sheets_configs (
      id TEXT PRIMARY KEY,
      spreadsheet_id TEXT NOT NULL,
      service_account_email TEXT,
      private_key TEXT,
      performance_sheet_name TEXT,
      search_terms_sheet_name TEXT,
      asset_performance_sheet_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();

  const config = db.prepare('SELECT * FROM sheets_configs LIMIT 1').get() as any;

  if (!config) return null;

  return {
    spreadsheetId: config.spreadsheet_id,
    serviceAccountEmail: config.service_account_email,
    privateKey: config.private_key,
    performanceSheetName: config.performance_sheet_name,
    searchTermsSheetName: config.search_terms_sheet_name,
    assetPerformanceSheetName: config.asset_performance_sheet_name,
  };
}

export default {
  syncPerformanceDataFromSheets,
  generateGoogleAdsScript,
  saveSheetsConfig,
  getSheetsConfig,
};
