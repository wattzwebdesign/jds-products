import axios from 'axios';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// JDS Master Data URL (redirects to CSV file)
const JDS_MASTER_DATA_URL = 'https://jdsindustries.com/includes/ajax_request/get_master_data.php';

/**
 * Download and import products from JDS master data CSV
 * Runs automatically on schedule or manually via admin panel
 */
export async function autoImportProducts() {
  const startTime = new Date();
  console.log(`[Auto-Import] Starting at ${startTime.toISOString()}`);

  try {
    // Step 1: Download CSV file
    console.log('[Auto-Import] Downloading CSV from JDS...');
    const response = await axios.get(JDS_MASTER_DATA_URL, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      timeout: 60000, // 60 second timeout
    });

    if (response.status !== 200) {
      throw new Error(`Failed to download CSV: HTTP ${response.status}`);
    }

    console.log('[Auto-Import] CSV downloaded successfully');

    // Step 2: Parse CSV
    console.log('[Auto-Import] Parsing CSV data...');
    const csvData = Buffer.from(response.data).toString('utf-8');
    const products = await parseCSV(csvData);

    console.log(`[Auto-Import] Parsed ${products.length} products from CSV`);

    // Step 3: Import products to database
    console.log('[Auto-Import] Importing products to database...');
    const result = await importProducts(products);

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const finalResult = {
      success: true,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${duration}s`,
      ...result,
      message: `Successfully processed ${result.total} products (${result.imported} new, ${result.updated} updated, ${result.errors} errors) in ${duration}s`
    };

    console.log(`[Auto-Import] Completed: ${finalResult.message}`);

    // Store sync log
    await storeSyncLog(finalResult);

    return finalResult;

  } catch (error) {
    console.error('[Auto-Import] Error:', error);

    const errorResult = {
      success: false,
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };

    // Store error log
    await storeSyncLog(errorResult);

    return errorResult;
  }
}

/**
 * Parse CSV data into product objects
 */
async function parseCSV(csvData) {
  return new Promise((resolve, reject) => {
    const products = [];
    const stream = Readable.from(csvData);

    stream
      .pipe(csv())
      .on('data', (row) => {
        // Map JDS CSV columns to database fields
        const shortDesc = row['SHORT DESCRIPTION'] || '';
        const desc1 = row['DESCRIPTION 1'] || '';
        const desc2 = row['DESCRIPTION 2'] || '';
        const combinedName = shortDesc || (desc1 + (desc2 ? ' ' + desc2 : '')).trim();

        const sku = String(row['ITEM'] || '').trim();

        if (sku) {
          products.push({
            sku,
            name: combinedName || 'Unknown Product',
            description: row['LONG DESCRIPTION'] || null,
            category: row['CLASS'] || null,
            basePrice: parseFloat(row['LESS THAN CASE PRICE']) || null,
            availableQty: 0, // Will be updated from JDS API
            localQty: 0, // Will be updated from JDS API
            imageUrl: row['LARGE IMAGE'] || row['SMALL IMAGE'] || null,
          });
        }
      })
      .on('end', () => {
        console.log(`[CSV Parser] Successfully parsed ${products.length} products`);
        resolve(products);
      })
      .on('error', (error) => {
        console.error('[CSV Parser] Error:', error);
        reject(error);
      });
  });
}

/**
 * Import products to database using batch upsert
 */
async function importProducts(products) {
  const BATCH_SIZE = 1000;
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    for (const product of batch) {
      try {
        // Check if product exists
        const existing = await prisma.product.findUnique({
          where: { sku: product.sku },
          select: { id: true }
        });

        await prisma.product.upsert({
          where: { sku: product.sku },
          update: {
            name: product.name,
            description: product.description,
            category: product.category,
            basePrice: product.basePrice,
            imageUrl: product.imageUrl,
            lastSynced: new Date(),
          },
          create: product,
        });

        if (existing) {
          updated++;
        } else {
          imported++;
        }
      } catch (error) {
        console.error(`[Import] Error importing product ${product.sku}:`, error.message);
        errors++;
      }
    }

    const progress = Math.min(i + BATCH_SIZE, products.length);
    console.log(`[Import] Progress: ${progress}/${products.length} products processed`);
  }

  return {
    total: products.length,
    imported,
    updated,
    errors
  };
}

/**
 * Store sync log in database for history tracking
 */
async function storeSyncLog(result) {
  try {
    // We'll create a SyncLog model in the next step
    // For now, just log to console
    console.log('[Sync Log]', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('[Sync Log] Error storing log:', error);
  }
}

/**
 * Get last sync information
 */
export async function getLastSyncInfo() {
  try {
    const lastSyncedProduct = await prisma.product.findFirst({
      orderBy: { lastSynced: 'desc' },
      select: { lastSynced: true }
    });

    return {
      lastSyncTime: lastSyncedProduct?.lastSynced || null,
      lastSyncTimeFormatted: lastSyncedProduct?.lastSynced
        ? new Date(lastSyncedProduct.lastSynced).toLocaleString()
        : 'Never'
    };
  } catch (error) {
    console.error('[Last Sync Info] Error:', error);
    return {
      lastSyncTime: null,
      lastSyncTimeFormatted: 'Unknown'
    };
  }
}
