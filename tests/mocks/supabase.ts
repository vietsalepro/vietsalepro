import { vi } from 'vitest';

// ponytail: minimal in-memory Supabase mock for tenant/auth/RLS unit tests.
// Ceiling: only supports the query shapes used by tenantService and the RLS scenarios.

type Row = Record<string, any>;

let currentUserId: string | null = null;
let currentTenantId: string | null = null;
let isSystemAdmin = false;

const store: Record<string, Row[]> = {
  tenants: [],
  tenant_memberships: [],
  tenant_subscriptions: [],
  products: [],
  orders: [],
};

export const resetMockData = () => {
  for (const key of Object.keys(store)) store[key] = [];
  currentUserId = null;
  currentTenantId = null;
  isSystemAdmin = false;
};

export const setCurrentUserId = (id: string | null) => { currentUserId = id; };
export const setCurrentTenantId = (id: string | null) => { currentTenantId = id; };
export const getCurrentTenantId = () => currentTenantId;
export const requireTenantId = (): string => {
  if (!currentTenantId) throw new Error('Chưa chọn tenant');
  return currentTenantId;
};
export const setSystemAdmin = (value: boolean) => { isSystemAdmin = value; };
export const getMockRows = (table: string) => store[table] ?? [];
export const addMockRow = (table: string, row: Row) => { store[table].push(row); };

const uuid = () => crypto.randomUUID();

const tenantIdColumn = (table: string): string | null => {
  if (['tenants', 'tenant_memberships', 'tenant_subscriptions'].includes(table)) return null;
  return 'tenant_id';
};

const isTenantMember = (tenantId: string, userId: string | null = currentUserId) => {
  if (!userId) return false;
  return store.tenant_memberships.some(m => m.tenant_id === tenantId && m.user_id === userId);
};

const isTenantOwner = (tenantId: string, userId: string | null = currentUserId) => {
  const tenant = store.tenants.find(t => t.id === tenantId);
  return tenant?.owner_id === userId;
};

const canAccessTenant = (tenantId: string) =>
  isSystemAdmin || isTenantMember(tenantId) || isTenantOwner(tenantId);

interface QueryState {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  filters: Record<string, any>;
  selectColumns: string;
  single: boolean;
  count?: 'exact' | 'estimated' | 'planned' | null;
  head?: boolean;
  insertValues?: any[];
  updateValues?: any;
}

const rlsError = () => ({ code: '42501', message: 'new row violates row-level security policy for table' });

