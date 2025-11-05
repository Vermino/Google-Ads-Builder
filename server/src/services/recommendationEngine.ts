/**
 * Recommendation Engine for Google Ads Automation
 *
 * Provides automated recommendations for:
 * - Structure hygiene (negatives, orphaned ad groups, budget pacing)
 * - RSA asset optimization
 * - Query mining (negative/positive keywords)
 * - Budget optimization
 * - Quality score improvements
 */

import { getDatabase } from '../db/database.js';
import { nanoid } from 'nanoid';
import type { Database } from 'better-sqlite3';

export interface Recommendation {
  id: string;
  campaignId?: string;
  adGroupId?: string;
  adId?: string;
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impactEstimate?: string;
  actionRequired: any;
  autoApplyEligible: boolean;
  status: 'pending' | 'applied' | 'dismissed' | 'scheduled';
}

export type RecommendationType =
  | 'missing_negatives'
  | 'conflicting_negatives'
  | 'orphaned_ad_group'
  | 'budget_pacing'
  | 'overlapping_keywords'
  | 'low_quality_score'
  | 'poor_asset_performance'
  | 'add_asset_variant'
  | 'remove_low_asset'
  | 'unpinned_asset'
  | 'search_term_negative'
  | 'search_term_positive'
  | 'keyword_expansion'
  | 'bid_adjustment'
  | 'budget_increase'
  | 'ad_copy_refresh';

