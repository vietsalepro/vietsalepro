import { vi } from 'vitest';

// ponytail: minimal in-memory Supabase mock for tenant/auth/RLS unit tests.
// Ceiling: only supports the query shapes used by tenantService and the RLS scenarios.

type Row = Record<string, any>;

let currentUserId: string | null = null;
let currentTenantId: string | null = null;
let isSystemAdmin = false;
let simulateBillingReminderFailure = false;

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
  invoice_reminder_logs: [],
  billing_job_logs: [],
  email_templates: [],
  support_tickets: [],
  ticket_replies: [],
  ticket_reply_templates: [],
  promo_codes: [],
  promotion_rules: [],
  promo_code_usages: [],
  announcements: [],
  error_logs: [],
  maintenance_windows: [],
  fraud_queue: [],
  tenant_registration_events: [],
  processed_operations: [],
  heavy_ops_jobs: [],
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
    { key: 'data_retention_cron', value: { schedule: '0 3 * * *', description: 'Hàng ngày lúc 03:00' }, updated_at: new Date().toISOString(), updated_by: null },
    { key: 'fraud_detection_config', value: { enabled: true, ip_window_hours: 24, ip_max: 5, email_domain_window_hours: 24, email_domain_max: 10, owner_window_hours: 24, owner_max: 20 }, updated_at: new Date().toISOString(), updated_by: null },
    { key: 'data_retention_config', value: { retention_days_orders: 730, retention_days_processed_operations: 90, retention_days_rate_limit_logs: 1, retention_days_fraud_queue: 90, retention_days_registration_events: 365, cron_schedule: '0 3 * * *' }, updated_at: new Date().toISOString(), updated_by: null },
    { key: 'email_brand', value: { logo_url: '', brand_color: '#2563eb', signature_html: 'Trân trọng,<br/>Đội ngũ VietSales Pro', from_name: 'VietSales Pro' }, updated_at: new Date().toISOString(), updated_by: null }
  );

  // ponytail: seed plans giống migration P8.1 để các test subscription/invoice dùng limits từ plans.
  store.plans.push(
    { key: 'free', name: 'Free', description: 'Gói miễn phí', max_users: 1, max_products: 50, max_orders_per_month: 300, monthly_price: 0, yearly_price: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { key: 'vip', name: 'VIP', description: 'Gói trả phí', max_users: 999, max_products: 999999, max_orders_per_month: 999999, monthly_price: 69000, yearly_price: 59000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  );

  // ponytail: seed error logs giống migration P13.2 để smoke test aggregation có dữ liệu.
  store.error_logs.push(
    { id: uuid(), source: 'checkout', level: 'error', message: 'Payment failed', detail: null, metadata: null, created_at: new Date().toISOString() },
    { id: uuid(), source: 'checkout', level: 'error', message: 'Inventory mismatch', detail: null, metadata: null, created_at: new Date().toISOString() },
    { id: uuid(), source: 'auth', level: 'warn', message: 'Stale session', detail: null, metadata: null, created_at: new Date().toISOString() }
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
export const setBillingReminderFailure = (value: boolean) => { simulateBillingReminderFailure = value; };
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
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
};

// ponytail: tables managed by system admin globally (no tenant_id column; no tenant filter).
const adminOnlyTables = ['bank_accounts', 'email_templates', 'ticket_reply_templates', 'promo_codes', 'promotion_rules', 'announcements'];

const tenantIdColumn = (table: string): string | null => {
  if (['tenants', 'tenant_memberships', 'tenant_subscriptions', 'system_settings', ...adminOnlyTables].includes(table)) return null;
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
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
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
  upsertValues?: any[];
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
    } else if (adminOnlyTables.includes(table)) {
      if (!isSystemAdmin) rows = [];
    } else if (table === 'invoice_reminder_logs') {
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
    let values = state.insertValues ?? [];
    // ponytail: replicate DB trigger — derive tenant_id for ticket_replies from parent ticket.
    if (table === 'ticket_replies') {
      values = values.map((v: any) => {
        if (!v.tenant_id && v.ticket_id) {
          const ticket = store.support_tickets?.find((t: any) => t.id === v.ticket_id);
          if (ticket) return { ...v, tenant_id: ticket.tenant_id };
        }
        return v;
      });
    }
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
    } else if (adminOnlyTables.includes(table)) {
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
      const enriched = { ...v };
      if (table === 'support_tickets') {
        if (!enriched.status) enriched.status = 'open';
        if (!enriched.priority) enriched.priority = 'medium';
        if (!enriched.category) enriched.category = 'support';
      }
      if (table === 'ticket_replies' && !enriched.tenant_id && enriched.ticket_id) {
        const ticket = store.support_tickets?.find((t: any) => t.id === enriched.ticket_id);
        if (ticket) enriched.tenant_id = ticket.tenant_id;
      }
      const row = { id: uuid(), ...enriched, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store[table].push(row);
      return row;
    });
    return state.single
      ? { data: inserted[0], error: null }
      : { data: inserted, error: null };
  }

  if (state.operation === 'update') {
    if (adminOnlyTables.includes(table) && !isSystemAdmin) return { data: null, error: rlsError() };
    rows.forEach(r => Object.assign(r, state.updateValues, { updated_at: new Date().toISOString() }));
    if (state.single) {
      return rows.length
        ? { data: rows[0], error: null }
        : { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    }
    return { data: rows, error: null };
  }

  if (state.operation === 'delete') {
    if (adminOnlyTables.includes(table) && !isSystemAdmin) return { data: null, error: rlsError() };
    store[table] = store[table].filter(r => !rows.includes(r));
    return { data: null, error: null };
  }

  if (state.operation === 'upsert') {
    const values = state.upsertValues ?? [];
    if (adminOnlyTables.includes(table) && !isSystemAdmin) return { data: null, error: rlsError() };
    const upserted = values.map((v: any) => {
      if (table === 'system_settings') {
        const existing = store[table].find(r => r.key === v.key);
        if (existing) {
          Object.assign(existing, { value: v.value, updated_at: new Date().toISOString(), updated_by: currentUserId });
          return existing;
        }
        const row = { ...v, updated_at: new Date().toISOString(), updated_by: currentUserId };
        store[table].push(row);
        return row;
      }
      // ponytail: generic upsert only supports system_settings; extend if needed.
      return v;
    });
    return state.single ? { data: upserted[0], error: null } : { data: upserted, error: null };
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
    upsert: (values: any) => { state.operation = 'upsert'; state.upsertValues = Array.isArray(values) ? values : [values]; return builder; },
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
      isolation_mode: 'shared',
      isolation_schema: null,
      isolation_project_ref: null,
      custom_domain: null,
      white_label: {},
      read_replica_url: null,
      connection_pool_config: {},
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

    // P18.2: isolation metadata
    const isolationMode = params.p_isolation_mode ?? tenant.isolation_mode;
    if (isolationMode && !['shared', 'schema', 'project'].includes(isolationMode)) {
      return { data: null, error: { code: '23514', message: `Chế độ cô lập không hợp lệ: ${isolationMode}` } };
    }
    if (isolationMode === 'schema' && !(params.p_isolation_schema ?? tenant.isolation_schema)) {
      return { data: null, error: { code: '23502', message: 'Chế độ schema cô lập yêu cầu tên schema (isolation_schema).' } };
    }
    if (isolationMode === 'project' && !(params.p_isolation_project_ref ?? tenant.isolation_project_ref)) {
      return { data: null, error: { code: '23502', message: 'Chế độ project cô lập yêu cầu project ref (isolation_project_ref).' } };
    }
    if (isolationMode !== 'shared' && tenant.plan === 'free') {
      return { data: null, error: { code: '23514', message: 'Tenant gói Free không được phép cô lập schema/project. Hãy chuyển sang VIP hoặc để shared.' } };
    }
    tenant.isolation_mode = isolationMode;
    if (params.p_isolation_mode === 'shared') {
      tenant.isolation_schema = null;
      tenant.isolation_project_ref = null;
    } else {
      if (params.p_isolation_schema !== null && params.p_isolation_schema !== undefined) tenant.isolation_schema = params.p_isolation_schema;
      if (params.p_isolation_project_ref !== null && params.p_isolation_project_ref !== undefined) tenant.isolation_project_ref = params.p_isolation_project_ref;
    }

    // P18.2: custom domain + white-label
    const domain = params.p_custom_domain !== null && params.p_custom_domain !== undefined
      ? params.p_custom_domain.trim() || null
      : null;
    if (domain !== null) {
      if (tenant.plan === 'free') {
        return { data: null, error: { code: '23514', message: 'Custom domain chỉ khả dụng cho tenant VIP.' } };
      }
      if (!/^[a-z0-9][-a-z0-9]*(\.[-a-z0-9]+)+$/i.test(domain)) {
        return { data: null, error: { code: '23514', message: `Tên miền không hợp lệ: ${domain}` } };
      }
      if (store.tenants.some(t => t.id !== tenant.id && t.custom_domain?.toLowerCase() === domain.toLowerCase())) {
        return { data: null, error: { code: '23505', message: `Tên miền đã được sử dụng bởi tenant khác: ${domain}` } };
      }
      tenant.custom_domain = domain;
    } else if (params.p_custom_domain !== undefined) {
      tenant.custom_domain = null;
    }

    if (params.p_white_label !== null && params.p_white_label !== undefined) {
      tenant.white_label = params.p_white_label;
    }

    // P18.3: read replica / connection pool config
    if (params.p_read_replica_url !== null && params.p_read_replica_url !== undefined) {
      tenant.read_replica_url = params.p_read_replica_url.trim() || null;
    }
    if (params.p_connection_pool_config !== null && params.p_connection_pool_config !== undefined) {
      tenant.connection_pool_config = params.p_connection_pool_config;
    }

    tenant.updated_at = new Date().toISOString();
    return { data: tenant, error: null };
  }

  if (name === 'get_tenant_by_domain') {
    const domain = params.p_domain?.toLowerCase();
    const tenant = store.tenants.find(t => t.custom_domain?.toLowerCase() === domain);
    return { data: tenant ?? null, error: null };
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

  if (name === 'get_billing_reminder_config') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem cấu hình reminder' } };
    }
    const config = getSetting('billing_reminder_config') || {
      enabled: true,
      milestones: [7, 3, 1],
      send_time: '09:00',
      function_url: '',
      reminder_secret: '',
    };
    return { data: config, error: null };
  }

  if (name === 'set_billing_reminder_config') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật cấu hình reminder' } };
    }
    const inputMilestones: number[] = params.p_milestones ?? [];
    if (inputMilestones.length === 0 || inputMilestones.some((x: number) => x <= 0)) {
      return { data: null, error: { code: '23514', message: 'milestones phải là mảng số nguyên dương không rỗng' } };
    }
    const milestones: number[] = [...new Set(inputMilestones)].sort((a, b) => a - b);
    const config = {
      enabled: params.p_enabled,
      milestones,
      send_time: params.p_send_time ?? '09:00',
      function_url: params.p_function_url ?? '',
      reminder_secret: params.p_reminder_secret ?? '',
    };
    setSetting('billing_reminder_config', config);
    return { data: config, error: null };
  }

  if (name === 'get_pending_billing_reminders') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem danh sách reminder' } };
    }
    const config = getSetting('billing_reminder_config') || { enabled: true, milestones: [7, 3, 1] };
    if (!config.enabled) return { data: [], error: null };
    const today = new Date().toISOString().slice(0, 10);
    const results: { invoice_id: string; milestone: string; due_date: string }[] = [];
    for (const days of config.milestones) {
      const target = addDays(today, days);
      const pending = store.invoices
        .filter((i: any) => {
          if (i.status !== 'pending') return false;
          if (i.due_date !== target) return false;
          const tenant = store.tenants.find((t: any) => t.id === i.tenant_id);
          if (!tenant || tenant.status === 'archived') return false;
          const sent = store.invoice_reminder_logs.some((r: any) => r.invoice_id === i.id && r.milestone === `T-${days}`);
          return !sent;
        })
        .map((i: any) => ({ invoice_id: i.id, milestone: `T-${days}`, due_date: i.due_date }));
      results.push(...pending);
    }
    return { data: results, error: null };
  }

  if (name === 'send_billing_reminders') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được gửi reminder' } };
    }
    const config = getSetting('billing_reminder_config') || { enabled: true, milestones: [7, 3, 1] };
    if (!config.enabled) {
      return { data: { sent: 0, skipped: 0, error: 'reminder disabled' }, error: null };
    }
    if (!config.function_url || !config.reminder_secret) {
      return { data: { sent: 0, skipped: 0, error: 'function_url hoặc reminder_secret chưa được cấu hình' }, error: null };
    }
    const today = new Date().toISOString().slice(0, 10);
    let sent = 0;
    let skipped = 0;
    for (const days of config.milestones) {
      const target = addDays(today, days);
      const pending = store.invoices.filter((i: any) => {
        if (i.status !== 'pending') return false;
        if (i.due_date !== target) return false;
        const tenant = store.tenants.find((t: any) => t.id === i.tenant_id);
        if (!tenant || tenant.status === 'archived') return false;
        const logged = store.invoice_reminder_logs.some((r: any) => r.invoice_id === i.id && r.milestone === `T-${days}`);
        return !logged;
      });
      for (const invoice of pending) {
        try {
          if (simulateBillingReminderFailure) {
            throw new Error('simulated billing reminder failure');
          }
          store.invoice_reminder_logs.push({
            id: uuid(),
            invoice_id: invoice.id,
            milestone: `T-${days}`,
            due_date: invoice.due_date,
            sent_at: new Date().toISOString(),
            status: 'pending',
            created_at: new Date().toISOString(),
          });
          sent += 1;
        } catch {
          skipped += 1;
        }
      }
    }
    return { data: { sent, skipped, error: null }, error: null };
  }

  if (name === 'get_billing_automation_status') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem dashboard automation' } };
    }
    const today = new Date().toISOString().slice(0, 10);
    const addDays = (dateStr: string, days: number): string => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d + days));
      return date.toISOString().slice(0, 10);
    };
    const expiringSoon = store.tenant_subscriptions
      .filter((s: any) => {
        if (!s.expires_at) return false;
        const expiresDate = s.expires_at.slice(0, 10);
        return expiresDate >= today && expiresDate <= addDays(today, 7);
      })
      .map((s: any) => {
        const tenant = store.tenants.find((t: any) => t.id === s.tenant_id);
        return {
          id: s.tenant_id,
          name: tenant?.name || '',
          subdomain: tenant?.subdomain || '',
          expires_at: s.expires_at,
          days_remaining: Math.max(0, Math.ceil((new Date(s.expires_at).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))),
        };
      });
    const overdueInvoices = store.invoices
      .filter((i: any) => ['overdue', 'expired'].includes(i.status))
      .map((i: any) => {
        const tenant = store.tenants.find((t: any) => t.id === i.tenant_id);
        return {
          id: i.id,
          invoice_no: i.invoice_no,
          tenant_id: i.tenant_id,
          tenant_name: tenant?.name || '',
          tenant_subdomain: tenant?.subdomain || '',
          due_date: i.due_date,
          status: i.status,
          balance: i.balance,
        };
      });
    const dunningTenants = store.tenants
      .filter((t: any) => {
        const sub = store.tenant_subscriptions.find((s: any) => s.tenant_id === t.id);
        return t.status === 'read_only' || sub?.billing_status === 'overdue';
      })
      .map((t: any) => {
        const sub = store.tenant_subscriptions.find((s: any) => s.tenant_id === t.id);
        return {
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          status: t.status,
          billing_status: sub?.billing_status || '',
        };
      });
    const pendingInvoiceCount = store.invoices.filter((i: any) => ['pending', 'overdue', 'expired'].includes(i.status)).length;
    return {
      data: {
        expiring_soon_count: expiringSoon.length,
        expiring_soon: expiringSoon,
        pending_invoice_count: pendingInvoiceCount,
        overdue_invoice_count: overdueInvoices.length,
        overdue_invoices: overdueInvoices,
        dunning_tenant_count: dunningTenants.length,
        dunning_tenants: dunningTenants,
      },
      error: null,
    };
  }

  if (name === 'get_billing_job_logs') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem job log' } };
    }
    const limit = params.p_limit ?? 100;
    const rows = store.billing_job_logs
      .slice()
      .sort((a: any, b: any) => new Date(b.run_at).getTime() - new Date(a.run_at).getTime())
      .slice(0, limit)
      .map((r: any) => ({
        id: r.id,
        job_name: r.job_name,
        status: r.status,
        run_at: r.run_at,
        duration_ms: r.duration_ms,
        records_affected: r.records_affected,
        message: r.message,
        details: r.details,
        created_at: r.created_at,
      }));
    return { data: rows, error: null };
  }

  if (name === 'get_current_announcements_for_tenant') {
    const tenantId = params.p_tenant_id;
    const tenant = store.tenants.find(t => t.id === tenantId);
    const now = new Date();
    const rows = store.announcements
      .filter((a: any) => {
        if (a.status !== 'active') return false;
        if (a.scheduled_at && new Date(a.scheduled_at) > now) return false;
        if (a.expires_at && new Date(a.expires_at) < now) return false;
        if (a.target_type === 'all') return true;
        if (!tenant) return false;
        if (a.target_type === 'specific_tenants') return (a.targets || []).includes(tenantId);
        if (a.target_type === 'specific_plans') return (a.targets || []).includes(tenant.plan);
        return false;
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { data: rows, error: null };
  }

  if (name === 'get_tenant_storage_usage') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem storage usage' } };
    }
    const tenants = store.tenants.map((t: any) => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      bytes: 1024 * 1024,
      tables: [{ name: 'orders', rowCount: 10, bytes: 512 * 1024 }],
    }));
    return {
      data: {
        checkedAt: new Date().toISOString(),
        totalDatabaseBytes: tenants.length * 1024 * 1024 * 2,
        tenants,
      },
      error: null,
    };
  }

  if (name === 'bulk_update_tenants') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được bulk update tenant' } };
    }
    const ids: string[] = params.p_tenant_ids || [];
    const updatedIds: string[] = [];
    const skippedIds: string[] = [];
    ids.forEach((id: string) => {
      const tenant = store.tenants.find(t => t.id === id);
      if (!tenant) {
        skippedIds.push(id);
        return;
      }
      if (params.p_status !== null && params.p_status !== undefined) {
        tenant.status = params.p_status;
        tenant.archived_at = params.p_status === 'archived' ? new Date().toISOString() : null;
      }
      if (params.p_plan !== null && params.p_plan !== undefined) {
        if (!getPlan(params.p_plan)) {
          skippedIds.push(id);
          return;
        }
        tenant.plan = params.p_plan;
      }
      tenant.updated_at = new Date().toISOString();
      updatedIds.push(id);
    });
    return { data: { updated: updatedIds.length, updatedIds, skippedIds }, error: null };
  }

  if (name === 'get_maintenance_windows') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem maintenance windows' } };
    }
    const start = params.p_start ? new Date(params.p_start) : null;
    const end = params.p_end ? new Date(params.p_end) : null;
    const rows = store.maintenance_windows.filter(w => {
      const ws = new Date(w.starts_at);
      const we = new Date(w.ends_at);
      if (start && we < start) return false;
      if (end && ws > end) return false;
      return true;
    });
    return { data: rows, error: null };
  }

  if (name === 'create_maintenance_window') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo maintenance window' } };
    }
    if (!params.p_title || !params.p_starts_at || !params.p_ends_at) {
      return { data: null, error: { code: '23514', message: 'Thiếu thông tin bắt buộc' } };
    }
    const window = {
      id: uuid(),
      title: (params.p_title || '').trim(),
      description: params.p_description ?? null,
      starts_at: params.p_starts_at,
      ends_at: params.p_ends_at,
      status: params.p_status ?? 'scheduled',
      created_by: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.maintenance_windows.push(window);
    return { data: window, error: null };
  }

  if (name === 'update_maintenance_window') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật maintenance window' } };
    }
    const window = store.maintenance_windows.find(w => w.id === params.p_id);
    if (!window) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    if (params.p_title !== null && params.p_title !== undefined) window.title = params.p_title.trim();
    if (params.p_description !== null && params.p_description !== undefined) window.description = params.p_description;
    if (params.p_starts_at !== null && params.p_starts_at !== undefined) window.starts_at = params.p_starts_at;
    if (params.p_ends_at !== null && params.p_ends_at !== undefined) window.ends_at = params.p_ends_at;
    if (params.p_status !== null && params.p_status !== undefined) window.status = params.p_status;
    window.updated_at = new Date().toISOString();
    return { data: window, error: null };
  }

  if (name === 'delete_maintenance_window') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xóa maintenance window' } };
    }
    const idx = store.maintenance_windows.findIndex(w => w.id === params.p_id);
    if (idx < 0) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    store.maintenance_windows.splice(idx, 1);
    return { data: { id: params.p_id, deleted: true }, error: null };
  }

  if (name === 'reset_demo_data') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được reset demo data' } };
    }
    const tenantId = params.p_tenant_id;
    const tenant = store.tenants.find(t => t.id === tenantId);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };

    const protectedTables = ['tenants', 'tenant_memberships', 'tenant_subscriptions', 'system_settings', 'app_audit_log', 'plans', 'system_admins'];
    const cleared: { table: string; rows: number }[] = [];

    for (const [table, rows] of Object.entries(store)) {
      if (protectedTables.includes(table)) continue;
      if (!Array.isArray(rows) || rows.length === 0 || !('tenant_id' in rows[0])) continue;
      const before = rows.length;
      (store as any)[table] = rows.filter((r: any) => r.tenant_id !== tenantId);
      const deleted = before - (store as any)[table].length;
      if (deleted > 0) cleared.push({ table, rows: deleted });
    }

    const sub = store.tenant_subscriptions.find(s => s.tenant_id === tenantId);
    if (sub) {
      sub.current_month_orders = 0;
      sub.current_month_start = new Date().toISOString().slice(0, 10);
      sub.updated_at = new Date().toISOString();
    }

    return {
      data: { tenant_id: tenantId, cleared, total_rows: cleared.reduce((sum, c) => sum + c.rows, 0) },
      error: null,
    };
  }

  if (name === 'migrate_tenant_data') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được migrate tenant' } };
    }
    const source = params.p_source_tenant_id;
    const target = params.p_target_tenant_id;
    const sourceTenant = store.tenants.find(t => t.id === source);
    if (!sourceTenant) return { data: null, error: { code: 'PGRST116', message: 'Source tenant not found' } };
    const targetTenant = store.tenants.find(t => t.id === target);
    if (!targetTenant) return { data: null, error: { code: 'PGRST116', message: 'Target tenant not found' } };
    if (source === target) {
      return { data: null, error: { code: '23514', message: 'Source và target tenant phải khác nhau' } };
    }

    const adminOnlyTables = ['bank_accounts', 'email_templates', 'ticket_reply_templates', 'promo_codes', 'promotion_rules', 'announcements'];
    const excluded = ['tenants', 'system_settings', 'app_audit_log', 'plans', 'system_admins', ...adminOnlyTables];

    // Xóa dữ liệu cũ của target tenant.
    for (const [table, rows] of Object.entries(store)) {
      if (excluded.includes(table)) continue;
      if (!Array.isArray(rows) || rows.length === 0 || !('tenant_id' in rows[0])) continue;
      (store as any)[table] = rows.filter((r: any) => r.tenant_id !== target);
    }

    // Copy dữ liệu từ source sang target.
    const restored: { table: string; rows: number }[] = [];
    let totalRows = 0;
    for (const [table, rows] of Object.entries(store)) {
      if (excluded.includes(table)) continue;
      if (!Array.isArray(rows) || rows.length === 0 || !('tenant_id' in rows[0])) continue;
      const sourceRows = rows.filter((r: any) => r.tenant_id === source);
      if (sourceRows.length === 0) continue;
      const copies = sourceRows.map((r: any) => ({ ...r, tenant_id: target }));
      (store as any)[table].push(...copies);
      restored.push({ table, rows: copies.length });
      totalRows += copies.length;
    }

    return {
      data: {
        source_tenant_id: source,
        target_tenant_id: target,
        result: { tenant_id: target, restored, errors: [], total_rows: totalRows },
      },
      error: null,
    };
  }

  // P17.4: fraud detection + data retention
  if (name === 'get_fraud_detection_config') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem cấu hình fraud detection' } };
    const cfg = store.system_settings.find(s => s.key === 'fraud_detection_config')?.value ?? {};
    return {
      data: {
        enabled: cfg.enabled ?? true,
        ipWindowHours: cfg.ip_window_hours ?? 24,
        ipMax: cfg.ip_max ?? 5,
        emailDomainWindowHours: cfg.email_domain_window_hours ?? 24,
        emailDomainMax: cfg.email_domain_max ?? 10,
        ownerWindowHours: cfg.owner_window_hours ?? 24,
        ownerMax: cfg.owner_max ?? 20,
      },
      error: null,
    };
  }

  if (name === 'set_fraud_detection_config') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật cấu hình fraud detection' } };
    const cfg = {
      enabled: params.p_enabled ?? true,
      ip_window_hours: params.p_ip_window_hours ?? 24,
      ip_max: params.p_ip_max ?? 5,
      email_domain_window_hours: params.p_email_domain_window_hours ?? 24,
      email_domain_max: params.p_email_domain_max ?? 10,
      owner_window_hours: params.p_owner_window_hours ?? 24,
      owner_max: params.p_owner_max ?? 20,
    };
    const idx = store.system_settings.findIndex(s => s.key === 'fraud_detection_config');
    if (idx >= 0) store.system_settings[idx].value = cfg;
    else store.system_settings.push({ key: 'fraud_detection_config', value: cfg, updated_at: new Date().toISOString(), updated_by: null });
    return {
      data: {
        enabled: cfg.enabled,
        ipWindowHours: cfg.ip_window_hours,
        ipMax: cfg.ip_max,
        emailDomainWindowHours: cfg.email_domain_window_hours,
        emailDomainMax: cfg.email_domain_max,
        ownerWindowHours: cfg.owner_window_hours,
        ownerMax: cfg.owner_max,
      },
      error: null,
    };
  }

  if (name === 'run_fraud_detection') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được chạy fraud detection' } };
    return { data: { enabled: true, inserted: 0, updated: 0 }, error: null };
  }

  if (name === 'get_fraud_queue') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem fraud queue' } };
    const status = params.p_status || null;
    const severity = params.p_severity || null;
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    const rows = store.fraud_queue.filter((q: any) => (!status || q.status === status) && (!severity || q.severity === severity));
    const paged = rows.slice(offset, offset + limit).map((q: any) => ({
      id: q.id,
      type: q.type,
      severity: q.severity,
      status: q.status,
      target_value: q.target_value,
      event_count: q.event_count,
      details: q.details,
      window_start: q.window_start,
      window_end: q.window_end,
      notes: q.notes,
      created_at: q.created_at,
      updated_at: q.updated_at,
    }));
    return { data: { data: paged, count: rows.length }, error: null };
  }

  if (name === 'get_fraud_stats') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem fraud stats' } };
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const q of store.fraud_queue) {
      byStatus[q.status] = (byStatus[q.status] || 0) + 1;
      bySeverity[q.severity] = (bySeverity[q.severity] || 0) + 1;
    }
    return { data: { total: store.fraud_queue.length, byStatus, bySeverity }, error: null };
  }

  if (name === 'update_fraud_queue_status') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật fraud queue' } };
    const q = store.fraud_queue.find((x: any) => x.id === params.p_id);
    if (!q) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    q.status = params.p_status;
    if (params.p_notes) q.notes = params.p_notes;
    q.updated_at = new Date().toISOString();
    return { data: { id: q.id, status: q.status, notes: q.notes, updatedAt: q.updated_at }, error: null };
  }

  if (name === 'get_data_retention_config') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem cấu hình data retention' } };
    const cfg = store.system_settings.find(s => s.key === 'data_retention_config')?.value ?? {};
    return {
      data: {
        retentionDaysOrders: cfg.retention_days_orders ?? 730,
        retentionDaysProcessedOperations: cfg.retention_days_processed_operations ?? 90,
        retentionDaysRateLimitLogs: cfg.retention_days_rate_limit_logs ?? 1,
        retentionDaysFraudQueue: cfg.retention_days_fraud_queue ?? 90,
        retentionDaysRegistrationEvents: cfg.retention_days_registration_events ?? 365,
        cronSchedule: cfg.cron_schedule ?? '0 3 * * *',
      },
      error: null,
    };
  }

  if (name === 'set_data_retention_config') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật cấu hình data retention' } };
    const cfg = {
      retention_days_orders: params.p_retention_days_orders ?? 730,
      retention_days_processed_operations: params.p_retention_days_processed_operations ?? 90,
      retention_days_rate_limit_logs: params.p_retention_days_rate_limit_logs ?? 1,
      retention_days_fraud_queue: params.p_retention_days_fraud_queue ?? 90,
      retention_days_registration_events: params.p_retention_days_registration_events ?? 365,
      cron_schedule: params.p_cron_schedule ?? '0 3 * * *',
    };
    const idx = store.system_settings.findIndex(s => s.key === 'data_retention_config');
    if (idx >= 0) store.system_settings[idx].value = cfg;
    else store.system_settings.push({ key: 'data_retention_config', value: cfg, updated_at: new Date().toISOString(), updated_by: null });
    const cronIdx = store.system_settings.findIndex(s => s.key === 'data_retention_cron');
    const cronValue = { schedule: cfg.cron_schedule, description: 'Hàng ngày' };
    if (cronIdx >= 0) store.system_settings[cronIdx].value = cronValue;
    else store.system_settings.push({ key: 'data_retention_cron', value: cronValue, updated_at: new Date().toISOString(), updated_by: null });
    return {
      data: {
        retentionDaysOrders: cfg.retention_days_orders,
        retentionDaysProcessedOperations: cfg.retention_days_processed_operations,
        retentionDaysRateLimitLogs: cfg.retention_days_rate_limit_logs,
        retentionDaysFraudQueue: cfg.retention_days_fraud_queue,
        retentionDaysRegistrationEvents: cfg.retention_days_registration_events,
        cronSchedule: cfg.cron_schedule,
      },
      error: null,
    };
  }

  if (name === 'run_data_retention') {
    if (!isSystemAdmin) return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được chạy data retention' } };
    return {
      data: {
        archivedOrders: 0,
        archivedItems: 0,
        deletedProcessedOperations: 0,
        deletedRateLimitLogs: 0,
        deletedFraudQueue: 0,
        deletedRegistrationEvents: 0,
      },
      error: null,
    };
  }

  // P18.3: Read replica + connection pooling + heavy ops queue
  if (name === 'get_connection_pool_stats') {
    return {
      data: {
        active: 2,
        idle: 8,
        total: 10,
        max: 100,
        status: 'healthy',
        message: null,
      },
      error: null,
    };
  }

  if (name === 'get_read_replica_status') {
    const configured = store.tenants.filter((t: any) => t.read_replica_url).length;
    return {
      data: {
        enabled: configured > 0,
        configured_tenants: configured,
        message: 'Read replica URL được cấu hình trên cột tenants.read_replica_url. Frontend dùng VITE_SUPABASE_READ_REPLICA_URL.',
      },
      error: null,
    };
  }

  if (name === 'enqueue_heavy_op_job') {
    const tenant = store.tenants.find((t: any) => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    if (!isSystemAdmin && !isTenantMember(params.p_tenant_id)) {
      return { data: null, error: { code: '42501', message: 'Không có quyền tạo job' } };
    }
    const job = {
      id: uuid(),
      tenant_id: params.p_tenant_id,
      job_type: params.p_job_type,
      payload: params.p_payload ?? {},
      status: 'pending',
      attempts: 0,
      max_attempts: params.p_max_attempts ?? 3,
      error_message: null,
      result: null,
      scheduled_at: params.p_scheduled_at ?? new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.heavy_ops_jobs.push(job);
    return { data: job, error: null };
  }

  if (name === 'get_heavy_op_jobs') {
    let rows = store.heavy_ops_jobs as any[];
    if (params.p_tenant_id) rows = rows.filter((j) => j.tenant_id === params.p_tenant_id);
    if (params.p_status) rows = rows.filter((j) => j.status === params.p_status);
    rows = rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    return { data: rows.slice(offset, offset + limit), error: null };
  }

  if (name === 'claim_heavy_op_job') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Không có quyền claim job' } };
    }
    const job = store.heavy_ops_jobs.find((j: any) => j.status === 'pending');
    if (!job) return { data: null, error: null };
    job.status = 'processing';
    job.attempts += 1;
    job.updated_at = new Date().toISOString();
    return { data: job, error: null };
  }

  if (name === 'complete_heavy_op_job') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Không có quyền cập nhật job' } };
    }
    const job = store.heavy_ops_jobs.find((j: any) => j.id === params.p_job_id);
    if (!job) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    job.status = params.p_status;
    job.result = params.p_result ?? null;
    job.error_message = params.p_error_message ?? null;
    job.updated_at = new Date().toISOString();
    return { data: job, error: null };
  }

  if (name === 'retry_heavy_op_job') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Không có quyền retry job' } };
    }
    const job = store.heavy_ops_jobs.find((j: any) => j.id === params.p_job_id);
    if (!job || !['failed', 'cancelled'].includes(job.status)) {
      return { data: null, error: { code: '23514', message: 'Chỉ được retry job failed/cancelled' } };
    }
    job.status = 'pending';
    job.attempts = 0;
    job.error_message = null;
    job.updated_at = new Date().toISOString();
    return { data: job, error: null };
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

  if (name === 'impersonate-tenant') {
    if (!isSystemAdmin) return { data: { error: 'Chỉ system admin được impersonate' }, error: null };
    const { tenant_id } = body;
    const tenant = store.tenants.find(t => t.id === tenant_id);
    if (!tenant) return { data: { error: 'Tenant không tồn tại' }, error: null };
    if (tenant.status !== 'active') return { data: { error: 'Tenant không hoạt động' }, error: null };

    const realMembership = store.tenant_memberships.find(
      m => m.tenant_id === tenant_id && m.user_id === currentUserId && !m.impersonated_by
    );
    if (realMembership) {
      return { data: { error: 'Bạn đã là thành viên của tenant này, không cần impersonate' }, error: null };
    }

    store.tenant_memberships = store.tenant_memberships.filter(
      m => !(m.tenant_id === tenant_id && m.user_id === currentUserId && m.impersonated_by)
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const membership = {
      id: uuid(),
      tenant_id,
      user_id: currentUserId,
      role: 'admin',
      invited_by: currentUserId,
      impersonated_by: currentUserId,
      impersonated_at: now.toISOString(),
      impersonated_expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    store.tenant_memberships.push(membership);

    store.app_audit_log.push({
      id: uuid(),
      tenant_id,
      table_name: 'tenant_memberships',
      action: 'IMPERSONATE',
      record_id: membership.id,
      user_id: currentUserId,
      new_data: {
        tenant_id,
        tenant_name: tenant.name,
        tenant_subdomain: tenant.subdomain,
        impersonated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      created_at: now.toISOString(),
    });

    return {
      data: {
        success: true,
        tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
        expires_at: expiresAt.toISOString(),
      },
      error: null,
    };
  }

  if (name === 'end-impersonation') {
    if (!isSystemAdmin) return { data: { error: 'Chỉ system admin được kết thúc impersonate' }, error: null };
    const sessions = store.tenant_memberships.filter(
      m => m.user_id === currentUserId && m.impersonated_by
    );
    const now = new Date();
    for (const session of sessions) {
      const startedAt = new Date(session.impersonated_at || now.toISOString());
      const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);
      store.app_audit_log.push({
        id: uuid(),
        tenant_id: session.tenant_id,
        table_name: 'tenant_memberships',
        action: 'IMPERSONATE_END',
        record_id: session.id,
        user_id: currentUserId,
        old_data: {
          tenant_id: session.tenant_id,
          impersonated_at: session.impersonated_at,
          impersonated_expires_at: session.impersonated_expires_at,
          duration_seconds: durationSeconds,
        },
        created_at: now.toISOString(),
      });
    }
    store.tenant_memberships = store.tenant_memberships.filter(
      m => !(m.user_id === currentUserId && m.impersonated_by)
    );
    return { data: { success: true, ended: sessions.length }, error: null };
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

  if (name === 'system-health') {
    return {
      data: {
        checkedAt: new Date().toISOString(),
        overall: 'healthy',
        checks: [
          { name: 'Database', status: 'healthy', latencyMs: 12, detail: 'Truy vấn thành công' },
          { name: 'Storage', status: 'healthy', latencyMs: 34, detail: '1 buckets' },
          { name: 'Edge Functions', status: 'healthy', latencyMs: 156, detail: 'Phản hồi OK' },
        ],
      },
      error: null,
    };
  }

  if (name === 'send-template-email') {
    const { template_key, to, variables, test } = body;
    if (!template_key || typeof template_key !== 'string') {
      return { data: { error: 'template_key không hợp lệ' }, error: null };
    }
    const template = store.email_templates.find(t => t.key === template_key);
    if (!template) {
      return { data: { error: `Không tìm thấy template '${template_key}'` }, error: null };
    }
    if (!template.is_active) {
      return { data: { error: `Template '${template_key}' đang bị tắt` }, error: null };
    }
    const recipients = Array.isArray(to) ? to : [to];
    const brandRow = store.system_settings.find(s => s.key === 'email_brand');
    const brandName = brandRow?.value?.from_name || 'VietSales Pro';
    return {
      data: {
        success: true,
        id: `email-${uuid()}`,
        to: recipients,
        template_key,
        subject: template.subject.replace(/\{\{\s*brand_name\s*\}\}/g, brandName),
        test: !!test,
      },
      error: null,
    };
  }

  if (name === 'send-ticket-email') {
    const { ticket_id, event, to, reply_id } = body;
    const ticket = store.support_tickets?.find(t => t.id === ticket_id);
    if (!ticket) return { data: { error: 'Không tìm thấy ticket' }, error: null };
    const tenant = store.tenants.find(t => t.id === ticket.tenant_id);
    const owner = tenant ? store.users.find(u => u.id === tenant.owner_id) : undefined;
    const recipient = to || owner?.email || `owner-${ticket.tenant_id}@example.com`;
    return {
      data: { success: true, id: `email-${uuid()}`, to: recipient, event, reply_id },
      error: null,
    };
  }

  if (name === 'error-performance') {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recent = store.error_logs.filter(e => e.created_at >= since);
    const bySource: Record<string, Record<string, number>> = {};
    for (const e of recent) {
      bySource[e.source] = bySource[e.source] || {};
      bySource[e.source][e.level] = (bySource[e.source][e.level] || 0) + 1;
    }
    const bySourceArray = Object.entries(bySource).flatMap(([source, levels]) =>
      Object.entries(levels).map(([level, count]) => ({ source, level, count }))
    );
    return {
      data: {
        checkedAt: new Date().toISOString(),
        errors: {
          total: recent.length,
          since,
          bySource: bySourceArray,
          recent: recent.slice(0, 50),
        },
        performance: {
          totalQueries: 12,
          totalCalls: 3456,
          averageTimeMs: 4.2,
          p95Ms: 18.5,
          p99Ms: 42.1,
          rps: 14.4,
          resetAt: new Date().toISOString(),
          topQueries: [
            { query: 'SELECT * FROM orders WHERE tenant_id = $1', calls: 1200, mean_ms: 2.1, p95_ms: 8.4, p99_ms: 14.2, total_ms: 2520 },
            { query: 'UPDATE tenants SET ...', calls: 45, mean_ms: 12.5, p95_ms: 35.0, p99_ms: 67.0, total_ms: 562.5 },
          ],
        },
      },
      error: null,
    };
  }

  if (name === 'system-backup') {
    return {
      data: {
        checkedAt: new Date().toISOString(),
        backupStatus: {
          pitrEnabled: true,
          pitrEarliestRecoveryPoint: new Date().toISOString(),
          lastBackupAt: new Date().toISOString(),
          cliAvailable: true,
          status: 'healthy',
        },
      },
      error: null,
    };
  }

  if (name === 'tenant-backup') {
    const { tenant_id } = body || {};
    const tenant = store.tenants.find(t => t.id === tenant_id);
    if (!tenant) return { data: { error: 'Tenant không tồn tại' }, error: null };
    return {
      data: {
        tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
        tables: {},
        exportedAt: new Date().toISOString(),
      },
      error: null,
    };
  }

  if (name === 'tenant-restore') {
    const { tenant_id, backup } = body || {};
    if (!tenant_id) return { data: { error: 'Thiếu tenant_id' }, error: null };
    if (!backup || !backup.tables) return { data: { error: 'Backup không hợp lệ' }, error: null };
    const restored = Object.entries(backup.tables).map(([table, rows]) => ({ table, rows: (rows as any[]).length }));
    return {
      data: {
        success: true,
        result: {
          tenant_id,
          restored,
          errors: [],
          total_rows: restored.reduce((sum, r) => sum + r.rows, 0),
        },
      },
      error: null,
    };
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
