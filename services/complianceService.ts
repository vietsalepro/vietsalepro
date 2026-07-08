import { supabase } from '../lib/supabase';
import {
  TermsAcceptance,
  TermsAcceptanceList,
  TenantExportData,
} from '../types/tenant';

export interface RecordTermsAcceptanceInput {
  userId: string;
  tenantId?: string;
  termsVersion?: string;
  termsType?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export interface GetTermsAcceptancesInput {
  tenantId?: string;
  termsType?: string;
  limit?: number;
  offset?: number;
}

const mapTermsAcceptanceFromDB = (row: any): TermsAcceptance => ({
  id: row.id,
  userId: row.user_id,
  tenantId: row.tenant_id,
  termsVersion: row.terms_version,
  termsType: row.terms_type,
  acceptedAt: row.accepted_at,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export async function recordTermsAcceptance(input: RecordTermsAcceptanceInput): Promise<string> {
  const { data, error } = await supabase.rpc('record_terms_acceptance', {
    p_user_id: input.userId,
    p_tenant_id: input.tenantId ?? null,
    p_terms_version: input.termsVersion ?? '1.0',
    p_terms_type: input.termsType ?? 'tos',
    p_ip_address: input.ipAddress ?? null,
    p_user_agent: input.userAgent ?? null,
    p_metadata: input.metadata ?? {},
  });
  if (error) throw error;
  return data as string;
}

export async function getTermsAcceptances(input: GetTermsAcceptancesInput = {}): Promise<TermsAcceptanceList> {
  const { data, error } = await supabase.rpc('get_terms_acceptances', {
    p_tenant_id: input.tenantId ?? null,
    p_terms_type: input.termsType ?? null,
    p_limit: input.limit ?? 50,
    p_offset: input.offset ?? 0,
  });
  if (error) throw error;
  const result = data as { data: any[]; count: number };
  return {
    data: (result.data || []).map(mapTermsAcceptanceFromDB),
    count: result.count || 0,
  };
}

export async function exportTenantData(tenantId: string): Promise<TenantExportData> {
  const { data, error } = await supabase.rpc('export_tenant_data', { p_tenant_id: tenantId });
  if (error) throw error;
  return data as TenantExportData;
}