export interface RecommendationOptions {
  campaignIds?: string[];
  includeStructureHygiene?: boolean;
  includeAssetOptimization?: boolean;
  includeQueryMining?: boolean;
  includeBudgetOptimization?: boolean;
  minImpressionsThreshold?: number;
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

/**
 * Generate all recommendations for campaigns
 */
export async function generateRecommendations(
  options: RecommendationOptions = {}
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  const {
    campaignIds,
    includeStructureHygiene = true,
    includeAssetOptimization = true,
    includeQueryMining = true,
    includeBudgetOptimization = true,
    minImpressionsThreshold = 100,
  } = options;

  const db = getDatabase();

  // Get campaigns to analyze
  const campaigns = campaignIds && campaignIds.length > 0
    ? db.prepare(`SELECT * FROM campaigns WHERE id IN (${campaignIds.map(() => '?').join(',')})`).all(...campaignIds)
    : db.prepare('SELECT * FROM campaigns WHERE status = ?').all('active');

  for (const campaign of campaigns as any[]) {
    if (includeStructureHygiene) {
      recommendations.push(...await analyzeStructureHygiene(db, campaign, options));
    }

    if (includeAssetOptimization) {
      recommendations.push(...await analyzeAssetPerformance(db, campaign, options));
    }

    if (includeQueryMining) {
      recommendations.push(...await analyzeSearchTerms(db, campaign, options));
    }

    if (includeBudgetOptimization) {
      recommendations.push(...await analyzeBudgetPacing(db, campaign, options));
    }
  }

  // Save recommendations to database
  const stmt = db.prepare(`
    INSERT INTO recommendations (
      id, campaign_id, ad_group_id, ad_id, type, priority, title, description,
      impact_estimate, action_required, auto_apply_eligible, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    for (const rec of recommendations) {
      stmt.run(
        rec.id,
        rec.campaignId || null,
        rec.adGroupId || null,
        rec.adId || null,
        rec.type,
        rec.priority,
        rec.title,
        rec.description,
        rec.impactEstimate || null,
        JSON.stringify(rec.actionRequired),
        rec.autoApplyEligible ? 1 : 0,
        rec.status
      );
    }
  })();

  return recommendations;
}

/**
 * Analyze structure hygiene issues
 */
async function analyzeStructureHygiene(
  db: Database,
  campaign: any,
  options: RecommendationOptions
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get ad groups for this campaign
  const adGroups = db.prepare(`
    SELECT * FROM ad_groups WHERE campaign_id = ?
  `).all(campaign.id) as any[];

  for (const adGroup of adGroups) {
    const keywords = JSON.parse(adGroup.keywords || '[]');
    const ads = db.prepare(`
      SELECT * FROM ads WHERE ad_group_id = ?
    `).all(adGroup.id) as any[];

    // Check for orphaned ad groups (no keywords or no ads)
    if (keywords.length === 0 || ads.length === 0) {
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        adGroupId: adGroup.id,
        type: 'orphaned_ad_group',
        priority: 'high',
        title: `Orphaned Ad Group: ${adGroup.name}`,
        description: keywords.length === 0
          ? 'This ad group has no keywords and will not receive impressions.'
          : 'This ad group has no ads and cannot serve.',
        impactEstimate: 'Will not receive any traffic',
        actionRequired: {
          action: 'add_keywords_or_ads',
          adGroupId: adGroup.id,
          missingKeywords: keywords.length === 0,
          missingAds: ads.length === 0,
        },
        autoApplyEligible: false,
        status: 'pending',
      });
    }

    // Check for ads with insufficient headlines/descriptions
    for (const ad of ads) {
      const headlines = JSON.parse(ad.headlines || '[]');
      const descriptions = JSON.parse(ad.descriptions || '[]');

      if (headlines.length < 3 || descriptions.length < 2) {
        recommendations.push({
          id: nanoid(),
          campaignId: campaign.id,
          adGroupId: adGroup.id,
          adId: ad.id,
          type: 'ad_copy_refresh',
          priority: 'medium',
          title: `Incomplete RSA: Ad in ${adGroup.name}`,
          description: `This ad has only ${headlines.length} headlines and ${descriptions.length} descriptions. Google recommends at least 8-10 headlines and 2-4 descriptions.`,
          impactEstimate: 'Low ad strength limits performance',
          actionRequired: {
            action: 'add_headlines_descriptions',
            adId: ad.id,
            currentHeadlines: headlines.length,
            currentDescriptions: descriptions.length,
            recommendedHeadlines: 10,
            recommendedDescriptions: 4,
          },
          autoApplyEligible: false,
          status: 'pending',
        });
      }
    }

    // Check for overlapping keywords within campaign
    const allKeywordsInCampaign = adGroups.flatMap(ag => {
      const kws = JSON.parse(ag.keywords || '[]');
      return kws.map((kw: any) => ({
        ...kw,
        adGroupId: ag.id,
        adGroupName: ag.name,
      }));
    });

    // Find duplicates
    const keywordMap = new Map<string, any[]>();
    for (const kw of allKeywordsInCampaign) {
      const key = kw.text.toLowerCase().trim();
      if (!keywordMap.has(key)) {
        keywordMap.set(key, []);
      }
      keywordMap.get(key)!.push(kw);
    }

    for (const [keywordText, instances] of keywordMap.entries()) {
      if (instances.length > 1) {
        recommendations.push({
          id: nanoid(),
          campaignId: campaign.id,
          type: 'overlapping_keywords',
          priority: 'medium',
          title: `Overlapping keyword: "${keywordText}"`,
          description: `This keyword appears in ${instances.length} ad groups: ${instances.map(i => i.adGroupName).join(', ')}. This can cause internal competition.`,
          impactEstimate: 'May reduce quality score and increase CPC',
          actionRequired: {
            action: 'remove_duplicate_keywords',
            keyword: keywordText,
            adGroups: instances.map(i => ({
              adGroupId: i.adGroupId,
              adGroupName: i.adGroupName,
            })),
          },
          autoApplyEligible: false,
          status: 'pending',
        });
      }
    }
  }

  // Check for missing negative keywords
  const negativeKeywords = db.prepare(`
    SELECT * FROM negative_keywords WHERE campaign_id = ?
  `).all(campaign.id) as any[];

  if (negativeKeywords.length === 0) {
    recommendations.push({
      id: nanoid(),
      campaignId: campaign.id,
      type: 'missing_negatives',
      priority: 'medium',
      title: 'No negative keywords found',
      description: 'This campaign has no negative keywords, which may result in wasted spend on irrelevant searches.',
      impactEstimate: 'Could save 10-20% of budget',
      actionRequired: {
        action: 'add_negative_keywords',
        campaignId: campaign.id,
        suggestedNegatives: [
          'free', 'cheap', 'download', 'torrent', 'crack',
          'pirate', 'tutorial', 'how to', 'diy',
        ],
      },
      autoApplyEligible: false,
      status: 'pending',
    });
  }

  return recommendations;
}

/**
 * Analyze RSA asset performance
 */
async function analyzeAssetPerformance(
  db: Database,
  campaign: any,
  options: RecommendationOptions
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const { minImpressionsThreshold = 100 } = options;

  // Get asset performance data
  const assets = db.prepare(`
    SELECT ap.*, a.ad_group_id, ag.name as ad_group_name
    FROM asset_performance ap
    INNER JOIN ads a ON ap.ad_id = a.id
    INNER JOIN ad_groups ag ON a.ad_group_id = ag.id
    WHERE ag.campaign_id = ?
    AND ap.impressions >= ?
  `).all(campaign.id, minImpressionsThreshold) as any[];

  // Group by ad
  const adAssets = new Map<string, any[]>();
  for (const asset of assets) {
    if (!adAssets.has(asset.ad_id)) {
      adAssets.set(asset.ad_id, []);
    }
    adAssets.get(asset.ad_id)!.push(asset);
  }

  for (const [adId, assetsForAd] of adAssets.entries()) {
    const lowAssets = assetsForAd.filter(a => a.performance_label === 'Low');
    const pinnedAssets = assetsForAd.filter(a => a.asset_position !== null);

    // Recommend removing low-performing assets
    if (lowAssets.length > 0) {
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        adId,
        type: 'remove_low_asset',
        priority: 'high',
        title: `Remove ${lowAssets.length} low-performing ${lowAssets[0].asset_type}(s)`,
        description: `Google has labeled ${lowAssets.length} ${lowAssets[0].asset_type}(s) as "Low" performance after ${lowAssets[0].impressions}+ impressions.`,
        impactEstimate: 'Could improve CTR by 5-15%',
        actionRequired: {
          action: 'remove_assets',
          adId,
          assets: lowAssets.map(a => ({
            id: a.id,
            text: a.asset_text,
            type: a.asset_type,
          })),
        },
        autoApplyEligible: true,
        status: 'pending',
      });
    }

    // Recommend unpinning assets
    if (pinnedAssets.length > 2) {
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        adId,
        type: 'unpinned_asset',
        priority: 'medium',
        title: `Too many pinned assets`,
        description: `This ad has ${pinnedAssets.length} pinned assets. Over-pinning limits Google's ability to optimize combinations.`,
        impactEstimate: 'May reduce impressions and performance',
        actionRequired: {
          action: 'unpin_assets',
          adId,
          pinnedAssets: pinnedAssets.map(a => ({
            text: a.asset_text,
            position: a.asset_position,
          })),
        },
        autoApplyEligible: false,
        status: 'pending',
      });
    }

    // Find best-performing assets and recommend variants
    const bestAssets = assetsForAd
      .filter(a => a.performance_label === 'Best')
      .slice(0, 3);

    if (bestAssets.length > 0) {
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        adId,
        type: 'add_asset_variant',
        priority: 'low',
        title: `Create variants of top-performing ${bestAssets[0].asset_type}s`,
        description: `Your best-performing ${bestAssets[0].asset_type}s are: "${bestAssets.map(a => a.asset_text).join('", "')}". Consider creating similar variants.`,
        impactEstimate: 'Could improve CTR by 3-8%',
        actionRequired: {
          action: 'generate_asset_variants',
          adId,
          baseAssets: bestAssets.map(a => a.asset_text),
          assetType: bestAssets[0].asset_type,
        },
        autoApplyEligible: true, // Can use AI to generate
        status: 'pending',
      });
    }
  }

  return recommendations;
}

