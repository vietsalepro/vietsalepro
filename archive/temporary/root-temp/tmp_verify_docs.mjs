import fs from 'fs';
import path from 'path';

const d = 'supabase/migrations';
const re = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"?public"?\."?([a-z_][a-z_0-9]*)"?\s*\(/gi;
const migrationNames = new Set();
for (const f of fs.readdirSync(d).sort()) {
  if (!f.endsWith('.sql')) continue;
  const t = fs.readFileSync(path.join(d, f), 'utf8');
  let m;
  while ((m = re.exec(t)) !== null) migrationNames.add(m[1]);
}

function extractD3Names(file) {
  const t = fs.readFileSync(file, 'utf8');
  const names = new Set();
  // D-P3-01 table rows: | rpcname | ...
  const rowRe = /^\|\s*([a-z_][a-z_0-9]*)\s*\|/gim;
  let m;
  while ((m = rowRe.exec(t)) !== null) names.add(m[1]);
  return names;
}
function extractAdminNames(file) {
  const t = fs.readFileSync(file, 'utf8');
  const names = new Set();
  // admin doc table rows: | `rpcname` | ...
  const rowRe = /^\|\s*`([a-z_][a-z_0-9]*)`\s*\|/gim;
  let m;
  while ((m = rowRe.exec(t)) !== null) names.add(m[1]);
  return names;
}

const d3 = extractD3Names('D-P3-01_Reconciled_RPC_Contract.md');
const admin = extractAdminNames('docs/admin-dashboard/RPC_CONTRACTS.md');
console.log('migration unique=' + migrationNames.size);
console.log('D-P3-01 names=' + d3.size);
console.log('admin names=' + admin.size);

const d3Missing = [...d3].filter(n => !migrationNames.has(n)).sort();
const adminMissing = [...admin].filter(n => !migrationNames.has(n)).sort();
const adminExtra = [...admin].filter(n => !d3.has(n)).sort();

console.log('D-P3-01 not in migrations:', d3Missing.length, d3Missing.slice(0,10).join(','));
console.log('admin not in migrations:', adminMissing.length, adminMissing.slice(0,10).join(','));
console.log('admin not in D-P3-01:', adminExtra.length, adminExtra.slice(0,10).join(','));

// Check all migration names are present in D-P3-01
const migrationMissingInD3 = [...migrationNames].filter(n => !d3.has(n)).sort();
console.log('migration missing in D-P3-01:', migrationMissingInD3.length, migrationMissingInD3.slice(0,20).join(','));
