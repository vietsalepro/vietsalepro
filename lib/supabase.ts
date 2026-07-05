/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errors';

const env = (import.meta as any).env ?? (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {

}

let currentTenantId: string | null = null;

export const setCurrentTenantId = (tenantId: string | null) => { currentTenantId = tenantId; };
export const getCurrentTenantId = () => currentTenantId;
export const requireTenantId = (): string => {
  const tenantId = currentTenantId;
  if (!tenantId) throw new AppError('Chưa chọn tenant', 'TENANT_NOT_SELECTED');
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
