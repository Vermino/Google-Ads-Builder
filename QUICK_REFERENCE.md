# CSV Export - Quick Reference Card

## Import Statement

```typescript
import { exportToGoogleAds } from '@/utils/csvExport';
import type { ExportOptions } from '@/utils/csvExport';
```

## Basic Usage

```typescript
// Export campaigns by ID
await exportToGoogleAds({
  campaignIds: ['camp-1', 'camp-2']
});
```

## Export Options

```typescript
interface ExportOptions {
  campaignIds: string[];      // Required
  includeAdGroups?: boolean;  // Optional (default: true)
  includeAds?: boolean;       // Optional (default: true)
  includeKeywords?: boolean;  // Optional (default: true)
}
```

## Error Handling

```typescript
try {
  await exportToGoogleAds(options);
  // Success - CSV downloaded
} catch (error) {
  // Error - validation failed or no data
  console.error(error.message);
}
```

## CSV Output

- **Format**: Google Ads Editor compatible
- **Encoding**: UTF-8 with BOM
- **Columns**: 31 total
- **Filename**: `google-ads-campaign-YYYY-MM-DD.csv`

## Match Types

| Type | Format | Example |
|------|--------|---------|
| Exact | `[keyword]` | `[instagram marketing]` |
| Phrase | `"keyword"` | `"instagram marketing"` |
| Broad | `keyword` | `instagram marketing` |

## Validation Rules

| Field | Constraint |
|-------|-----------|
| Headlines | 3-15 required, max 30 chars each |
| Descriptions | 2-4 required, max 90 chars each |
| Path 1 | Optional, max 15 chars |
| Path 2 | Optional, max 15 chars |
| Final URL | Required |

## CPC Calculation

```
Adjusted CPC = Base CPC × (1 + Modifier %)
```

Example: $2.50 base + 75% modifier = $4.38

## Status Mappings

| Internal | Google Ads |
|----------|-----------|
| active | Enabled |
| paused | Paused |
| ended/disabled | Removed |

## File Location

`src/utils/csvExport.ts`

## Documentation

- Technical: `CSV_EXPORT_IMPLEMENTATION.md`
- Testing: `TEST_CSV_EXPORT.md`
- Summary: `CSV_EXPORT_SUMMARY.md`
