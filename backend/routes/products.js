import express from 'express';
import jdsApiClient from '../services/jdsApiClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/products/search
 * Body: { query, filters: { inStock, localStock, category }, page, limit }
 * Search products in local database
 * PUBLIC ENDPOINT - No authentication required
 */
router.post('/search', async (req, res) => {
  try {
    const { query = '', filters = {}, page = 1, limit = 20 } = req.body;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      AND: [] // Use AND array to combine all conditions
    };

    // Search by name, description, or SKU
    // MySQL is case-insensitive by default for LIKE queries
    // Split query into individual words and match products containing ALL words
    if (query && query.trim()) {
      const searchTerms = query.trim().split(/\s+/); // Split by whitespace

      if (searchTerms.length === 1) {
        // Single word search - check name, description, or SKU
        where.AND.push({
          OR: [
            { name: { contains: searchTerms[0] } },
            { description: { contains: searchTerms[0] } },
            { sku: { contains: searchTerms[0] } },
          ]
        });
      } else {
        // Multi-word search - products must contain ALL words in name OR description
        where.AND.push({
          OR: [
            {
              AND: searchTerms.map(term => ({
                name: { contains: term }
              }))
            },
            {
              AND: searchTerms.map(term => ({
                description: { contains: term }
              }))
            }
          ]
        });
      }
    }

    // Apply filters
    if (filters.inStock) {
      where.AND.push({ availableQty: { gt: 0 } });
    }
    if (filters.localStock) {
      where.AND.push({ localQty: { gt: 0 } });
    }
    if (filters.category) {
      where.AND.push({ category: filters.category });
    }
    if (filters.color) {
      where.AND.push({ color: filters.color });
    }

    // If no conditions were added, remove the AND wrapper
    const finalWhere = where.AND.length > 0 ? where : {};

    // Execute search
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: finalWhere,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where: finalWhere })
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
 * REQUIRES AUTHENTICATION
 */
router.get('/:sku/live', authenticateToken, async (req, res) => {
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

    // Get existing product data from database (for imageUrl and other details)
    const dbProduct = await prisma.product.findUnique({
      where: { sku }
    });

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

    // Merge database fields (imageUrl, etc.) with live API data
    const mergedProduct = {
      ...liveProduct,
      imageUrl: dbProduct?.imageUrl || liveProduct.imageUrl,
      basePrice: dbProduct?.basePrice || liveProduct.basePrice,
      category: dbProduct?.category || liveProduct.category,
      caseQty: dbProduct?.caseQty,
      color: dbProduct?.color,
      length: dbProduct?.length,
      height: dbProduct?.height,
      width: dbProduct?.width,
      lastPriceChange: dbProduct?.lastPriceChange,
    };

    res.json({
      success: true,
      product: mergedProduct
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
 * REQUIRES AUTHENTICATION
 */
router.post('/lookup', authenticateToken, async (req, res) => {
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

    // Check which products exist in our database and merge with DB data
    const productsWithStatus = await Promise.all(
      products.map(async (product) => {
        const dbProduct = await prisma.product.findUnique({
          where: { sku: product.sku },
          select: {
            sku: true,
            imageUrl: true,
            basePrice: true,
            category: true,
            caseQty: true,
            color: true,
            length: true,
            width: true,
            height: true,
            lastPriceChange: true
          }
        });

        // Merge JDS API data with database data (prefer API for live data, DB for static data)
        return {
          ...product,
          // Use DB image if available, fallback to API image
          imageUrl: dbProduct?.imageUrl || product.imageUrl || product.image_url || product.Image || null,
          // Merge other DB fields
          basePrice: dbProduct?.basePrice || product.basePrice,
          category: dbProduct?.category || product.category,
          caseQty: dbProduct?.caseQty,
          color: dbProduct?.color,
          length: dbProduct?.length,
          width: dbProduct?.width,
          height: dbProduct?.height,
          lastPriceChange: dbProduct?.lastPriceChange,
          inDatabase: !!dbProduct
        };
      })
    );

    // Count missing products
    const missingProducts = productsWithStatus.filter(p => !p.inDatabase);

    res.json({
      success: true,
      products: productsWithStatus,
      requestedCount: skus.length,
      foundCount: products.length,
      missingCount: missingProducts.length,
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

/**
 * GET /api/products/filters/colors
 * Get unique colors for filter dropdown
 * PUBLIC ENDPOINT - No authentication required
 */
router.get('/filters/colors', async (req, res) => {
  try {
    const colors = await prisma.product.groupBy({
      by: ['color'],
      where: {
        color: {
          not: null
        }
      },
      _count: {
        color: true
      },
      orderBy: {
        color: 'asc'
      }
    });

    const colorList = colors.map(c => ({
      color: c.color,
      count: c._count.color
    }));

    res.json({
      success: true,
      colors: colorList
    });
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({
      error: 'Failed to fetch colors',
      message: error.message
    });
  }
});

export default router;
