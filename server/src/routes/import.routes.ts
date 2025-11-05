/**
 * Import API Routes
 * Handles CSV/ZIP file uploads and imports from Google Ads Editor
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import {
  importFromEditorCSV,
  importFromZip,
  importPerformanceData,
  importSearchTerms,
} from '../services/importService.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/zip', 'application/x-zip-compressed'];
    const allowedExtensions = ['.csv', '.zip'];

    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

    if (hasValidType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and ZIP files are allowed.'));
    }
  },
});

/**
 * POST /api/import/editor
 * Import from Google Ads Editor CSV or ZIP file
 */
router.post('/editor', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const options = {
      updateExisting: req.body.updateExisting === 'true',
      createSnapshot: req.body.createSnapshot !== 'false', // Default true
    };

    let result;

    if (req.file.originalname.toLowerCase().endsWith('.zip')) {
      result = await importFromZip(req.file.buffer, req.file.originalname, options);
    } else {
      const fileContent = req.file.buffer.toString('utf-8');
      result = await importFromEditorCSV(fileContent, req.file.originalname, options);
    }

    res.json(result);

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    });
  }
});

/**
 * POST /api/import/performance
 * Import performance data from CSV report
 */
router.post('/performance', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { dateRangeStart, dateRangeEnd } = req.body;

    if (!dateRangeStart || !dateRangeEnd) {
      return res.status(400).json({
        success: false,
        error: 'dateRangeStart and dateRangeEnd are required',
      });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const result = await importPerformanceData(fileContent, dateRangeStart, dateRangeEnd);

    res.json(result);

  } catch (error) {
    console.error('Performance import error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    });
  }
});

/**
 * POST /api/import/search-terms
 * Import search terms report from CSV
 */
router.post('/search-terms', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { dateRangeStart, dateRangeEnd } = req.body;

    if (!dateRangeStart || !dateRangeEnd) {
      return res.status(400).json({
        success: false,
        error: 'dateRangeStart and dateRangeEnd are required',
      });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const result = await importSearchTerms(fileContent, dateRangeStart, dateRangeEnd);

    res.json(result);

  } catch (error) {
    console.error('Search terms import error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    });
  }
});

/**
 * GET /api/import/history
 * Get import history
 */
router.get('/history', (req: Request, res: Response) => {
  try {
    const { getDatabase } = require('../db/database.js');
    const db = getDatabase();

    const limit = parseInt(req.query.limit as string) || 50;
    const imports = db.prepare(`
      SELECT id, filename, file_type, import_type, status,
             entities_imported, created_at, completed_at
      FROM imports
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);

    res.json({
      success: true,
      imports,
    });

  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch import history',
    });
  }
});

/**
 * GET /api/import/:id
 * Get details of a specific import
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { getDatabase } = require('../db/database.js');
    const db = getDatabase();

    const importRecord = db.prepare('SELECT * FROM imports WHERE id = ?').get(req.params.id);

    if (!importRecord) {
      return res.status(404).json({
        success: false,
        error: 'Import not found',
      });
    }

    // Parse JSON fields
    const result = {
      ...importRecord,
      errors: JSON.parse(importRecord.errors || '[]'),
      metadata: JSON.parse(importRecord.metadata || '{}'),
    };

    res.json({
      success: true,
      import: result,
    });

  } catch (error) {
    console.error('Error fetching import:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch import',
    });
  }
});

export default router;
