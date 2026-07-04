// Splice script for remaining SSOT files (2, 3, 4)
const fs = require('fs');
const path = require('path');
const root = 'e:/DỤ ÁN/vietsale-pro-v7';

function readUtf8(p) { return fs.readFileSync(p, 'utf8'); }
function writeUtf8(p, c) { fs.writeFileSync(p, c, { encoding: 'utf8' }); }
function splitLines(text) { return text.replace(/\r\n/g, '\n').split('\n'); }

function extractFunction(lines) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^CREATE OR REPLACE FUNCTION/.test(lines[i])) { start = i; break; }
  }
  if (start < 0) throw new Error('No CREATE OR REPLACE FUNCTION found');
  let end = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\$\$;/.test(lines[i]) || /^\$\$ LANGUAGE/.test(lines[i])) { end = i; break; }
  }
  if (end < 0) throw new Error('No closing $$; found');
  return lines.slice(start, end + 1).join('\n');
}

function extractLines(lines, startLine, endLine) {
  return lines.slice(startLine - 1, endLine).join('\n');
}

function findFunctionBounds(lines, sigRegex) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (sigRegex.test(lines[i])) { start = i; break; }
  }
  if (start < 0) throw new Error('Function not found: ' + sigRegex);
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\$\$;/.test(lines[i]) || /^\$\$ LANGUAGE/.test(lines[i])) { end = i; break; }
  }
  if (end < 0) throw new Error('Closing $$; not found for: ' + sigRegex);
  return { start: start + 1, end: end + 1 };
}

// Read migration and extract function bodies
const migPath = path.join(root, 'supabase/migration_phase7c_stock_ledger_complete.sql');
const migLines = splitLines(readUtf8(migPath));

const fn4 = extractFunction(extractLines(migLines, 554, 883).split('\n'));   // create_return_order
const fn5 = extractFunction(extractLines(migLines, 887, 1041).split('\n'));  // cancel_return_order_v2
const fn6 = extractFunction(extractLines(migLines, 1045, 1548).split('\n')); // create_exchange_transaction
const fn7 = extractFunction(extractLines(migLines, 1552, 1656).split('\n')); // complete_disposal
const fn8 = extractFunction(extractLines(migLines, 1660, 1723).split('\n')); // delete_disposal_with_restore

console.log('Function body lengths:', 'f4=' + fn4.length, 'f5=' + fn5.length, 'f6=' + fn6.length, 'f7=' + fn7.length, 'f8=' + fn8.length);
console.log('fn4 has mojibake:', fn4.includes('Ã') || fn4.includes('Â'));
console.log('fn4 has BÚT TOÁN:', fn4.includes('BÚT TOÁN'));
console.log('fn7 has Stock Entry:', fn7.includes('Stock Entry'));

