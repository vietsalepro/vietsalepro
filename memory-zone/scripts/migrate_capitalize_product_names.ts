import { createClient } from '@supabase/supabase-js';
import { capitalizeProductName } from '../utils/stringHelper';

type ProductRow = {
  id: string;
  name: string | null;
  display_name: string | null;
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  console.log('Start migrating product names...');

  const pageSize = 500;
  let page = 0;
  let totalUpdated = 0;
  let totalScanned = 0;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('products')
      .select('id, name, display_name')
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;
    const rows = (data || []) as ProductRow[];
    if (rows.length === 0) break;

    totalScanned += rows.length;

    const updates = rows
      .map((row) => {
        const normalizedName = capitalizeProductName(row.name || '');
        const normalizedDisplayName = capitalizeProductName(row.display_name || row.name || '');
        return {
          row,
          changes: {
            name: normalizedName,
            display_name: normalizedDisplayName,
          },
        };
      })
      .filter(({ row, changes }) => row.name !== changes.name || row.display_name !== changes.display_name);

    if (updates.length > 0) {
      console.log(`Page ${page + 1}: updating ${updates.length}/${rows.length} products...`);

      for (const { row, changes } of updates) {
        const { error: updateError } = await supabase
          .from('products')
          .update(changes)
          .eq('id', row.id);

        if (updateError) {
          console.error(`Failed to update product ${row.id}:`, updateError.message);
          continue;
        }

        totalUpdated++;
        console.log(`- ${row.id}: "${row.name || ''}" -> "${changes.name}"`);
      }
    }

    if (rows.length < pageSize) break;
    page++;
  }

  console.log('Migration finished.');
  console.log(`Scanned: ${totalScanned}`);
  console.log(`Updated: ${totalUpdated}`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
