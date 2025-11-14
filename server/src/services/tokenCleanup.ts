/**
 * OAuth Token Cleanup Service
 *
 * Automatically removes expired OAuth tokens from the database
 * Runs periodically to prevent database bloat
 */

import { getDatabase } from '../db/database.js';
import logger from '../utils/logger.js';

/**
 * Clean up expired OAuth tokens from database
 * Removes tokens that expired more than 2 hours ago
 */
export function cleanupExpiredTokens(): void {
  try {
    const db = getDatabase();

    // Delete tokens older than 2 hours (1 hour expiry + 1 hour grace period)
    const result = db.prepare(`
      DELETE FROM oauth_tokens
      WHERE datetime(expires_at) < datetime('now', '-2 hours')
    `).run();

    if (result.changes > 0) {
      logger.info('OAuth tokens cleaned up', { count: result.changes });
    }
  } catch (error: any) {
    logger.error('Token cleanup error', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Get OAuth token statistics
 * Useful for monitoring token usage
 */
export function getTokenStats(): {
  total: number;
  unused: number;
  used: number;
  expired: number;
} {
  try {
    const db = getDatabase();

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END) as unused,
        SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN datetime(expires_at) < datetime('now') THEN 1 ELSE 0 END) as expired
      FROM oauth_tokens
    `).get() as any;

    return {
      total: stats.total || 0,
      unused: stats.unused || 0,
      used: stats.used || 0,
      expired: stats.expired || 0,
    };
  } catch (error: any) {
    logger.error('Error getting token stats', {
      error: error.message,
      stack: error.stack
    });
    return { total: 0, unused: 0, used: 0, expired: 0 };
  }
}