/**
 * Analyze search terms for negative/positive keyword opportunities
 */
async function analyzeSearchTerms(
  db: Database,
  campaign: any,
  options: RecommendationOptions
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const { minImpressionsThreshold = 50 } = options;

  // Get search terms with performance data
  const searchTerms = db.prepare(`
    SELECT st.*, ag.name as ad_group_name
    FROM search_terms st
    INNER JOIN ad_groups ag ON st.ad_group_id = ag.id
    WHERE st.campaign_id = ?
    AND st.impressions >= ?
    AND st.status = 'active'
  `).all(campaign.id, minImpressionsThreshold) as any[];

  // Analyze each search term
  for (const term of searchTerms) {
    const ctr = term.clicks > 0 ? (term.clicks / term.impressions) : 0;
    const conversionRate = term.clicks > 0 ? (term.conversions / term.clicks) : 0;
    const cpa = term.conversions > 0 ? (term.cost / term.conversions) : 0;

    // High impressions, low CTR → negative keyword candidate
    if (term.impressions > 100 && ctr < 0.01) {
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        adGroupId: term.ad_group_id,
        type: 'search_term_negative',
        priority: 'high',
        title: `Add negative keyword: "${term.search_term}"`,
        description: `This search term has ${term.impressions} impressions but only ${term.clicks} clicks (${(ctr * 100).toFixed(2)}% CTR). Adding it as a negative keyword will save budget.`,
        impactEstimate: `Could save $${term.cost.toFixed(2)}/month`,
        actionRequired: {
          action: 'add_negative_keyword',
          searchTerm: term.search_term,
          campaignId: campaign.id,
          adGroupId: term.ad_group_id,
          matchType: 'phrase',
          stats: {
            impressions: term.impressions,
            clicks: term.clicks,
            cost: term.cost,
            ctr,
          },
        },
        autoApplyEligible: true,
        status: 'pending',
      });
    }

    // High CTR, high conversion rate → positive keyword candidate
    if (term.impressions > 50 && ctr > 0.05 && conversionRate > 0.02) {
      // Check if term is already a keyword
      const adGroup = db.prepare(`
        SELECT keywords FROM ad_groups WHERE id = ?
      `).get(term.ad_group_id) as { keywords: string };

      const keywords = JSON.parse(adGroup.keywords || '[]');
      const exists = keywords.some((kw: any) =>
        kw.text.toLowerCase() === term.search_term.toLowerCase()
      );

      if (!exists) {
        recommendations.push({
          id: nanoid(),
          campaignId: campaign.id,
          adGroupId: term.ad_group_id,
          type: 'search_term_positive',
          priority: 'high',
          title: `Add keyword: "${term.search_term}"`,
          description: `This search term has excellent performance: ${(ctr * 100).toFixed(2)}% CTR, ${(conversionRate * 100).toFixed(2)}% conversion rate. Add it as a keyword to gain more control.`,
          impactEstimate: `Could increase conversions by 15-30%`,
          actionRequired: {
            action: 'add_keyword',
            searchTerm: term.search_term,
            adGroupId: term.ad_group_id,
            matchType: 'phrase',
            stats: {
              impressions: term.impressions,
              clicks: term.clicks,
              conversions: term.conversions,
              cost: term.cost,
              ctr,
              conversionRate,
            },
          },
          autoApplyEligible: true,
          status: 'pending',
        });
      }
    }

    // High cost, low conversions → optimization opportunity
    if (term.cost > 50 && (conversionRate < 0.01 || term.conversions === 0)) {
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        adGroupId: term.ad_group_id,
        type: 'search_term_negative',
        priority: 'critical',
        title: `High-cost low-performer: "${term.search_term}"`,
        description: `This search term has spent $${term.cost.toFixed(2)} with ${term.conversions} conversions. Consider adding as negative keyword or reducing bids.`,
        impactEstimate: `Could save $${(term.cost * 12).toFixed(2)}/year`,
        actionRequired: {
          action: 'add_negative_keyword',
          searchTerm: term.search_term,
          campaignId: campaign.id,
          adGroupId: term.ad_group_id,
          matchType: 'phrase',
          stats: {
            impressions: term.impressions,
            clicks: term.clicks,
            cost: term.cost,
            conversions: term.conversions,
            ctr,
            conversionRate,
          },
        },
        autoApplyEligible: true,
        status: 'pending',
      });
    }
  }

  return recommendations;
}

