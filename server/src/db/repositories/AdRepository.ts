/**
 * Ad Repository
 * Handles all database operations for ads
 */

import { getDatabase } from '../database';
import type { Ad, CreateAdInput, UpdateAdInput, HeadlineWithCategory } from '../types';
import { nanoid } from 'nanoid';

// Database row type (headlines and descriptions stored as JSON strings)
interface AdRow {
  id: string;
  ad_group_id: string;
  headlines: string; // JSON string
  descriptions: string; // JSON string
  final_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class AdRepository {
  /**
   * Convert database row to Ad object
   */
  private rowToAd(row: AdRow): Ad {
    return {
      ...row,
      headlines: JSON.parse(row.headlines) as HeadlineWithCategory[],
      descriptions: JSON.parse(row.descriptions) as string[],
    };
  }

  /**
   * Create a new ad
   */
  create(input: CreateAdInput): Ad {
    const db = getDatabase();

    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO ads (id, ad_group_id, headlines, descriptions, final_url, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.ad_group_id,
      JSON.stringify(input.headlines),
      JSON.stringify(input.descriptions),
      input.final_url,
      input.status ?? 'draft',
      now,
      now
    );

    return this.findById(id)!;
  }

  /**
   * Find ad by ID
   */
  findById(id: string): Ad | null {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM ads WHERE id = ?');
    const row = stmt.get(id) as AdRow | undefined;

    return row ? this.rowToAd(row) : null;
  }

  /**
   * Find all ads
   */
  findAll(): Ad[] {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM ads ORDER BY created_at DESC');
    const rows = stmt.all() as AdRow[];

    return rows.map(row => this.rowToAd(row));
  }

  /**
   * Find ads by ad group ID
   */
  findByAdGroupId(adGroupId: string): Ad[] {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM ads
      WHERE ad_group_id = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(adGroupId) as AdRow[];

    return rows.map(row => this.rowToAd(row));
  }

  /**
   * Find ads by status
   */
  findByStatus(status: string): Ad[] {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM ads WHERE status = ? ORDER BY created_at DESC');
    const rows = stmt.all(status) as AdRow[];

    return rows.map(row => this.rowToAd(row));
  }

  /**
   * Update ad
   */
  update(id: string, input: UpdateAdInput): Ad | null {
    const db = getDatabase();

    // Check if ad exists
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.headlines !== undefined) {
      updates.push('headlines = ?');
      values.push(JSON.stringify(input.headlines));
    }

    if (input.descriptions !== undefined) {
      updates.push('descriptions = ?');
      values.push(JSON.stringify(input.descriptions));
    }

    if (input.final_url !== undefined) {
      updates.push('final_url = ?');
      values.push(input.final_url);
    }

    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    if (updates.length === 0) {
      return existing; // No updates
    }

    // Always update updated_at
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE ads
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  }

  /**
   * Delete ad
   */
  delete(id: string): boolean {
    const db = getDatabase();

    const stmt = db.prepare('DELETE FROM ads WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }

  /**
   * Count ads by ad group
   */
  countByAdGroupId(adGroupId: string): number {
    const db = getDatabase();

    const stmt = db.prepare('SELECT COUNT(*) as count FROM ads WHERE ad_group_id = ?');
    const result = stmt.get(adGroupId) as { count: number };

    return result.count;
  }

  /**
   * Count ads by campaign (joins through ad groups)
   */
  countByCampaignId(campaignId: string): number {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM ads a
      JOIN ad_groups ag ON a.ad_group_id = ag.id
      WHERE ag.campaign_id = ?
    `);
    const result = stmt.get(campaignId) as { count: number };

    return result.count;
  }
}

export default new AdRepository();
