import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env ?? (typeof process !== 'undefined' ? process.env : {});
const readReplicaUrl = env?.VITE_SUPABASE_READ_REPLICA_URL as string | undefined;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY as string | undefined;

let cached: SupabaseClient | null = null;
let cachedUrl: string | null = null;

// ponytail: read replica client chỉ khởi tạo khi có URL; nếu chưa cấu hình thì trả null.
// Đồng thời hỗ trợ per-tenant override từ tenant.read_replica_url.
export const getReadReplicaClient = (tenantOverrideUrl?: string): SupabaseClient | null => {
  const url = tenantOverrideUrl || readReplicaUrl;
  const key = supabaseAnonKey;
  if (!url || !key) return null;
  if (cachedUrl !== url) {
    cached = createClient(url, key);
    cachedUrl = url;
  }
  return cached;
};

export const isReadReplicaConfigured = (tenantOverrideUrl?: string): boolean =>
  !!(tenantOverrideUrl || readReplicaUrl);
