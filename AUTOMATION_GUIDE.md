# Google Ads Bulk Automation System - Complete Guide

## Overview

This system provides comprehensive automated Google Ads management **without using the Google Ads API**. Instead, it leverages:
- **Google Ads Editor CSV/ZIP exports** for campaign structure
- **Google Ads Scripts + Google Sheets** for performance data (much easier to get approved than Ads API)
- **Automated recommendations engine** for optimization opportunities
- **Automation orchestrator** for scheduled and triggered actions

## Table of Contents

1. [Architecture](#architecture)
2. [Setup Guide](#setup-guide)
3. [Core Features](#core-features)
4. [API Endpoints](#api-endpoints)
5. [Usage Workflows](#usage-workflows)
6. [Automation Examples](#automation-examples)

---

## Architecture

### Data Flow

```
Google Ads Editor → CSV/ZIP Export → Import API → Database
        ↓
Google Ads Account → Google Ads Script → Google Sheets → Sheets API → Database
        ↓
Performance Data + Campaign Structure → Recommendation Engine → Recommendations
        ↓
Recommendations + Automation Rules → Automation Orchestrator → Actions
        ↓
Actions → Export to CSV → Google Ads Editor → Import to Google Ads
```

### Database Schema

**New Tables Added:**
- `imports` - Track CSV/ZIP import history
- `snapshots` - Version control for campaigns
- `performance_data` - Performance metrics by entity (campaign/ad group/ad/keyword)
- `asset_performance` - Headline/description performance tracking
- `search_terms` - Actual search queries with performance
- `recommendations` - Generated optimization recommendations
- `automation_rules` - Automation rule definitions
- `automation_history` - Execution tracking
- `negative_keywords` - Negative keyword management
- `sheets_configs` - Google Sheets integration settings

---

## Setup Guide

### 1. Google Sheets Integration Setup

#### Step 1: Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Sheets API**
4. Navigate to **IAM & Admin > Service Accounts**
5. Create a new service account
6. Create and download a **JSON key** for the service account

#### Step 2: Create Google Sheets Spreadsheet

1. Create a new Google Sheets spreadsheet
2. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
3. Share the spreadsheet with the service account email
4. Give it **Editor** permissions

#### Step 3: Configure in Application

**API Endpoint:** `POST /api/sheets/config`

```json
{
  "spreadsheetId": "your-spreadsheet-id",
  "serviceAccountEmail": "your-service-account@project.iam.gserviceaccount.com",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "performanceSheetName": "Performance",
  "searchTermsSheetName": "SearchTerms",
  "assetPerformanceSheetName": "AssetPerformance"
}
```

#### Step 4: Install Google Ads Script

1. Get the script: `GET /api/sheets/script`
2. Go to Google Ads: **Tools & Settings > Bulk Actions > Scripts**
3. Create a new script
4. Paste the generated script code
5. Authorize the script
6. Schedule it to run **daily**

---

### 2. Import Workflow Setup

The import workflow allows you to import campaigns from Google Ads Editor exports.

#### Import from CSV/ZIP

**API Endpoint:** `POST /api/import/editor`

**Multipart Form Data:**
```
file: [CSV or ZIP file]
updateExisting: true/false (optional, default: false)
createSnapshot: true/false (optional, default: true)
```

**What it does:**
- Parses Google Ads Editor CSV format
- Creates/updates campaigns, ad groups, ads, keywords
- Creates version snapshot before changes
- Validates data and reports errors

#### Import Performance Data

**API Endpoint:** `POST /api/import/performance`

**Multipart Form Data:**
```
file: [CSV file from Google Ads performance report]
dateRangeStart: YYYY-MM-DD
dateRangeEnd: YYYY-MM-DD
```

#### Import Search Terms

**API Endpoint:** `POST /api/import/search-terms`

**Multipart Form Data:**
```
file: [CSV file from Google Ads search terms report]
dateRangeStart: YYYY-MM-DD
dateRangeEnd: YYYY-MM-DD
```

---

## Core Features

### 1. Automated Recommendations

The recommendation engine analyzes campaigns and generates actionable recommendations.

#### Recommendation Types

**Structure Hygiene:**
- `missing_negatives` - Campaign has no negative keywords
- `conflicting_negatives` - Negative keywords blocking positive keywords
- `orphaned_ad_group` - Ad group with no keywords or no ads
- `overlapping_keywords` - Same keyword in multiple ad groups

**RSA Asset Optimization:**
- `poor_asset_performance` - Assets labeled "Low" by Google
- `remove_low_asset` - Remove low-performing headlines/descriptions
- `add_asset_variant` - Create variants of top performers
- `unpinned_asset` - Too many pinned assets limiting optimization

**Query Mining:**
- `search_term_negative` - High impressions, low CTR → add as negative
- `search_term_positive` - High CTR, high conversions → add as keyword
- `keyword_expansion` - Related terms performing well

**Budget Optimization:**
- `budget_pacing` - Underspending or overspending
- `budget_increase` - Limited by budget with good performance
- `bid_adjustment` - Adjust bids based on performance

#### Generate Recommendations

**API Endpoint:** `POST /api/recommendations/generate`

```json
{
  "campaignIds": ["campaign-id-1", "campaign-id-2"],
  "includeStructureHygiene": true,
  "includeAssetOptimization": true,
  "includeQueryMining": true,
  "includeBudgetOptimization": true,
  "minImpressionsThreshold": 100,
  "dateRangeStart": "2025-10-01",
  "dateRangeEnd": "2025-11-05"
}
```

**Response:**
```json
{
  "success": true,
  "count": 42,
  "recommendations": [
    {
      "id": "rec-123",
      "campaignId": "campaign-id-1",
      "adGroupId": "ad-group-id-1",
      "type": "search_term_negative",
      "priority": "high",
      "title": "Add negative keyword: \"free download\"",
      "description": "This search term has 500 impressions but only 2 clicks (0.4% CTR)",
      "impactEstimate": "Could save $45/month",
      "actionRequired": {
        "action": "add_negative_keyword",
        "searchTerm": "free download",
        "matchType": "phrase"
      },
      "autoApplyEligible": true,
      "status": "pending"
    }
  ]
}
```

#### Apply Recommendations

**Single:** `POST /api/recommendations/:id/apply`

**Bulk:** `POST /api/recommendations/apply-bulk`
```json
{
  "recommendationIds": ["rec-123", "rec-456", "rec-789"]
}
```

---

### 2. Automation Rules

Automation rules define when and what actions to execute automatically.

#### Automation Rule Structure

```json
{
  "name": "Daily Auto-Apply Safe Recommendations",
  "description": "Automatically apply high-priority recommendations that are safe to auto-apply",
  "triggerType": "scheduled",
  "triggerConfig": {
    "schedule": "daily"
  },
  "actionType": "apply_recommendations",
  "actionConfig": {
    "autoApplyOnly": true,
    "priorities": ["critical", "high"]
  },
  "filters": {
    "campaignIds": []
  },
  "enabled": true
}
```

#### Trigger Types

- **`scheduled`** - Run on a schedule (hourly, daily, weekly)
- **`performance_threshold`** - Trigger when metrics cross thresholds
- **`budget_threshold`** - Trigger on budget utilization
- **`import_completion`** - Trigger after import completes
- **`manual`** - Only run manually

#### Action Types

| Action Type | Description | Auto-Apply Safe |
|------------|-------------|-----------------|
| `apply_recommendations` | Apply pending recommendations | Configurable |
| `pause_low_performers` | Pause low CTR/conversion campaigns/ad groups/ads | ⚠️ Review first |
| `add_negatives` | Add negative keywords to campaigns | ✅ Yes |
| `add_keywords` | Add keywords to ad groups | ✅ Yes |
| `increase_budget` | Increase campaign budgets | ⚠️ Review first |
| `decrease_budget` | Decrease campaign budgets | ⚠️ Review first |
| `adjust_bids` | Adjust keyword/ad group bids | ⚠️ Review first |
| `refresh_ads` | Generate new ad copy variants | ⚠️ Review first |
| `sync_sheets_data` | Pull data from Google Sheets | ✅ Yes |
| `generate_recommendations` | Run recommendation engine | ✅ Yes |

#### API Endpoints

**Create Rule:** `POST /api/automation/rules`

**Get All Rules:** `GET /api/automation/rules`

**Execute Rule:** `POST /api/automation/rules/:id/execute`

**Get Execution History:** `GET /api/automation/history?ruleId=rule-123`

**Get Templates:** `GET /api/automation/templates`

---

## API Endpoints Reference

### Import Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/import/editor` | Import campaigns from Google Ads Editor CSV/ZIP |
| POST | `/api/import/performance` | Import performance data CSV |
| POST | `/api/import/search-terms` | Import search terms report |
| GET | `/api/import/history` | Get import history |
| GET | `/api/import/:id` | Get import details |

### Recommendations Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recommendations/generate` | Generate recommendations |
| GET | `/api/recommendations` | Get all recommendations (with filters) |
| GET | `/api/recommendations/campaign/:id` | Get recommendations for campaign |
| GET | `/api/recommendations/stats` | Get recommendation statistics |
| POST | `/api/recommendations/:id/apply` | Apply a recommendation |
| POST | `/api/recommendations/apply-bulk` | Apply multiple recommendations |
| PATCH | `/api/recommendations/:id/status` | Update recommendation status |
| DELETE | `/api/recommendations/:id` | Delete recommendation |

### Automation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/automation/rules` | Get all automation rules |
| GET | `/api/automation/rules/:id` | Get specific rule |
| POST | `/api/automation/rules` | Create automation rule |
| PATCH | `/api/automation/rules/:id` | Update rule |
| DELETE | `/api/automation/rules/:id` | Delete rule |
| POST | `/api/automation/rules/:id/execute` | Execute rule manually |
| GET | `/api/automation/history` | Get execution history |
| GET | `/api/automation/stats` | Get automation statistics |
| GET | `/api/automation/templates` | Get pre-built templates |

### Google Sheets Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sheets/config` | Get current configuration |
| POST | `/api/sheets/config` | Save configuration |
| POST | `/api/sheets/sync` | Manually sync data |
| GET | `/api/sheets/script` | Get Google Ads Script code |
| DELETE | `/api/sheets/config` | Remove configuration |
| GET | `/api/sheets/setup-guide` | Get setup instructions |

---

## Usage Workflows

### Workflow 1: Daily Optimization Loop

**Goal:** Automatically optimize campaigns daily without manual intervention.

**Setup:**

1. **Configure Google Sheets** (one-time)
   - Set up service account
   - Configure spreadsheet
   - Install Google Ads Script (scheduled daily)

2. **Create Automation Rules:**

   **Rule 1: Sync Performance Data (8:00 AM)**
   ```json
   {
     "name": "Morning Data Sync",
     "triggerType": "scheduled",
     "triggerConfig": { "schedule": "daily", "time": "08:00" },
     "actionType": "sync_sheets_data",
     "actionConfig": { "dateRangeDays": 7 }
   }
   ```

   **Rule 2: Generate Recommendations (8:30 AM)**
   ```json
   {
     "name": "Generate Daily Recommendations",
     "triggerType": "scheduled",
     "triggerConfig": { "schedule": "daily", "time": "08:30" },
     "actionType": "generate_recommendations",
     "actionConfig": {}
   }
   ```

   **Rule 3: Auto-Apply Safe Recommendations (9:00 AM)**
   ```json
   {
     "name": "Auto-Apply Safe Recommendations",
     "triggerType": "scheduled",
     "triggerConfig": { "schedule": "daily", "time": "09:00" },
     "actionType": "apply_recommendations",
     "actionConfig": {
       "autoApplyOnly": true,
       "priorities": ["critical", "high"]
     }
   }
   ```

3. **Review Dashboard**
   - Check applied recommendations
   - Review pending manual-review recommendations
   - Monitor automation execution history

4. **Weekly Export**
   - Export updated campaigns to CSV
   - Import to Google Ads Editor
   - Upload to Google Ads

---

### Workflow 2: Import → Analyze → Optimize

**Goal:** Import existing campaigns, analyze them, and get optimization recommendations.

**Steps:**

1. **Export from Google Ads Editor**
   - Open Google Ads Editor
   - Select campaigns to optimize
   - File → Export → Export to CSV
   - Save as ZIP

2. **Import to System**
   ```bash
   curl -X POST http://localhost:3001/api/import/editor \
     -F "file=@campaigns.zip" \
     -F "updateExisting=false" \
     -F "createSnapshot=true"
   ```

3. **Generate Recommendations**
   ```bash
   curl -X POST http://localhost:3001/api/recommendations/generate \
     -H "Content-Type: application/json" \
     -d '{
       "includeStructureHygiene": true,
       "includeAssetOptimization": true,
       "includeQueryMining": true,
       "includeBudgetOptimization": true
     }'
   ```

4. **Review and Apply**
   - View recommendations in dashboard
   - Apply safe ones automatically
   - Review others manually
   - Export changes for Google Ads Editor

---

### Workflow 3: Automated Negative Keyword Management

**Goal:** Automatically add negative keywords based on search term data.

**Setup:**

1. **Import Search Terms Weekly**
   - Export search terms report from Google Ads UI
   - Import via API: `POST /api/import/search-terms`

2. **Auto-Generate Negative Keyword Recommendations**
   - Recommendation engine analyzes search terms
   - Identifies low CTR, high spend terms
   - Creates `search_term_negative` recommendations

3. **Auto-Apply**
   ```json
   {
     "name": "Auto-Add Negative Keywords",
     "triggerType": "scheduled",
     "triggerConfig": { "schedule": "weekly" },
     "actionType": "apply_recommendations",
     "actionConfig": {
       "autoApplyOnly": true,
       "priorities": ["critical", "high"],
       "types": ["search_term_negative"]
     }
   }
   ```

4. **Result**
   - Wasted spend reduced
   - Negative keywords automatically added
   - Export to Google Ads Editor weekly

---

## Automation Examples

### Example 1: Pause Low Performers

```json
{
  "name": "Pause Low CTR Ad Groups",
  "description": "Automatically pause ad groups with CTR < 1% after 1000+ impressions",
  "triggerType": "scheduled",
  "triggerConfig": {
    "schedule": "weekly"
  },
  "actionType": "pause_low_performers",
  "actionConfig": {
    "entityType": "ad_group",
    "ctrThreshold": 0.01,
    "minImpressions": 1000,
    "dateRangeDays": 7
  },
  "enabled": true
}
```

### Example 2: Add Common Negatives

```json
{
  "name": "Add Standard Negative Keywords",
  "description": "Add common waste keywords to all campaigns",
  "triggerType": "manual",
  "triggerConfig": {},
  "actionType": "add_negatives",
  "actionConfig": {
    "negativeKeywords": [
      "free", "cheap", "download", "torrent", "crack",
      "pirate", "tutorial", "how to", "diy"
    ],
    "matchType": "phrase",
    "campaignIds": []
  },
  "enabled": true
}
```

### Example 3: Budget Increase for Winners

```json
{
  "name": "Increase Budget for High Converters",
  "description": "Increase budget by 20% for campaigns with >5% conversion rate",
  "triggerType": "performance_threshold",
  "triggerConfig": {
    "conversionRateThreshold": 0.05,
    "minConversions": 10
  },
  "actionType": "increase_budget",
  "actionConfig": {
    "adjustmentPercent": 20
  },
  "filters": {
    "campaignIds": []
  },
  "enabled": true
}
```

---

## Recommendation Priority Guide

### Critical Priority
- High spend with zero conversions
- Campaigns/ad groups with fundamental issues (no keywords, no ads)
- Budget exhaustion limiting high-performing campaigns

### High Priority
- Low-performing search terms consuming budget
- High-performing search terms not added as keywords
- Low-performing assets in RSAs
- Obvious keyword overlaps

### Medium Priority
- Budget pacing issues
- Missing negative keywords
- Ad copy refresh suggestions
- Quality score improvements

### Low Priority
- Asset variant suggestions
- Keyword expansion opportunities
- Bid adjustment suggestions

---

## Best Practices

### 1. Start Conservative
- Enable auto-apply only for negative keywords initially
- Review all other recommendations manually
- Gradually increase automation as confidence grows

### 2. Monitor Automation History
- Check execution logs daily
- Review changes made by automations
- Adjust rules based on results

### 3. Use Snapshots
- Always create snapshots before bulk changes
- Keep versioned backups of campaign structure
- Enable rollback capability

### 4. Regular Exports
- Export campaigns to Google Ads Editor weekly
- Upload changes to Google Ads regularly
- Don't let the system drift too far from live state

### 5. Combine Manual + Auto
- Use automation for repetitive tasks (negatives, low performers)
- Keep human oversight for budget and bid changes
- Review recommendations before applying high-impact changes

---

## Troubleshooting

### Google Sheets Integration Issues

**Problem:** "Authentication failed"
- Check service account has correct permissions
- Verify private key is complete with BEGIN/END markers
- Ensure spreadsheet is shared with service account email

**Problem:** "No data synced"
- Verify Google Ads Script is running successfully
- Check sheet names match configuration
- Ensure script is scheduled to run daily

### Import Issues

**Problem:** "CSV parsing error"
- Ensure CSV is from Google Ads Editor (correct format)
- Check for special characters in campaign names
- Verify file encoding is UTF-8

**Problem:** "Validation errors"
- Review error messages in import response
- Check headline/description character limits
- Verify required fields are present

### Automation Issues

**Problem:** "Automation not running"
- Check rule is enabled
- Verify next_run_at timestamp
- Check automation history for errors

**Problem:** "Actions not applied"
- Review execution errors in automation history
- Check if entities still exist
- Verify action configuration is correct

---

## Technical Details

### Database Migrations

Migrations are run automatically on server startup. The migration system tracks applied migrations to avoid re-running them.

Location: `server/src/db/migrations/`

### Recommendation Scoring

Recommendations are prioritized based on:
- **Impact:** Potential cost savings or performance improvement
- **Confidence:** Amount of data supporting the recommendation
- **Risk:** Likelihood of negative impact if applied

### Automation Scheduler

The scheduler runs every 60 seconds and checks for due automations. Scheduled automations have a `next_run_at` timestamp that determines when they execute.

---

## Future Enhancements

- [ ] UI dashboard for recommendations
- [ ] Visual campaign structure editor
- [ ] A/B testing framework for ad variations
- [ ] Advanced bid optimization algorithms
- [ ] Machine learning for conversion prediction
- [ ] Integration with Google Analytics 4
- [ ] Automated report generation
- [ ] Slack/Email notifications for recommendations
- [ ] Multi-account management
- [ ] Template-based campaign creation

---

## Support & Contribution

For issues, feature requests, or contributions, please refer to the main project repository.

**Key Files:**
- `server/src/services/importService.ts` - Import logic
- `server/src/services/recommendationEngine.ts` - Recommendation generation
- `server/src/services/automationOrchestrator.ts` - Automation execution
- `server/src/services/sheetsIntegration.ts` - Google Sheets integration
- `server/src/db/migrations/001_automation_system.sql` - Database schema

---

## License

This automation system is part of the Google Ads Builder project and follows the same license terms.