/**
 * Analyze budget pacing and utilization
 */
async function analyzeBudgetPacing(
  db: Database,
  campaign: any,
  options: RecommendationOptions
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get performance data for the campaign
  const performanceData = db.prepare(`
    SELECT * FROM performance_data
    WHERE entity_type = 'campaign' AND entity_id = ?
    ORDER BY date_range_start DESC
    LIMIT 14
  `).all(campaign.id) as any[];

  if (performanceData.length === 0) {
    return recommendations;
  }

  // Calculate average daily spend
  const totalCost = performanceData.reduce((sum, d) => sum + d.cost, 0);
  const avgDailySpend = totalCost / performanceData.length;
  const dailyBudget = campaign.budget;

  // Underspending check
  if (avgDailySpend < dailyBudget * 0.6 && dailyBudget > 0) {
    const lostImpShare = performanceData[0]?.search_lost_is_budget || 0;

    if (lostImpShare < 0.05) {
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        type: 'budget_pacing',
        priority: 'low',
        title: 'Underspending budget',
        description: `This campaign is only spending ${((avgDailySpend / dailyBudget) * 100).toFixed(0)}% of its daily budget ($${avgDailySpend.toFixed(2)} / $${dailyBudget.toFixed(2)}). Consider lowering budget or increasing bids.`,
        impactEstimate: 'Reallocate budget to better-performing campaigns',
        actionRequired: {
          action: 'adjust_budget',
          campaignId: campaign.id,
          currentBudget: dailyBudget,
          recommendedBudget: Math.ceil(avgDailySpend * 1.1),
          reason: 'underspending',
        },
        autoApplyEligible: false,
        status: 'pending',
      });
    }
  }

  // Overspending / limited by budget check
  const lostImpShareBudget = performanceData[0]?.search_lost_is_budget || 0;
  if (lostImpShareBudget > 0.15) {
    const avgConversionRate = performanceData[0]?.conversion_rate || 0;
    const avgCpa = performanceData[0]?.cpa || 0;

    if (avgConversionRate > 0.02) { // Good conversion rate
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        type: 'budget_increase',
        priority: 'high',
        title: 'Limited by budget',
        description: `This campaign is losing ${(lostImpShareBudget * 100).toFixed(0)}% of impression share due to budget constraints. With a ${(avgConversionRate * 100).toFixed(2)}% conversion rate, increasing budget could drive more conversions.`,
        impactEstimate: `Could increase conversions by ${(lostImpShareBudget * 100).toFixed(0)}%`,
        actionRequired: {
          action: 'increase_budget',
          campaignId: campaign.id,
          currentBudget: dailyBudget,
          recommendedBudget: Math.ceil(dailyBudget * 1.25),
          reason: 'limited_by_budget',
          supportingData: {
            lostImpressionShare: lostImpShareBudget,
            conversionRate: avgConversionRate,
            cpa: avgCpa,
          },
        },
        autoApplyEligible: false,
        status: 'pending',
      });
    }
  }

  // Check for declining performance
  if (performanceData.length >= 7) {
    const recentPerf = performanceData.slice(0, 3);
    const olderPerf = performanceData.slice(3, 7);

    const recentCtr = recentPerf.reduce((sum, d) => sum + d.ctr, 0) / recentPerf.length;
    const olderCtr = olderPerf.reduce((sum, d) => sum + d.ctr, 0) / olderPerf.length;

    if (recentCtr < olderCtr * 0.8) {
      recommendations.push({
        id: nanoid(),
        campaignId: campaign.id,
        type: 'ad_copy_refresh',
        priority: 'medium',
        title: 'Declining CTR trend',
        description: `CTR has declined by ${(((olderCtr - recentCtr) / olderCtr) * 100).toFixed(0)}% over the past week. Consider refreshing ad copy.`,
        impactEstimate: 'Could restore CTR to previous levels',
        actionRequired: {
          action: 'refresh_ads',
          campaignId: campaign.id,
          reason: 'declining_ctr',
          oldCtr: olderCtr,
          newCtr: recentCtr,
        },
        autoApplyEligible: false,
        status: 'pending',
      });
    }
  }

  return recommendations;
}

