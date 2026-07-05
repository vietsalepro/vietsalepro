import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase, setCurrentTenantId } from '../lib/supabase';
import { getSubdomain } from '../lib/tenant';
import { Tenant, TenantMembership, TenantRole } from '../types/tenant';

interface TenantContextType {
  tenant: Tenant | null;
  membership: TenantMembership | null;
  role: TenantRole | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const mapTenantFromDB = (row: any): Tenant => ({
  id: row.id,
  name: row.name,
  subdomain: row.subdomain,
  status: row.status,
  plan: row.plan,
  ownerId: row.owner_id,
  settings: row.settings || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapMembershipFromDB = (row: any): TenantMembership => ({
  id: row.id,
  tenantId: row.tenant_id,
  userId: row.user_id,
  role: row.role,
  invitedBy: row.invited_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [membership, setMembership] = useState<TenantMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTenant = async () => {
      setIsLoading(true);
      setMembership(null);

      try {
        const subdomain = getSubdomain();
        // ponytail: admin hoặc root domain không resolve tenant; routing riêng bên App.tsx.
        if (!subdomain || subdomain === 'admin') {
          if (!cancelled) {
            setTenant(null);
            setCurrentTenantId(null);
          }
          return;
        }

        // Dùng security definer RPC để lookup tenant hoạt động cả khi chưa đăng nhập.
        const { data: row, error } = await supabase.rpc('get_tenant_by_subdomain', { p_subdomain: subdomain });
        if (cancelled) return;
        if (error) throw error;

        if (!row) {
          if (!cancelled) {
            setTenant(null);
            setCurrentTenantId(null);
          }
          return;
        }

        const t = mapTenantFromDB(row);
        if (!cancelled) {
          setTenant(t);
          setCurrentTenantId(t.id);
        }

        if (user) {

          const { data: mRow, error: mError } = await supabase
            .from('tenant_memberships')
            .select('*')
            .eq('tenant_id', t.id)
            .eq('user_id', user.id)
            .single();
          if (cancelled) return;
          if (mError && mError.code !== 'PGRST116') throw mError;
          if (!cancelled) {
            setMembership(mRow ? mapMembershipFromDB(mRow) : null);
          }
        }
      } catch (err) {

        if (!cancelled) {
          setTenant(null);
          setMembership(null);
          setCurrentTenantId(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadTenant();
    return () => { cancelled = true; };
  }, [user]);

  const value: TenantContextType = {
    tenant,
    membership,
    role: membership?.role || null,
    isLoading,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
