import { supabase } from '../../lib/supabase';

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export interface License {
  id: string;
  tenantId: string;
  key: string;
  plan: string;
  maxUsers: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  expiresAt?: string;
  isActive: boolean;
  status: LicenseStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateLicenseInput {
  tenantId: string;
  plan: string;
  maxUsers?: number;
  maxProducts?: number;
  maxOrdersPerMonth?: number;
  expiresAt?: string;
}

export interface ValidateLicenseResult {
  valid: boolean;
  license?: License;
  reason?: 'not_found' | 'expired' | 'revoked' | 'invalid';
}

interface LicenseRow {
  id: string;
  tenant_id: string;
  license_key: string;
  plan: string;
  max_users: number;
  max_products: number;
  max_orders_per_month: number;
  expires_at: string | null;
  is_active: boolean;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapLicenseRow(row: LicenseRow): License {
  const now = new Date();
  let status = LicenseStatus.ACTIVE;
  if (!row.is_active || row.revoked_at) {
    status = LicenseStatus.REVOKED;
  } else if (row.expires_at && new Date(row.expires_at) < now) {
    status = LicenseStatus.EXPIRED;
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    key: row.license_key,
    plan: row.plan,
    maxUsers: row.max_users,
    maxProducts: row.max_products,
    maxOrdersPerMonth: row.max_orders_per_month,
    expiresAt: row.expires_at ?? undefined,
    isActive: row.is_active,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function generateLicense(input: GenerateLicenseInput): Promise<License> {
  const {
    tenantId,
    plan,
    maxUsers = 0,
    maxProducts = 0,
    maxOrdersPerMonth = 0,
    expiresAt,
  } = input;

  const { data, error } = await supabase.rpc('generate_tenant_license', {
    p_tenant_id: tenantId,
    p_plan: plan,
    p_max_users: maxUsers,
    p_max_products: maxProducts,
    p_max_orders_per_month: maxOrdersPerMonth,
    p_expires_at: expiresAt ?? null,
  });

  if (error) throw error;
  if (!data || typeof data !== 'object' || !data.id || !data.license_key) {
    throw new Error(data?.error || 'Phản hồi tạo license không hợp lệ');
  }

  return mapLicenseRow(data as LicenseRow);
}

export async function validateLicense(key: string): Promise<ValidateLicenseResult> {
  const { data, error } = await supabase.rpc('validate_tenant_license', {
    p_license_key: key,
  });

  if (error) throw error;
  if (!data || typeof data !== 'object' || typeof data.valid !== 'boolean') {
    throw new Error(data?.error || 'Phản hồi kiểm tra license không hợp lệ');
  }

  const { valid, license_id, tenant_id, plan, reason } = data as {
    valid: boolean;
    license_id: string | null;
    tenant_id: string | null;
    plan: string | null;
    reason: string | null;
  };

  if (!valid) {
    return {
      valid: false,
      reason: (reason as ValidateLicenseResult['reason']) || 'invalid',
      license: license_id
        ? {
            id: license_id,
            tenantId: tenant_id || '',
            key,
            plan: plan || '',
            maxUsers: 0,
            maxProducts: 0,
            maxOrdersPerMonth: 0,
            isActive: false,
            status: LicenseStatus[reason?.toUpperCase() as keyof typeof LicenseStatus] || LicenseStatus.REVOKED,
          }
        : undefined,
    };
  }

  return {
    valid: true,
    license: {
      id: license_id || '',
      tenantId: tenant_id || '',
      key,
      plan: plan || '',
      maxUsers: 0,
      maxProducts: 0,
      maxOrdersPerMonth: 0,
      isActive: true,
      status: LicenseStatus.ACTIVE,
    },
  };
}

export async function listTenantLicenses(tenantId: string): Promise<License[]> {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => mapLicenseRow(row as LicenseRow));
}

export async function revokeLicense(licenseId: string): Promise<void> {
  const { error } = await supabase
    .from('licenses')
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq('id', licenseId);

  if (error) throw error;
}
