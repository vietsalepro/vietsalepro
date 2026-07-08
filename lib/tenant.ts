import { supabase } from './supabase';

export const getSubdomain = () => {
  const host = window.location.host;
  // ponytail: localhost/dev dùng tenant 'main' để dev/test, không phá vỡ logic production.
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'main';
  const parts = host.split('.');
  if (parts.length >= 3 && parts[parts.length - 2] === 'vietsalepro') return parts[0];
  return null;
};

export const isCustomDomain = () => {
  const host = window.location.host;
  if (host.includes('localhost') || host.includes('127.0.0.1')) return false;
  const parts = host.split('.');
  return !(parts.length >= 3 && parts[parts.length - 2] === 'vietsalepro');
};

export const getTenantId = async () => {
  // ponytail: không cache trong localStorage; tenant_id luôn lấy từ host runtime.
  const host = window.location.host;
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const subdomain = getSubdomain();
    if (!subdomain) return null;
    const { data } = await supabase.rpc('get_tenant_by_subdomain', { p_subdomain: subdomain });
    return data?.id || null;
  }

  if (isCustomDomain()) {
    const { data } = await supabase.rpc('get_tenant_by_domain', { p_domain: host });
    if (data?.id) return data.id;
  }

  const subdomain = getSubdomain();
  if (!subdomain) return null;
  const { data } = await supabase.rpc('get_tenant_by_subdomain', { p_subdomain: subdomain });
  return data?.id || null;
};

export const getTenantUrl = (subdomain: string, customDomain?: string): string => {
  const host = window.location.host;
  // ponytail: localhost/dev không có subdomain riêng, redirect về origin.
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return window.location.origin;
  }
  if (customDomain) {
    return `${window.location.protocol}//${customDomain}/`;
  }
  return `${window.location.protocol}//${subdomain}.vietsalepro.com/`;
};

export const getAdminUrl = (): string => {
  const host = window.location.host;
  // ponytail: localhost/dev giữ nguyên origin, chỉ đổi path sang /admin.
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `${window.location.origin}/admin`;
  }
  return `${window.location.protocol}//admin.vietsalepro.com/admin`;
};
