import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importProductsFromExcel, getImportStats } from '../services/excelImport.js';
import { manualImport, getImportStatus } from '../services/scheduler.js';
import { getLastSyncInfo } from '../services/autoImport.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

/**
 * POST /api/admin/import-products
 * Upload and import products from Excel file
 */
router.post('/import-products', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Importing products from file: ${req.file.originalname}`);

    // Import products from Excel
    const result = await importProductsFromExcel(req.file.path);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Import error:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Import failed',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/import-stats
 * Get statistics about imported products
 */
router.get('/import-stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getImportStats();

    if (stats) {
      res.json(stats);
    } else {
      res.status(500).json({ error: 'Failed to get import statistics' });
    }
  } catch (error) {
    console.error('Error getting import stats:', error);
    res.status(500).json({
      error: 'Failed to get import statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/sync-now
 * Manually trigger product sync from JDS master data
 * Returns immediately, sync runs in background
 */
router.post('/sync-now', authenticateToken, (req, res) => {
  try {
    console.log('[Admin] Manual sync triggered by user');
    const result = manualImport(); // No await - returns immediately

    if (result.success || result.isRunning) {
      res.json(result);
    } else {
      res.status(409).json(result); // 409 Conflict if already running
    }
  } catch (error) {
    console.error('[Admin] Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/sync-status
 * Get current sync status and last sync info
 */
router.get('/sync-status', authenticateToken, async (req, res) => {
  try {
    const status = getImportStatus();
    const lastSync = await getLastSyncInfo();

    res.json({
      ...status,
      ...lastSync
    });
  } catch (error) {
    console.error('[Admin] Error getting sync status:', error);
    res.status(500).json({
      error: 'Failed to get sync status',
      message: error.message
    });
  }
});

export default router;
