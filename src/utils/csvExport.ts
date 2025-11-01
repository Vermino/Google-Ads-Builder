/**
 * CSV Export Utility for Google Ads Campaign Builder
 *
 * Exports campaigns to Google Ads Editor-compatible CSV format with support for:
 * - Responsive Search Ads (RSAs) with up to 15 headlines and 4 descriptions
 * - Multiple match types (exact, phrase, broad)
 * - Match type bid modifiers
 * - Keyword-level CPC overrides
 * - Proper CSV escaping and UTF-8 BOM for Excel compatibility
 */

import type { Campaign, AdGroup, ResponsiveSearchAd, Keyword, Headline, Description } from '../types';

/**
 * Export options for Google Ads CSV generation
 */
export interface ExportOptions {
  campaignIds: string[];
  includeAdGroups?: boolean;
  includeAds?: boolean;
  includeKeywords?: boolean;
}

/**
 * CSV row representing a complete Google Ads entry
 */
interface CSVRow {
  campaign: string;
  campaignStatus: string;
  budget: string;
  adGroup: string;
  adGroupStatus: string;
  maxCpc: string;
  keyword: string;
  matchType: string;
  headline1: string;
  headline2: string;
  headline3: string;
  headline4: string;
  headline5: string;
  headline6: string;
  headline7: string;
  headline8: string;
  headline9: string;
  headline10: string;
  headline11: string;
  headline12: string;
  headline13: string;
  headline14: string;
  headline15: string;
  description1: string;
  description2: string;
  description3: string;
  description4: string;
  path1: string;
  path2: string;
  finalUrl: string;
  adStatus: string;
}

/**
 * Validation error details
 */
interface ValidationError {
  field: string;
  message: string;
  value: string;
}

/**
 * Escapes a CSV field value according to RFC 4180
 * @param value - The string value to escape
 * @returns Escaped CSV field value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generates a CSV row from an array of field values
 * @param data - Array of string values for each column
 * @returns CSV-formatted row string
 */
function generateCSVRow(data: string[]): string {
  return data.map(escapeCSV).join(',');
}

/**
 * Converts campaign status to Google Ads Editor format
 * @param status - Internal campaign status
 * @returns Google Ads Editor status format
 */
function convertCampaignStatus(status: Campaign['status']): string {
  const statusMap: Record<Campaign['status'], string> = {
    'active': 'Enabled',
    'paused': 'Paused',
    'ended': 'Removed'
  };
  return statusMap[status] || 'Paused';
}

/**
 * Converts ad group status to Google Ads Editor format
 * @param status - Internal ad group status
 * @returns Google Ads Editor status format
 */
function convertAdGroupStatus(status: AdGroup['status']): string {
  const statusMap: Record<AdGroup['status'], string> = {
    'active': 'Enabled',
    'paused': 'Paused'
  };
  return statusMap[status] || 'Paused';
}

/**
 * Converts ad status to Google Ads Editor format
 * @param status - Internal ad status
 * @returns Google Ads Editor status format
 */
function convertAdStatus(status: ResponsiveSearchAd['status']): string {
  const statusMap: Record<ResponsiveSearchAd['status'], string> = {
    'enabled': 'Enabled',
    'paused': 'Paused',
    'disabled': 'Removed'
  };
  return statusMap[status] || 'Paused';
}

/**
 * Calculates the actual CPC based on match type modifiers
 * @param baseCpc - Base CPC from ad group
 * @param matchType - Match type (broad, phrase, exact)
 * @param adGroup - Ad group with match type bidding settings
 * @returns Calculated CPC value
 */
function calculateMatchTypeCpc(
  baseCpc: number,
  matchType: 'broad' | 'phrase' | 'exact',
  adGroup: AdGroup
): number {
  if (!adGroup.matchTypeBidding) {
    return baseCpc;
  }

  const modifier = adGroup.matchTypeBidding[matchType];
  if (!modifier || !modifier.enabled) {
    return baseCpc;
  }

  // Apply percentage modifier
  const adjustedCpc = baseCpc * (1 + modifier.percentage / 100);
  return Math.round(adjustedCpc * 100) / 100; // Round to 2 decimal places
}

/**
 * Validates headline text against Google Ads constraints
 * @param headline - Headline object to validate
 * @returns Array of validation errors
 */
function validateHeadline(headline: Headline): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!headline.text || headline.text.trim() === '') {
    errors.push({
      field: 'headline',
      message: 'Headline cannot be empty',
      value: headline.text
    });
  }

  if (headline.text.length > 30) {
    errors.push({
      field: 'headline',
      message: 'Headline exceeds 30 character limit',
      value: headline.text
    });
  }

  return errors;
}