// ---- SSOT 2: supabase_migration_v7_core_consolidation.sql ----
console.log('\n=== Processing supabase_migration_v7_core_consolidation.sql ===');
{
  const p = path.join(root, 'supabase_migration_v7_core_consolidation.sql');
  // Backup
  fs.copyFileSync(p, p + '.bak_phase7c');
  const text = readUtf8(p);
  const lines = splitLines(text);
  const b1 = findFunctionBounds(lines, /CREATE OR REPLACE FUNCTION create_return_order\(/);
  const b2 = findFunctionBounds(lines, /CREATE OR REPLACE FUNCTION cancel_return_order_v2\(/);
  const b3 = findFunctionBounds(lines, /CREATE OR REPLACE FUNCTION create_exchange_transaction\(/);
  console.log('Old bounds: return=' + b1.start + '-' + b1.end, 'cancel=' + b2.start + '-' + b2.end, 'exchange=' + b3.start + '-' + b3.end);

  const parts = [];
  parts.push(lines.slice(0, b1.start - 1).join('\n'));
  parts.push(fn4);
  parts.push(lines.slice(b1.end, b2.start - 1).join('\n'));
  parts.push(fn5);
  parts.push(lines.slice(b2.end, b3.start - 1).join('\n'));
  parts.push(fn6);
  parts.push(lines.slice(b3.end).join('\n'));
  const newText = parts.join('\n');
  writeUtf8(p, newText);

  const check = readUtf8(p);
  const checkLines = splitLines(check);
  console.log('Old lines:', lines.length, 'New lines:', checkLines.length);
  console.log('Has mojibake:', check.includes('Ã') || check.includes('Â'));
  console.log('Has insert_stock_ledger_entry:', check.includes('insert_stock_ledger_entry'));
  console.log('Has Stock Entry:', check.includes('Stock Entry'));
  console.log('Has BÚT TOÁN:', check.includes('BÚT TOÁN'));
  const nb1 = findFunctionBounds(checkLines, /CREATE OR REPLACE FUNCTION create_return_order\(/);
  const nb2 = findFunctionBounds(checkLines, /CREATE OR REPLACE FUNCTION cancel_return_order_v2\(/);
  const nb3 = findFunctionBounds(checkLines, /CREATE OR REPLACE FUNCTION create_exchange_transaction\(/);
  console.log('New bounds: return=' + nb1.start + '-' + nb1.end, 'cancel=' + nb2.start + '-' + nb2.end, 'exchange=' + nb3.start + '-' + nb3.end);
}

// ---- SSOT 3: supabase_migration_disposals.sql ----
console.log('\n=== Processing supabase_migration_disposals.sql ===');
{
  const p = path.join(root, 'supabase_migration_disposals.sql');
  fs.copyFileSync(p, p + '.bak_phase7c');
  const text = readUtf8(p);
  const lines = splitLines(text);
  const b1 = findFunctionBounds(lines, /CREATE OR REPLACE FUNCTION complete_disposal\(/);
  console.log('Old bounds: complete_disposal=' + b1.start + '-' + b1.end);

  const parts = [];
  parts.push(lines.slice(0, b1.start - 1).join('\n'));
  parts.push(fn7);
  parts.push(lines.slice(b1.end).join('\n'));
  const newText = parts.join('\n');
  writeUtf8(p, newText);

  const check = readUtf8(p);
  const checkLines = splitLines(check);
  console.log('Old lines:', lines.length, 'New lines:', checkLines.length);
  console.log('Has mojibake:', check.includes('Ã') || check.includes('Â'));
  console.log('Has insert_stock_ledger_entry:', check.includes('insert_stock_ledger_entry'));
  console.log('Has Stock Entry:', check.includes('Stock Entry'));
  const nb1 = findFunctionBounds(checkLines, /CREATE OR REPLACE FUNCTION complete_disposal\(/);
  console.log('New bounds: complete_disposal=' + nb1.start + '-' + nb1.end);
}

// ---- SSOT 4: supabase_migration_delete_disposal_with_restore.sql ----
console.log('\n=== Processing supabase_migration_delete_disposal_with_restore.sql ===');
{
  const p = path.join(root, 'supabase_migration_delete_disposal_with_restore.sql');
  fs.copyFileSync(p, p + '.bak_phase7c');
  const text = readUtf8(p);
  const lines = splitLines(text);
  const b1 = findFunctionBounds(lines, /CREATE OR REPLACE FUNCTION delete_disposal_with_restore\(/);
  console.log('Old bounds: delete_disposal=' + b1.start + '-' + b1.end);

  const parts = [];
  parts.push(lines.slice(0, b1.start - 1).join('\n'));
  parts.push(fn8);
  parts.push(lines.slice(b1.end).join('\n'));
  const newText = parts.join('\n');
  writeUtf8(p, newText);

  const check = readUtf8(p);
  const checkLines = splitLines(check);
  console.log('Old lines:', lines.length, 'New lines:', checkLines.length);
  console.log('Has mojibake:', check.includes('Ã') || check.includes('Â'));
  console.log('Has insert_stock_ledger_entry:', check.includes('insert_stock_ledger_entry'));
  console.log('Has Stock Entry:', check.includes('Stock Entry'));
  const nb1 = findFunctionBounds(checkLines, /CREATE OR REPLACE FUNCTION delete_disposal_with_restore\(/);
  console.log('New bounds: delete_disposal=' + nb1.start + '-' + nb1.end);
}

console.log('\n=== All SSOT files processed ===');
