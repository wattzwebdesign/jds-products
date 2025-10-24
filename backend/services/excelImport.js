import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Parse Excel file and import products into database
 * Expected columns: SKU, Product Name, Description, Category, Price, Available Qty, Local Qty, Image URL
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

    // Map Excel columns to database fields (adjust column names based on your Excel file)
    const products = rawData.map(row => ({
      sku: String(row['SKU'] || row['sku'] || '').trim(),
      name: String(row['Product Name'] || row['Name'] || row['name'] || '').trim(),
      description: row['Description'] || row['description'] || null,
      category: row['Category'] || row['category'] || null,
      basePrice: row['Price'] || row['price'] || null,
      availableQty: parseInt(row['Available Qty'] || row['availableQty'] || row['available'] || 0),
      localQty: parseInt(row['Local Qty'] || row['localQty'] || row['local'] || 0),
      imageUrl: row['Image URL'] || row['imageUrl'] || row['image'] || null,
    })).filter(product => product.sku); // Only include products with valid SKU

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
