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
    tenant.archived_at = params.p_status === 'archived' ? new Date().toISOString() : null;
    return { data: tenant, error: null };
  }

  if (name === 'search_tenants') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tìm kiếm tenant' } };
    }
    const term = (params.p_search_term || '').toLowerCase();
    const all = store.tenants.filter(t => {
      if (term && !t.name.toLowerCase().includes(term) && !t.subdomain.toLowerCase().includes(term)) return false;
      return true;
    });
    const rows = all.filter(t => {
      if (params.p_status && t.status !== params.p_status) return false;
      if (params.p_plan && t.plan !== params.p_plan) return false;
      return true;
    });
    const page = params.p_page ?? 1;
    const pageSize = params.p_page_size ?? 20;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize);
    const counts = {
      active: all.filter(t => t.status === 'active').length,
      suspended: all.filter(t => t.status === 'suspended').length,
      trial: all.filter(t => t.status === 'trial').length,
      pending: all.filter(t => t.status === 'pending').length,
      archived: all.filter(t => t.status === 'archived').length,
      free: all.filter(t => t.plan === 'free').length,
      vip: all.filter(t => t.plan === 'vip').length,
    };
    return { data: { tenants: paged, totalCount: rows.length, counts }, error: null };
  }

  if (name === 'update_tenant') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật tenant' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    if (params.p_name !== null && params.p_name !== undefined) tenant.name = params.p_name.trim();
    if (params.p_plan !== null && params.p_plan !== undefined) tenant.plan = params.p_plan;
    if (params.p_status !== null && params.p_status !== undefined) {
      tenant.status = params.p_status;
      tenant.archived_at = params.p_status === 'archived' ? new Date().toISOString() : null;
    }
    tenant.updated_at = new Date().toISOString();
    return { data: tenant, error: null };
  }

  if (name === 'delete_tenant_safe') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xóa tenant' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    tenant.status = 'archived';
    tenant.archived_at = new Date().toISOString();
    tenant.updated_at = new Date().toISOString();
    return { data: tenant, error: null };
  }

  if (name === 'get_tenant_usage_summary') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem usage tenant' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const sub = store.tenant_subscriptions.find(s => s.tenant_id === params.p_tenant_id);
    if (!sub) return { data: null, error: { code: 'PGRST116', message: 'Subscription not found' } };
    const userCount = store.tenant_memberships.filter(m => m.tenant_id === params.p_tenant_id).length;
    const productCount = store.products.filter(p => p.tenant_id === params.p_tenant_id).length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const subMonth = (sub.current_month_start ?? '').slice(0, 7);
    const orderCount = subMonth === thisMonth ? sub.current_month_orders : 0;
    const percent = (current: number, max: number) => max > 0 ? Number(((current / max) * 100).toFixed(2)) : 0;
    return {
      data: {
        tenantId: sub.tenant_id,
        plan: sub.plan,
        billingStatus: sub.billing_status,
        expiresAt: sub.expires_at,
        users: { current: userCount, max: sub.max_users, percent: percent(userCount, sub.max_users) },
        products: { current: productCount, max: sub.max_products, percent: percent(productCount, sub.max_products) },
        orders: { current: orderCount, max: sub.max_orders_per_month, percent: percent(orderCount, sub.max_orders_per_month), monthStart: sub.current_month_start },
      },
      error: null,
    };
  }

  if (name === 'update_tenant_subscription') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật subscription' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const sub = store.tenant_subscriptions.find(s => s.tenant_id === params.p_tenant_id);
    if (!sub) return { data: null, error: { code: 'PGRST116', message: 'Subscription not found' } };
    const newPlan = params.p_plan ?? sub.plan;
    if (!['free', 'vip'].includes(newPlan)) {
      return { data: null, error: { code: '23514', message: `Gói dịch vụ không hợp lệ: ${newPlan}` } };
    }
    sub.plan = newPlan;
    tenant.plan = newPlan;
    // ponytail: khi đổi gói và không truyền custom limits, áp giới hạn mặc định của gói mới.
    sub.max_users = params.p_max_users ?? (params.p_plan !== null && params.p_plan !== undefined ? (newPlan === 'free' ? 1 : 999999) : sub.max_users);
    sub.max_products = params.p_max_products ?? (params.p_plan !== null && params.p_plan !== undefined ? (newPlan === 'free' ? 50 : 999999) : sub.max_products);
    sub.max_orders_per_month = params.p_max_orders_per_month ?? (params.p_plan !== null && params.p_plan !== undefined ? (newPlan === 'free' ? 300 : 999999) : sub.max_orders_per_month);
    if (params.p_billing_status !== null && params.p_billing_status !== undefined) sub.billing_status = params.p_billing_status;
    if (params.p_expires_at !== null && params.p_expires_at !== undefined) sub.expires_at = params.p_expires_at;
    sub.updated_at = new Date().toISOString();
    tenant.updated_at = new Date().toISOString();
    return { data: sub, error: null };
  }

  if (name === 'reset_monthly_order_counter') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được reset counter' } };
    }
    const sub = store.tenant_subscriptions.find(s => s.tenant_id === params.p_tenant_id);
    if (!sub) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    sub.current_month_orders = 0;
    sub.current_month_start = new Date().toISOString().slice(0, 10);
    sub.updated_at = new Date().toISOString();
    return { data: sub, error: null };
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
