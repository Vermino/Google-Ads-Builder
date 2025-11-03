/**
 * Campaign Repository
 * Handles all database operations for campaigns
 */

import { getDatabase } from '../database';
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '../types';
import { nanoid } from 'nanoid';

export class CampaignRepository {
  /**
   * Create a new campaign
   */
  create(input: CreateCampaignInput): Campaign {
    const db = getDatabase();

    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO campaigns (id, name, budget, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.name,
      input.budget ?? 0,
      input.status ?? 'draft',
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
    const campaign = stmt.get(id) as Campaign | undefined;

    return campaign ?? null;
  }

  /**
   * Find all campaigns
   */
  findAll(): Campaign[] {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC');
    return stmt.all() as Campaign[];
  }

  /**
   * Find campaigns by status
   */
  findByStatus(status: string): Campaign[] {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC');
    return stmt.all(status) as Campaign[];
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

    return stmt.all(`%${query}%`) as Campaign[];
  }
}

export default new CampaignRepository();
