import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importProductsFromExcel, getImportStats } from '../services/excelImport.js';
import { manualImport, getImportStatus } from '../services/scheduler.js';
import { getLastSyncInfo } from '../services/autoImport.js';
import { authenticateToken } from '../middleware/auth.js';
import jdsApiClient from '../services/jdsApiClient.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

/**
 * POST /api/admin/add-missing-products
 * Body: { skus: string[] }
 * Fetch products from JDS API and add them to database if missing
 */
router.post('/add-missing-products', authenticateToken, async (req, res) => {
  try {
    const { skus } = req.body;

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return res.status(400).json({
        error: 'Please provide an array of SKUs'
      });
    }

    // Get user's JDS API token
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { jdsApiToken: true }
    });

    if (!user || !user.jdsApiToken) {
      return res.status(400).json({
        error: 'JDS API token not configured'
      });
    }

    // Fetch products from JDS API
    const jdsProducts = await jdsApiClient.getProductDetailsBySkus(skus, user.jdsApiToken);

    if (jdsProducts.length === 0) {
      return res.status(404).json({
        error: 'No products found in JDS API'
      });
    }

    const results = [];
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const jdsProduct of jdsProducts) {
      try {
        // Check if product exists
        const existing = await prisma.product.findUnique({
          where: { sku: jdsProduct.sku }
        });

        // Create product object from JDS API data
        const productData = {
          sku: jdsProduct.sku,
          name: jdsProduct.name || 'Unknown Product',
          description: jdsProduct.description || null,
          basePrice: jdsProduct.pricing?.price || null,
          availableQty: jdsProduct.availability?.available || 0,
          localQty: jdsProduct.availability?.local || 0,
          imageUrl: jdsProduct.imageUrl || null,
          category: jdsProduct.category || null,
          lastSynced: new Date()
        };

        if (existing) {
          // Update existing product
          await prisma.product.update({
            where: { sku: jdsProduct.sku },
            data: productData
          });
          updated++;
          results.push({
            sku: jdsProduct.sku,
            status: 'updated',
            name: jdsProduct.name
          });
        } else {
          // Create new product
          await prisma.product.create({
            data: productData
          });
          added++;
          results.push({
            sku: jdsProduct.sku,
            status: 'added',
            name: jdsProduct.name
          });
        }
      } catch (error) {
        console.error(`Error adding product ${jdsProduct.sku}:`, error);
        skipped++;
        results.push({
          sku: jdsProduct.sku,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      total: jdsProducts.length,
      added,
      updated,
      skipped,
      results,
      message: `Successfully processed ${jdsProducts.length} products (${added} added, ${updated} updated, ${skipped} errors)`
    });

  } catch (error) {
    console.error('Add missing products error:', error);
    res.status(500).json({
      error: 'Failed to add products',
      message: error.message
    });
  }
});

export default router;
