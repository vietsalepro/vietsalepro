/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env ?? (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Anon Key. Please check your .env file.');
}

let currentTenantId: string | null = null;

export const setCurrentTenantId = (tenantId: string | null) => { currentTenantId = tenantId; };
export const getCurrentTenantId = () => currentTenantId;
export const requireTenantId = (): string => {
  const tenantId = currentTenantId;
  if (!tenantId) throw new Error('Chưa chọn tenant');
  return tenantId;
};

export const tenantFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  if (currentTenantId) headers.set('x-tenant-id', currentTenantId);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  { global: { fetch: tenantFetch } }
);
