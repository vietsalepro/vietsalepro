import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  ['Mã sản phẩm (Bắt buộc)', 'Tên sản phẩm', 'Số lượng thực tế'],
  ['8935049013280', 'Lốc Sữa Nuvi Có Thạch Hương Cam 170ml', 6]
]);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

const outputPath = path.join(__dirname, 'import-inventory-sample.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('Created', outputPath);
