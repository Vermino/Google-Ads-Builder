/**
 * Ad Group Repository
 * Handles all database operations for ad groups
 */

import { getDatabase } from '../database';
import type { AdGroup, CreateAdGroupInput, UpdateAdGroupInput } from '../types';
import { nanoid } from 'nanoid';

// Database row type (keywords stored as JSON string)
interface AdGroupRow {
  id: string;
  campaign_id: string;
  name: string;
  keywords: string; // JSON string
  status: string;
  created_at: string;
  updated_at: string;
}

export class AdGroupRepository {
  /**
   * Convert database row to AdGroup object
   */
  private rowToAdGroup(row: AdGroupRow): AdGroup {
    return {
      ...row,
      keywords: JSON.parse(row.keywords) as string[],
    };
  }

  /**
   * Create a new ad group
   */
  create(input: CreateAdGroupInput): AdGroup {
    const db = getDatabase();

    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO ad_groups (id, campaign_id, name, keywords, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.campaign_id,
      input.name,
      JSON.stringify(input.keywords ?? []),
      input.status ?? 'draft',
      now,
      now
    );

    return this.findById(id)!;
  }

  /**
   * Find ad group by ID
   */
  findById(id: string): AdGroup | null {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM ad_groups WHERE id = ?');
    const row = stmt.get(id) as AdGroupRow | undefined;

    return row ? this.rowToAdGroup(row) : null;
  }

  /**
   * Find all ad groups
   */
  findAll(): AdGroup[] {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM ad_groups ORDER BY created_at DESC');
    const rows = stmt.all() as AdGroupRow[];

    return rows.map(row => this.rowToAdGroup(row));
  }

  /**
   * Find ad groups by campaign ID
   */
  findByCampaignId(campaignId: string): AdGroup[] {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM ad_groups
      WHERE campaign_id = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(campaignId) as AdGroupRow[];

    return rows.map(row => this.rowToAdGroup(row));
  }

  /**
   * Find ad groups by status
   */
  findByStatus(status: string): AdGroup[] {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM ad_groups WHERE status = ? ORDER BY created_at DESC');
    const rows = stmt.all(status) as AdGroupRow[];

    return rows.map(row => this.rowToAdGroup(row));
  }

  /**
   * Update ad group
   */
  update(id: string, input: UpdateAdGroupInput): AdGroup | null {
    const db = getDatabase();

    // Check if ad group exists
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }

    if (input.keywords !== undefined) {
      updates.push('keywords = ?');
      values.push(JSON.stringify(input.keywords));
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
      UPDATE ad_groups
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  }

  /**
   * Delete ad group (and all associated ads via CASCADE)
   */
  delete(id: string): boolean {
    const db = getDatabase();

    const stmt = db.prepare('DELETE FROM ad_groups WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }

  /**
   * Count ad groups by campaign
   */
  countByCampaignId(campaignId: string): number {
    const db = getDatabase();

    const stmt = db.prepare('SELECT COUNT(*) as count FROM ad_groups WHERE campaign_id = ?');
    const result = stmt.get(campaignId) as { count: number };

    return result.count;
  }

  /**
   * Search ad groups by name
   */
  searchByName(query: string): AdGroup[] {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM ad_groups
      WHERE name LIKE ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(`%${query}%`) as AdGroupRow[];

    return rows.map(row => this.rowToAdGroup(row));
  }
}

export default new AdGroupRepository();