/**
 * Validates description text against Google Ads constraints
 * @param description - Description object to validate
 * @returns Array of validation errors
 */
function validateDescription(description: Description): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!description.text || description.text.trim() === '') {
    errors.push({
      field: 'description',
      message: 'Description cannot be empty',
      value: description.text
    });
  }

  if (description.text.length > 90) {
    errors.push({
      field: 'description',
      message: 'Description exceeds 90 character limit',
      value: description.text
    });
  }

  return errors;
}

/**
 * Validates path text against Google Ads constraints
 * @param path - Path string to validate
 * @param pathNumber - Path number (1 or 2)
 * @returns Array of validation errors
 */
function validatePath(path: string | undefined, pathNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (path && path.length > 15) {
    errors.push({
      field: `path${pathNumber}`,
      message: `Path ${pathNumber} exceeds 15 character limit`,
      value: path
    });
  }

  return errors;
}

/**
 * Validates a complete ad for Google Ads requirements
 * @param ad - Responsive Search Ad to validate
 * @returns Array of validation errors
 */
function validateAd(ad: ResponsiveSearchAd): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate headlines (minimum 3, maximum 15)
  if (ad.headlines.length < 3) {
    errors.push({
      field: 'headlines',
      message: `Ad requires at least 3 headlines, found ${ad.headlines.length}`,
      value: ad.headlines.length.toString()
    });
  }

  if (ad.headlines.length > 15) {
    errors.push({
      field: 'headlines',
      message: `Ad cannot have more than 15 headlines, found ${ad.headlines.length}`,
      value: ad.headlines.length.toString()
    });
  }

  // Validate descriptions (minimum 2, maximum 4)
  if (ad.descriptions.length < 2) {
    errors.push({
      field: 'descriptions',
      message: `Ad requires at least 2 descriptions, found ${ad.descriptions.length}`,
      value: ad.descriptions.length.toString()
    });
  }

  if (ad.descriptions.length > 4) {
    errors.push({
      field: 'descriptions',
      message: `Ad cannot have more than 4 descriptions, found ${ad.descriptions.length}`,
      value: ad.descriptions.length.toString()
    });
  }

  // Validate individual headlines
  ad.headlines.forEach(headline => {
    errors.push(...validateHeadline(headline));
  });

  // Validate individual descriptions
  ad.descriptions.forEach(description => {
    errors.push(...validateDescription(description));
  });

  // Validate paths
  errors.push(...validatePath(ad.path1, 1));
  errors.push(...validatePath(ad.path2, 2));

  // Validate final URL
  if (!ad.finalUrl || ad.finalUrl.trim() === '') {
    errors.push({
      field: 'finalUrl',
      message: 'Final URL is required',
      value: ad.finalUrl
    });
  }

  return errors;
}

/**
 * Creates a CSV row for a keyword with ad combination
 * @param campaign - Campaign object
 * @param adGroup - Ad Group object
 * @param ad - Responsive Search Ad object
 * @param keyword - Keyword object
 * @param matchType - Match type for the keyword
 * @returns CSV row object
 */
function createCSVRow(
  campaign: Campaign,
  adGroup: AdGroup,
  ad: ResponsiveSearchAd,
  keyword: Keyword,
  matchType: 'broad' | 'phrase' | 'exact'
): CSVRow {
  // Calculate CPC based on match type
  const maxCpc = keyword.maxCpc || calculateMatchTypeCpc(adGroup.maxCpc, matchType, adGroup);

  // Format keyword with match type symbols
  let formattedKeyword = keyword.text;
  if (matchType === 'exact') {
    formattedKeyword = `[${keyword.text}]`;
  } else if (matchType === 'phrase') {
    formattedKeyword = `"${keyword.text}"`;
  }
  // broad match has no special formatting

  // Create headline fields (up to 15)
  const headlines: string[] = new Array(15).fill('');
  ad.headlines.forEach((headline, index) => {
    if (index < 15) {
      headlines[index] = headline.text;
    }
  });

  // Create description fields (up to 4)
  const descriptions: string[] = new Array(4).fill('');
  ad.descriptions.forEach((description, index) => {
    if (index < 4) {
      descriptions[index] = description.text;
    }
  });

  return {
    campaign: campaign.name,
    campaignStatus: convertCampaignStatus(campaign.status),
    budget: campaign.budget.toFixed(2),
    adGroup: adGroup.name,
    adGroupStatus: convertAdGroupStatus(adGroup.status),
    maxCpc: maxCpc.toFixed(2),
    keyword: formattedKeyword,
    matchType: matchType,
    headline1: headlines[0],
    headline2: headlines[1],
    headline3: headlines[2],
    headline4: headlines[3],
    headline5: headlines[4],
    headline6: headlines[5],
    headline7: headlines[6],
    headline8: headlines[7],
    headline9: headlines[8],
    headline10: headlines[9],
    headline11: headlines[10],
    headline12: headlines[11],
    headline13: headlines[12],
    headline14: headlines[13],
    headline15: headlines[14],
    description1: descriptions[0],
    description2: descriptions[1],
    description3: descriptions[2],
    description4: descriptions[3],
    path1: ad.path1 || campaign.path1 || '',
    path2: ad.path2 || campaign.path2 || '',
    finalUrl: ad.finalUrl || campaign.finalUrl,
    adStatus: convertAdStatus(ad.status)
  };
}

