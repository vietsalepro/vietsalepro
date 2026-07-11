// Sub-Phase 7.2: Admin compliance service — GDPR request management.

import { supabase } from '../../lib/supabase';

export type GdprRequestType = 'export' | 'deletion';
export type GdprRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface GdprRequest {
  id: string;
  userId: string;
  type: GdprRequestType;
  reason?: string;
  status: GdprRequestStatus;
  dryRun: boolean;
  resultUrl?: string;
  createdAt: string;
  completedAt?: string;
  userEmail?: string;
}

export interface GdprRequestInput {
  userId: string;
  type: GdprRequestType;
  reason?: string;
  dryRun?: boolean;
}

export interface GdprRequestsList {
  data: GdprRequest[];
  count: number;
}

export interface GdprExportData {
  profile: {
    id?: string;
    email?: string;
    created_at?: string;
    last_sign_in_at?: string;
    raw_user_meta_data?: any;
  };
  memberships: any[];
  payments: any[];
  audit_log: any[];
  admin_login_history: any[];
  terms_acceptance: any[];
  exported_at?: string;
}

export interface GdprDeleteResult {
  dry_run: boolean;
  request_id: string;
  user_id: string;
  planned_actions?: any[];
  executed_actions?: any[];
  deleted_at?: string;
}

const mapGdprRequestFromDB = (row: any): GdprRequest => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  reason: row.reason,
  status: row.status,
  dryRun: row.dry_run ?? false,
  resultUrl: row.result_url,
  createdAt: row.created_at,
  completedAt: row.completed_at,
  userEmail: row.user_email,
});

export async function getGdprRequests(options: {
  status?: GdprRequestStatus | null;
  type?: GdprRequestType | null;
  limit?: number;
  offset?: number;
} = {}): Promise<GdprRequestsList> {
  const { data, error } = await supabase.rpc('get_gdpr_requests', {
    p_status: options.status ?? null,
    p_type: options.type ?? null,
    p_limit: options.limit ?? 50,
    p_offset: options.offset ?? 0,
  });
  if (error) throw error;

  const result = data as { data: any[]; count: number };
  return {
    data: (result.data || []).map(mapGdprRequestFromDB),
    count: result.count || 0,
  };
}

export async function createGdprRequest(input: GdprRequestInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_gdpr_request', {
    p_user_id: input.userId,
    p_type: input.type,
    p_reason: input.reason ?? null,
    p_dry_run: input.dryRun ?? false,
  });
  if (error) throw error;
  return data as string;
}

export async function getGdprExportData(userId: string): Promise<GdprExportData> {
  const { data, error } = await supabase.rpc('gdpr_export_user_data', { p_user_id: userId });
  if (error) throw error;
  return (data || {}) as GdprExportData;
}

export async function deleteUserData(
  userId: string,
  dryRun = true,
): Promise<GdprDeleteResult> {
  const { data, error } = await supabase.rpc('gdpr_delete_user_data', {
    p_user_id: userId,
    p_dry_run: dryRun,
  });
  if (error) throw error;
  return (data || {}) as GdprDeleteResult;
}

export function downloadGdprExport(data: GdprExportData, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `gdpr-export-${data.profile?.id || 'user'}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