/**
 * Apply a recommendation automatically
 */
export async function applyRecommendation(
  recommendationId: string
): Promise<{ success: boolean; message: string }> {
  const db = getDatabase();

  const recommendation = db.prepare(`
    SELECT * FROM recommendations WHERE id = ?
  `).get(recommendationId) as any;

  if (!recommendation) {
    return { success: false, message: 'Recommendation not found' };
  }

  if (!recommendation.auto_apply_eligible) {
    return { success: false, message: 'This recommendation cannot be auto-applied' };
  }

  const actionRequired = JSON.parse(recommendation.action_required);

  try {
    switch (actionRequired.action) {
      case 'add_negative_keyword':
        db.prepare(`
          INSERT INTO negative_keywords (id, campaign_id, ad_group_id, keyword_text, match_type, level, source)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          nanoid(),
          actionRequired.campaignId,
          actionRequired.adGroupId || null,
          actionRequired.searchTerm,
          actionRequired.matchType,
          actionRequired.adGroupId ? 'ad_group' : 'campaign',
          'automated'
        );

        // Mark search term
        db.prepare(`
          UPDATE search_terms
          SET status = 'added_as_negative'
          WHERE search_term = ? AND ad_group_id = ?
        `).run(actionRequired.searchTerm, actionRequired.adGroupId);
        break;

      case 'add_keyword':
        const adGroup = db.prepare(`
          SELECT keywords FROM ad_groups WHERE id = ?
        `).get(actionRequired.adGroupId) as { keywords: string };

        const keywords = JSON.parse(adGroup.keywords || '[]');
        keywords.push({
          id: nanoid(),
          text: actionRequired.searchTerm,
        });

        db.prepare(`
          UPDATE ad_groups SET keywords = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(JSON.stringify(keywords), actionRequired.adGroupId);

        // Mark search term
        db.prepare(`
          UPDATE search_terms
          SET status = 'added_as_positive'
          WHERE search_term = ? AND ad_group_id = ?
        `).run(actionRequired.searchTerm, actionRequired.adGroupId);
        break;

      case 'remove_assets':
        // Would remove low-performing assets from the ad
        // Implementation depends on how assets are stored
        break;

      default:
        return { success: false, message: 'Unknown action type' };
    }

    // Mark recommendation as applied
    db.prepare(`
      UPDATE recommendations
      SET status = 'applied', applied_at = datetime('now')
      WHERE id = ?
    `).run(recommendationId);

    return { success: true, message: 'Recommendation applied successfully' };

  } catch (error) {
    return {
      success: false,
      message: `Error applying recommendation: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get all recommendations for a campaign
 */
export function getRecommendationsForCampaign(
  campaignId: string,
  status?: string
): Recommendation[] {
  const db = getDatabase();

  let query = 'SELECT * FROM recommendations WHERE campaign_id = ?';
  const params: any[] = [campaignId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY priority DESC, created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(row => ({
    id: row.id,
    campaignId: row.campaign_id,
    adGroupId: row.ad_group_id,
    adId: row.ad_id,
    type: row.type,
    priority: row.priority,
    title: row.title,
    description: row.description,
    impactEstimate: row.impact_estimate,
    actionRequired: JSON.parse(row.action_required),
    autoApplyEligible: row.auto_apply_eligible === 1,
    status: row.status,
  }));
}

export default {
  generateRecommendations,
  applyRecommendation,
  getRecommendationsForCampaign,
};