/**
 * Converts CSV row object to array of string values
 * @param row - CSV row object
 * @returns Array of string values
 */
function rowToArray(row: CSVRow): string[] {
  return [
    row.campaign,
    row.campaignStatus,
    row.budget,
    row.adGroup,
    row.adGroupStatus,
    row.maxCpc,
    row.keyword,
    row.matchType,
    row.headline1,
    row.headline2,
    row.headline3,
    row.headline4,
    row.headline5,
    row.headline6,
    row.headline7,
    row.headline8,
    row.headline9,
    row.headline10,
    row.headline11,
    row.headline12,
    row.headline13,
    row.headline14,
    row.headline15,
    row.description1,
    row.description2,
    row.description3,
    row.description4,
    row.path1,
    row.path2,
    row.finalUrl,
    row.adStatus
  ];
}

/**
 * Gets the CSV header row
 * @returns Array of header column names
 */
function getCSVHeaders(): string[] {
  return [
    'Campaign',
    'Campaign Status',
    'Budget',
    'Ad Group',
    'Ad Group Status',
    'Max CPC',
    'Keyword',
    'Match Type',
    'Headline 1',
    'Headline 2',
    'Headline 3',
    'Headline 4',
    'Headline 5',
    'Headline 6',
    'Headline 7',
    'Headline 8',
    'Headline 9',
    'Headline 10',
    'Headline 11',
    'Headline 12',
    'Headline 13',
    'Headline 14',
    'Headline 15',
    'Description 1',
    'Description 2',
    'Description 3',
    'Description 4',
    'Path 1',
    'Path 2',
    'Final URL',
    'Ad Status'
  ];
}

/**
 * Triggers a browser download for the CSV content
 * @param csvContent - Complete CSV content string
 * @param filename - Filename for the download
 */
