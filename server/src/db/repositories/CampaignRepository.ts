/**
 * Campaign Repository
 * Handles all database operations for campaigns
 */

import { getDatabase } from '../database';
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '../types';
import { nanoid } from 'nanoid';

// Database row type (global_descriptions stored as JSON string)
interface CampaignRow {
  id: string;
  name: string;
  budget: number;
  status: string;
  location: string;
  start_date: string;
  end_date: string;
  final_url: string;
  path1: string;
  path2: string;
  global_descriptions: string; // JSON string
  created_at: string;
  updated_at: string;
}

export class CampaignRepository {
  /**
   * Convert database row to Campaign object
   */
  private rowToCampaign(row: CampaignRow): Campaign {
    return {
      ...row,
      startDate: row.start_date,
      endDate: row.end_date,
      finalUrl: row.final_url,
      globalDescriptions: JSON.parse(row.global_descriptions || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create a new campaign
   */
  create(input: CreateCampaignInput): Campaign {
    const db = getDatabase();

    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO campaigns (
        id, name, budget, status, location, start_date, end_date,
        final_url, path1, path2, global_descriptions, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.name,
      input.budget ?? 0,
      input.status ?? 'draft',
      input.location ?? 'United States',
      input.start_date ?? '',
      input.end_date ?? '',
      input.final_url ?? '',
      input.path1 ?? '',
      input.path2 ?? '',
      JSON.stringify(input.global_descriptions ?? []),
      now,
      now
    );

    return this.findById(id)!;
  }

  /**
   * Find campaign by ID
   */
  findById(id: string): Campaign | null {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM campaigns WHERE id = ?');
    const row = stmt.get(id) as CampaignRow | undefined;

    return row ? this.rowToCampaign(row) : null;
  }

  /**
   * Find all campaigns
   */
  findAll(): Campaign[] {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC');
    const rows = stmt.all() as CampaignRow[];
    return rows.map(row => this.rowToCampaign(row));
  }

  /**
   * Find campaigns by status
   */
  findByStatus(status: string): Campaign[] {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC');
    const rows = stmt.all(status) as CampaignRow[];
    return rows.map(row => this.rowToCampaign(row));
  }

  /**
   * Update campaign
   */
  update(id: string, input: UpdateCampaignInput): Campaign | null {
    const db = getDatabase();

    // Check if campaign exists
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

    if (input.budget !== undefined) {
      updates.push('budget = ?');
      values.push(input.budget);
    }

    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    if (input.location !== undefined) {
      updates.push('location = ?');
      values.push(input.location);
    }

    if (input.start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(input.start_date);
    }

    if (input.end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(input.end_date);
    }

    if (input.final_url !== undefined) {
      updates.push('final_url = ?');
      values.push(input.final_url);
    }

    if (input.path1 !== undefined) {
      updates.push('path1 = ?');
      values.push(input.path1);
    }

    if (input.path2 !== undefined) {
      updates.push('path2 = ?');
      values.push(input.path2);
    }

    if (input.global_descriptions !== undefined) {
      updates.push('global_descriptions = ?');
      values.push(JSON.stringify(input.global_descriptions));
    }

    if (updates.length === 0) {
      return existing; // No updates
    }

    // Always update updated_at
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE campaigns
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  }

  /**
   * Delete campaign (and all associated ad groups and ads via CASCADE)
   */
  delete(id: string): boolean {
    const db = getDatabase();

    const stmt = db.prepare('DELETE FROM campaigns WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }

  /**
   * Count total campaigns
   */
  count(): number {
    const db = getDatabase();

    const stmt = db.prepare('SELECT COUNT(*) as count FROM campaigns');
    const result = stmt.get() as { count: number };

    return result.count;
  }

  /**
   * Search campaigns by name
   */
  searchByName(query: string): Campaign[] {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT * FROM campaigns
      WHERE name LIKE ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(`%${query}%`) as CampaignRow[];
    return rows.map(row => this.rowToCampaign(row));
  }

  /**
   * Update only the updated_at timestamp for a campaign
   */
  touch(id: string): Campaign | null {
    const db = getDatabase();

    const stmt = db.prepare(
      `UPDATE campaigns SET updated_at = ? WHERE id = ?`
    );

    const now = new Date().toISOString();
    const result = stmt.run(now, id);

    if (result.changes === 0) {
      return null;
    }

    return this.findById(id);
  }
}

export default new CampaignRepository();
