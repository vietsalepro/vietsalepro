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
  users: [],
  app_audit_log: [],
  rate_limit_logs: [],
  system_admins: [],
  system_settings: [],
  orders_archive: [],
  order_items_archive: [],
  bank_accounts: [],
  invoices: [],
  invoice_items: [],
  payments: [],
  invoice_number_counters: [],
  plans: [],
};

export const resetMockData = () => {
  for (const key of Object.keys(store)) store[key] = [];
  currentUserId = null;
  currentTenantId = null;
  isSystemAdmin = false;

  // ponytail: seed system settings giống migration P6 để các test operations có dữ liệu mặc định.
  store.system_settings.push(
    { key: 'default_limits_free', value: { max_users: 1, max_products: 50, max_orders_per_month: 300 }, updated_at: new Date().toISOString(), updated_by: null },
    { key: 'default_limits_vip', value: { max_users: 999, max_products: 999999, max_orders_per_month: 999999 }, updated_at: new Date().toISOString(), updated_by: null },
    { key: 'maintenance_mode', value: { enabled: false, message: '' }, updated_at: new Date().toISOString(), updated_by: null },
    { key: 'data_retention_cron', value: { schedule: '0 3 * * *', description: 'Hàng ngày lúc 03:00' }, updated_at: new Date().toISOString(), updated_by: null }
  );

  // ponytail: seed plans giống migration P8.1 để các test subscription/invoice dùng limits từ plans.
  store.plans.push(
    { key: 'free', name: 'Free', description: 'Gói miễn phí', max_users: 1, max_products: 50, max_orders_per_month: 300, monthly_price: 0, yearly_price: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { key: 'vip', name: 'VIP', description: 'Gói trả phí', max_users: 999, max_products: 999999, max_orders_per_month: 999999, monthly_price: 69000, yearly_price: 59000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  );
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

const getSetting = (key: string): any => {
  const row = store.system_settings.find(s => s.key === key);
  return row?.value ?? null;
};

const setSetting = (key: string, value: any) => {
  const idx = store.system_settings.findIndex(s => s.key === key);
  const row = { key, value, updated_at: new Date().toISOString(), updated_by: currentUserId };
  if (idx >= 0) store.system_settings[idx] = row;
  else store.system_settings.push(row);
  return row;
};

const getPlan = (key: string): Row | undefined => store.plans.find(p => p.key === key && p.is_active);

const getPlanLimits = (key: string): { max_users: number; max_products: number; max_orders_per_month: number } => {
  const p = getPlan(key);
  if (p) return { max_users: p.max_users, max_products: p.max_products, max_orders_per_month: p.max_orders_per_month };
  if (key === 'free') return { max_users: 1, max_products: 50, max_orders_per_month: 300 };
  if (key === 'vip') return { max_users: 999, max_products: 999999, max_orders_per_month: 999999 };
  return { max_users: 0, max_products: 0, max_orders_per_month: 0 };
};

const uuid = () => crypto.randomUUID();

const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const tenantIdColumn = (table: string): string | null => {
  if (['tenants', 'tenant_memberships', 'tenant_subscriptions', 'bank_accounts', 'system_settings'].includes(table)) return null;
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
  ilikeFilters: Record<string, string>;
  gteFilters: Record<string, any>;
  lteFilters: Record<string, any>;
  selectColumns: string;
  single: boolean;
  count?: 'exact' | 'estimated' | 'planned' | null;
  head?: boolean;
  insertValues?: any[];
  updateValues?: any;
  rangeStart?: number;
  rangeEnd?: number;
  orderBy?: string;
  orderAsc?: boolean;
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
    } else if (table === 'bank_accounts') {
      if (!isSystemAdmin) rows = [];
    } else {
      const col = tenantIdColumn(table);
      // ponytail: system admin bypass tenant filter để xem toàn bộ dữ liệu (audit log, v.v.).
      if (col && !isSystemAdmin) rows = rows.filter(r => r[col] === currentTenantId);
    }
  }

  for (const [field, value] of Object.entries(state.filters)) {
    rows = rows.filter(r => r[field] === value);
  }
  for (const [field, pattern] of Object.entries(state.ilikeFilters)) {
    const term = pattern.replace(/^%|%$/g, '').toLowerCase();
    rows = rows.filter(r => String(r[field] ?? '').toLowerCase().includes(term));
  }
  for (const [field, value] of Object.entries(state.gteFilters)) {
    rows = rows.filter(r => r[field] >= value);
  }
  for (const [field, value] of Object.entries(state.lteFilters)) {
    rows = rows.filter(r => r[field] <= value);
  }
  if (state.orderBy) {
    rows = rows.slice().sort((a, b) => {
      const av = a[state.orderBy!] ?? '';
      const bv = b[state.orderBy!] ?? '';
      const dir = state.orderAsc ? 1 : -1;
      return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
    });
  }
  const totalCount = state.count ? rows.length : undefined;
  if (state.rangeStart !== undefined && state.rangeEnd !== undefined) {
    rows = rows.slice(state.rangeStart, state.rangeEnd + 1);
  }

  if (state.operation === 'select') {
    if (state.head && state.count) {
      return { data: null, count: totalCount ?? rows.length, error: null };
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
    return state.count ? { data: rows, count: totalCount ?? rows.length, error: null } : { data: rows, error: null };
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
    } else if (table === 'bank_accounts') {
      if (!isSystemAdmin) return { data: null, error: rlsError() };
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
    if (table === 'bank_accounts' && !isSystemAdmin) return { data: null, error: rlsError() };
    rows.forEach(r => Object.assign(r, state.updateValues, { updated_at: new Date().toISOString() }));
    if (state.single) {
      return rows.length
        ? { data: rows[0], error: null }
        : { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    }
    return { data: rows, error: null };
  }

  if (state.operation === 'delete') {
    if (table === 'bank_accounts' && !isSystemAdmin) return { data: null, error: rlsError() };
    store[table] = store[table].filter(r => !rows.includes(r));
    return { data: null, error: null };
  }

  return { data: null, error: null };
};

const queryBuilder = (table: string): any => {
  const state: QueryState = { table, operation: 'select', filters: {}, ilikeFilters: {}, gteFilters: {}, lteFilters: {}, selectColumns: '*', single: false };
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
    ilike: (field: string, pattern: string) => { state.ilikeFilters[field] = pattern; return builder; },
    gte: (field: string, value: any) => { state.gteFilters[field] = value; return builder; },
    lte: (field: string, value: any) => { state.lteFilters[field] = value; return builder; },
    range: (from: number, to: number) => { state.rangeStart = from; state.rangeEnd = to; return builder; },
    order: (field: string, opts?: { ascending?: boolean }) => { state.orderBy = field; state.orderAsc = opts?.ascending ?? false; return builder; },
    single: () => { state.single = true; return builder; },
    then: (resolve: any) => {
      resolve(executeQuery(state));
    },
  };
  return builder;
};

const rpc = async (name: string, params: Record<string, any>) => {
  if (name === 'create_tenant_with_admin') {
    const planKey = params.p_plan ?? 'free';
    const plan = getPlan(planKey);
    if (!plan) {
      return { data: null, error: { code: '23514', message: `Gói dịch vụ không hợp lệ: ${planKey}` } };
    }
    const tenant = {
      id: uuid(),
      name: params.p_name,
      subdomain: params.p_subdomain,
      status: 'active',
      plan: planKey,
      owner_id: params.p_owner_user_id ?? currentUserId,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.tenants.push(tenant);
    const limits = getPlanLimits(planKey);
    store.tenant_subscriptions.push({
      tenant_id: tenant.id,
      plan: planKey,
      max_users: limits.max_users,
      max_products: limits.max_products,
      max_orders_per_month: limits.max_orders_per_month,
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
    if (params.p_plan !== null && params.p_plan !== undefined) {
      if (!getPlan(params.p_plan)) {
        return { data: null, error: { code: '23514', message: `Gói dịch vụ không hợp lệ: ${params.p_plan}` } };
      }
      tenant.plan = params.p_plan;
    }
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
    if (!getPlan(newPlan)) {
      return { data: null, error: { code: '23514', message: `Gói dịch vụ không hợp lệ: ${newPlan}` } };
    }
    const limits = getPlanLimits(newPlan);
    sub.plan = newPlan;
    tenant.plan = newPlan;
    // ponytail: khi đổi gói và không truyền custom limits, áp giới hạn mặc định của gói mới.
    sub.max_users = params.p_max_users ?? (params.p_plan !== null && params.p_plan !== undefined ? limits.max_users : sub.max_users);
    sub.max_products = params.p_max_products ?? (params.p_plan !== null && params.p_plan !== undefined ? limits.max_products : sub.max_products);
    sub.max_orders_per_month = params.p_max_orders_per_month ?? (params.p_plan !== null && params.p_plan !== undefined ? limits.max_orders_per_month : sub.max_orders_per_month);
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

  if (name === 'get_tenant_feature_flags') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem feature flags' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    return { data: tenant.settings?.features ?? {}, error: null };
  }

  if (name === 'update_tenant_feature_flags') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật feature flags' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    tenant.settings = {
      ...tenant.settings,
      features: { ...(tenant.settings?.features ?? {}), ...params.p_features },
    };
    tenant.updated_at = new Date().toISOString();
    return { data: tenant.settings.features, error: null };
  }

  if (name === 'get_tenant_members_with_email') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem danh sách thành viên tenant' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const rows = store.tenant_memberships
      .filter(m => m.tenant_id === params.p_tenant_id)
      .map(m => ({
        ...m,
        email: `user-${m.user_id}@example.com`,
        invited_by_email: m.invited_by ? `inviter-${m.invited_by}@example.com` : null,
      }));
    return { data: rows, error: null };
  }

  if (name === 'get_system_overview') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem tổng quan hệ thống' } };
    }
    const total = store.tenants.length;
    const active = store.tenants.filter(t => t.status === 'active').length;
    const trial = store.tenants.filter(t => t.status === 'trial').length;
    const vip = store.tenants.filter(t => t.plan === 'vip').length;
    const thisMonthStart = new Date().toISOString().slice(0, 7) + '-01';
    const newThisMonth = store.tenants.filter(t => t.created_at >= thisMonthStart).length;

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const expiringTenants = store.tenants
      .map(t => {
        const sub = store.tenant_subscriptions.find(s => s.tenant_id === t.id);
        return { tenant: t, sub };
      })
      .filter((item): item is { tenant: typeof item.tenant; sub: NonNullable<typeof item.sub> } =>
        !!item.sub && !!item.sub.expires_at && item.sub.expires_at <= sevenDaysFromNow
      )
      .map(({ tenant, sub }) => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        expires_at: sub.expires_at,
        days_remaining: Math.floor((new Date(sub.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      }))
      .sort((a, b) => a.days_remaining - b.days_remaining)
      .slice(0, 50);

    const nearLimitTenants = store.tenants
      .map(t => {
        const sub = store.tenant_subscriptions.find(s => s.tenant_id === t.id);
        const userCount = store.tenant_memberships.filter(m => m.tenant_id === t.id).length;
        const productCount = store.products.filter(p => p.tenant_id === t.id).length;
        return {
          tenant: t,
          sub,
          userCount,
          productCount,
          userPercent: sub && sub.max_users > 0 ? (userCount / sub.max_users) * 100 : 0,
          productPercent: sub && sub.max_products > 0 ? (productCount / sub.max_products) * 100 : 0,
          orderPercent: sub && sub.max_orders_per_month > 0 ? (sub.current_month_orders / sub.max_orders_per_month) * 100 : 0,
        };
      })
      .filter(t => t.userPercent >= 80 || t.productPercent >= 80 || t.orderPercent >= 80)
      .map(t => ({
        id: t.tenant.id,
        name: t.tenant.name,
        subdomain: t.tenant.subdomain,
        user_percent: Number(t.userPercent.toFixed(2)),
        product_percent: Number(t.productPercent.toFixed(2)),
        order_percent: Number(t.orderPercent.toFixed(2)),
      }))
      .sort((a, b) => Math.max(b.user_percent, b.product_percent, b.order_percent) - Math.max(a.user_percent, a.product_percent, a.order_percent))
      .slice(0, 50);

    const expiringSoon = expiringTenants.length;
    const nearLimit = nearLimitTenants.length;

    return {
      data: {
        totalTenants: total,
        activeTenants: active,
        trialTenants: trial,
        vipTenants: vip,
        expiringSoon,
        nearLimit,
        newThisMonth,
        expiringTenants,
        nearLimitTenants,
      },
      error: null,
    };
  }

  if (name === 'get_top_tenants') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem top tenants' } };
    }
    const limit = params.p_limit ?? 10;
    const rows = store.tenants
      .filter(t => t.status !== 'archived')
      .map(t => {
        const sub = store.tenant_subscriptions.find(s => s.tenant_id === t.id);
        return {
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          status: t.status,
          plan: t.plan,
          created_at: t.created_at,
          orders_this_month: sub?.current_month_orders ?? 0,
          user_count: store.tenant_memberships.filter(m => m.tenant_id === t.id).length,
          product_count: store.products.filter(p => p.tenant_id === t.id).length,
        };
      })
      .sort((a, b) => b.orders_this_month - a.orders_this_month || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
    return { data: rows, error: null };
  }

  if (name === 'get_tenant_growth') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem tenant growth' } };
    }
    const months = params.p_months ?? 6;
    const result: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = store.tenants.filter(t => {
        if (t.status === 'archived') return false;
        const created = new Date(t.created_at);
        return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
      }).length;
      result.push({ month, count });
    }
    return { data: result, error: null };
  }

  if (name === 'get_rate_limit_logs') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem rate limit logs' } };
    }
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    const sorted = store.rate_limit_logs.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const data = sorted.slice(offset, offset + limit);
    return { data: { data, count: store.rate_limit_logs.length }, error: null };
  }

  if (name === 'get_system_admins') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem danh sách system admin' } };
    }
    const rows = store.system_admins.map(sa => {
      const user = store.users.find(u => u.id === sa.user_id);
      return { user_id: sa.user_id, email: user?.email, created_at: sa.created_at };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: rows, error: null };
  }

  if (name === 'add_system_admin') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được thêm system admin' } };
    }
    const user = store.users.find(u => u.id === params.p_user_id) || store.users.find(u => u.email === params.p_user_id);
    if (!user) return { data: null, error: { code: 'PGRST116', message: 'User not found' } };
    const existing = store.system_admins.find(sa => sa.user_id === user.id);
    if (!existing) {
      store.system_admins.push({ user_id: user.id, created_at: new Date().toISOString() });
    }
    return { data: { user_id: user.id, email: user.email, created_at: new Date().toISOString() }, error: null };
  }

  if (name === 'remove_system_admin') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xóa system admin' } };
    }
    if (params.p_user_id === currentUserId) {
      return { data: null, error: { code: '23514', message: 'Không thể tự xóa quyền system admin của chính mình' } };
    }
    const idx = store.system_admins.findIndex(sa => sa.user_id === params.p_user_id);
    if (idx === -1) return { data: null, error: { code: 'PGRST116', message: 'System admin not found' } };
    store.system_admins.splice(idx, 1);
    return { data: true, error: null };
  }

  if (name === 'get_data_retention_status') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem trạng thái data retention' } };
    }
    return {
      data: {
        archivedOrdersCount: store.orders_archive.length,
        archivedOrderItemsCount: store.order_items_archive.length,
        rateLimitLogsCount: store.rate_limit_logs.length,
        lastRun: getSetting('data_retention_last_run'),
        cronSchedule: getSetting('data_retention_cron')?.schedule ?? '0 3 * * *',
        cronJob: null,
      },
      error: null,
    };
  }

  if (name === 'get_default_plan_limits') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem cấu hình giới hạn' } };
    }
    return {
      data: {
        free: getPlanLimits('free'),
        vip: getPlanLimits('vip'),
      },
      error: null,
    };
  }

  if (name === 'set_default_plan_limits') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật giới hạn mặc định' } };
    }
    const plan = getPlan(params.p_plan);
    if (!plan) {
      return { data: null, error: { code: '23514', message: `Gói dịch vụ không hợp lệ: ${params.p_plan}` } };
    }
    if (params.p_max_users <= 0 || params.p_max_products <= 0 || params.p_max_orders_per_month <= 0) {
      return { data: null, error: { code: '23514', message: 'Giới hạn phải lớn hơn 0' } };
    }
    plan.max_users = params.p_max_users;
    plan.max_products = params.p_max_products;
    plan.max_orders_per_month = params.p_max_orders_per_month;
    plan.updated_at = new Date().toISOString();
    // ponytail: giữ ngược compatibility với system_settings cũ.
    setSetting('default_limits_' + params.p_plan, { max_users: params.p_max_users, max_products: params.p_max_products, max_orders_per_month: params.p_max_orders_per_month });
    return { data: { max_users: params.p_max_users, max_products: params.p_max_products, max_orders_per_month: params.p_max_orders_per_month }, error: null };
  }

  if (name === 'get_maintenance_mode') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem maintenance mode' } };
    }
    return { data: getSetting('maintenance_mode') || { enabled: false, message: '' }, error: null };
  }

  if (name === 'set_maintenance_mode') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật maintenance mode' } };
    }
    const value = { enabled: !!params.p_enabled, message: params.p_message ?? '' };
    setSetting('maintenance_mode', value);
    return { data: value, error: null };
  }

  if (name === 'get_plans') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem danh sách gói' } };
    }
    const rows = store.plans
      .slice()
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(p => ({
        key: p.key,
        name: p.name,
        description: p.description,
        max_users: p.max_users,
        max_products: p.max_products,
        max_orders_per_month: p.max_orders_per_month,
        monthly_price: p.monthly_price,
        yearly_price: p.yearly_price,
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));
    return { data: rows, error: null };
  }

  if (name === 'get_plan_by_key') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem chi tiết gói' } };
    }
    const p = store.plans.find(x => x.key === params.p_key);
    if (!p) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    return {
      data: {
        key: p.key,
        name: p.name,
        description: p.description,
        max_users: p.max_users,
        max_products: p.max_products,
        max_orders_per_month: p.max_orders_per_month,
        monthly_price: p.monthly_price,
        yearly_price: p.yearly_price,
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at,
      },
      error: null,
    };
  }

  if (name === 'create_plan') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo gói' } };
    }
    const key = String(params.p_key).trim().toLowerCase();
    if (!key || !/^[a-z0-9_]+$/.test(key)) {
      return { data: null, error: { code: '23514', message: 'Mã gói không hợp lệ' } };
    }
    if (params.p_max_users <= 0 || params.p_max_products <= 0 || params.p_max_orders_per_month <= 0) {
      return { data: null, error: { code: '23514', message: 'Giới hạn phải lớn hơn 0' } };
    }
    const existing = store.plans.findIndex(p => p.key === key);
    const row = {
      key,
      name: String(params.p_name).trim(),
      description: params.p_description,
      max_users: params.p_max_users,
      max_products: params.p_max_products,
      max_orders_per_month: params.p_max_orders_per_month,
      monthly_price: params.p_monthly_price ?? 0,
      yearly_price: params.p_yearly_price ?? 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (existing >= 0) store.plans[existing] = row;
    else store.plans.push(row);
    return { data: row, error: null };
  }

  if (name === 'update_plan') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật gói' } };
    }
    const p = store.plans.find(x => x.key === params.p_key);
    if (!p) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    if (params.p_max_users !== null && params.p_max_users !== undefined && params.p_max_users <= 0) {
      return { data: null, error: { code: '23514', message: 'Giới hạn người dùng phải lớn hơn 0' } };
    }
    if (params.p_max_products !== null && params.p_max_products !== undefined && params.p_max_products <= 0) {
      return { data: null, error: { code: '23514', message: 'Giới hạn sản phẩm phải lớn hơn 0' } };
    }
    if (params.p_max_orders_per_month !== null && params.p_max_orders_per_month !== undefined && params.p_max_orders_per_month <= 0) {
      return { data: null, error: { code: '23514', message: 'Giới hạn đơn hàng phải lớn hơn 0' } };
    }
    p.name = params.p_name ?? p.name;
    p.description = params.p_description ?? p.description;
    p.max_users = params.p_max_users ?? p.max_users;
    p.max_products = params.p_max_products ?? p.max_products;
    p.max_orders_per_month = params.p_max_orders_per_month ?? p.max_orders_per_month;
    p.monthly_price = params.p_monthly_price ?? p.monthly_price;
    p.yearly_price = params.p_yearly_price ?? p.yearly_price;
    p.is_active = params.p_is_active ?? p.is_active;
    p.updated_at = new Date().toISOString();
    return { data: p, error: null };
  }

  if (name === 'delete_plan') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xóa gói' } };
    }
    if (['free', 'vip'].includes(params.p_key)) {
      return { data: null, error: { code: '23514', message: `Không thể xóa gói mặc định ${params.p_key}` } };
    }
    const inUse = store.tenants.some(t => t.plan === params.p_key) || store.tenant_subscriptions.some(s => s.plan === params.p_key);
    if (inUse) {
      return { data: null, error: { code: '23514', message: 'Gói đang được sử dụng bởi tenant, không thể xóa' } };
    }
    const idx = store.plans.findIndex(p => p.key === params.p_key);
    if (idx === -1) return { data: false, error: null };
    store.plans.splice(idx, 1);
    return { data: true, error: null };
  }

  if (name === 'create_invoice') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo hóa đơn' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Tenant not found' } };
    const sub = store.tenant_subscriptions.find(s => s.tenant_id === params.p_tenant_id);
    if (!sub) return { data: null, error: { code: 'PGRST116', message: 'Subscription not found' } };

    const cycleType = params.p_cycle_type;
    const quantity = params.p_quantity;
    const bonusMonths = params.p_bonus_months ?? 0;
    if (!['monthly', 'yearly'].includes(cycleType)) {
      return { data: null, error: { code: '23514', message: `Chu kỳ không hợp lệ: ${cycleType}` } };
    }
    if (quantity <= 0) {
      return { data: null, error: { code: '23514', message: 'Số lượng phải lớn hơn 0' } };
    }
    if (bonusMonths < 0) {
      return { data: null, error: { code: '23514', message: 'Số tháng tặng không hợp lệ' } };
    }

    const plan = getPlan(sub.plan);
    const planName = plan?.name || 'VIP';
    const paidMonths = cycleType === 'yearly' ? quantity * 12 : quantity;
    const unitPrice = cycleType === 'yearly' ? (plan?.yearly_price ?? 59000) : (plan?.monthly_price ?? 69000);
    const subtotal = paidMonths * unitPrice;
    const today = new Date().toISOString().slice(0, 10);
    const start = sub.expires_at && sub.expires_at.slice(0, 10) >= today ? sub.expires_at.slice(0, 10) : today;
    const end = addMonths(start, paidMonths + bonusMonths);

    const year = new Date().getFullYear();
    const counterIdx = store.invoice_number_counters.findIndex(c => c.year === year);
    let counter = 1;
    if (counterIdx >= 0) {
      counter = store.invoice_number_counters[counterIdx].counter + 1;
      store.invoice_number_counters[counterIdx].counter = counter;
    } else {
      store.invoice_number_counters.push({ year, counter });
    }
    const invoiceNo = `INV-${year}-${String(counter).padStart(4, '0')}`;

    const invoice = {
      id: uuid(),
      tenant_id: params.p_tenant_id,
      invoice_no: invoiceNo,
      status: 'pending',
      issue_date: today,
      due_date: addDays(today, 2),
      period_start: start,
      period_end: end,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      amount_paid: 0,
      balance: subtotal,
      notes: params.p_notes,
      created_by: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.invoices.push(invoice);
    store.invoice_items.push({
      id: uuid(),
      invoice_id: invoice.id,
      tenant_id: params.p_tenant_id,
      description: `Gói ${planName} - ${cycleType === 'yearly' ? 'Năm' : 'Tháng'}`,
      quantity: paidMonths,
      unit_price: unitPrice,
      amount: paidMonths * unitPrice,
      created_at: new Date().toISOString(),
    });
    if (bonusMonths > 0) {
      store.invoice_items.push({
        id: uuid(),
        invoice_id: invoice.id,
        tenant_id: params.p_tenant_id,
        description: 'Tháng tặng',
        quantity: bonusMonths,
        unit_price: 0,
        amount: 0,
        created_at: new Date().toISOString(),
      });
    }
    return { data: invoice, error: null };
  }

  if (name === 'confirm_payment') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xác nhận thanh toán' } };
    }
    const invoice = store.invoices.find(i => i.id === params.p_invoice_id);
    if (!invoice) return { data: null, error: { code: 'PGRST116', message: 'Invoice not found' } };
    if (['paid', 'cancelled', 'draft'].includes(invoice.status)) {
      return { data: null, error: { code: 'P0001', message: `Hóa đơn ở trạng thái ${invoice.status}, không thể xác nhận thanh toán` } };
    }
    const tenant = store.tenants.find(t => t.id === invoice.tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Tenant not found' } };
    const sub = store.tenant_subscriptions.find(s => s.tenant_id === invoice.tenant_id);
    if (!sub) return { data: null, error: { code: 'PGRST116', message: 'Subscription not found' } };

    const today = new Date().toISOString().slice(0, 10);
    const payment = {
      id: uuid(),
      tenant_id: invoice.tenant_id,
      invoice_id: invoice.id,
      amount: invoice.total,
      payment_method: params.p_payment_method || 'bank_transfer',
      payment_date: today,
      reference_code: params.p_reference_code || null,
      status: 'confirmed',
      notes: params.p_notes || null,
      created_by: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.payments.push(payment);

    invoice.status = 'paid';
    invoice.amount_paid = invoice.total;
    invoice.updated_at = new Date().toISOString();

    const currentExpires = sub.expires_at ? sub.expires_at.slice(0, 10) : today;
    const newExpires = invoice.period_end && invoice.period_end.slice(0, 10) > currentExpires
      ? invoice.period_end.slice(0, 10)
      : currentExpires;
    sub.billing_status = 'ok';
    sub.expires_at = newExpires;
    sub.updated_at = new Date().toISOString();

    if (tenant.status === 'read_only') {
      tenant.status = 'active';
      tenant.updated_at = new Date().toISOString();
    }

    return { data: payment, error: null };
  }

  return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } };
};

