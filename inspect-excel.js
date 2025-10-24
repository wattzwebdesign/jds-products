import XLSX from 'xlsx';

const workbook = XLSX.readFile('JDS-Master-Data-2025-10-24.xls');
console.log('Sheet Names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get first 3 rows as JSON to see structure
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('\n=== First 5 rows ===');
for (let i = 0; i < Math.min(5, data.length); i++) {
  console.log(`Row ${i}:`, data[i]);
}

// Get column headers
console.log('\n=== Column Headers ===');
console.log(data[0]);

// Get first data row
console.log('\n=== First Data Row ===');
const jsonData = XLSX.utils.sheet_to_json(worksheet);
console.log(jsonData[0]);

console.log('\n=== Total Rows ===');
console.log(jsonData.length);
