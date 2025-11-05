/**
 * Import Service for Google Ads Editor CSV/ZIP Files
 *
 * Handles importing campaigns, ad groups, ads, and keywords from:
 * - Google Ads Editor CSV exports
 * - Performance reports from Google Ads UI
 * - Search terms reports
 * - Asset performance reports
 */

import { parse } from 'csv-parse/sync';
import AdmZip from 'adm-zip';
import { nanoid } from 'nanoid';
import { getDatabase } from '../db/database.js';
import type { Database } from 'better-sqlite3';

/**
 * Import result with detailed statistics
 */
export interface ImportResult {
  success: boolean;
  importId: string;
  stats: {
    campaignsCreated: number;
    campaignsUpdated: number;
    adGroupsCreated: number;
    adGroupsUpdated: number;
    adsCreated: number;
    adsUpdated: number;
    keywordsCreated: number;
    performanceRecordsCreated: number;
    searchTermsCreated: number;
    errorsCount: number;
  };
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row?: number;
  field?: string;
  message: string;
  value?: string;
}

export interface ImportWarning {
  row?: number;
  message: string;
}

/**
 * Parsed CSV row from Google Ads Editor export
 */
interface EditorCSVRow {
  campaign?: string;
  'Campaign'?: string;
  campaignStatus?: string;
  'Campaign Status'?: string;
  budget?: string;
  'Budget'?: string;
  adGroup?: string;
  'Ad Group'?: string;
  adGroupStatus?: string;
  'Ad Group Status'?: string;
  maxCpc?: string;
  'Max CPC'?: string;
  keyword?: string;
  'Keyword'?: string;
  matchType?: string;
  'Match Type'?: string;
  headline1?: string;
  'Headline 1'?: string;
  headline2?: string;
  'Headline 2'?: string;
  headline3?: string;
  'Headline 3'?: string;
  headline4?: string;
  'Headline 4'?: string;
  headline5?: string;
  'Headline 5'?: string;
  headline6?: string;
  'Headline 6'?: string;
  headline7?: string;
  'Headline 7'?: string;
  headline8?: string;
  'Headline 8'?: string;
  headline9?: string;
  'Headline 9'?: string;
  headline10?: string;
  'Headline 10'?: string;
  headline11?: string;
  'Headline 11'?: string;
  headline12?: string;
  'Headline 12'?: string;
  headline13?: string;
  'Headline 13'?: string;
  headline14?: string;
  'Headline 14'?: string;
  headline15?: string;
  'Headline 15'?: string;
  description1?: string;
  'Description 1'?: string;
  description2?: string;
  'Description 2'?: string;
  description3?: string;
  'Description 3'?: string;
  description4?: string;
  'Description 4'?: string;
  path1?: string;
  'Path 1'?: string;
  path2?: string;
  'Path 2'?: string;
  finalUrl?: string;
  'Final URL'?: string;
  adStatus?: string;
  'Ad Status'?: string;
  [key: string]: string | undefined;
}

/**
 * Performance report CSV row
 */
interface PerformanceCSVRow {
  campaign?: string;
  'Campaign'?: string;
  'Ad Group'?: string;
  adGroup?: string;
  'Impressions'?: string;
  impressions?: string;
  'Clicks'?: string;
  clicks?: string;
  'Cost'?: string;
  cost?: string;
  'Conversions'?: string;
  conversions?: string;
  'CTR'?: string;
  ctr?: string;
  'Avg. CPC'?: string;
  avgCpc?: string;
  'Cost / conv.'?: string;
  costPerConversion?: string;
  'Conv. rate'?: string;
  conversionRate?: string;
  'Impr. share'?: string;
  impressionShare?: string;
  'Search lost IS (rank)'?: string;
  searchLostIsRank?: string;
  'Search lost IS (budget)'?: string;
  searchLostIsBudget?: string;
  'Quality score'?: string;
  qualityScore?: string;
  [key: string]: string | undefined;
}

/**
 * Search terms CSV row
 */
interface SearchTermsCSVRow {
  'Search term'?: string;
  searchTerm?: string;
  'Match type'?: string;
  matchType?: string;
  'Campaign'?: string;
  campaign?: string;
  'Ad group'?: string;
  adGroup?: string;
  'Impressions'?: string;
  impressions?: string;
  'Clicks'?: string;
  clicks?: string;
  'Cost'?: string;
  cost?: string;
  'Conversions'?: string;
  conversions?: string;
  [key: string]: string | undefined;
}

