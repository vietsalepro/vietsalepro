// Audit that every service-layer RPC call is defined in the canonical migration chain.
// Run: npx tsx scripts/audit-rpc-contracts.ts
//
// ponytail: Only two SQL identifier formats are supported:
//   CREATE [OR REPLACE] FUNCTION public.name(...)
//   CREATE [OR REPLACE] FUNCTION "public"."name"(...)
// If a future migration introduces another quoting style, extend the regex below.

import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve('supabase/migrations');
const CODE_DIRS = ['services', 'lib', 'utils'];

const FN_RE = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+"?public"?\."?([a-z_][a-z_0-9]*)"?\s*\(/gi;
const RPC_RE = /supabase\.rpc\('([a-z_0-9]+)'/g;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(p));
    } else if (entry.name.endsWith('.ts')) {
      out.push(p);
    }
  }
  return out;
}

function extractMigrationRpcs(): Set<string> {
  const names = new Set<string>();
  for (const entry of fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() || !entry.name.endsWith('.sql')) continue;
    const text = fs.readFileSync(path.join(MIGRATIONS_DIR, entry.name), 'utf-8');
    for (const m of text.matchAll(FN_RE)) {
      names.add(m[1]);
    }
  }
  return names;
}

function extractCodeRpcs(filePaths: string[]): { names: Set<string>; byFile: Map<string, string[]> } {
  const names = new Set<string>();
  const byFile = new Map<string, string[]>();
  for (const p of filePaths) {
    const text = fs.readFileSync(p, 'utf-8');
    const fileNames: string[] = [];
    for (const m of text.matchAll(RPC_RE)) {
      names.add(m[1]);
      fileNames.push(m[1]);
    }
    if (fileNames.length) byFile.set(p, fileNames);
  }
  return { names, byFile };
}

function main(): number {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    return 1;
  }

  const migrationRpcs = extractMigrationRpcs();
  const codeFiles = CODE_DIRS.flatMap(walk);
  const { names: codeRpcs, byFile } = extractCodeRpcs(codeFiles);

  const missingFromMigrations = [...codeRpcs].filter((n) => !migrationRpcs.has(n)).sort();

  console.log(`Migration RPCs: ${migrationRpcs.size}`);
  console.log(`Code RPCs      : ${codeRpcs.size}`);
  console.log('');

  if (missingFromMigrations.length === 0) {
    console.log('All service-layer RPC calls are defined in the canonical migration chain.');
    return 0;
  }

  console.error(`RPCs found in code but missing from migrations (${missingFromMigrations.length}):`);
  for (const name of missingFromMigrations) {
    const files = [...byFile.entries()]
      .filter(([, list]) => list.includes(name))
      .map(([f]) => f.replace(/\\/g, '/'));
    console.error(`  - ${name}  (${files.join(', ')})`);
  }
  return 1;
}

process.exit(main());
