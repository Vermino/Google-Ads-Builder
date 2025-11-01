# CSV Export Utility - Test Guide

## Overview
The CSV export utility has been successfully implemented for the Google Ads Campaign Builder. This document provides testing instructions and usage examples.

## Features Implemented

### Core Functionality
- Exports campaigns to Google Ads Editor-compatible CSV format
- Supports Responsive Search Ads (RSAs) with up to 15 headlines and 4 descriptions
- Handles multiple match types (exact, phrase, broad)
- Applies match type bid modifiers automatically
- Supports keyword-level CPC overrides
- UTF-8 BOM encoding for Excel compatibility
- RFC 4180 compliant CSV escaping

### Validation
- Validates headline character limits (30 chars max)
- Validates description character limits (90 chars max)
- Validates path character limits (15 chars max)
- Checks minimum/maximum headline count (3-15)
- Checks minimum/maximum description count (2-4)
- Validates required fields (final URL, campaign name, etc.)

### Match Type Support
- **Exact Match**: Keywords wrapped in [brackets]
- **Phrase Match**: Keywords wrapped in "quotes"
- **Broad Match**: Keywords without special formatting
- Respects enabled/disabled match types per ad group
- Calculates adjusted CPC based on match type modifiers

## Usage

### From UI (Dashboard)
The function is called from the Dashboard component with just ExportOptions:

```typescript
import { exportToGoogleAds } from '@/utils/csvExport';

const handleExport = async (options: ExportOptions) => {
  try {
    await exportToGoogleAds(options);
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

### Programmatic Usage
You can also call it with explicit campaign data:

```typescript
import { exportToGoogleAds } from '@/utils/csvExport';
import type { Campaign } from '@/types';

const campaigns: Campaign[] = [...]; // Your campaign data

await exportToGoogleAds(campaigns, {
  campaignIds: ['camp-1', 'camp-2'],
  includeAdGroups: true,
  includeAds: true,
  includeKeywords: true
});
```

### Using Store Wrapper
Alternatively, use the convenience wrapper:

```typescript
import { exportCampaignsFromStore } from '@/utils/csvExport';
import { useCampaignStore } from '@/stores/useCampaignStore';

const getCampaigns = () => useCampaignStore.getState().campaigns;

await exportCampaignsFromStore(getCampaigns, {
  campaignIds: ['camp-1']
});
```

## CSV Output Format

### Columns
```
Campaign, Campaign Status, Budget, Ad Group, Ad Group Status, Max CPC, Keyword, Match Type,
Headline 1, Headline 2, ..., Headline 15,
Description 1, Description 2, Description 3, Description 4,
Path 1, Path 2, Final URL, Ad Status
```

### Example Row
```csv
[JJM] Trusy | US | Instagram Marketing | Nov 2025,Enabled,5000.00,Instagram Marketing Platform,Enabled,4.38,[instagram marketing platform],exact,#1 Instagram Growth Platform,InstaMagnet System Included,35,000+ Members Worldwide,...,Transform your Instagram with proven growth strategies. Get expert support included.,...,Platform,Trial,https://go.trusy.co/subscribe-google-new/,Enabled
```

## Testing with Mock Data

### Expected Output
When exporting the mock campaign (`camp-1`), you should get:

**Campaign**: [JJM] Trusy | US | Instagram Marketing | Nov 2025
**Ad Groups**: 5 (Instagram Marketing Platform, Account Manager, Courses, Growth Service, Automation Tools)
**Keywords per Ad Group**: 5
**Match Types**: 3 (broad, phrase, exact) - varies by ad group based on enabled match types
**Expected Total Rows**: ~75 rows (5 ad groups × 5 keywords × 3 match types on average)

### Match Type Bid Calculations

**Ad Group 1: Instagram Marketing Platform**
- Base CPC: $2.50
- Phrase: 20% modifier = $3.00
- Exact: 75% modifier = $4.38
- Broad: Not enabled (excluded from export)

**Ad Group 2: Instagram Account Manager**
- Base CPC: $2.75
- Broad: -27.27% modifier = $2.00
- Phrase: 0% modifier = $2.75
- Exact: +27.27% modifier = $3.50

## Testing Steps

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Dashboard**
   - Navigate to `http://localhost:5173` (or your Vite dev server port)
   - You should see the mock campaign listed

4. **Test Export**
   - Click the "Export" button in the header
   - Select the campaign to export
   - Confirm the export
   - A CSV file should download automatically

5. **Verify CSV Content**
   - Open the downloaded CSV in a text editor or spreadsheet
   - Check that all columns are present
   - Verify match type formatting (brackets, quotes)
   - Confirm CPC calculations match expected values
   - Check that all 15 headlines and 4 descriptions are included

6. **Import to Google Ads Editor**
   - Open Google Ads Editor
   - Go to Account → Import → From file
   - Select the exported CSV
   - Verify no errors during import
   - Check that campaigns, ad groups, ads, and keywords are structured correctly

## Error Handling

### Validation Errors
The export will fail with detailed error messages if:
- Headlines exceed 30 characters
- Descriptions exceed 90 characters
- Paths exceed 15 characters
- Less than 3 headlines or more than 15
- Less than 2 descriptions or more than 4
- Final URL is missing

### Example Error Message
```
Validation failed for 1 ad(s):

Campaign: [JJM] Trusy | US | Instagram Marketing | Nov 2025
Ad Group: Instagram Marketing Platform
Ad: Primary Growth Platform Ad
  - headline: Headline exceeds 30 character limit (value: "This is a very long headline that exceeds limits")
  - description: Description exceeds 90 character limit (value: "...")
```

### Empty Data Errors
- "No campaigns found to export" - When no campaign IDs match
- "No valid data to export" - When campaigns have no ad groups, ads, or keywords

## File Format Details

### CSV Escaping
- Fields containing commas, quotes, or newlines are wrapped in double quotes
- Embedded quotes are escaped by doubling them ("")
- Follows RFC 4180 standard

### Character Encoding
- UTF-8 with BOM (Byte Order Mark)
- Ensures proper character display in Excel
- Supports international characters and emojis

### Filename Format
- Pattern: `google-ads-campaign-YYYY-MM-DD.csv`
- Example: `google-ads-campaign-2025-10-31.csv`
- Uses current date in ISO format

## Known Limitations

1. **Global Descriptions**: The campaign-level global descriptions are not currently exported. This is intentional as Google Ads Editor expects descriptions at the ad level.

2. **Pinned Positions**: Headline and description pinning is stored in the data model but not currently exported in the CSV. Google Ads Editor uses a different format for pinning that would require additional columns.

3. **Broad Modifier Match Type**: The legacy +keyword syntax (broad modifier) is tracked in the system but converted to phrase match during export, as Google has deprecated this match type.

4. **Ad Extensions**: The CSV export only handles RSA structure. Ad extensions (sitelinks, callouts, etc.) would need to be configured separately in Google Ads Editor.

## Next Steps

1. **UI Testing**: Test the export modal and button interactions
2. **Edge Cases**: Test with campaigns that have missing or incomplete data
3. **Large Exports**: Test with multiple campaigns and many ad groups
4. **Google Ads Import**: Verify successful import into Google Ads Editor
5. **Error UX**: Test error message display in the UI

## Support

For issues or questions about the CSV export functionality:
- Check the console for detailed error messages
- Verify your campaign data structure matches the TypeScript types
- Review the validation rules in `csvExport.ts`
- Test with the provided mock data first before custom data