const executeQuery = (state: QueryState) => {
  const table = state.table;
  let rows = store[table] ?? [];

  if (state.operation === 'select') {
    if (table === 'tenants') {
      rows = rows.filter(r => canAccessTenant(r.id));
    } else if (table === 'tenant_memberships') {
      rows = rows.filter(r => r.user_id === currentUserId || canAccessTenant(r.tenant_id));
    } else if (table === 'tenant_subscriptions') {
      rows = rows.filter(r => canAccessTenant(r.tenant_id));
    } else {
      const col = tenantIdColumn(table);
      if (col) rows = rows.filter(r => r[col] === currentTenantId);
    }
  }

  for (const [field, value] of Object.entries(state.filters)) {
    rows = rows.filter(r => r[field] === value);
  }

  if (state.operation === 'select') {
    if (state.head && state.count) {
      return { data: null, count: rows.length, error: null };
    }
    if (state.selectColumns && state.selectColumns.includes('(*)')) {
      const [fk] = state.selectColumns.split(' ');
      const refTable = fk === 'tenant_id' ? 'tenants' : table;
      rows = rows.map(r => ({ [fk]: store[refTable].find(x => x.id === r[fk]) ?? r[fk] }));
    }
    if (state.single) {
      return rows.length
        ? { data: rows[0], error: null }
        : { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    }
    return { data: rows, error: null };
  }

  if (state.operation === 'insert') {
    const values = state.insertValues ?? [];
    if (table === 'tenant_memberships') {
      const row = values[0];
      if (row.tenant_id !== currentTenantId && !isSystemAdmin) {
        return { data: null, error: rlsError() };
      }
    } else if (table === 'tenants') {
      // allowed
    } else if (table === 'tenant_subscriptions') {
      const row = values[0];
      if (!canAccessTenant(row.tenant_id) && !isSystemAdmin) {
        return { data: null, error: rlsError() };
      }
    } else {
      const col = tenantIdColumn(table);
      for (const row of values) {
        if (col && row[col] !== currentTenantId) {
          return { data: null, error: rlsError() };
        }
      }
    }

    const inserted = values.map((v: any) => {
      const row = { id: uuid(), ...v, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store[table].push(row);
      return row;
    });
    return state.single
      ? { data: inserted[0], error: null }
      : { data: inserted, error: null };
  }

  if (state.operation === 'update') {
    rows.forEach(r => Object.assign(r, state.updateValues, { updated_at: new Date().toISOString() }));
    if (state.single) {
      return rows.length
        ? { data: rows[0], error: null }
        : { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    }
    return { data: rows, error: null };
  }

  if (state.operation === 'delete') {
    store[table] = store[table].filter(r => !rows.includes(r));
    return { data: null, error: null };
  }

  return { data: null, error: null };
};

const queryBuilder = (table: string): any => {
  const state: QueryState = { table, operation: 'select', filters: {}, selectColumns: '*', single: false };
  const builder = {
    select: (cols: string | object = '*', options?: { count?: 'exact' | 'estimated' | 'planned'; head?: boolean }) => {
      if (typeof cols === 'string') state.selectColumns = cols;
      if (options) {
        state.count = options.count ?? undefined;
        state.head = options.head ?? false;
      }
      return builder;
    },
    insert: (values: any) => {
      state.operation = 'insert';
      state.insertValues = Array.isArray(values) ? values : [values];
      return builder;
    },
    update: (values: any) => { state.operation = 'update'; state.updateValues = values; return builder; },
    delete: () => { state.operation = 'delete'; return builder; },
    eq: (field: string, value: any) => { state.filters[field] = value; return builder; },
    order: () => builder,
    single: () => { state.single = true; return builder; },
    then: (resolve: any) => {
      resolve(executeQuery(state));
    },
  };
  return builder;
};

const rpc = async (name: string, params: Record<string, any>) => {
  if (name === 'create_tenant_with_admin') {
    const tenant = {
      id: uuid(),
      name: params.p_name,
      subdomain: params.p_subdomain,
      status: 'active',
      plan: params.p_plan ?? 'free',
      owner_id: params.p_owner_user_id ?? currentUserId,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.tenants.push(tenant);
    store.tenant_subscriptions.push({
      tenant_id: tenant.id,
      plan: tenant.plan,
      max_users: 1,
      max_products: 50,
      max_orders_per_month: 300,
      current_month_orders: 0,
      current_month_start: new Date().toISOString().slice(0, 10),
      billing_status: 'ok',
      updated_at: new Date().toISOString(),
    });
    const ownerId = params.p_owner_user_id ?? currentUserId;
    if (ownerId) {
      store.tenant_memberships.push({
        id: uuid(),
        tenant_id: tenant.id,
        user_id: ownerId,
        role: 'admin',
        invited_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    setCurrentTenantId(tenant.id);
    return { data: tenant, error: null };
  }

  if (name === 'update_tenant_status') {
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    tenant.status = params.p_status;
    tenant.updated_at = new Date().toISOString();
    return { data: tenant, error: null };
  }

  return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } };
};

export const mockSupabase = {
  auth: {
    getUser: vi.fn(async () => ({ data: { user: currentUserId ? { id: currentUserId } : null }, error: null })),
  },
  from: vi.fn((table: string) => queryBuilder(table)),
  rpc: vi.fn(rpc),
};
