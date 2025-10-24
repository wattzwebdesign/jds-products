import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Parse Excel file and import products into database
 * JDS Excel Format:
 * - ITEM: SKU code
 * - SHORT DESCRIPTION: Product name
 * - LONG DESCRIPTION: Detailed description
 * - CLASS: Category
 * - LESS THAN CASE PRICE: Base price
 * - LARGE IMAGE: Product image URL
 */
export async function importProductsFromExcel(filePath) {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${rawData.length} products in Excel file`);

    // Map JDS Excel columns to database fields
    const products = rawData.map(row => {
      // Combine DESCRIPTION 1 and DESCRIPTION 2 for full name if SHORT DESCRIPTION is not available
      const shortDesc = row['SHORT DESCRIPTION'] || '';
      const desc1 = row['DESCRIPTION 1'] || '';
      const desc2 = row['DESCRIPTION 2'] || '';
      const combinedName = shortDesc || (desc1 + (desc2 ? ' ' + desc2 : '')).trim();

      return {
        sku: String(row['ITEM'] || '').trim(),
        name: combinedName || 'Unknown Product',
        description: row['LONG DESCRIPTION'] || null,
        category: row['CLASS'] || null,
        basePrice: parseFloat(row['LESS THAN CASE PRICE']) || null,
        availableQty: 0, // Will be updated from JDS API
        localQty: 0, // Will be updated from JDS API
        imageUrl: row['LARGE IMAGE'] || row['SMALL IMAGE'] || null,
      };
    }).filter(product => product.sku); // Only include products with valid SKU

    console.log(`Mapped ${products.length} valid products`);

    // Batch insert/update products
    const BATCH_SIZE = 1000;
    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      for (const product of batch) {
        try {
          await prisma.product.upsert({
            where: { sku: product.sku },
            update: {
              name: product.name,
              description: product.description,
              category: product.category,
              basePrice: product.basePrice,
              availableQty: product.availableQty,
              localQty: product.localQty,
              imageUrl: product.imageUrl,
              lastSynced: new Date(),
            },
            create: product,
          });

          // Check if it's an update or new insert
          const existing = await prisma.product.findUnique({
            where: { sku: product.sku },
            select: { createdAt: true, updatedAt: true }
          });

          if (existing && existing.createdAt < existing.updatedAt) {
            updated++;
          } else {
            imported++;
          }
        } catch (error) {
          console.error(`Error importing product ${product.sku}:`, error.message);
          errors++;
        }
      }

      console.log(`Progress: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length} products processed`);
    }

    return {
      success: true,
      total: products.length,
      imported,
      updated,
      errors,
      message: `Successfully processed ${products.length} products (${imported} new, ${updated} updated, ${errors} errors)`
    };
  } catch (error) {
    console.error('Excel import error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get import statistics
 */
export async function getImportStats() {
  try {
    const totalProducts = await prisma.product.count();
    const inStockCount = await prisma.product.count({
      where: { availableQty: { gt: 0 } }
    });
    const localStockCount = await prisma.product.count({
      where: { localQty: { gt: 0 } }
    });

    return {
      totalProducts,
      inStockCount,
      localStockCount,
      lastSync: await prisma.product.findFirst({
        orderBy: { lastSynced: 'desc' },
        select: { lastSynced: true }
      })
    };
  } catch (error) {
    console.error('Error getting import stats:', error);
    return null;
  }
}