/**
 * Normalize column names (case-insensitive, handle variations)
 */
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '_');
}

/**
 * Get value from row with flexible column matching
 */
function getRowValue(row: any, ...possibleNames: string[]): string | undefined {
  for (const name of possibleNames) {
    if (row[name]) return row[name];
  }
  return undefined;
}

/**
 * Parse status from Google Ads Editor format to internal format
 */
function parseStatus(editorStatus: string | undefined, defaultStatus: string = 'draft'): string {
  if (!editorStatus) return defaultStatus;

  const status = editorStatus.toLowerCase().trim();
  if (status === 'enabled' || status === 'active') return 'active';
  if (status === 'paused') return 'paused';
  if (status === 'removed' || status === 'deleted' || status === 'disabled') return 'draft';

  return defaultStatus;
}

/**
 * Parse match type from Google Ads Editor format
 */
function parseMatchType(editorMatchType: string | undefined): string {
  if (!editorMatchType) return 'broad';

  const matchType = editorMatchType.toLowerCase().trim();
  if (matchType === 'exact' || matchType === '[exact]') return 'exact';
  if (matchType === 'phrase' || matchType === '"phrase"') return 'phrase';
  return 'broad';
}

/**
 * Import campaigns from Google Ads Editor CSV
 */
export async function importFromEditorCSV(
  fileContent: string,
  filename: string,
  options: {
    updateExisting?: boolean;
    createSnapshot?: boolean;
  } = {}
): Promise<ImportResult> {
  const db = getDatabase();
  const importId = nanoid();
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  const stats = {
    campaignsCreated: 0,
    campaignsUpdated: 0,
    adGroupsCreated: 0,
    adGroupsUpdated: 0,
    adsCreated: 0,
    adsUpdated: 0,
    keywordsCreated: 0,
    performanceRecordsCreated: 0,
    searchTermsCreated: 0,
    errorsCount: 0,
  };

  try {
    // Record import start
    db.prepare(`
      INSERT INTO imports (id, filename, file_type, file_size, import_type, status, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(importId, filename, 'csv', fileContent.length, 'editor_export', 'processing', fileContent);

    // Parse CSV
    const records: EditorCSVRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM
    });

    if (records.length === 0) {
      errors.push({ message: 'CSV file is empty or has no data rows' });
      updateImportStatus(db, importId, 'failed', 0, errors);
      return { success: false, importId, stats, errors, warnings };
    }

    // Group rows by campaign and ad group
    const campaignMap = new Map<string, {
      campaign: any;
      adGroups: Map<string, {
        adGroup: any;
        keywords: any[];
        ads: any[];
      }>;
    }>();

    let rowIndex = 0;
    for (const row of records) {
      rowIndex++;

      try {
        const campaignName = getRowValue(row, 'campaign', 'Campaign');
        const adGroupName = getRowValue(row, 'adGroup', 'Ad Group');

        if (!campaignName) {
          warnings.push({ row: rowIndex, message: 'Row missing campaign name, skipping' });
          continue;
        }

        // Get or create campaign entry
        if (!campaignMap.has(campaignName)) {
          campaignMap.set(campaignName, {
            campaign: {
              name: campaignName,
              status: parseStatus(getRowValue(row, 'campaignStatus', 'Campaign Status'), 'active'),
              budget: parseFloat(getRowValue(row, 'budget', 'Budget') || '0'),
              finalUrl: getRowValue(row, 'finalUrl', 'Final URL') || '',
              path1: getRowValue(row, 'path1', 'Path 1') || '',
              path2: getRowValue(row, 'path2', 'Path 2') || '',
            },
            adGroups: new Map(),
          });
        }

        const campaignEntry = campaignMap.get(campaignName)!;

        if (!adGroupName) {
          continue; // Campaign-only row
        }

        // Get or create ad group entry
        if (!campaignEntry.adGroups.has(adGroupName)) {
          campaignEntry.adGroups.set(adGroupName, {
            adGroup: {
              name: adGroupName,
              status: parseStatus(getRowValue(row, 'adGroupStatus', 'Ad Group Status'), 'active'),
              maxCpc: parseFloat(getRowValue(row, 'maxCpc', 'Max CPC') || '0'),
            },
            keywords: [],
            ads: [],
          });
        }

        const adGroupEntry = campaignEntry.adGroups.get(adGroupName)!;

        // Parse keyword
        const keywordText = getRowValue(row, 'keyword', 'Keyword');
        if (keywordText) {
          const matchType = parseMatchType(getRowValue(row, 'matchType', 'Match Type'));
          adGroupEntry.keywords.push({
            text: keywordText,
            matchType,
            maxCpc: parseFloat(getRowValue(row, 'maxCpc', 'Max CPC') || '0'),
          });
        }

        // Parse ad (headlines and descriptions)
        const headlines = [];
        for (let i = 1; i <= 15; i++) {
          const headline = getRowValue(row, `headline${i}`, `Headline ${i}`);
          if (headline && headline.trim()) {
            headlines.push({ id: nanoid(), text: headline.trim() });
          }
        }

        const descriptions = [];
        for (let i = 1; i <= 4; i++) {
          const description = getRowValue(row, `description${i}`, `Description ${i}`);
          if (description && description.trim()) {
            descriptions.push({ id: nanoid(), text: description.trim() });
          }
        }

        if (headlines.length > 0 && descriptions.length > 0) {
          adGroupEntry.ads.push({
            headlines,
            descriptions,
            finalUrl: getRowValue(row, 'finalUrl', 'Final URL') || '',
            path1: getRowValue(row, 'path1', 'Path 1') || '',
            path2: getRowValue(row, 'path2', 'Path 2') || '',
            status: parseStatus(getRowValue(row, 'adStatus', 'Ad Status'), 'active'),
          });
        }
      } catch (error) {
        errors.push({
          row: rowIndex,
          message: `Error parsing row: ${error instanceof Error ? error.message : String(error)}`,
        });
        stats.errorsCount++;
      }
    }

    // Import into database
    db.transaction(() => {
      for (const [campaignName, campaignEntry] of campaignMap.entries()) {
        // Check if campaign exists
        const existingCampaign = db.prepare(`
          SELECT id FROM campaigns WHERE name = ?
        `).get(campaignName) as { id: string } | undefined;

        let campaignId: string;

        if (existingCampaign && options.updateExisting) {
          // Update existing campaign
          campaignId = existingCampaign.id;
          db.prepare(`
            UPDATE campaigns
            SET status = ?, budget = ?, final_url = ?, path1 = ?, path2 = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(
            campaignEntry.campaign.status,
            campaignEntry.campaign.budget,
            campaignEntry.campaign.finalUrl,
            campaignEntry.campaign.path1,
            campaignEntry.campaign.path2,
            campaignId
          );
          stats.campaignsUpdated++;
        } else if (!existingCampaign) {
          // Create new campaign
          campaignId = nanoid();
          db.prepare(`
            INSERT INTO campaigns (id, name, status, budget, final_url, path1, path2, global_descriptions)
            VALUES (?, ?, ?, ?, ?, ?, ?, '[]')
          `).run(
            campaignId,
            campaignEntry.campaign.name,
            campaignEntry.campaign.status,
            campaignEntry.campaign.budget,
            campaignEntry.campaign.finalUrl,
            campaignEntry.campaign.path1,
            campaignEntry.campaign.path2
          );
          stats.campaignsCreated++;
        } else {
          // Skip if exists and not updating
          continue;
        }

        // Create snapshot if requested
        if (options.createSnapshot) {
          createSnapshot(db, campaignId, 'import', 'Pre-import snapshot');
        }

        // Import ad groups
        for (const [adGroupName, adGroupEntry] of campaignEntry.adGroups.entries()) {
          const existingAdGroup = db.prepare(`
            SELECT id FROM ad_groups WHERE campaign_id = ? AND name = ?
          `).get(campaignId, adGroupName) as { id: string } | undefined;

          let adGroupId: string;

          if (existingAdGroup && options.updateExisting) {
            adGroupId = existingAdGroup.id;

            // Get existing keywords
            const existingData = db.prepare(`
              SELECT keywords FROM ad_groups WHERE id = ?
            `).get(adGroupId) as { keywords: string };

            const existingKeywords = JSON.parse(existingData.keywords || '[]');
            const newKeywords = adGroupEntry.keywords.map(k => ({
              id: nanoid(),
              text: k.text,
              maxCpc: k.maxCpc || undefined,
            }));

            // Merge keywords (avoid duplicates)
            const allKeywords = [...existingKeywords];
            for (const newKw of newKeywords) {
              if (!allKeywords.some(k => k.text === newKw.text)) {
                allKeywords.push(newKw);
                stats.keywordsCreated++;
              }
            }

            db.prepare(`
              UPDATE ad_groups
              SET status = ?, keywords = ?, updated_at = datetime('now')
              WHERE id = ?
            `).run(
              adGroupEntry.adGroup.status,
              JSON.stringify(allKeywords),
              adGroupId
            );
            stats.adGroupsUpdated++;
          } else if (!existingAdGroup) {
            adGroupId = nanoid();
            const keywords = adGroupEntry.keywords.map(k => ({
              id: nanoid(),
              text: k.text,
              maxCpc: k.maxCpc || undefined,
            }));

            db.prepare(`
              INSERT INTO ad_groups (id, campaign_id, name, status, keywords)
              VALUES (?, ?, ?, ?, ?)
            `).run(
              adGroupId,
              campaignId,
              adGroupEntry.adGroup.name,
              adGroupEntry.adGroup.status,
              JSON.stringify(keywords)
            );
            stats.adGroupsCreated++;
            stats.keywordsCreated += keywords.length;
          } else {
            continue;
          }

          // Import ads
          for (const adData of adGroupEntry.ads) {
            // Check for duplicate ads (same headlines)
            const headlineTexts = adData.headlines.map((h: any) => h.text).sort().join('|');
            const existingAds = db.prepare(`
              SELECT id, headlines FROM ads WHERE ad_group_id = ?
            `).all(adGroupId) as Array<{ id: string; headlines: string }>;

            let isDuplicate = false;
            for (const existingAd of existingAds) {
              const existingHeadlines = JSON.parse(existingAd.headlines || '[]');
              const existingHeadlineTexts = existingHeadlines.map((h: any) => h.text).sort().join('|');
              if (existingHeadlineTexts === headlineTexts) {
                isDuplicate = true;
                break;
              }
            }

            if (!isDuplicate) {
              const adId = nanoid();
              db.prepare(`
                INSERT INTO ads (id, ad_group_id, headlines, descriptions, final_url, status)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(
                adId,
                adGroupId,
                JSON.stringify(adData.headlines),
                JSON.stringify(adData.descriptions),
                adData.finalUrl,
                adData.status
              );
              stats.adsCreated++;
            } else if (options.updateExisting) {
              stats.adsUpdated++;
            }
          }
        }
      }
    })();

    // Update import status
    updateImportStatus(db, importId, 'completed',
      stats.campaignsCreated + stats.adGroupsCreated + stats.adsCreated + stats.keywordsCreated,
      errors
    );

    return {
      success: true,
      importId,
      stats,
      errors,
      warnings,
    };

  } catch (error) {
    errors.push({
      message: `Fatal import error: ${error instanceof Error ? error.message : String(error)}`,
    });
    stats.errorsCount++;

    updateImportStatus(db, importId, 'failed', 0, errors);

    return {
      success: false,
      importId,
      stats,
      errors,
      warnings,
    };
  }
}

/**
 * Import from ZIP file (multiple CSVs)
 */
export async function importFromZip(
  fileBuffer: Buffer,
  filename: string,
  options: {
    updateExisting?: boolean;
    createSnapshot?: boolean;
  } = {}
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const aggregatedStats = {
    campaignsCreated: 0,
    campaignsUpdated: 0,
    adGroupsCreated: 0,
    adGroupsUpdated: 0,
    adsCreated: 0,
    adsUpdated: 0,
    keywordsCreated: 0,
    performanceRecordsCreated: 0,
    searchTermsCreated: 0,
    errorsCount: 0,
  };

  try {
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();

    let importId = nanoid();
    let hasProcessedFiles = false;

    for (const entry of zipEntries) {
      if (entry.isDirectory || !entry.entryName.endsWith('.csv')) {
        continue;
      }

      const csvContent = entry.getData().toString('utf8');
      const result = await importFromEditorCSV(csvContent, entry.entryName, options);

      if (!hasProcessedFiles) {
        importId = result.importId;
        hasProcessedFiles = true;
      }

      // Aggregate stats
      Object.keys(result.stats).forEach(key => {
        aggregatedStats[key as keyof typeof aggregatedStats] +=
          result.stats[key as keyof typeof result.stats];
      });

      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    if (!hasProcessedFiles) {
      errors.push({ message: 'No CSV files found in ZIP archive' });
      return {
        success: false,
        importId: nanoid(),
        stats: aggregatedStats,
        errors,
        warnings,
      };
    }

    return {
      success: errors.length === 0,
      importId,
      stats: aggregatedStats,
      errors,
      warnings,
    };

  } catch (error) {
    errors.push({
      message: `Error processing ZIP file: ${error instanceof Error ? error.message : String(error)}`,
    });

    return {
      success: false,
      importId: nanoid(),
      stats: aggregatedStats,
      errors,
      warnings,
    };
  }
}

/**
 * Import performance data from Google Ads reports
 */
export async function importPerformanceData(
  fileContent: string,
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<ImportResult> {
  const db = getDatabase();
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  const stats = {
    campaignsCreated: 0,
    campaignsUpdated: 0,
    adGroupsCreated: 0,
    adGroupsUpdated: 0,
    adsCreated: 0,
    adsUpdated: 0,
    keywordsCreated: 0,
    performanceRecordsCreated: 0,
    searchTermsCreated: 0,
    errorsCount: 0,
  };

  try {
    const records: PerformanceCSVRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    db.transaction(() => {
      for (const row of records) {
        const campaignName = getRowValue(row, 'Campaign', 'campaign');
        const adGroupName = getRowValue(row, 'Ad Group', 'adGroup', 'ad_group');

        if (!campaignName) {
          continue;
        }

        // Find campaign
        const campaign = db.prepare(`
          SELECT id FROM campaigns WHERE name = ?
        `).get(campaignName) as { id: string } | undefined;

        if (!campaign) {
          warnings.push({ message: `Campaign "${campaignName}" not found in database` });
          continue;
        }

        const impressions = parseInt(getRowValue(row, 'Impressions', 'impressions') || '0');
        const clicks = parseInt(getRowValue(row, 'Clicks', 'clicks') || '0');
        const cost = parseFloat(getRowValue(row, 'Cost', 'cost') || '0');
        const conversions = parseFloat(getRowValue(row, 'Conversions', 'conversions') || '0');
        const ctr = parseFloat(getRowValue(row, 'CTR', 'ctr') || '0');
        const avgCpc = parseFloat(getRowValue(row, 'Avg. CPC', 'avgCpc', 'avg_cpc') || '0');

        if (adGroupName) {
          // Ad group level performance
          const adGroup = db.prepare(`
            SELECT id FROM ad_groups WHERE campaign_id = ? AND name = ?
          `).get(campaign.id, adGroupName) as { id: string } | undefined;

          if (adGroup) {
            db.prepare(`
              INSERT INTO performance_data (
                id, entity_type, entity_id, date_range_start, date_range_end,
                impressions, clicks, cost, conversions, ctr, cpc
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              nanoid(),
              'ad_group',
              adGroup.id,
              dateRangeStart,
              dateRangeEnd,
              impressions,
              clicks,
              cost,
              conversions,
              ctr,
              avgCpc
            );
            stats.performanceRecordsCreated++;
          }
        } else {
          // Campaign level performance
          db.prepare(`
            INSERT INTO performance_data (
              id, entity_type, entity_id, date_range_start, date_range_end,
              impressions, clicks, cost, conversions, ctr, cpc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            nanoid(),
            'campaign',
            campaign.id,
            dateRangeStart,
            dateRangeEnd,
            impressions,
            clicks,
            cost,
            conversions,
            ctr,
            avgCpc
          );
          stats.performanceRecordsCreated++;
        }
      }
    })();

    return {
      success: true,
      importId: nanoid(),
      stats,
      errors,
      warnings,
    };

  } catch (error) {
    errors.push({
      message: `Error importing performance data: ${error instanceof Error ? error.message : String(error)}`,
    });
    stats.errorsCount++;

    return {
      success: false,
      importId: nanoid(),
      stats,
      errors,
      warnings,
    };
  }
}

/**
 * Import search terms data
 */
export async function importSearchTerms(
  fileContent: string,
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<ImportResult> {
  const db = getDatabase();
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  const stats = {
    campaignsCreated: 0,
    campaignsUpdated: 0,
    adGroupsCreated: 0,
    adGroupsUpdated: 0,
    adsCreated: 0,
    adsUpdated: 0,
    keywordsCreated: 0,
    performanceRecordsCreated: 0,
    searchTermsCreated: 0,
    errorsCount: 0,
  };

  try {
    const records: SearchTermsCSVRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    db.transaction(() => {
      for (const row of records) {
        const searchTerm = getRowValue(row, 'Search term', 'searchTerm', 'search_term');
        const campaignName = getRowValue(row, 'Campaign', 'campaign');
        const adGroupName = getRowValue(row, 'Ad group', 'adGroup', 'ad_group');
        const matchType = parseMatchType(getRowValue(row, 'Match type', 'matchType', 'match_type'));

        if (!searchTerm || !campaignName || !adGroupName) {
          continue;
        }

        // Find campaign and ad group
        const campaign = db.prepare(`
          SELECT id FROM campaigns WHERE name = ?
        `).get(campaignName) as { id: string } | undefined;

        if (!campaign) {
          continue;
        }

        const adGroup = db.prepare(`
          SELECT id FROM ad_groups WHERE campaign_id = ? AND name = ?
        `).get(campaign.id, adGroupName) as { id: string } | undefined;

        if (!adGroup) {
          continue;
        }

        const impressions = parseInt(getRowValue(row, 'Impressions', 'impressions') || '0');
        const clicks = parseInt(getRowValue(row, 'Clicks', 'clicks') || '0');
        const cost = parseFloat(getRowValue(row, 'Cost', 'cost') || '0');
        const conversions = parseFloat(getRowValue(row, 'Conversions', 'conversions') || '0');

        db.prepare(`
          INSERT INTO search_terms (
            id, campaign_id, ad_group_id, search_term, match_type,
            impressions, clicks, cost, conversions,
            date_range_start, date_range_end
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          nanoid(),
          campaign.id,
          adGroup.id,
          searchTerm,
          matchType,
          impressions,
          clicks,
          cost,
          conversions,
          dateRangeStart,
          dateRangeEnd
        );
        stats.searchTermsCreated++;
      }
    })();

    return {
      success: true,
      importId: nanoid(),
      stats,
      errors,
      warnings,
    };

  } catch (error) {
    errors.push({
      message: `Error importing search terms: ${error instanceof Error ? error.message : String(error)}`,
    });
    stats.errorsCount++;

    return {
      success: false,
      importId: nanoid(),
      stats,
      errors,
      warnings,
    };
  }
}

/**
 * Create a snapshot of a campaign
 */
function createSnapshot(
  db: Database,
  campaignId: string,
  snapshotType: string,
  description: string
): void {
  // Get full campaign data
  const campaign = db.prepare(`
    SELECT * FROM campaigns WHERE id = ?
  `).get(campaignId);

  const adGroups = db.prepare(`
    SELECT * FROM ad_groups WHERE campaign_id = ?
  `).all(campaignId);

  const ads = db.prepare(`
    SELECT a.* FROM ads a
    INNER JOIN ad_groups ag ON a.ad_group_id = ag.id
    WHERE ag.campaign_id = ?
  `).all(campaignId);

  const snapshotData = {
    campaign,
    adGroups,
    ads,
    timestamp: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO snapshots (id, campaign_id, snapshot_type, snapshot_data, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    nanoid(),
    campaignId,
    snapshotType,
    JSON.stringify(snapshotData),
    description
  );
}

/**
 * Update import status in database
 */
function updateImportStatus(
  db: Database,
  importId: string,
  status: string,
  entitiesImported: number,
  errors: ImportError[]
): void {
  db.prepare(`
    UPDATE imports
    SET status = ?, entities_imported = ?, errors = ?, completed_at = datetime('now')
    WHERE id = ?
  `).run(status, entitiesImported, JSON.stringify(errors), importId);
}

export default {
  importFromEditorCSV,
  importFromZip,
  importPerformanceData,
  importSearchTerms,
};
