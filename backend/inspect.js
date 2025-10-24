import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'JDS-Master-Data-2025-10-24.xls');

const workbook = XLSX.readFile(filePath);
console.log('Sheet Names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get first 3 rows as array to see structure
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('\n=== Column Headers (Row 0) ===');
console.log(data[0]);

console.log('\n=== First 3 Data Rows ===');
for (let i = 1; i < Math.min(4, data.length); i++) {
  console.log(`\nRow ${i}:`, data[i].slice(0, 10), '...'); // First 10 columns
}

// Get as objects
const jsonData = XLSX.utils.sheet_to_json(worksheet);
console.log('\n=== First Row as Object ===');
console.log(JSON.stringify(jsonData[0], null, 2));

console.log('\n=== Total Rows ===');
console.log(jsonData.length);
