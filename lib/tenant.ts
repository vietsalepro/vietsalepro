import { supabase } from './supabase';

export const getSubdomain = () => {
  const host = window.location.host;
  // ponytail: localhost/dev dùng tenant 'main' để dev/test, không phá vỡ logic production.
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'main';
  const parts = host.split('.');
  if (parts.length >= 3 && parts[parts.length - 2] === 'vietsalepro') return parts[0];
  return null;
};

export const getTenantId = async () => {
  // ponytail: không cache trong localStorage; tenant_id luôn lấy từ subdomain runtime.
  const subdomain = getSubdomain();
  if (!subdomain) return null;
  const { data } = await supabase.rpc('get_tenant_by_subdomain', { p_subdomain: subdomain });
  return data?.id || null;
};
