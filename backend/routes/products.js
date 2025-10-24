import express from 'express';
import jdsApiClient from '../services/jdsApiClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All product routes require authentication
router.use(authenticateToken);

/**
 * POST /api/products/lookup
 * Body: { skus: string[] } or { skuInput: string }
 */
router.post('/lookup', async (req, res) => {
  try {
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

    // Fetch products from JDS API
    const products = await jdsApiClient.getProductDetailsBySkus(skus);

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
