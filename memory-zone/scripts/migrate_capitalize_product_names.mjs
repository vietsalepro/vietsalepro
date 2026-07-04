/**
 * Migration script: Chuẩn hóa tất cả tên sản phẩm trong database về Title Case.
 *
 * Cách chạy:
 *   SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY \
 *   node scripts/migrate_capitalize_product_names.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Tự đọc file .env ở thư mục gốc project
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
} catch {
  console.warn('⚠️  Could not read .env file, relying on shell environment variables.');
}

// ── Helper (inline từ utils/stringHelper.ts) ────────────────────────────
function capitalizeProductName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// ── Config ──────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Example:');
  console.error('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/migrate_capitalize_product_names.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Start migrating product names...');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log('');

  const PAGE_SIZE = 500;
  let page = 0;
  let totalUpdated = 0;
  let totalScanned = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('products')
      .select('id, name, display_name')
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;

    const rows = data || [];
    if (rows.length === 0) break;

    totalScanned += rows.length;

    // Tính toán thay đổi
    const updates = rows
      .map(row => {
        const normalizedName = capitalizeProductName(row.name || '');
        const normalizedDisplayName = capitalizeProductName(row.display_name || row.name || '');
        return {
          row,
          changes: { name: normalizedName, display_name: normalizedDisplayName },
        };
      })
      .filter(({ row, changes }) =>
        row.name !== changes.name || row.display_name !== changes.display_name
      );

    if (updates.length > 0) {
      console.log(`📄 Page ${page + 1}: ${updates.length}/${rows.length} products cần cập nhật`);

      for (const { row, changes } of updates) {
        const { error: updateError } = await supabase
          .from('products')
          .update(changes)
          .eq('id', row.id);

        if (updateError) {
          console.error(`  ❌ ${row.id}: ${updateError.message}`);
          continue;
        }

        totalUpdated++;
        console.log(`  ✅ ${row.id}: "${row.name || ''}" → "${changes.name}"`);
      }
    } else {
      console.log(`📄 Page ${page + 1}: ${rows.length} products — không cần cập nhật`);
    }

    if (rows.length < PAGE_SIZE) break;
    page++;
  }

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🏁 Migration finished!');
  console.log(`   Scanned: ${totalScanned}`);
  console.log(`   Updated: ${totalUpdated}`);
  console.log('═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