function downloadCSV(csvContent: string, filename: string): void {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Determines which match types are enabled for an ad group
 * @param adGroup - Ad group object
 * @returns Array of enabled match types
 */
function getEnabledMatchTypes(adGroup: AdGroup): Array<'broad' | 'phrase' | 'exact'> {
  const matchTypes: Array<'broad' | 'phrase' | 'exact'> = [];

  if (!adGroup.matchTypeBidding) {
    // If no match type bidding is configured, export all three types
    return ['broad', 'phrase', 'exact'];
  }

  if (adGroup.matchTypeBidding.broad?.enabled) {
    matchTypes.push('broad');
  }
  if (adGroup.matchTypeBidding.phrase?.enabled) {
    matchTypes.push('phrase');
  }
  if (adGroup.matchTypeBidding.exact?.enabled) {
    matchTypes.push('exact');
  }

  // If nothing is explicitly enabled, default to all types
  if (matchTypes.length === 0) {
    return ['broad', 'phrase', 'exact'];
  }

  return matchTypes;
}

/**
 * Internal function that performs the actual export logic
 * @param campaigns - Array of campaigns to export
 * @param options - Export options
 * @returns Promise that resolves when export is complete
 * @throws Error if validation fails or campaigns are invalid
 */
async function performExport(
  campaigns: Campaign[],
  options: ExportOptions
): Promise<void> {
  try {
    // Filter campaigns by IDs if specified
    let campaignsToExport = campaigns;
    if (options.campaignIds.length > 0) {
      campaignsToExport = campaigns.filter(c => options.campaignIds.includes(c.id));
    }

    // Validate we have campaigns to export
    if (campaignsToExport.length === 0) {
      throw new Error('No campaigns found to export. Please select at least one campaign.');
    }

    // Collect all validation errors
    const allValidationErrors: Array<{ campaign: string; adGroup: string; ad: string; errors: ValidationError[] }> = [];

    // Generate CSV rows
    const csvRows: CSVRow[] = [];

    for (const campaign of campaignsToExport) {
      // Check if campaign has ad groups
      if (!campaign.adGroups || campaign.adGroups.length === 0) {
        console.warn(`Campaign "${campaign.name}" has no ad groups, skipping...`);
        continue;
      }

      for (const adGroup of campaign.adGroups) {
        // Check if ad group has ads
        if (!adGroup.ads || adGroup.ads.length === 0) {
          console.warn(`Ad Group "${adGroup.name}" in campaign "${campaign.name}" has no ads, skipping...`);
          continue;
        }

        // Check if ad group has keywords
        if (!adGroup.keywords || adGroup.keywords.length === 0) {
          console.warn(`Ad Group "${adGroup.name}" in campaign "${campaign.name}" has no keywords, skipping...`);
          continue;
        }

        for (const ad of adGroup.ads) {
          // Validate the ad
          const validationErrors = validateAd(ad);
          if (validationErrors.length > 0) {
            allValidationErrors.push({
              campaign: campaign.name,
              adGroup: adGroup.name,
              ad: ad.name,
              errors: validationErrors
            });
            // Skip this ad if validation fails
            continue;
          }

          // Get enabled match types for this ad group
          const enabledMatchTypes = getEnabledMatchTypes(adGroup);

          // Generate a row for each keyword and match type combination
          for (const keyword of adGroup.keywords) {
            for (const matchType of enabledMatchTypes) {
              const row = createCSVRow(campaign, adGroup, ad, keyword, matchType);
              csvRows.push(row);
            }
          }
        }
      }
    }

    // If there were validation errors, throw them
    if (allValidationErrors.length > 0) {
      const errorMessages = allValidationErrors.map(({ campaign, adGroup, ad, errors }) => {
        const errorList = errors.map(e => `  - ${e.field}: ${e.message} (value: "${e.value}")`).join('\n');
        return `Campaign: ${campaign}\nAd Group: ${adGroup}\nAd: ${ad}\n${errorList}`;
      });
      throw new Error(`Validation failed for ${allValidationErrors.length} ad(s):\n\n${errorMessages.join('\n\n')}`);
    }

    // If no rows were generated, throw error
    if (csvRows.length === 0) {
      throw new Error('No valid data to export. Please ensure campaigns have ad groups with ads and keywords.');
    }

    // Build CSV content
    const headers = getCSVHeaders();
    const headerRow = generateCSVRow(headers);
    const dataRows = csvRows.map(row => generateCSVRow(rowToArray(row)));
    const csvContent = [headerRow, ...dataRows].join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `google-ads-campaign-${timestamp}.csv`;

    // Trigger download
    downloadCSV(csvContent, filename);

    console.log(`Successfully exported ${csvRows.length} rows from ${campaignsToExport.length} campaign(s)`);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during export');
  }
}

/**
 * Exports campaigns to Google Ads Editor-compatible CSV format
 *
 * This function has two signatures:
 * 1. exportToGoogleAds(options: ExportOptions) - Gets campaigns from window context
 * 2. exportToGoogleAds(campaigns: Campaign[], options: ExportOptions) - Explicit campaigns array
 *
 * @param campaignsOrOptions - Either Campaign[] or ExportOptions
 * @param optionsParam - ExportOptions (only when first param is Campaign[])
 * @returns Promise that resolves when export is complete
 * @throws Error if validation fails or campaigns are invalid
 */
export async function exportToGoogleAds(
  campaignsOrOptions: Campaign[] | ExportOptions,
  optionsParam?: ExportOptions
): Promise<void> {
  // Import store dynamically to avoid circular dependencies
  const { useCampaignStore } = await import('../stores/useCampaignStore');

  let campaigns: Campaign[];
  let options: ExportOptions;

  // Check if first parameter is ExportOptions (UI calling pattern)
  if (!Array.isArray(campaignsOrOptions)) {
    // First param is ExportOptions, get campaigns from store
    options = campaignsOrOptions;
    campaigns = useCampaignStore.getState().campaigns;
  } else {
    // First param is Campaign[], second is ExportOptions
    campaigns = campaignsOrOptions;
    options = optionsParam || { campaignIds: [], includeAdGroups: true, includeAds: true, includeKeywords: true };
  }

  return performExport(campaigns, options);
}

/**
 * Exports campaigns from Zustand store to Google Ads Editor CSV format
 * This is a convenience wrapper that accepts campaign IDs and fetches from store
 * @param getCampaigns - Function to get all campaigns from store
 * @param options - Export options
 * @returns Promise that resolves when export is complete
 */
export async function exportCampaignsFromStore(
  getCampaigns: () => Campaign[],
  options: ExportOptions
): Promise<void> {
  const allCampaigns = getCampaigns();
  return performExport(allCampaigns, options);
}
