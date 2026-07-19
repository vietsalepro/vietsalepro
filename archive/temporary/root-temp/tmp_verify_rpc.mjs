import fs from 'fs';
import path from 'path';

const d = 'supabase/migrations';
const re = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"?public"?\."?([a-z_][a-z_0-9]*)"?\s*\(/gi;
const names = new Set();
let c = 0;
for (const f of fs.readdirSync(d).sort()) {
  if (!f.endsWith('.sql')) continue;
  const t = fs.readFileSync(path.join(d, f), 'utf8');
  let m;
  while ((m = re.exec(t)) !== null) {
    names.add(m[1]);
    c++;
  }
}
console.log('declarations=' + c);
console.log('unique=' + names.size);