const functionsInvoke = async (name: string, { body }: { body: any }) => {
  if (name === 'invite-member') {
    const { tenant_id, email, role } = body;
    const tenant = store.tenants.find(t => t.id === tenant_id);
    if (!tenant) return { data: { error: 'Tenant không tồn tại' }, error: null };
    if (tenant.status !== 'active') return { data: { error: 'Tenant không hoạt động' }, error: null };

    const sub = store.tenant_subscriptions.find(s => s.tenant_id === tenant_id);
    const memberCount = store.tenant_memberships.filter(m => m.tenant_id === tenant_id).length;
    if (sub && memberCount >= sub.max_users) {
      return { data: { error: 'Đã đạt giới hạn số user của gói dịch vụ' }, error: null };
    }

    let user = store.users.find(u => u.email === email);
    if (!user) {
      user = { id: uuid(), email };
      store.users.push(user);
    }
    const existing = store.tenant_memberships.find(m => m.tenant_id === tenant_id && m.user_id === user.id);
    if (existing) return { data: { error: 'User đã là thành viên của tenant này' }, error: null };

    const membership = {
      id: uuid(),
      tenant_id,
      user_id: user.id,
      role,
      invited_by: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.tenant_memberships.push(membership);
    return { data: { success: true }, error: null };
  }

  if (name === 'reset-password') {
    const { tenant_id, user_id } = body;
    const tenant = store.tenants.find(t => t.id === tenant_id);
    if (!tenant) return { data: { error: 'Tenant không tồn tại' }, error: null };
    const membership = store.tenant_memberships.find(m => m.tenant_id === tenant_id && m.user_id === user_id);
    if (!membership) return { data: { error: 'User không thuộc tenant này' }, error: null };
    return { data: { success: true, action: 'recovery', redirectTo: `https://${tenant.subdomain}.vietsalepro.com/reset-password`, link: null }, error: null };
  }

  if (name === 'send-billing-email') {
    const { invoice_id, type, to } = body;
    if (!invoice_id) return { data: { error: 'invoice_id không hợp lệ' }, error: null };
    if (type !== 'reminder' && type !== 'confirmation') {
      return { data: { error: 'type phải là reminder hoặc confirmation' }, error: null };
    }
    const invoice = store.invoices.find(i => i.id === invoice_id);
    if (!invoice) return { data: { error: 'Không tìm thấy hóa đơn' }, error: null };
    const tenant = store.tenants.find(t => t.id === invoice.tenant_id);
    const owner = tenant ? store.users.find(u => u.id === tenant.owner_id) : undefined;
    const recipient = to || owner?.email;
    if (!recipient) return { data: { error: 'Không tìm thấy email người nhận cho tenant này' }, error: null };
    return { data: { success: true, id: `email-${uuid()}`, to: recipient, type }, error: null };
  }

  if (name === 'check-subdomain') {
    const { subdomain } = body;
    const s = (subdomain || '').trim().toLowerCase();
    const reserved = ['admin', 'www', 'api', 'app'];
    if (!s) return { data: { available: false, error: 'Subdomain không được để trống' }, error: null };
    if (s.length < 3 || s.length > 63) return { data: { available: false, error: 'Subdomain phải dài 3-63 ký tự' }, error: null };
    if (!/^[a-z0-9-]+$/.test(s) || s.startsWith('-') || s.endsWith('-')) return { data: { available: false, error: 'Subdomain không hợp lệ' }, error: null };
    if (reserved.includes(s)) return { data: { available: false }, error: null };
    const existing = store.tenants.find(t => t.subdomain === s);
    return { data: { available: !existing }, error: null };
  }

  return { data: { error: 'Function not found' }, error: null };
};

export const mockSupabase = {
  auth: {
    getUser: vi.fn(async () => ({ data: { user: currentUserId ? { id: currentUserId } : null }, error: null })),
  },
  from: vi.fn((table: string) => queryBuilder(table)),
  rpc: vi.fn(rpc),
  functions: {
    invoke: vi.fn(functionsInvoke),
  },
};
