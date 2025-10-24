import express from 'express';
import jdsApiClient from '../services/jdsApiClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// All product routes require authentication
router.use(authenticateToken);

/**
 * POST /api/products/search
 * Body: { query, filters: { inStock, localStock, category }, page, limit }
 * Search products in local database
 */
router.post('/search', async (req, res) => {
  try {
    const { query = '', filters = {}, page = 1, limit = 20 } = req.body;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    // Search by name, description, or SKU
    // MySQL is case-insensitive by default for LIKE queries
    if (query && query.trim()) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        { sku: { contains: query } },
      ];
    }

    // Apply filters
    if (filters.inStock) {
      where.availableQty = { gt: 0 };
    }
    if (filters.localStock) {
      where.localQty = { gt: 0 };
    }
    if (filters.category) {
      where.category = filters.category;
    }

    // Execute search
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/products/:sku/live
 * Get live product data from JDS API for a specific SKU
 */
router.get('/:sku/live', async (req, res) => {
  try {
    const { sku } = req.params;

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

    // Fetch live data from JDS API
    const products = await jdsApiClient.getProductDetailsBySkus([sku], user.jdsApiToken);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const liveProduct = products[0];

    // Update local database with fresh data
    await prisma.product.upsert({
      where: { sku },
      update: {
        availableQty: liveProduct.availability?.available || 0,
        localQty: liveProduct.availability?.local || 0,
        lastSynced: new Date()
      },
      create: {
        sku,
        name: liveProduct.name || 'Unknown Product',
        description: liveProduct.description,
        availableQty: liveProduct.availability?.available || 0,
        localQty: liveProduct.availability?.local || 0,
      }
    });

    res.json({
      success: true,
      product: liveProduct
    });
  } catch (error) {
    console.error('Live product fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch live product data',
      message: error.message
    });
  }
});

/**
 * POST /api/products/lookup
 * Body: { skus: string[] } or { skuInput: string }
 */
router.post('/lookup', async (req, res) => {
  try {
    // Get user's JDS API token
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { jdsApiToken: true }
    });

    if (!user || !user.jdsApiToken) {
      return res.status(400).json({
        error: 'JDS API token not configured',
        message: 'Please add your JDS API token in your profile settings'
      });
    }

    let skus = [];

    // Accept either an array of SKUs or a string input to parse
    if (req.body.skus && Array.isArray(req.body.skus)) {
      skus = req.body.skus.filter(sku => sku && sku.trim());
    } else if (req.body.skuInput && typeof req.body.skuInput === 'string') {
      skus = jdsApiClient.parseSkuInput(req.body.skuInput);
    }

    if (skus.length === 0) {
      return res.status(400).json({
        error: 'Please provide at least one SKU',
        message: 'SKUs can be comma-separated, space-separated, or on separate lines'
      });
    }

    // Limit the number of SKUs per request (optional safety measure)
    if (skus.length > 50) {
      return res.status(400).json({
        error: 'Too many SKUs',
        message: 'Maximum 50 SKUs per request'
      });
    }

    // Fetch products from JDS API using user's token
    const products = await jdsApiClient.getProductDetailsBySkus(skus, user.jdsApiToken);

    // Check if any SKUs were not found
    const foundSkus = products.map(p => p.sku);
    const notFoundSkus = skus.filter(sku => !foundSkus.includes(sku));

    res.json({
      success: true,
      products,
      requestedCount: skus.length,
      foundCount: products.length,
      notFound: notFoundSkus.length > 0 ? notFoundSkus : undefined
    });

  } catch (error) {
    console.error('Product lookup error:', error);

    // Check if it's a JDS API error
    if (error.message.includes('JDS API')) {
      return res.status(502).json({
        error: 'Error communicating with product database',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to lookup products',
      message: error.message
    });
  }
});

export default router;
