// Splice script: replace functions in SSOT files with new versions from migration_phase7c
// Uses UTF-8 (no BOM) to preserve Vietnamese characters.
const fs = require('fs');
const path = require('path');

const root = 'e:/DỤ ÁN/vietsale-pro-v7';

function readUtf8(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeUtf8(p, content) {
  // Write without BOM
  fs.writeFileSync(p, content, { encoding: 'utf8' });
}

function splitLines(text) {
  // Normalize line endings to \n, then split
  return text.replace(/\r\n/g, '\n').split('\n');
}

// Extract a function body (from "CREATE OR REPLACE FUNCTION" to the last "$$;") from an array of lines
function extractFunction(lines) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^CREATE OR REPLACE FUNCTION/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) throw new Error('No CREATE OR REPLACE FUNCTION found');
  let end = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\$\$;/.test(lines[i]) || /^\$\$ LANGUAGE/.test(lines[i])) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('No closing $$; found');
  return lines.slice(start, end + 1).join('\n');
}

// Extract a 1-based inclusive line range from an array of lines
function extractLines(lines, startLine, endLine) {
  const s = startLine - 1;
  const e = endLine - 1;
  return lines.slice(s, e + 1).join('\n');
}

// Find function boundaries (1-based line numbers) in an array of lines
function findFunctionBounds(lines, sigRegex) {
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (sigRegex.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) throw new Error('Function not found: ' + sigRegex);
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\$\$;/.test(lines[i]) || /^\$\$ LANGUAGE/.test(lines[i])) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('Closing $$; not found for: ' + sigRegex);
  return { start: start + 1, end: end + 1 }; // 1-based
}

// Read the migration file
const migPath = path.join(root, 'supabase/migration_phase7c_stock_ledger_complete.sql');
const migText = readUtf8(migPath);
const migLines = splitLines(migText);

// Extract sections from migration (1-based line ranges from grep)
const sec1 = extractLines(migLines, 122, 350).split('\n');   // process_import_v2
const sec2 = extractLines(migLines, 353, 525).split('\n');   // delete_import_v2
const sec3 = extractLines(migLines, 529, 550).split('\n');   // update_import_v2
const sec4 = extractLines(migLines, 554, 883).split('\n');   // create_return_order
const sec5 = extractLines(migLines, 887, 1041).split('\n');  // cancel_return_order_v2
const sec6 = extractLines(migLines, 1045, 1548).split('\n'); // create_exchange_transaction
const sec7 = extractLines(migLines, 1552, 1656).split('\n'); // complete_disposal
const sec8 = extractLines(migLines, 1660, 1723).split('\n'); // delete_disposal_with_restore
const sec9 = extractLines(migLines, 1727, 1803).split('\n'); // get_stock_ledger
const sec10 = extractLines(migLines, 1807, 1839).split('\n'); // get_stock_balance

// Extract just the function bodies
const fn1 = extractFunction(sec1);
const fn2 = extractFunction(sec2);
const fn3 = extractFunction(sec3);
const fn4 = extractFunction(sec4);
const fn5 = extractFunction(sec5);
const fn6 = extractFunction(sec6);
const fn7 = extractFunction(sec7);
const fn8 = extractFunction(sec8);
const fn9 = extractFunction(sec9);
const fn10 = extractFunction(sec10);

console.log('Extracted function bodies. Lengths:',
  'f1=' + fn1.length, 'f2=' + fn2.length, 'f3=' + fn3.length,
  'f4=' + fn4.length, 'f5=' + fn5.length, 'f6=' + fn6.length,
  'f7=' + fn7.length, 'f8=' + fn8.length, 'f9=' + fn9.length, 'f10=' + fn10.length);

// Check for mojibake
const hasMojibake = fn1.includes('Ã') || fn1.includes('Â');
console.log('fn1 has mojibake:', hasMojibake);
console.log('fn1 has BÚT TOÁN:', fn1.includes('BÚT TOÁN'));

// ---- SSOT 1: supabase_migration_import_goods_v2.sql ----
console.log('\n=== Processing supabase_migration_import_goods_v2.sql ===');
const ssot1Path = path.join(root, 'supabase_migration_import_goods_v2.sql');
const ssot1 = readUtf8(ssot1Path);
const lines1 = splitLines(ssot1);
const b1 = findFunctionBounds(lines1, /CREATE OR REPLACE FUNCTION process_import_v2/);
const b2 = findFunctionBounds(lines1, /CREATE OR REPLACE FUNCTION delete_import_v2/);
const b3 = findFunctionBounds(lines1, /CREATE OR REPLACE FUNCTION update_import_v2/);
console.log('Old bounds: process=' + b1.start + '-' + b1.end, 'delete=' + b2.start + '-' + b2.end, 'update=' + b3.start + '-' + b3.end);

// Build new content:
// [0 .. b1.start-2] (before process_import_v2, 0-based)
// fn1
// [b1.end .. b2.start-2] (between process end and delete start, 0-based)
// fn2
// [b2.end .. b3.start-2] (between delete end and update start)
// fn3
// [b3.end .. end] (after update)
const parts1 = [];
parts1.push(lines1.slice(0, b1.start - 1).join('\n'));
parts1.push(fn1);
parts1.push(lines1.slice(b1.end, b2.start - 1).join('\n'));
parts1.push(fn2);
parts1.push(lines1.slice(b2.end, b3.start - 1).join('\n'));
parts1.push(fn3);
parts1.push(lines1.slice(b3.end).join('\n'));
const new1 = parts1.join('\n');
writeUtf8(ssot1Path, new1);

// Verify
const check1 = readUtf8(ssot1Path);
const checkLines1 = splitLines(check1);
console.log('Old lines:', lines1.length, 'New lines:', checkLines1.length);
console.log('Has mojibake:', check1.includes('Ã') || check1.includes('Â'));
console.log('Has insert_stock_ledger_entry:', check1.includes('insert_stock_ledger_entry'));
console.log('Has BÚT TOÁN:', check1.includes('BÚT TOÁN'));

// Verify function bounds in new file
const nb1 = findFunctionBounds(checkLines1, /CREATE OR REPLACE FUNCTION process_import_v2/);
const nb2 = findFunctionBounds(checkLines1, /CREATE OR REPLACE FUNCTION delete_import_v2/);
const nb3 = findFunctionBounds(checkLines1, /CREATE OR REPLACE FUNCTION update_import_v2/);
console.log('New bounds: process=' + nb1.start + '-' + nb1.end, 'delete=' + nb2.start + '-' + nb2.end, 'update=' + nb3.start + '-' + nb3.end);

module.exports = {
  fn1, fn2, fn3, fn4, fn5, fn6, fn7, fn8, fn9, fn10,
  readUtf8, writeUtf8, splitLines, findFunctionBounds, extractFunction
};
