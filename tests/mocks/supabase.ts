import { vi } from 'vitest';

// ponytail: minimal in-memory Supabase mock for tenant/auth/RLS unit tests.
// Ceiling: only supports the query shapes used by tenantService and the RLS scenarios.

type Row = Record<string, any>;

let currentUserId: string | null = null;
let currentTenantId: string | null = null;
let isSystemAdmin = false;
let simulateBillingReminderFailure = false;
let orderCodeCounter = 0;
let returnOrderCodeCounter = 0;
let supplierExchangeCodeCounter = 0;

const store: Record<string, Row[]> = {
  tenants: [],
  tenant_memberships: [],
  tenant_subscriptions: [],
  products: [],
  orders: [],
  users: [],
  app_audit_log: [],
  audit_log: [],
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
  tenant_credentials: [],
  licenses: [],
  invitations: [],
  partners: [],
  integrations: [],
  tenant_api_keys: [],
  tenant_webhooks: [],
  webhook_deliveries: [],
  gdpr_requests: [],
  terms_acceptance: [],
  gdpr_deletion_logs: [],
  notification_logs: [],
  login_attempts: [],
  admin_login_history: [],
  admin_2fa_backup_codes: [],
  categories: [],
  brands: [],
  product_lots: [],
  inventory_counts: [],
  inventory_count_items: [],
  stock_movements: [],
  customers: [],
  customer_payment_ledger: [],
  order_items: [],
  return_orders: [],
  return_order_items: [],
  point_history: [],
  rewards: [],
  // Recovery Wave-03 — H4/H5/H6 stores
  suppliers: [],
  supplier_payment_ledger: [],
  import_receipts: [],
  import_items: [],
  supplier_exchanges: [],
  supplier_exchange_return_items: [],
  supplier_exchange_received_items: [],
  // Recovery Wave-04 — H7/H8 stores
  disposals: [],
  disposal_items: [],
};

export const resetMockData = () => {
  for (const key of Object.keys(store)) store[key] = [];
  currentUserId = null;
  currentTenantId = null;
  isSystemAdmin = false;
  orderCodeCounter = 0;
  returnOrderCodeCounter = 0;
  supplierExchangeCodeCounter = 0;

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
  notFilters: Record<string, any>;
  ilikeFilters: Record<string, string>;
  inFilters: Record<string, any[]>;
  gteFilters: Record<string, any>;
  lteFilters: Record<string, any>;
  selectColumns: string;
  single: boolean | 'maybe';
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
    } else if (table === 'tenant_credentials') {
      if (!isSystemAdmin) rows = [];
    } else if (table === 'licenses') {
      if (!isSystemAdmin) rows = [];
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
  for (const [field, value] of Object.entries(state.notFilters)) {
    rows = rows.filter(r => r[field] !== value);
  }
  for (const [field, values] of Object.entries(state.inFilters)) {
    rows = rows.filter(r => values.includes(r[field]));
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
      const tokens = state.selectColumns.split(',').map(s => s.trim());
      // ponytail: keep legacy `fk (*)` pattern while also supporting explicit resource syntax `tenant_id, tenants(*)`.
      const oldFkPattern = tokens.length === 2 && tokens[1] === '(*)' ? tokens[0] : null;
      rows = rows.map(r => {
        if (oldFkPattern) {
          const refTable = oldFkPattern === 'tenant_id' ? 'tenants' : table;
          return { [oldFkPattern]: store[refTable].find(x => x.id === r[oldFkPattern]) ?? r[oldFkPattern] };
        }
        const expanded = { ...r };
        for (const token of tokens) {
          if (!token.endsWith('(*)')) continue;
          const relTable = token.slice(0, -3);
          const fk = relTable === 'tenants' ? 'tenant_id' : `${relTable.replace(/s$/, '')}_id`;
          expanded[relTable] = store[relTable].find(x => x.id === r[fk]) ?? null;
        }
        return expanded;
      });
    }
    if (state.single) {
      if (state.single === 'maybe') {
        return { data: rows[0] ?? null, error: null };
      }
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
    } else if (table === 'tenant_credentials') {
      if (!isSystemAdmin) return { data: null, error: rlsError() };
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
    if (table === 'tenant_memberships') {
      for (const row of rows) {
        const tenant = store.tenants.find(t => t.id === row.tenant_id);
        if (tenant && tenant.owner_id === row.user_id) {
          return { data: null, error: { code: '23503', message: 'Không thể xóa chủ sở hữu' } };
        }
        const admins = store.tenant_memberships.filter(m => m.tenant_id === row.tenant_id && m.role === 'admin');
        if (row.role === 'admin' && admins.length <= 1) {
          return { data: null, error: { code: '23503', message: 'Không thể xóa admin cuối cùng' } };
        }
      }
    }
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
  const state: QueryState = { table, operation: 'select', filters: {}, notFilters: {}, ilikeFilters: {}, inFilters: {}, gteFilters: {}, lteFilters: {}, selectColumns: '*', single: false };
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
    not: (field: string, _op: string, value: any) => { state.notFilters[field] = value; return builder; },
    ilike: (field: string, pattern: string) => { state.ilikeFilters[field] = pattern; return builder; },
    in: (field: string, values: any[]) => { state.inFilters[field] = values; return builder; },
    gte: (field: string, value: any) => { state.gteFilters[field] = value; return builder; },
    lte: (field: string, value: any) => { state.lteFilters[field] = value; return builder; },
    range: (from: number, to: number) => { state.rangeStart = from; state.rangeEnd = to; return builder; },
    order: (field: string, opts?: { ascending?: boolean }) => { state.orderBy = field; state.orderAsc = opts?.ascending ?? false; return builder; },
    single: () => { state.single = true; return builder; },
    maybeSingle: () => { state.single = 'maybe'; return builder; },
    then: (resolve: any) => {
      resolve(executeQuery(state));
    },
  };
  return builder;
};

const rpc = async (name: string, params: Record<string, any>): Promise<{ data: any; error: any }> => {
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
      const owner = store.users.find(u => u.id === ownerId);
      store.tenant_memberships.push({
        id: uuid(),
        tenant_id: tenant.id,
        user_id: ownerId,
        role: 'admin',
        status: 'active',
        is_active: true,
        email: owner?.email || `${ownerId}@example.com`,
        invited_by: null,
        invited_at: new Date().toISOString(),
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

  if (name === 'set_tenant_subdomain') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật subdomain tenant' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const s = (params.p_subdomain || '').trim().toLowerCase();
    const reserved = ['admin', 'www', 'api', 'app'];
    if (s.length < 3 || s.length > 63) {
      return { data: null, error: { code: '22023', message: 'Subdomain phải dài 3-63 ký tự' } };
    }
    if (!/^[a-z0-9-]+$/.test(s) || s.startsWith('-') || s.endsWith('-')) {
      return { data: null, error: { code: '22023', message: 'Subdomain không hợp lệ' } };
    }
    if (reserved.includes(s)) {
      return { data: null, error: { code: '22023', message: `Subdomain "${s}" thuộc danh sách dự trữ` } };
    }
    if (store.tenants.some(t => t.id !== tenant.id && t.subdomain === s && t.status !== 'archived')) {
      return { data: null, error: { code: '23505', message: 'Subdomain đã được sử dụng' } };
    }
    tenant.subdomain = s;
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
      .map(m => {
        const user = store.users.find(u => u.id === m.user_id);
        const inviter = m.invited_by ? store.users.find(u => u.id === m.invited_by) : null;
        return {
          ...m,
          email: user?.email || `user-${m.user_id}@example.com`,
          invited_by_email: inviter?.email || (m.invited_by ? `inviter-${m.invited_by}@example.com` : null),
        };
      });
    return { data: rows, error: null };
  }

  if (name === 'search_tenant_members') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem danh sách thành viên tenant' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    let rows: any[] = store.tenant_memberships
      .filter(m => m.tenant_id === params.p_tenant_id)
      .map(m => {
        const user = store.users.find(u => u.id === m.user_id);
        const inviter = m.invited_by ? store.users.find(u => u.id === m.invited_by) : null;
        return {
          ...m,
          email: user?.email || `user-${m.user_id}@example.com`,
          invited_by_email: inviter?.email || (m.invited_by ? `inviter-${m.invited_by}@example.com` : null),
          is_owner: tenant.owner_id === m.user_id,
        };
      });
    if (params.p_role) {
      rows = rows.filter(m => m.role === params.p_role);
    }
    if (params.p_status) {
      rows = rows.filter(m => m.status === params.p_status);
    }
    if (params.p_is_active !== null && params.p_is_active !== undefined) {
      rows = rows.filter(m => m.is_active === params.p_is_active);
    }
    const search = params.p_search ? String(params.p_search).toLowerCase() : '';
    if (search) {
      rows = rows.filter(m => (m.email || '').toLowerCase().includes(search));
    }
    const sortBy = params.p_sort_by as string | null;
    if (sortBy) {
      const sortDir = params.p_sort_dir === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        const aVal = a[sortBy] ?? '';
        const bVal = b[sortBy] ?? '';
        if (aVal === bVal) return 0;
        return (aVal < bVal ? -1 : 1) * sortDir;
      });
    }
    const page = Number(params.p_page ?? 1);
    const pageSize = Number(params.p_page_size ?? 20);
    const offset = (page - 1) * pageSize;
    const paginated = rows.slice(offset, offset + pageSize);
    return { data: { items: paginated, total_count: rows.length }, error: null };
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
    const offset = params.p_offset ?? 0;
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
          createdAt: t.created_at,
          ordersThisMonth: sub?.current_month_orders ?? 0,
          userCount: store.tenant_memberships.filter(m => m.tenant_id === t.id).length,
          productCount: store.products.filter(p => p.tenant_id === t.id).length,
        };
      })
      .sort((a, b) => b.ordersThisMonth - a.ordersThisMonth || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(offset, offset + limit);
    return { data: { data: rows, count: store.tenants.filter(t => t.status !== 'archived').length }, error: null };
  }

  if (name === 'get_tenants_admin') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được gọi get_tenants_admin' } };
    }
    const limit = params.p_limit ?? 20;
    const offset = ((params.p_page ?? 1) - 1) * limit;
    const search = (params.p_search ?? '').toLowerCase();
    const statusFilter = params.p_status ?? 'all';
    const planFilter = params.p_plan ?? 'all';
    const sortBy = params.p_sort_by ?? 'created_at';
    const sortOrder = params.p_sort_order ?? 'desc';

    let rows = store.tenants.filter(t => t.status !== 'archived');
    if (statusFilter !== 'all') rows = rows.filter(t => t.status === statusFilter);
    if (planFilter !== 'all') rows = rows.filter(t => t.plan === planFilter);
    if (search) {
      rows = rows.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.subdomain.toLowerCase().includes(search)
      );
    }

    const total = rows.length;
    const sortMult = sortOrder === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      let av: any = a[sortBy];
      let bv: any = b[sortBy];
      if (sortBy === 'created_at' || sortBy === 'updated_at' || sortBy === 'archived_at') {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortMult * av.localeCompare(bv);
      }
      return sortMult * (av > bv ? 1 : av < bv ? -1 : 0);
    });
    rows = rows.slice(offset, offset + limit);
    return { data: { data: rows, total }, error: null };
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
      status: 'open',
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
    if (['paid', 'void', 'uncollectible', 'draft'].includes(invoice.status)) {
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
          if (i.status !== 'open') return false;
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
        if (i.status !== 'open') return false;
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
      .filter((i: any) => ['open', 'uncollectible'].includes(i.status))
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
    const pendingInvoiceCount = store.invoices.filter((i: any) => ['open', 'uncollectible'].includes(i.status)).length;
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

  if (name === 'list_partners') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem danh sách partner' } };
    }
    const rows = store.partners
      .slice()
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        website: p.website,
        contactEmail: p.contact_email,
        logoUrl: p.logo_url,
        status: p.status,
        createdBy: p.created_by,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
    return { data: rows, error: null };
  }

  if (name === 'create_partner') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo partner' } };
    }
    if (!params.p_name || String(params.p_name).trim().length === 0) {
      return { data: null, error: { code: '23514', message: 'Tên partner không được để trống' } };
    }
    const now = new Date().toISOString();
    const row = {
      id: uuid(),
      name: String(params.p_name).trim(),
      slug: (params.p_slug && String(params.p_slug).trim()) || null,
      description: (params.p_description && String(params.p_description).trim()) || null,
      website: (params.p_website && String(params.p_website).trim()) || null,
      contact_email: (params.p_contact_email && String(params.p_contact_email).trim()) || null,
      logo_url: (params.p_logo_url && String(params.p_logo_url).trim()) || null,
      status: 'active',
      created_by: currentUserId,
      created_at: now,
      updated_at: now,
    };
    store.partners.push(row);
    return {
      data: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        website: row.website,
        contactEmail: row.contact_email,
        logoUrl: row.logo_url,
        status: row.status,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      error: null,
    };
  }

  if (name === 'update_partner') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật partner' } };
    }
    const row = store.partners.find((p: any) => p.id === params.p_partner_id);
    if (!row) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    if (params.p_name !== null && params.p_name !== undefined) row.name = String(params.p_name).trim();
    if (params.p_slug !== null && params.p_slug !== undefined) row.slug = String(params.p_slug).trim() || null;
    if (params.p_description !== null && params.p_description !== undefined) row.description = String(params.p_description).trim() || null;
    if (params.p_website !== null && params.p_website !== undefined) row.website = String(params.p_website).trim() || null;
    if (params.p_contact_email !== null && params.p_contact_email !== undefined) row.contact_email = String(params.p_contact_email).trim() || null;
    if (params.p_logo_url !== null && params.p_logo_url !== undefined) row.logo_url = String(params.p_logo_url).trim() || null;
    if (params.p_status !== null && params.p_status !== undefined) row.status = params.p_status;
    row.updated_at = new Date().toISOString();
    return {
      data: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        website: row.website,
        contactEmail: row.contact_email,
        logoUrl: row.logo_url,
        status: row.status,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      error: null,
    };
  }

  if (name === 'delete_partner') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xóa partner' } };
    }
    const idx = store.partners.findIndex((p: any) => p.id === params.p_partner_id);
    if (idx < 0) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const id = store.partners[idx].id;
    store.partners.splice(idx, 1);
    return { data: { id, deleted: true }, error: null };
  }

  if (name === 'list_integrations') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem danh sách integration' } };
    }
    const rows = store.integrations
      .slice()
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((i: any) => {
        const partner = store.partners.find((p: any) => p.id === i.partner_id);
        return {
          id: i.id,
          partnerId: i.partner_id,
          name: i.name,
          slug: i.slug,
          description: i.description,
          category: i.category,
          status: i.status,
          documentationUrl: i.documentation_url,
          partnerName: partner?.name ?? null,
          createdBy: i.created_by,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
        };
      });
    return { data: rows, error: null };
  }

  if (name === 'create_integration') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo integration' } };
    }
    if (!params.p_name || String(params.p_name).trim().length === 0) {
      return { data: null, error: { code: '23514', message: 'Tên integration không được để trống' } };
    }
    if (params.p_partner_id && !store.partners.some((p: any) => p.id === params.p_partner_id)) {
      return { data: null, error: { code: '23514', message: `Không tìm thấy partner: ${params.p_partner_id}` } };
    }
    const now = new Date().toISOString();
    const row = {
      id: uuid(),
      partner_id: params.p_partner_id || null,
      name: String(params.p_name).trim(),
      slug: (params.p_slug && String(params.p_slug).trim()) || null,
      description: (params.p_description && String(params.p_description).trim()) || null,
      category: (params.p_category && String(params.p_category).trim()) || null,
      status: params.p_status ?? 'active',
      documentation_url: (params.p_documentation_url && String(params.p_documentation_url).trim()) || null,
      created_by: currentUserId,
      created_at: now,
      updated_at: now,
    };
    store.integrations.push(row);
    return {
      data: {
        id: row.id,
        partnerId: row.partner_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        category: row.category,
        status: row.status,
        documentationUrl: row.documentation_url,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      error: null,
    };
  }

  if (name === 'update_integration') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật integration' } };
    }
    const row = store.integrations.find((i: any) => i.id === params.p_integration_id);
    if (!row) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    if (params.p_partner_id !== null && params.p_partner_id !== undefined) row.partner_id = params.p_partner_id;
    if (params.p_name !== null && params.p_name !== undefined) row.name = String(params.p_name).trim();
    if (params.p_slug !== null && params.p_slug !== undefined) row.slug = String(params.p_slug).trim() || null;
    if (params.p_description !== null && params.p_description !== undefined) row.description = String(params.p_description).trim() || null;
    if (params.p_category !== null && params.p_category !== undefined) row.category = String(params.p_category).trim() || null;
    if (params.p_status !== null && params.p_status !== undefined) row.status = params.p_status;
    if (params.p_documentation_url !== null && params.p_documentation_url !== undefined) row.documentation_url = String(params.p_documentation_url).trim() || null;
    row.updated_at = new Date().toISOString();
    return {
      data: {
        id: row.id,
        partnerId: row.partner_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        category: row.category,
        status: row.status,
        documentationUrl: row.documentation_url,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      error: null,
    };
  }

  if (name === 'delete_integration') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xóa integration' } };
    }
    const idx = store.integrations.findIndex((i: any) => i.id === params.p_integration_id);
    if (idx < 0) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const id = store.integrations[idx].id;
    store.integrations.splice(idx, 1);
    return { data: { id, deleted: true }, error: null };
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

  if (name === 'get_current_user_tenants') {
    const memberships = store.tenant_memberships.filter(m => m.user_id === currentUserId);
    const tenantIds = memberships.map(m => m.tenant_id);
    const rows = store.tenants.filter(t => tenantIds.includes(t.id) && t.status !== 'archived');
    return { data: rows, error: null };
  }

  if (name === 'get_tenant_members_with_email') {
    const tenantId = params.p_tenant_id;
    if (!isSystemAdmin && !isTenantOwner(tenantId)) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin hoặc chủ sở hữu mới được xem danh sách thành viên' } };
    }
    const rows = store.tenant_memberships
      .filter(m => m.tenant_id === tenantId)
      .map(m => ({
        ...m,
        email: m.email || `${m.user_id}@example.com`,
        invited_by_email: store.users.find(u => u.id === m.invited_by)?.email || null,
      }));
    return { data: rows, error: null };
  }

  if (name === 'update_tenant_member_role') {
    const tenantId = params.p_tenant_id;
    const userId = params.p_user_id;
    const role = params.p_role;
    if (!isSystemAdmin && !isTenantOwner(tenantId)) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin hoặc chủ sở hữu mới được cập nhật vai trò' } };
    }
    const validRoles = ['admin', 'cashier', 'inventory_manager', 'accountant', 'viewer'];
    if (!validRoles.includes(role)) {
      return { data: null, error: { code: '23514', message: `Vai trò không hợp lệ: ${role}` } };
    }
    const member = store.tenant_memberships.find(m => m.tenant_id === tenantId && m.user_id === userId);
    if (!member) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    member.role = role;
    member.updated_at = new Date().toISOString();
    return { data: member, error: null };
  }

  if (name === 'remove_tenant_member') {
    const tenantId = params.p_tenant_id;
    const userId = params.p_user_id;
    if (!isSystemAdmin && !isTenantOwner(tenantId)) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin hoặc chủ sở hữu mới được xóa thành viên' } };
    }
    const idx = store.tenant_memberships.findIndex(m => m.tenant_id === tenantId && m.user_id === userId);
    if (idx === -1) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const tenant = store.tenants.find(t => t.id === tenantId);
    if (tenant?.owner_id === userId) {
      return { data: null, error: { code: '42501', message: 'Không thể xóa chủ sở hữu tenant' } };
    }
    store.tenant_memberships.splice(idx, 1);
    return { data: null, error: null };
  }

  if (name === 'toggle_tenant_member_active') {
    const tenantId = params.p_tenant_id;
    const userId = params.p_user_id;
    const isActive = params.p_is_active;
    if (!isSystemAdmin && !isTenantOwner(tenantId)) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin hoặc chủ sở hữu mới được cập nhật trạng thái thành viên' } };
    }
    const member = store.tenant_memberships.find(m => m.tenant_id === tenantId && m.user_id === userId);
    if (!member) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    member.is_active = isActive;
    member.updated_at = new Date().toISOString();
    return { data: member, error: null };
  }

  // P15: API keys + webhooks
  if (name === 'create_tenant_api_key') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo API key' } };
    }
    const tenant = store.tenants.find((t: any) => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const pName = params.p_name ? String(params.p_name).trim() : '';
    if (!pName) {
      return { data: null, error: { code: '23514', message: 'Tên API key không được để trống' } };
    }
    const now = new Date().toISOString();
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const row = {
      id: uuid(),
      tenant_id: params.p_tenant_id,
      name: pName,
      api_key_hash: `sha256-${token}`,
      api_key_preview: token.slice(-4),
      version: params.p_version ?? 1,
      status: 'active',
      created_by: currentUserId,
      revoked_at: null,
      revoked_by: null,
      last_used_at: null,
      created_at: now,
      updated_at: now,
    };
    store.tenant_api_keys.push(row);
    return {
      data: {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        apiKey: token,
        apiKeyPreview: row.api_key_preview,
        version: row.version,
        status: row.status,
        createdAt: row.created_at,
        lastUsedAt: row.last_used_at,
      },
      error: null,
    };
  }

  if (name === 'create_tenant_webhook') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo webhook' } };
    }
    const tenant = store.tenants.find((t: any) => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const pName = params.p_name ? String(params.p_name).trim() : '';
    if (!pName) {
      return { data: null, error: { code: '23514', message: 'Tên webhook không được để trống' } };
    }
    const pUrl = params.p_url ? String(params.p_url).trim() : '';
    if (!pUrl) {
      return { data: null, error: { code: '23514', message: 'URL webhook không được để trống' } };
    }
    if (!/^https?:\/\//.test(pUrl)) {
      return { data: null, error: { code: '23514', message: 'URL webhook phải bắt đầu bằng http:// hoặc https://' } };
    }
    const now = new Date().toISOString();
    const row = {
      id: uuid(),
      tenant_id: params.p_tenant_id,
      name: pName,
      url: pUrl,
      events: params.p_events ?? ['*'],
      secret: params.p_secret ?? null,
      status: 'active',
      created_by: currentUserId,
      created_at: now,
      updated_at: now,
    };
    store.tenant_webhooks.push(row);
    return {
      data: {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        url: row.url,
        events: row.events,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      error: null,
    };
  }

  if (name === 'delete_tenant_webhook') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xóa webhook' } };
    }
    const idx = store.tenant_webhooks.findIndex((w: any) => w.id === params.p_webhook_id);
    if (idx < 0) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const id = store.tenant_webhooks[idx].id;
    store.tenant_webhooks.splice(idx, 1);
    return { data: { id, deleted: true }, error: null };
  }

  if (name === 'list_tenant_api_keys') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem API key' } };
    }
    const rows = store.tenant_api_keys
      .filter((k: any) => k.tenant_id === params.p_tenant_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((k: any) => ({
        id: k.id,
        tenantId: k.tenant_id,
        name: k.name,
        apiKeyPreview: k.api_key_preview,
        version: k.version,
        status: k.status,
        createdBy: k.created_by,
        revokedAt: k.revoked_at,
        revokedBy: k.revoked_by,
        lastUsedAt: k.last_used_at,
        createdAt: k.created_at,
        updatedAt: k.updated_at,
      }));
    return { data: rows, error: null };
  }

  if (name === 'list_tenant_webhooks') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem webhook' } };
    }
    const rows = store.tenant_webhooks
      .filter((w: any) => w.tenant_id === params.p_tenant_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((w: any) => ({
        id: w.id,
        tenantId: w.tenant_id,
        name: w.name,
        url: w.url,
        events: w.events,
        status: w.status,
        createdBy: w.created_by,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      }));
    return { data: rows, error: null };
  }

  if (name === 'list_webhook_deliveries') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem delivery log' } };
    }
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    const all = store.webhook_deliveries
      .filter((d: any) => d.webhook_id === params.p_webhook_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const rows = all.slice(offset, offset + limit).map((d: any) => ({
      id: d.id,
      webhookId: d.webhook_id,
      tenantId: d.tenant_id,
      eventType: d.event_type,
      payload: d.payload,
      idempotencyKey: d.idempotency_key,
      status: d.status,
      httpStatus: d.http_status,
      responseBody: d.response_body,
      errorMessage: d.error_message,
      attemptCount: d.attempt_count,
      maxAttempts: d.max_attempts,
      attemptedAt: d.attempted_at,
      deliveredAt: d.delivered_at,
      nextRetryAt: d.next_retry_at,
      attemptLog: d.attempt_log,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
    return { data: { data: rows, count: all.length }, error: null };
  }

  if (name === 'retry_webhook_delivery') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được retry webhook' } };
    }
    const row = store.webhook_deliveries.find(
      (d: any) => d.id === params.p_delivery_id && ['failed', 'exhausted'].includes(d.status)
    );
    if (!row) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const now = new Date().toISOString();
    row.status = 'pending';
    row.next_retry_at = now;
    row.updated_at = now;
    return {
      data: { id: row.id, status: row.status, attemptCount: row.attempt_count, nextRetryAt: row.next_retry_at },
      error: null,
    };
  }

  if (name === 'revoke_tenant_api_key') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được thu hồi API key' } };
    }
    const row = store.tenant_api_keys.find((k: any) => k.id === params.p_key_id);
    if (!row) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const now = new Date().toISOString();
    row.status = 'revoked';
    row.revoked_at = now;
    row.revoked_by = currentUserId;
    row.updated_at = now;
    return { data: row, error: null };
  }

  if (name === 'trigger_webhook_event') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được trigger webhook event' } };
    }
    if (!params.p_tenant_id || !params.p_event_type) {
      return { data: null, error: { code: '23514', message: 'Thiếu tenant_id hoặc event_type' } };
    }
    const webhooks = store.tenant_webhooks.filter(
      (w: any) =>
        w.tenant_id === params.p_tenant_id &&
        w.status === 'active' &&
        (w.events.includes('*') || w.events.includes(params.p_event_type))
    );
    if (webhooks.length === 0) {
      return { data: { enqueued: 0, deliveries: [] }, error: null };
    }
    const now = new Date().toISOString();
    const rootKey = params.p_idempotency_key || `${params.p_tenant_id}:${params.p_event_type}:${uuid()}`;
    const deliveries: any[] = [];
    for (const webhook of webhooks) {
      const idempotencyKey = `${rootKey}:${webhook.id}`;
      if (store.webhook_deliveries.some((d: any) => d.idempotency_key === idempotencyKey)) continue;
      const row = {
        id: uuid(),
        webhook_id: webhook.id,
        tenant_id: params.p_tenant_id,
        event_type: params.p_event_type,
        payload: params.p_payload ?? {},
        idempotency_key: idempotencyKey,
        status: 'pending',
        http_status: null,
        response_body: null,
        error_message: null,
        attempt_count: 0,
        max_attempts: 5,
        attempted_at: null,
        delivered_at: null,
        next_retry_at: now,
        attempt_log: [],
        created_at: now,
        updated_at: now,
      };
      store.webhook_deliveries.push(row);
      deliveries.push({ id: row.id, webhook_id: row.webhook_id, idempotency_key: row.idempotency_key, status: row.status });
    }
    return { data: { enqueued: deliveries.length, deliveries }, error: null };
  }

  if (name === 'update_tenant_webhook') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được cập nhật webhook' } };
    }
    const row = store.tenant_webhooks.find((w: any) => w.id === params.p_webhook_id);
    if (!row) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    if (params.p_name !== null && params.p_name !== undefined) row.name = String(params.p_name).trim();
    if (params.p_url !== null && params.p_url !== undefined) row.url = String(params.p_url).trim();
    if (params.p_events !== null && params.p_events !== undefined) row.events = params.p_events;
    if (params.p_secret !== null && params.p_secret !== undefined) row.secret = params.p_secret;
    if (params.p_status !== null && params.p_status !== undefined) row.status = params.p_status;
    row.updated_at = new Date().toISOString();
    return {
      data: {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        url: row.url,
        events: row.events,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      error: null,
    };
  }

  // P17.3 + P17.4: GDPR requests, terms acceptance, tenant/user data export/deletion
  if (name === 'record_terms_acceptance') {
    if (!params.p_user_id) {
      return { data: null, error: { code: '23514', message: 'Thiếu user_id' } };
    }
    if (
      params.p_terms_type !== null &&
      params.p_terms_type !== undefined &&
      !['tos', 'privacy', 'gdpr', 'cookie', 'custom'].includes(params.p_terms_type)
    ) {
      return { data: null, error: { code: '23514', message: 'terms_type không hợp lệ' } };
    }
    const user = store.users.find((u: any) => u.id === params.p_user_id);
    if (!user) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    if (params.p_user_id !== currentUserId && !isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Không được ghi nhận chấp thuận điều khoản cho người khác' } };
    }
    const now = new Date().toISOString();
    const trimmedType = typeof params.p_terms_type === 'string' ? params.p_terms_type.trim() : '';
    const trimmedVersion = typeof params.p_terms_version === 'string' ? params.p_terms_version.trim() : '';
    const trimmedIp = typeof params.p_ip_address === 'string' ? params.p_ip_address.trim() : '';
    const trimmedUa = typeof params.p_user_agent === 'string' ? params.p_user_agent.trim() : '';
    const row = {
      id: uuid(),
      user_id: params.p_user_id,
      tenant_id: params.p_tenant_id ?? null,
      terms_version: trimmedVersion || '1.0',
      terms_type: trimmedType || 'tos',
      ip_address: trimmedIp || null,
      user_agent: trimmedUa || null,
      metadata: params.p_metadata ?? {},
      accepted_at: now,
      created_at: now,
      updated_at: now,
    };
    store.terms_acceptance.push(row);
    return { data: row.id, error: null };
  }

  if (name === 'get_terms_acceptances') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem terms acceptance log' } };
    }
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    const all = store.terms_acceptance
      .filter(
        (a: any) =>
          (params.p_tenant_id === null || params.p_tenant_id === undefined || a.tenant_id === params.p_tenant_id) &&
          (params.p_terms_type === null || params.p_terms_type === undefined || a.terms_type === params.p_terms_type)
      )
      .sort((a: any, b: any) => new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime());
    const data = all.slice(offset, offset + limit).map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      tenant_id: a.tenant_id,
      terms_version: a.terms_version,
      terms_type: a.terms_type,
      accepted_at: a.accepted_at,
      ip_address: a.ip_address,
      user_agent: a.user_agent,
      metadata: a.metadata,
      created_at: a.created_at,
    }));
    return { data: { data, count: all.length }, error: null };
  }

  if (name === 'export_tenant_data') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được export dữ liệu tenant' } };
    }
    if (!params.p_tenant_id) {
      return { data: null, error: { code: '23514', message: 'Thiếu tenant_id' } };
    }
    const tenant = store.tenants.find((t: any) => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const subscription = store.tenant_subscriptions.find((s: any) => s.tenant_id === params.p_tenant_id) ?? {};
    const members = store.tenant_memberships
      .filter((m: any) => m.tenant_id === params.p_tenant_id)
      .map((m: any) => {
        const u = store.users.find((u: any) => u.id === m.user_id);
        return {
          id: m.id,
          tenant_id: m.tenant_id,
          user_id: m.user_id,
          role: m.role,
          invited_by: m.invited_by,
          created_at: m.created_at,
          updated_at: m.updated_at,
          email: u?.email ?? null,
        };
      });
    const excludedTables = new Set([
      'tenants',
      'tenant_memberships',
      'tenant_subscriptions',
      'system_admins',
      'admin_login_history',
      'admin_2fa_backup_codes',
      'terms_acceptance',
    ]);
    const tables: any[] = [];
    for (const tableName of Object.keys(store)) {
      if (excludedTables.has(tableName)) continue;
      const rows = store[tableName];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      if (!Object.prototype.hasOwnProperty.call(rows[0], 'tenant_id')) continue;
      const filtered = rows.filter((r: any) => r.tenant_id === params.p_tenant_id);
      tables.push({ table_name: tableName, row_count: filtered.length, rows: filtered });
    }
    return {
      data: {
        tenant,
        subscription,
        members,
        tables,
        exported_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  if (name === 'create_gdpr_request') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo GDPR request' } };
    }
    if (!params.p_user_id) {
      return { data: null, error: { code: '23514', message: 'Thiếu user_id' } };
    }
    if (!['export', 'deletion'].includes(params.p_type)) {
      return { data: null, error: { code: '23514', message: 'type phải là export hoặc deletion' } };
    }
    const user = store.users.find((u: any) => u.id === params.p_user_id);
    if (!user) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const now = new Date().toISOString();
    const trimmedReason = typeof params.p_reason === 'string' ? params.p_reason.trim() : '';
    const row = {
      id: uuid(),
      user_id: params.p_user_id,
      type: params.p_type,
      reason: trimmedReason || null,
      status: 'pending',
      dry_run: params.p_dry_run ?? false,
      result_data: null,
      result_url: null,
      requested_by: currentUserId,
      created_at: now,
      completed_at: null,
    };
    store.gdpr_requests.push(row);
    return { data: row.id, error: null };
  }

  if (name === 'get_gdpr_requests') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem GDPR requests' } };
    }
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    const all = store.gdpr_requests
      .filter(
        (r: any) =>
          (params.p_status === null || params.p_status === undefined || r.status === params.p_status) &&
          (params.p_type === null || params.p_type === undefined || r.type === params.p_type)
      )
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const data = all.slice(offset, offset + limit).map((r: any) => {
      const u = store.users.find((u: any) => u.id === r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        type: r.type,
        reason: r.reason,
        status: r.status,
        dry_run: r.dry_run,
        result_url: r.result_url,
        created_at: r.created_at,
        completed_at: r.completed_at,
        user_email: u?.email ?? null,
      };
    });
    return { data: { data, count: all.length }, error: null };
  }

  if (name === 'gdpr_export_user_data') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được export dữ liệu user' } };
    }
    if (!params.p_user_id) {
      return { data: null, error: { code: '23514', message: 'Thiếu user_id' } };
    }
    const user = store.users.find((u: any) => u.id === params.p_user_id);
    if (!user) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const profile = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      raw_user_meta_data: user.raw_user_meta_data ?? {},
    };
    const memberships = store.tenant_memberships
      .filter((m: any) => m.user_id === params.p_user_id)
      .map((m: any) => {
        const t = store.tenants.find((t: any) => t.id === m.tenant_id);
        if (!t) return null;
        return {
          id: m.id,
          tenant_id: m.tenant_id,
          role: m.role,
          status: m.status,
          invited_by: m.invited_by,
          created_at: m.created_at,
          updated_at: m.updated_at,
          tenant_name: t.name,
          tenant_subdomain: t.subdomain,
        };
      })
      .filter(Boolean);
    const payments = store.payments
      .filter((p: any) => p.created_by === params.p_user_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p: any) => ({
        id: p.id,
        tenant_id: p.tenant_id,
        invoice_id: p.invoice_id,
        amount: p.amount,
        payment_method: p.payment_method,
        payment_date: p.payment_date,
        reference_code: p.reference_code,
        status: p.status,
        notes: p.notes,
        created_at: p.created_at,
      }));
    const audit_log = store.audit_log
      .filter((a: any) => a.actor_id === params.p_user_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((a: any) => ({
        id: a.id,
        tenant_id: a.tenant_id,
        action: a.action,
        entity_type: a.entity_type,
        entity_id: a.entity_id,
        old_data: a.old_data,
        new_data: a.new_data,
        ip_address: a.ip_address,
        created_at: a.created_at,
      }));
    const admin_login_history = store.admin_login_history
      .filter((h: any) => h.user_id === params.p_user_id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((h: any) => ({
        id: h.id,
        email: h.email,
        ip_address: h.ip_address,
        user_agent: h.user_agent,
        status: h.status,
        failure_reason: h.failure_reason,
        created_at: h.created_at,
      }));
    const terms_acceptance = store.terms_acceptance
      .filter((a: any) => a.user_id === params.p_user_id)
      .sort((a: any, b: any) => new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime())
      .map((a: any) => ({
        id: a.id,
        tenant_id: a.tenant_id,
        terms_version: a.terms_version,
        terms_type: a.terms_type,
        accepted_at: a.accepted_at,
        ip_address: a.ip_address,
        user_agent: a.user_agent,
        metadata: a.metadata,
      }));
    return {
      data: {
        profile,
        memberships,
        payments,
        audit_log,
        admin_login_history,
        terms_acceptance,
        exported_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  if (name === 'gdpr_delete_user_data') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xóa dữ liệu user' } };
    }
    if (!params.p_user_id) {
      return { data: null, error: { code: '23514', message: 'Thiếu user_id' } };
    }
    const user = store.users.find((u: any) => u.id === params.p_user_id);
    if (!user) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const request_id = uuid();
    const userId = params.p_user_id;
    const membershipCount = store.tenant_memberships.filter((m: any) => m.user_id === userId).length;
    const termsCount = store.terms_acceptance.filter((a: any) => a.user_id === userId).length;
    const paymentCount = store.payments.filter((p: any) => p.created_by === userId).length;
    const auditCount = store.audit_log.filter((a: any) => a.actor_id === userId).length;
    const loginCount = store.admin_login_history.filter((h: any) => h.user_id === userId).length;
    const planned_actions = [
      { table: 'auth.users', action: 'anonymize', columns: ['email', 'raw_user_meta_data'] },
      { table: 'public.tenant_memberships', action: 'delete', row_count: membershipCount },
      { table: 'public.terms_acceptance', action: 'delete', row_count: termsCount },
      { table: 'public.payments', action: 'anonymize', column: 'created_by', row_count: paymentCount },
      { table: 'public.audit_log', action: 'delete', row_count: auditCount },
      { table: 'public.admin_login_history', action: 'delete', row_count: loginCount },
    ];
    if (params.p_dry_run !== false) {
      return { data: { dry_run: true, request_id, user_id: userId, planned_actions }, error: null };
    }
    const now = new Date().toISOString();
    user.email = `deleted-${userId}@anon.local`;
    user.raw_user_meta_data = {};
    user.encrypted_password = null;
    user.email_confirmed_at = null;
    user.confirmation_token = null;
    user.recovery_token = null;
    user.email_change_token_new = null;
    user.email_change = null;
    user.phone = null;
    user.phone_confirmed_at = null;
    store.gdpr_deletion_logs.push({ id: uuid(), request_id, user_id: userId, action: 'anonymize_auth_user', details: { user_id: userId }, created_at: now });
    store.tenant_memberships = store.tenant_memberships.filter((m: any) => m.user_id !== userId);
    store.gdpr_deletion_logs.push({ id: uuid(), request_id, user_id: userId, action: 'delete_memberships', details: { user_id: userId }, created_at: now });
    store.terms_acceptance = store.terms_acceptance.filter((a: any) => a.user_id !== userId);
    store.gdpr_deletion_logs.push({ id: uuid(), request_id, user_id: userId, action: 'delete_terms_acceptance', details: { user_id: userId }, created_at: now });
    for (const p of store.payments) {
      if (p.created_by === userId) p.created_by = null;
    }
    store.gdpr_deletion_logs.push({ id: uuid(), request_id, user_id: userId, action: 'anonymize_payments', details: { user_id: userId }, created_at: now });
    store.audit_log = store.audit_log.filter((a: any) => a.actor_id !== userId);
    store.gdpr_deletion_logs.push({ id: uuid(), request_id, user_id: userId, action: 'delete_audit_log', details: { user_id: userId }, created_at: now });
    store.admin_login_history = store.admin_login_history.filter((h: any) => h.user_id !== userId);
    store.gdpr_deletion_logs.push({ id: uuid(), request_id, user_id: userId, action: 'delete_login_history', details: { user_id: userId }, created_at: now });
    return {
      data: {
        dry_run: false,
        request_id,
        user_id: userId,
        executed_actions: planned_actions,
        deleted_at: now,
      },
      error: null,
    };
  }

  // P12.3: notification log in-app messages
  if (name === 'send_in_app_message') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được gửi tin nhắn in-app' } };
    }
    if (!params.p_tenant_id || !params.p_title || !params.p_content) {
      return { data: null, error: { code: '23514', message: 'Thiếu tenant_id, title hoặc content' } };
    }
    const now = new Date().toISOString();
    const row = {
      id: uuid(),
      tenant_id: params.p_tenant_id,
      channel: 'in_app',
      title: String(params.p_title).trim(),
      content: String(params.p_content).trim(),
      status: 'sent',
      error_message: null,
      metadata: params.p_metadata ?? null,
      sent_by: currentUserId,
      created_at: now,
      updated_at: now,
    };
    store.notification_logs.push(row);
    return { data: row, error: null };
  }

  if (name === 'get_in_app_messages_for_tenant') {
    const v_tenant_id = params.p_tenant_id ?? currentTenantId;
    if (!v_tenant_id) {
      return { data: [], error: null };
    }
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    const all = store.notification_logs
      .filter((n: any) => n.tenant_id === v_tenant_id && n.channel === 'in_app')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const data = all.slice(offset, offset + limit);
    return { data, error: null };
  }

  if (name === 'mark_in_app_message_read') {
    const v_tenant_id = params.p_tenant_id ?? currentTenantId;
    if (!v_tenant_id) {
      return { data: false, error: null };
    }
    const row = store.notification_logs.find(
      (n: any) =>
        n.id === params.p_log_id &&
        n.tenant_id === v_tenant_id &&
        n.channel === 'in_app' &&
        n.status !== 'read'
    );
    if (!row) {
      return { data: false, error: null };
    }
    row.status = 'read';
    row.updated_at = new Date().toISOString();
    return { data: true, error: null };
  }

  if (name === 'validate_promo_code') {
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: { valid: false, error: 'Không tìm thấy tenant' }, error: null };

    const promo = store.promo_codes.find(p => p.code === params.p_code);
    if (!promo) return { data: { valid: false, error: 'Mã voucher không tồn tại' }, error: null };

    const today = new Date().toISOString().slice(0, 10);
    if (!promo.is_active) {
      return { data: { valid: false, error: 'Mã voucher đã bị vô hiệu hóa' }, error: null };
    }
    if (promo.valid_from && promo.valid_from.slice(0, 10) > today) {
      return { data: { valid: false, error: 'Mã voucher chưa có hiệu lực' }, error: null };
    }
    if (promo.valid_until && promo.valid_until.slice(0, 10) < today) {
      return { data: { valid: false, error: 'Mã voucher đã hết hạn' }, error: null };
    }

    const subtotal = Number(params.p_invoice_subtotal ?? 0);
    if (Number(promo.min_invoice_amount ?? 0) > 0 && subtotal < Number(promo.min_invoice_amount)) {
      return { data: { valid: false, error: 'Hóa đơn chưa đạt giá trị tối thiểu' }, error: null };
    }

    const totalUsed = store.promo_code_usages.filter(u => u.promo_code_id === promo.id).length;
    if (promo.max_uses_total !== null && promo.max_uses_total !== undefined && totalUsed >= promo.max_uses_total) {
      return { data: { valid: false, error: 'Mã voucher đã hết lượt sử dụng' }, error: null };
    }

    const tenantUsed = store.promo_code_usages.filter(
      u => u.promo_code_id === promo.id && u.tenant_id === params.p_tenant_id
    ).length;
    if (promo.max_uses_per_tenant !== null && promo.max_uses_per_tenant !== undefined && tenantUsed >= promo.max_uses_per_tenant) {
      return { data: { valid: false, error: 'Tenant đã sử dụng hết lượt voucher' }, error: null };
    }

    const conditions = promo.target_conditions || {};
    if (conditions.tenant_age_days !== undefined) {
      const ageDays = Math.floor(
        (new Date(today).getTime() - new Date(tenant.created_at.slice(0, 10)).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (ageDays > Number(conditions.tenant_age_days)) {
        return { data: { valid: false, error: 'Tenant không đủ điều kiện độ tuổi' }, error: null };
      }
    }
    if (conditions.plan !== undefined && tenant.plan !== conditions.plan) {
      return { data: { valid: false, error: 'Voucher không áp dụng cho gói hiện tại' }, error: null };
    }
    if (conditions.tenant_ids !== undefined && Array.isArray(conditions.tenant_ids) && !conditions.tenant_ids.includes(params.p_tenant_id)) {
      return { data: { valid: false, error: 'Tenant không nằm trong danh sách áp dụng' }, error: null };
    }

    return {
      data: {
        valid: true,
        promo_code_id: promo.id,
        kind: promo.kind,
        discount_value: promo.discount_value,
        max_discount_amount: promo.max_discount_amount,
      },
      error: null,
    };
  }

  if (name === 'get_promo_code_usage_counts') {
    const usages = store.promo_code_usages.filter(u => u.promo_code_id === params.p_promo_code_id);
    const perTenant: Record<string, number> = {};
    for (const u of usages) {
      perTenant[u.tenant_id] = (perTenant[u.tenant_id] || 0) + 1;
    }
    return { data: { total: usages.length, per_tenant: perTenant }, error: null };
  }

  if (name === 'apply_voucher_to_invoice') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được áp dụng voucher' } };
    }
    const invoice = store.invoices.find(i => i.id === params.p_invoice_id);
    if (!invoice) {
      return { data: { success: false, error: 'Không tìm thấy hóa đơn' }, error: null };
    }
    if (!['draft', 'pending'].includes(invoice.status)) {
      return { data: { success: false, error: 'Hóa đơn không ở trạng thái chờ thanh toán' }, error: null };
    }
    if (store.promo_code_usages.some(u => u.invoice_id === params.p_invoice_id)) {
      return { data: { success: false, error: 'Hóa đơn đã áp dụng voucher' }, error: null };
    }
    const tenant = store.tenants.find(t => t.id === invoice.tenant_id);
    if (!tenant) {
      return { data: { success: false, error: 'Không tìm thấy tenant' }, error: null };
    }

    const validation = await (rpc as any)('validate_promo_code', {
      p_code: params.p_code,
      p_tenant_id: invoice.tenant_id,
      p_invoice_subtotal: invoice.subtotal,
    });
    if (!validation.data?.valid) {
      return { data: { success: false, error: validation.data?.error || 'Áp dụng voucher thất bại' }, error: null };
    }

    const promo = store.promo_codes.find(p => p.code === params.p_code);
    if (!promo) {
      return { data: { success: false, error: 'Mã voucher không tồn tại' }, error: null };
    }

    const subtotal = Number(invoice.subtotal ?? 0);
    let discount = 0;
    if (promo.kind === 'percentage') {
      discount = subtotal * Number(promo.discount_value) / 100;
      if (promo.max_discount_amount !== null && promo.max_discount_amount !== undefined && discount > Number(promo.max_discount_amount)) {
        discount = Number(promo.max_discount_amount);
      }
    } else {
      discount = Number(promo.discount_value);
    }
    if (discount > subtotal) discount = subtotal;
    if (discount < 0) discount = 0;
    discount = Math.round(discount * 100) / 100;

    const positiveItems = store.invoice_items
      .filter(it => it.invoice_id === params.p_invoice_id && Number(it.unit_price) > 0)
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    let cycleType = 'monthly';
    if (positiveItems.length > 0 && Number(positiveItems[0].unit_price) === 59000) {
      cycleType = 'yearly';
    }

    const today = new Date().toISOString().slice(0, 10);
    let bonusMonths = 0;
    const activeRules = store.promotion_rules
      .filter(r => r.is_active && r.benefit_type === 'bonus_months')
      .filter(r => (!r.valid_from || r.valid_from.slice(0, 10) <= today) && (!r.valid_until || r.valid_until.slice(0, 10) >= today))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    for (const rule of activeRules) {
      let matches = false;
      const conditionType = rule.condition_type;
      const conditionValue = rule.condition_value || {};
      if (conditionType === 'always') {
        matches = true;
      } else if (conditionType === 'tenant_age_days') {
        const ageDays = Math.floor(
          (new Date(today).getTime() - new Date(tenant.created_at.slice(0, 10)).getTime()) / (1000 * 60 * 60 * 24)
        );
        matches = ageDays <= Number(conditionValue.age_days ?? 0);
      } else if (conditionType === 'plan') {
        matches = tenant.plan === conditionValue.plan;
      } else if (conditionType === 'specific_tenant') {
        matches = conditionValue.tenant_id === invoice.tenant_id;
      } else if (conditionType === 'cycle_type') {
        matches = cycleType === conditionValue.cycle_type;
      }
      if (matches) {
        bonusMonths += Number(rule.benefit_value ?? 0);
      }
    }

    const total = Math.max(0, subtotal - discount);
    invoice.discount = discount;
    invoice.total = total;
    invoice.updated_at = new Date().toISOString();

    if (bonusMonths > 0 && invoice.period_end) {
      const invoiceEnd = invoice.period_end.slice(0, 10);
      const tenantExpires = tenant.expires_at ? tenant.expires_at.slice(0, 10) : invoiceEnd;
      const baseDate = invoiceEnd >= tenantExpires ? invoiceEnd : tenantExpires;
      invoice.period_end = addMonths(baseDate, bonusMonths);
    }

    if (bonusMonths > 0) {
      store.invoice_items.push({
        id: uuid(),
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
        description: 'Tháng tặng (promotion)',
        quantity: bonusMonths,
        unit_price: 0,
        amount: 0,
        created_at: new Date().toISOString(),
      });
    }

    const usageId = uuid();
    store.promo_code_usages.push({
      id: usageId,
      promo_code_id: promo.id,
      tenant_id: invoice.tenant_id,
      invoice_id: invoice.id,
      used_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    return {
      data: {
        success: true,
        invoice_id: invoice.id,
        promo_code_id: promo.id,
        code: promo.code,
        discount,
        bonus_months: bonusMonths,
        total,
        period_end: invoice.period_end,
        usage_id: usageId,
      },
      error: null,
    };
  }

  // ========== Domain A — Auth, Identity & Security (Recovery Package-01) ==========

  if (name === 'can_use_feature') {
    const sub = store.tenant_subscriptions.find(s => s.tenant_id === params.p_tenant_id);
    if (!sub) return { data: false, error: null };
    const plan = getPlan(sub.plan);
    if (!plan) return { data: false, error: null };
    return { data: true, error: null };
  }

  if (name === 'has_tenant_role') {
    if (!currentUserId) return { data: false, error: null };
    const member = store.tenant_memberships.find(
      m => m.tenant_id === params.p_tenant_id && m.user_id === currentUserId
    );
    return { data: member?.role === params.p_role, error: null };
  }

  if (name === 'is_system_admin') {
    return { data: isSystemAdmin, error: null };
  }

  if (name === 'is_tenant_owner') {
    if (!currentUserId) return { data: false, error: null };
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    return { data: tenant?.owner_id === currentUserId, error: null };
  }

  if (name === 'get_tenant_by_subdomain') {
    const tenant = store.tenants.find(t => t.subdomain === params.p_subdomain) ?? null;
    return { data: tenant, error: null };
  }

  if (name === 'is_2fa_enabled') {
    // ponytail: mock store không có auth.mfa_factors; mặc định false.
    return { data: false, error: null };
  }

  if (name === 'generate_2fa_backup_codes') {
    const userId = params.p_user_id;
    if (!userId) return { data: null, error: { code: '23514', message: 'Thiếu user_id' } };
    // Xóa code cũ chưa dùng
    store.admin_2fa_backup_codes = store.admin_2fa_backup_codes.filter(
      (c: any) => c.user_id !== userId || c.used_at !== null
    );
    const count = Math.max(1, Math.min(params.p_count ?? 10, 20));
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = uuid().replace(/-/g, '').toUpperCase().slice(0, 16);
      codes.push(code);
      store.admin_2fa_backup_codes.push({
        id: uuid(),
        user_id: userId,
        code_hash: `sha256-${code}`,
        used_at: null,
        created_at: new Date().toISOString(),
      });
    }
    return { data: { user_id: userId, codes }, error: null };
  }

  if (name === 'list_2fa_backup_codes') {
    const userId = params.p_user_id;
    if (!userId) return { data: [], error: null };
    const rows = store.admin_2fa_backup_codes
      .filter((c: any) => c.user_id === userId && c.used_at === null)
      .map((c: any) => ({ id: c.id, createdAt: c.created_at }));
    return { data: rows, error: null };
  }

  if (name === 'delete_2fa_backup_codes') {
    const userId = params.p_user_id;
    if (!userId) return { data: null, error: null };
    store.admin_2fa_backup_codes = store.admin_2fa_backup_codes.filter(
      (c: any) => c.user_id !== userId
    );
    return { data: null, error: null };
  }

  if (name === 'verify_2fa_backup_code') {
    const userId = params.p_user_id;
    const code = params.p_code;
    if (!userId || !code) return { data: { valid: false, code_id: null }, error: null };
    // Rate-limit: tối đa 5 lần thất bại trong 15 phút
    const recentFails = store.admin_2fa_backup_codes.filter(
      (c: any) => c.user_id === userId && c.failed_at &&
        new Date(c.failed_at).getTime() > Date.now() - 15 * 60 * 1000
    ).length;
    if (recentFails >= 5) {
      return { data: { valid: false, code_id: null }, error: null };
    }
    const match = store.admin_2fa_backup_codes.find(
      (c: any) => c.user_id === userId && c.code_hash === `sha256-${code}` && c.used_at === null
    );
    if (!match) {
      // Ghi lại lần thất bại
      store.admin_2fa_backup_codes.push({
        id: uuid(),
        user_id: userId,
        code_hash: `sha256-${code}`,
        used_at: null,
        failed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      return { data: { valid: false, code_id: null }, error: null };
    }
    match.used_at = new Date().toISOString();
    return { data: { valid: true, code_id: match.id }, error: null };
  }

  if (name === 'record_login_attempt') {
    const row = {
      id: uuid(),
      email: (params.p_email || '').toLowerCase().trim(),
      ip_address: params.p_ip_address || '',
      success: params.p_success ?? false,
      attempted_at: new Date().toISOString(),
    };
    store.login_attempts.push(row);
    return { data: row.id, error: null };
  }

  if (name === 'get_login_attempts') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem login attempts' } };
    }
    const email = params.p_email ? (params.p_email as string).toLowerCase().trim() : null;
    let rows = store.login_attempts.slice();
    if (email) rows = rows.filter((r: any) => r.email === email);
    rows.sort((a: any, b: any) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime());
    const count = rows.length;
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    const paged = rows.slice(offset, offset + limit).map((r: any) => ({
      id: r.id,
      email: r.email,
      ip_address: r.ip_address,
      success: r.success,
      attempted_at: r.attempted_at,
    }));
    return { data: { data: paged, count }, error: null };
  }

  if (name === 'get_locked_emails') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem danh sách bị khóa' } };
    }
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const emailMap: Record<string, { failed: number; lastAttempt: string }> = {};
    for (const a of store.login_attempts) {
      if (a.success || a.attempted_at < cutoff) continue;
      if (!emailMap[a.email]) emailMap[a.email] = { failed: 0, lastAttempt: a.attempted_at };
      emailMap[a.email].failed++;
      if (a.attempted_at > emailMap[a.email].lastAttempt) emailMap[a.email].lastAttempt = a.attempted_at;
    }
    const locked = Object.entries(emailMap)
      .filter(([_, v]) => v.failed >= 5)
      .map(([email, v]) => ({ email, failed_count: v.failed, last_attempt: v.lastAttempt }));
    return { data: locked, error: null };
  }

  if (name === 'unlock_login_attempts') {
    const email = (params.p_email || '').toLowerCase().trim();
    store.login_attempts = store.login_attempts.filter((r: any) => r.email !== email);
    return { data: null, error: null };
  }

  if (name === 'get_tenant_security_settings') {
    if (!isSystemAdmin && !isTenantMember(params.p_tenant_id)) {
      return { data: null, error: { code: '42501', message: 'Không đủ quyền xem cấu hình bảo mật' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    const settings = tenant?.settings || {};
    return {
      data: {
        tenant_id: params.p_tenant_id,
        allowed_ips: settings.allowed_ips || [],
        session_timeout_minutes: settings.session_timeout_minutes ?? 60,
      },
      error: null,
    };
  }

  if (name === 'update_tenant_ip_allowlist') {
    if (!isSystemAdmin && !isTenantMember(params.p_tenant_id)) {
      return { data: null, error: { code: '42501', message: 'Không đủ quyền cập nhật IP allowlist' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    tenant.settings = { ...(tenant.settings || {}), allowed_ips: params.p_allowed_ips || [] };
    tenant.updated_at = new Date().toISOString();
    return { data: null, error: null };
  }

  if (name === 'update_tenant_session_timeout') {
    if (!isSystemAdmin && !isTenantMember(params.p_tenant_id)) {
      return { data: null, error: { code: '42501', message: 'Không đủ quyền cập nhật thời gian timeout' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
    const minutes = Math.max(5, Math.min(params.p_minutes ?? 60, 1440));
    tenant.settings = { ...(tenant.settings || {}), session_timeout_minutes: minutes };
    tenant.updated_at = new Date().toISOString();
    return { data: null, error: null };
  }

  if (name === 'record_admin_login') {
    const userId = params.p_user_id;
    if (!userId) return { data: null, error: null };
    // Chỉ ghi nếu user là system admin, or failed + lookup
    if (params.p_status === 'success' && !store.system_admins.some((s: any) => s.user_id === userId)) {
      return { data: null, error: null };
    }
    const row = {
      id: uuid(),
      user_id: userId,
      email: params.p_email || null,
      ip_address: params.p_ip_address || null,
      user_agent: params.p_user_agent || null,
      status: params.p_status || 'success',
      failure_reason: params.p_failure_reason || null,
      created_at: new Date().toISOString(),
    };
    store.admin_login_history.push(row);
    return { data: row.id, error: null };
  }

  if (name === 'get_admin_login_history') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem login history' } };
    }
    let rows = store.admin_login_history.slice();
    if (params.p_status) rows = rows.filter((r: any) => r.status === params.p_status);
    if (params.p_date_from) {
      const from = new Date(params.p_date_from).getTime();
      rows = rows.filter((r: any) => new Date(r.created_at).getTime() >= from);
    }
    if (params.p_date_to) {
      const to = new Date(params.p_date_to).getTime();
      rows = rows.filter((r: any) => new Date(r.created_at).getTime() <= to);
    }
    rows.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const count = rows.length;
    const limit = params.p_limit ?? 50;
    const offset = params.p_offset ?? 0;
    const paged = rows.slice(offset, offset + limit).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      email: r.email,
      ip_address: r.ip_address,
      user_agent: r.user_agent,
      status: r.status,
      failure_reason: r.failure_reason,
      created_at: r.created_at,
    }));
    return { data: { data: paged, count }, error: null };
  }

  if (name === 'get_admin_login_alerts') {
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem login alerts' } };
    }
    const hoursAgo = params.p_hours_ago ?? 24;
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    const recent = store.admin_login_history.filter((r: any) => r.created_at >= cutoff);

    // failed_burst: >=3 failures trong 15 phút theo user
    const failedBurst: any[] = [];
    const failedByUser: Record<string, any[]> = {};
    for (const r of recent) {
      if (r.status !== 'failed') continue;
      if (!failedByUser[r.user_id]) failedByUser[r.user_id] = [];
      failedByUser[r.user_id].push(r);
    }
    for (const [uid, attempts] of Object.entries(failedByUser)) {
      for (let i = 0; i < attempts.length; i++) {
        const windowStart = new Date(attempts[i].created_at).getTime();
        const inWindow = attempts.filter(
          (a: any) => new Date(a.created_at).getTime() >= windowStart && new Date(a.created_at).getTime() <= windowStart + 15 * 60 * 1000
        );
        if (inWindow.length >= 3) {
          failedBurst.push({
            user_id: uid,
            email: inWindow[0].email,
            ip_address: inWindow[0].ip_address,
            failed_count: inWindow.length,
            window_start: inWindow[0].created_at,
            window_end: inWindow[inWindow.length - 1].created_at,
          });
          break;
        }
      }
    }

    // rapid_login: >=3 success trong 15 phút
    const rapidLogin: any[] = [];
    const successByUser: Record<string, any[]> = {};
    for (const r of recent) {
      if (r.status !== 'success') continue;
      if (!successByUser[r.user_id]) successByUser[r.user_id] = [];
      successByUser[r.user_id].push(r);
    }
    for (const [uid, attempts] of Object.entries(successByUser)) {
      for (let i = 0; i < attempts.length; i++) {
        const windowStart = new Date(attempts[i].created_at).getTime();
        const inWindow = attempts.filter(
          (a: any) => new Date(a.created_at).getTime() >= windowStart && new Date(a.created_at).getTime() <= windowStart + 15 * 60 * 1000
        );
        if (inWindow.length >= 3) {
          rapidLogin.push({
            user_id: uid,
            email: inWindow[0].email,
            success_count: inWindow.length,
            window_start: inWindow[0].created_at,
            window_end: inWindow[inWindow.length - 1].created_at,
          });
          break;
        }
      }
    }

    return {
      data: {
        failed_burst: failedBurst,
        new_device: [],
        rapid_login: rapidLogin,
      },
      error: null,
    };
  }

  // ========== End Domain A ==========

  // ========== Domain B — Tenant Administration & Licensing (Recovery Domain B) ==========

  if (name === 'generate_tenant_license') {
    // Canonical: 20260720000001_sp_7_3_licenses.sql:37 — RETURNS public.licenses (single row)
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được tạo license' } };
    }
    const tenant = store.tenants.find(t => t.id === params.p_tenant_id);
    if (!tenant) {
      return { data: null, error: { code: 'PGRST116', message: 'Tenant không tồn tại' } };
    }
    const key = crypto.randomUUID().replace(/-/g, '').toUpperCase() + crypto.randomUUID().replace(/-/g, '').toUpperCase();
    const now = new Date().toISOString();
    const license = {
      id: crypto.randomUUID(),
      tenant_id: params.p_tenant_id,
      license_key: key,
      plan: params.p_plan,
      max_users: params.p_max_users ?? 0,
      max_products: params.p_max_products ?? 0,
      max_orders_per_month: params.p_max_orders_per_month ?? 0,
      expires_at: params.p_expires_at ?? null,
      is_active: true,
      revoked_at: null,
      created_at: now,
      updated_at: now,
    };
    store.licenses.push(license);
    // ponytail: omits audit_log INSERT side effect (audit_log table not under test;
    //           upgrade: push to store.audit_log when a license-audit test is added)
    return { data: license, error: null };
  }

  if (name === 'validate_tenant_license') {
    // Canonical: 20260720000001_sp_7_3_licenses.sql:106 — RETURNS TABLE(valid BOOLEAN, license_id UUID, tenant_id UUID, plan TEXT, reason TEXT)
    const key = (params.p_license_key || '').toUpperCase();
    const license = store.licenses.find((l: any) => l.license_key === key);
    if (!license) {
      return { data: { valid: false, license_id: null, tenant_id: null, plan: null, reason: 'not_found' }, error: null };
    }
    if (license.revoked_at || !license.is_active) {
      return { data: { valid: false, license_id: license.id, tenant_id: license.tenant_id, plan: license.plan, reason: 'revoked' }, error: null };
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return { data: { valid: false, license_id: license.id, tenant_id: license.tenant_id, plan: license.plan, reason: 'expired' }, error: null };
    }
    return { data: { valid: true, license_id: license.id, tenant_id: license.tenant_id, plan: license.plan, reason: null }, error: null };
  }

  if (name === 'lookup_invitation') {
    // Canonical: 20260714000001_accept_invitation_rpc.sql:17 — RETURNS TABLE(tenant_id, tenant_name, tenant_subdomain, tenant_custom_domain, role, email, active, expired)
    const token = params.p_token;
    const invitation = store.invitations.find((i: any) => i.token === token);
    if (!invitation) return { data: [], error: null };
    const tenant = store.tenants.find(t => t.id === invitation.tenant_id);
    if (!tenant) return { data: [], error: null };
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    const row = {
      tenant_id: invitation.tenant_id,
      tenant_name: tenant.name,
      tenant_subdomain: tenant.subdomain,
      tenant_custom_domain: tenant.custom_domain ?? null,
      role: invitation.role,
      email: invitation.email,
      active: invitation.status === 'pending' && expiresAt > now,
      expired: expiresAt <= now,
    };
    return { data: [row], error: null };
  }

  if (name === 'accept_invitation') {
    // Canonical: 20260714000001_accept_invitation_rpc.sql:53 — RETURNS public.tenant_memberships (single row)
    // Full guard chain: auth.uid(), existence, status='pending', not expired, email match, no duplicate membership
    if (!currentUserId) {
      return { data: null, error: { code: '42501', message: 'Yêu cầu đăng nhập' } };
    }
    const token = params.p_token;
    const invitation = store.invitations.find((i: any) => i.token === token);
    if (!invitation) {
      return { data: null, error: { code: 'PGRST116', message: 'Lời mời không tồn tại' } };
    }
    if (invitation.status !== 'pending') {
      return { data: null, error: { code: '23514', message: 'Lời mời đã được sử dụng hoặc đã bị thu hồi' } };
    }
    if (new Date(invitation.expires_at) <= new Date()) {
      return { data: null, error: { code: '23514', message: 'Lời mời đã hết hạn' } };
    }
    const currentUser = store.users.find((u: any) => u.id === currentUserId);
    const userEmail = currentUser?.email || '';
    if (userEmail.toLowerCase() !== invitation.email.toLowerCase()) {
      return { data: null, error: { code: '42501', message: 'Email đăng nhập không khớp với email được mời' } };
    }
    const existingMembership = store.tenant_memberships.find(
      (m: any) => m.tenant_id === invitation.tenant_id && m.user_id === currentUserId
    );
    if (existingMembership) {
      return { data: null, error: { code: '23505', message: 'Bạn đã là thành viên của tenant này' } };
    }
    const now = new Date().toISOString();
    const membership = {
      id: crypto.randomUUID(),
      tenant_id: invitation.tenant_id,
      user_id: currentUserId,
      role: invitation.role,
      status: 'active',
      is_active: true,
      invited_by: invitation.created_by ?? null,
      invited_at: invitation.created_at ?? now,
      accepted_at: now,
      email: invitation.email,
      created_at: now,
      updated_at: now,
    };
    store.tenant_memberships.push(membership);
    // Update invitation status
    const invIdx = store.invitations.findIndex((i: any) => i.id === invitation.id);
    if (invIdx >= 0) {
      store.invitations[invIdx].status = 'accepted';
      store.invitations[invIdx].updated_at = now;
    }
    // ponytail: omits app_audit_log INSERT side effect
    return { data: membership, error: null };
  }

  if (name === 'get_revenue_metrics') {
    // Canonical: 20250708000010_phase_p16_1_revenue_metrics.sql:4 — RETURNS JSON
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem revenue metrics' } };
    }
    const today = new Date().toISOString().slice(0, 10);
    const start = params.p_start_date ?? (today.slice(0, 7) + '-01');
    const end = params.p_end_date ?? today;
    // MRR = sum of monthly_price for active/read_only tenants on paid plans
    let mrr = 0;
    for (const t of store.tenants) {
      if (!['active', 'read_only'].includes(t.status)) continue;
      const plan = store.plans.find((p: any) => p.key === t.plan);
      if (plan && plan.monthly_price > 0) mrr += plan.monthly_price;
    }
    const arr = mrr * 12;
    // Revenue by plan from confirmed payments in range
    const revenueByPlan: Record<string, any> = {};
    let totalRevenue = 0;
    for (const p of store.payments) {
      if (p.status !== 'confirmed') continue;
      if (p.payment_date < start || p.payment_date > end) continue;
      const tenant = store.tenants.find((t: any) => t.id === p.tenant_id);
      const planKey = tenant?.plan || 'unknown';
      if (!revenueByPlan[planKey]) {
        const plan = store.plans.find((pl: any) => pl.key === planKey);
        revenueByPlan[planKey] = { plan: planKey, plan_name: plan?.name || planKey, revenue: 0, payment_count: 0 };
      }
      revenueByPlan[planKey].revenue += p.amount;
      revenueByPlan[planKey].payment_count += 1;
      totalRevenue += p.amount;
    }
    const revenueByPlanArr = Object.values(revenueByPlan).sort((a: any, b: any) => b.revenue - a.revenue);
    return {
      data: {
        mrr,
        arr,
        total_revenue: totalRevenue,
        revenue_by_plan: revenueByPlanArr,
        period_start: start,
        period_end: end,
      },
      error: null,
    };
  }

  if (name === 'get_churn_cohort_metrics') {
    // Canonical: 20250708000011_phase_p16_2_churn_cohort.sql:5 — RETURNS JSON
    if (!isSystemAdmin) {
      return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được xem churn/cohort metrics' } };
    }
    const today = new Date().toISOString().slice(0, 10);
    const end = params.p_end_date ?? today;
    const start = params.p_start_date ?? (new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const cohortMonths = params.p_cohort_months ?? 12;

    // Churn snapshot
    const activeStart = store.tenants.filter((t: any) => new Date(t.created_at) < new Date(start)).length;
    const activeEnd = store.tenants.filter((t: any) => {
      if (new Date(t.created_at) >= new Date(start)) return false;
      if (!['active', 'trial', 'read_only'].includes(t.status)) return false;
      const sub = store.tenant_subscriptions.find((s: any) => s.tenant_id === t.id);
      return !sub || sub.billing_status !== 'cancelled';
    }).length;
    const churned = activeStart - activeEnd;
    const churnRate = activeStart > 0 ? Number(((churned / activeStart) * 100).toFixed(2)) : 0;

    // LTV
    let totalRevenue = 0;
    const payingTenants = new Set<string>();
    for (const p of store.payments) {
      if (p.status !== 'confirmed') continue;
      totalRevenue += p.amount;
      payingTenants.add(p.tenant_id);
    }
    const payingTenantCount = payingTenants.size;
    const avgLtv = payingTenantCount > 0 ? Number((totalRevenue / payingTenantCount).toFixed(2)) : 0;

    // LTV by plan
    const ltvByPlan: Record<string, any> = {};
    for (const p of store.payments) {
      if (p.status !== 'confirmed') continue;
      const tenant = store.tenants.find((t: any) => t.id === p.tenant_id);
      const planKey = tenant?.plan || 'unknown';
      if (!ltvByPlan[planKey]) {
        const plan = store.plans.find((pl: any) => pl.key === planKey);
        ltvByPlan[planKey] = { plan: planKey, plan_name: plan?.name || planKey, revenue: 0, tenants: new Set<string>() };
      }
      ltvByPlan[planKey].revenue += p.amount;
      ltvByPlan[planKey].tenants.add(p.tenant_id);
    }
    const ltvByPlanArr = Object.entries(ltvByPlan).map(([key, val]: [string, any]) => ({
      plan: key,
      plan_name: val.plan_name,
      revenue: val.revenue,
      tenants: val.tenants.size,
      ltv: val.tenants.size > 0 ? Number((val.revenue / val.tenants.size).toFixed(2)) : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // Funnel
    const payingTenantIds = new Set(
      store.payments.filter((p: any) => p.status === 'confirmed').map((p: any) => p.tenant_id)
    );
    let trial = 0, activeFree = 0, paying = 0, churnedFunnel = 0;
    for (const t of store.tenants) {
      const sub = store.tenant_subscriptions.find((s: any) => s.tenant_id === t.id);
      const isCancelled = sub?.billing_status === 'cancelled';
      if (t.status === 'trial') trial++;
      else if (t.status === 'active' && !payingTenantIds.has(t.id) && !isCancelled) activeFree++;
      else if (['active', 'read_only'].includes(t.status) && payingTenantIds.has(t.id) && !isCancelled) paying++;
      else if (['suspended', 'archived'].includes(t.status) || isCancelled) churnedFunnel++;
    }

    // Cohort conversion-to-paid (simplified single-pass)
    const cohortMap: Record<string, { total: number; converted: Set<string> }> = {};
    for (const t of store.tenants) {
      const cohort = t.created_at.slice(0, 7);
      if (!cohortMap[cohort]) cohortMap[cohort] = { total: 0, converted: new Set() };
      cohortMap[cohort].total++;
    }
    for (const p of store.payments) {
      if (p.status !== 'confirmed') continue;
      const tenant = store.tenants.find((t: any) => t.id === p.tenant_id);
      if (!tenant) continue;
      const cohort = tenant.created_at.slice(0, 7);
      if (!cohortMap[cohort]) continue;
      cohortMap[cohort].converted.add(p.tenant_id);
    }
    const cohortsArr = Object.entries(cohortMap)
      .filter(([month]) => month >= start.slice(0, 7))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        total: data.total,
        retention: [{
          month,
          conversionRate: data.total > 0 ? Number(((data.converted.size / data.total) * 100).toFixed(2)) : 0,
        }],
      }));

    // Months series
    const months: string[] = [];
    const cohortStart = new Date(start.slice(0, 7) + '-01');
    const endDate = new Date(end.slice(0, 7) + '-01');
    for (const d = new Date(cohortStart); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      months.push(d.toISOString().slice(0, 7));
    }

    return {
      data: {
        churn: {
          active_start: activeStart,
          active_end: activeEnd,
          churned_count: churned,
          churn_rate: churnRate,
          period_start: start,
          period_end: end,
        },
        cohort: {
          months,
          cohorts: cohortsArr,
        },
        ltv: {
          average_ltv: avgLtv,
          total_revenue: totalRevenue,
          paying_tenants: payingTenantCount,
          by_plan: ltvByPlanArr,
        },
        funnel: {
          trial,
          active_free: activeFree,
          paying,
          churned: churnedFunnel,
        },
      },
      error: null,
    };
  }

  // ========== End Domain B ==========

  // ========== Domain H1 — Products & Catalog (Recovery Domain H1) ==========

  // ponytail: shared 23-column product row builder for search_products_rpc / get_product_by_barcode
  // Canonical source: 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql (latest definition)
  // Columns: id, name, display_name, code (= products.sku), barcode, price, cost, quantity, unit, location,
  //          category, brand, image, min_stock, max_stock, safety_stock, is_point_accumulation_enabled,
  //          conversion_units, created_at, has_lots, category_id, brand_id, product_lots
  const buildProductRow = (p: any) => {
    const lots = (store.product_lots ?? [])
      .filter((pl: any) => pl.product_id === p.id)
      .sort((a: any, b: any) => {
        const aExp = a.expiry_date || '';
        const bExp = b.expiry_date || '';
        if (aExp !== bExp) return aExp < bExp ? -1 : 1;
        const aCrt = a.created_at || '';
        const bCrt = b.created_at || '';
        return aCrt < bCrt ? -1 : 1;
      });
    return {
      id: p.id,
      name: p.name ?? '',
      display_name: p.display_name ?? p.name ?? '',
      code: p.sku ?? p.code ?? '',
      barcode: p.barcode ?? '',
      price: p.price ?? 0,
      cost: p.cost ?? 0,
      quantity: p.quantity ?? 0,
      unit: p.unit ?? '',
      location: p.location ?? '',
      category: p.category ?? '',
      brand: p.brand ?? '',
      image: p.image ?? '',
      min_stock: p.min_stock ?? 0,
      max_stock: p.max_stock ?? 0,
      safety_stock: p.safety_stock ?? 0,
      is_point_accumulation_enabled: p.is_point_accumulation_enabled ?? false,
      conversion_units: p.conversion_units ?? null,
      created_at: p.created_at ?? new Date().toISOString(),
      has_lots: (lots.length > 0) || (p.has_lots ?? false),
      category_id: p.category_id ?? '',
      brand_id: p.brand_id ?? '',
      product_lots: lots,
    };
  };

  if (name === 'check_product_barcode_exists') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:3276 — RETURNS BOOLEAN
    const barcode = params.p_barcode;
    if (!barcode) return { data: false, error: null };
    const exists = store.products.some((p: any) => p.barcode === barcode);
    return { data: exists, error: null };
  }

  if (name === 'check_product_code_exists') {
    // Canonical: 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql:82 — RETURNS BOOLEAN (checks products.sku)
    const code = params.p_code;
    if (!code) return { data: false, error: null };
    const exists = store.products.some((p: any) => p.sku === code);
    return { data: exists, error: null };
  }

  if (name === 'get_product_by_barcode') {
    // Canonical: 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql:284 — RETURNS TABLE (23 columns)
    const barcode = params.p_barcode;
    if (!barcode) return { data: [], error: null };
    const product = store.products.find((p: any) => p.barcode === barcode);
    if (!product) return { data: [], error: null };
    return { data: [buildProductRow(product)], error: null };
  }

  if (name === 'get_product_stats') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:8084 — RETURNS JSON
    const all = store.products ?? [];
    const total = all.length;
    const active = all.filter((p: any) => p.status === 'active' || !p.status).length;
    const lowStock = all.filter((p: any) => {
      const qty = Number(p.quantity ?? 0);
      const min = Number(p.min_stock ?? 0);
      return min > 0 && qty > 0 && qty <= min;
    }).length;
    const outOfStock = all.filter((p: any) => Number(p.quantity ?? 0) === 0).length;
    const inventoryValue = all.reduce((sum: number, p: any) => sum + (Number(p.quantity ?? 0) * Number(p.cost ?? 0)), 0);
    return { data: { total, active, lowStock, outOfStock, inventoryValue }, error: null };
  }

  if (name === 'get_brand_product_counts') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:6698 — RETURNS JSON
    const brands = store.brands ?? [];
    const counts = brands.map((b: any) => {
      const count = store.products.filter((p: any) => p.brand_id === b.id || p.brand === b.name).length;
      return { id: b.id, name: b.name, product_count: count };
    });
    return { data: counts, error: null };
  }

  if (name === 'get_category_product_counts') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:6717 — RETURNS JSON
    const categories = store.categories ?? [];
    const counts = categories.map((c: any) => {
      const count = store.products.filter((p: any) => p.category_id === c.id || p.category === c.name).length;
      return { id: c.id, name: c.name, product_count: count };
    });
    return { data: counts, error: null };
  }

  if (name === 'get_unsynced_brands') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:9603 — RETURNS JSON
    // Finds product brands not yet present in store.brands
    const knownBrandNames = new Set((store.brands ?? []).map((b: any) => b.name?.toLowerCase().trim()));
    const productBrands = new Set(
      store.products
        .map((p: any) => p.brand?.toLowerCase().trim())
        .filter(Boolean)
    );
    const unsynced = [...productBrands].filter(name => !knownBrandNames.has(name));
    return { data: unsynced.map(name => ({ name })), error: null };
  }

  if (name === 'get_unsynced_categories') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:9624 — RETURNS JSON
    // Finds product categories not yet present in store.categories
    const knownCategoryNames = new Set((store.categories ?? []).map((c: any) => c.name?.toLowerCase().trim()));
    const productCategories = new Set(
      store.products
        .map((p: any) => p.category?.toLowerCase().trim())
        .filter(Boolean)
    );
    const unsynced = [...productCategories].filter(name => !knownCategoryNames.has(name));
    return { data: unsynced.map(name => ({ name })), error: null };
  }

  if (name === 'count_point_products') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:3822 — RETURNS INTEGER
    const count = store.products.filter((p: any) => p.is_point_accumulation_enabled === true).length;
    return { data: count, error: null };
  }

  if (name === 'search_products_rpc') {
    // Canonical: 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql:231 — RETURNS TABLE (23 columns)
    const term = (params.p_search_term || '').toLowerCase();
    const limit = params.p_limit ?? 100;
    let matches = store.products ?? [];
    if (term) {
      matches = matches.filter((p: any) =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term) ||
        (p.barcode || '').toLowerCase().includes(term)
      );
    }
    matches = matches.slice(0, limit);
    return { data: matches.map((p: any) => buildProductRow(p)), error: null };
  }

  if (name === 'filter_products_rpc') {
    // Canonical: 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql:346 — RETURNS JSON (8-arg overload, superset of 7-arg)
    // One handler covers both overloads; 7-arg delegates to 8-arg in canonical SQL.
    let rows = store.products ?? [];
    const search = (params.p_search_term || '').toLowerCase();
    if (search) {
      rows = rows.filter((p: any) =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.sku || '').toLowerCase().includes(search) ||
        (p.barcode || '').toLowerCase().includes(search)
      );
    }
    if (params.p_category_id) {
      rows = rows.filter((p: any) => p.category_id === params.p_category_id);
    }
    if (params.p_brand_id) {
      rows = rows.filter((p: any) => p.brand_id === params.p_brand_id);
    }
    if (params.p_stock_status) {
      if (params.p_stock_status === 'in_stock') {
        rows = rows.filter((p: any) => Number(p.quantity ?? 0) > 0);
      } else if (params.p_stock_status === 'out_of_stock') {
        rows = rows.filter((p: any) => Number(p.quantity ?? 0) === 0);
      } else if (params.p_stock_status === 'low_stock') {
        rows = rows.filter((p: any) => {
          const qty = Number(p.quantity ?? 0);
          const min = Number(p.min_stock ?? 0);
          return min > 0 && qty > 0 && qty <= min;
        });
      }
    }
    const totalCount = rows.length;
    const sortBy = params.p_sort_by ?? 'created_at';
    const sortOrder = params.p_sort_order ?? 'desc';
    const sortMult = sortOrder === 'asc' ? 1 : -1;
    rows.sort((a: any, b: any) => {
      let av = a[sortBy] ?? '';
      let bv = b[sortBy] ?? '';
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      }
      if (typeof av === 'string' && typeof bv === 'string') return sortMult * av.localeCompare(bv);
      return sortMult * (av > bv ? 1 : av < bv ? -1 : 0);
    });
    const page = params.p_page ?? 1;
    const pageSize = params.p_page_size ?? 20;
    const start = (page - 1) * pageSize;
    const paged = rows.slice(start, start + pageSize);
    return { data: { products: paged.map((p: any) => buildProductRow(p)), totalCount }, error: null };
  }

  // ========== End Domain H1 ==========

  // ========== Domain H2 — Inventory & Stock (Recovery Wave-02) ==========

  if (name === 'cancel_inventory_count_rpc') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:2782 — RETURNS void
    const count = store.inventory_counts.find((c: any) => c.id === params.p_count_id);
    if (!count) return { data: null, error: { code: 'P0001', message: 'Phiếu kiểm kê không tồn tại' } };
    if (count.status === 'cancelled') return { data: null, error: { code: 'P0001', message: 'Phiếu kiểm kê đã bị hủy trước đó' } };
    if (count.status === 'completed') {
      // Reverse stock deltas + write reverse ledger entries
      for (const item of store.inventory_count_items.filter((i: any) => i.count_id === count.id)) {
        const diff = (item.actual_quantity ?? 0) - (item.system_quantity ?? 0);
        if (diff === 0) continue;
        const product = store.products.find((p: any) => p.id === item.product_id);
        if (product && !product.has_lots) {
          product.quantity = Number(product.quantity ?? 0) - diff;
        } else if (product && item.lot_id) {
          const lot = store.product_lots.find((pl: any) => pl.id === item.lot_id);
          if (lot) lot.quantity = Math.max(0, Number(lot.quantity ?? 0) - diff);
        }
        store.stock_movements.push({
          id: uuid(),
          posting_date: new Date().toISOString(),
          voucher_type: 'Stock Reconciliation',
          voucher_no: count.code ?? count.id,
          voucher_detail_no: item.id,
          product_id: item.product_id,
          lot_id: item.lot_id ?? null,
          warehouse: 'Kho Chính',
          actual_qty: -diff,
          qty_after_transaction: 0,
          valuation_rate: 0,
          incoming_rate: 0,
          outgoing_rate: 0,
          stock_value: 0,
          balance_value: 0,
          reason: item.reason ?? 'Hủy phiếu kiểm kê',
          is_cancelled: true,
          created_at: new Date().toISOString(),
        });
      }
    }
    count.status = 'cancelled';
    count.completed_at = null;
    return { data: null, error: null };
  }

  if (name === 'complete_inventory_count') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:3531 — RETURNS void
    if (!params.p_count_id) return { data: null, error: { code: 'P0001', message: 'Mã phiếu kiểm kê không hợp lệ' } };
    const count = store.inventory_counts.find((c: any) => c.id === params.p_count_id);
    if (!count) return { data: null, error: { code: 'P0001', message: 'Phiếu kiểm kê không tồn tại' } };
    if (count.status === 'completed') return { data: null, error: { code: 'P0001', message: 'Phiếu kiểm kê đã được hoàn thành trước đó' } };
    if (count.status === 'cancelled') return { data: null, error: { code: 'P0001', message: 'Phiếu kiểm kê đã bị hủy, không thể hoàn thành' } };
    const items = store.inventory_count_items.filter((i: any) => i.count_id === count.id);
    for (const item of items) {
      if (item.actual_quantity == null) return { data: null, error: { code: 'P0001', message: 'Số lượng thực tế chưa nhập' } };
      if (item.actual_quantity < 0) return { data: null, error: { code: 'P0001', message: 'Số lượng thực tế không được âm' } };
      const product = store.products.find((p: any) => p.id === item.product_id);
      if (!product) return { data: null, error: { code: 'P0001', message: 'Sản phẩm không tồn tại' } };
      let currentQty: number;
      if (!product.has_lots) {
        currentQty = Number(product.quantity ?? 0);
        const delta = Number(item.actual_quantity) - currentQty;
        product.quantity = Number(product.quantity ?? 0) + delta;
        item.system_quantity = currentQty;
        if (delta !== 0) {
          store.stock_movements.push({
            id: uuid(), posting_date: new Date().toISOString(), voucher_type: 'Stock Reconciliation',
            voucher_no: count.code ?? count.id, voucher_detail_no: item.id, product_id: item.product_id,
            lot_id: null, warehouse: 'Kho Chính', actual_qty: delta, qty_after_transaction: product.quantity,
            valuation_rate: 0, incoming_rate: 0, outgoing_rate: 0, stock_value: 0, balance_value: 0,
            reason: item.reason ?? 'Hoàn thành kiểm kê', is_cancelled: false, created_at: new Date().toISOString(),
          });
        }
      } else if (item.lot_id) {
        const lot = store.product_lots.find((pl: any) => pl.id === item.lot_id);
        currentQty = Number(lot?.quantity ?? 0);
        const delta = Number(item.actual_quantity) - currentQty;
        if (lot) lot.quantity = Number(lot.quantity ?? 0) + delta;
        item.system_quantity = currentQty;
        if (delta !== 0) {
          store.stock_movements.push({
            id: uuid(), posting_date: new Date().toISOString(), voucher_type: 'Stock Reconciliation',
            voucher_no: count.code ?? count.id, voucher_detail_no: item.id, product_id: item.product_id,
            lot_id: item.lot_id, warehouse: 'Kho Chính', actual_qty: delta, qty_after_transaction: lot?.quantity ?? 0,
            valuation_rate: 0, incoming_rate: 0, outgoing_rate: 0, stock_value: 0, balance_value: 0,
            reason: item.reason ?? 'Hoàn thành kiểm kê', is_cancelled: false, created_at: new Date().toISOString(),
          });
        }
      }
    }
    count.status = 'completed';
    count.completed_at = new Date().toISOString();
    return { data: null, error: null };
  }

  if (name === 'delete_inventory_count_rpc') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:5571 — RETURNS void
    const count = store.inventory_counts.find((c: any) => c.id === params.p_count_id);
    if (!count) return { data: null, error: { code: 'P0001', message: 'Phiếu kiểm kê không tồn tại' } };
    if (count.status === 'completed') return { data: null, error: { code: 'P0001', message: 'Không thể xóa hẳn phiếu kiểm kê đã hoàn thành' } };
    if (!['draft', 'cancelled'].includes(count.status)) return { data: null, error: { code: 'P0001', message: 'Chỉ được xóa hẳn phiếu kiểm kê ở trạng thái draft hoặc cancelled' } };
    store.inventory_count_items = store.inventory_count_items.filter((i: any) => i.count_id !== params.p_count_id);
    store.inventory_counts = store.inventory_counts.filter((c: any) => c.id !== params.p_count_id);
    return { data: null, error: null };
  }

  if (name === 'get_stock_ledger') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:8923 — RETURNS TABLE
    let rows = store.stock_movements ?? [];
    if (params.p_product_id) rows = rows.filter((r: any) => r.product_id === params.p_product_id);
    if (params.p_lot_id) rows = rows.filter((r: any) => r.lot_id === params.p_lot_id);
    if (params.p_voucher_type) rows = rows.filter((r: any) => r.voucher_type === params.p_voucher_type);
    if (params.p_from_date) rows = rows.filter((r: any) => new Date(r.posting_date) >= new Date(params.p_from_date));
    if (params.p_to_date) rows = rows.filter((r: any) => new Date(r.posting_date) <= new Date(params.p_to_date));
    if (params.p_is_cancelled !== null && params.p_is_cancelled !== undefined) rows = rows.filter((r: any) => r.is_cancelled === params.p_is_cancelled);
    rows = rows.slice().sort((a: any, b: any) => {
      const pa = new Date(a.posting_date).getTime();
      const pb = new Date(b.posting_date).getTime();
      if (pa !== pb) return pa < pb ? -1 : 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    const limit = params.p_limit ?? 1000;
    const offset = params.p_offset ?? 0;
    const paged = rows.slice(offset, offset + limit).map((r: any) => {
      const product = store.products.find((p: any) => p.id === r.product_id);
      const lot = store.product_lots.find((pl: any) => pl.id === r.lot_id);
      return {
        id: r.id,
        posting_date: r.posting_date,
        voucher_type: r.voucher_type,
        voucher_no: r.voucher_no,
        voucher_detail_no: r.voucher_detail_no,
        product_id: r.product_id,
        product_name: product?.name ?? null,
        lot_id: r.lot_id,
        lot_code: lot?.code ?? null,
        warehouse: r.warehouse,
        actual_qty: r.actual_qty,
        qty_after_transaction: r.qty_after_transaction,
        valuation_rate: r.valuation_rate,
        incoming_rate: r.incoming_rate,
        outgoing_rate: r.outgoing_rate,
        stock_value: r.stock_value,
        balance_value: r.balance_value,
        reason: r.reason,
        is_cancelled: r.is_cancelled,
        created_at: r.created_at,
      };
    });
    return { data: paged, error: null };
  }

  if (name === 'check_stock_ledger_drift') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:3346 — RETURNS TABLE
    const lotTotals: Record<string, number> = {};
    for (const pl of store.product_lots ?? []) {
      lotTotals[pl.product_id] = (lotTotals[pl.product_id] ?? 0) + Number(pl.quantity ?? 0);
    }
    const movementTotals: Record<string, number> = {};
    for (const sm of store.stock_movements ?? []) {
      if (sm.is_cancelled) continue;
      movementTotals[sm.product_id] = (movementTotals[sm.product_id] ?? 0) + Number(sm.actual_qty ?? 0);
    }
    const drift: any[] = [];
    for (const p of store.products ?? []) {
      const pq = Number(p.quantity ?? 0);
      const ls = lotTotals[p.id] ?? null;
      const ms = movementTotals[p.id] ?? null;
      if (p.has_lots) {
        if (pq !== (ls ?? 0) || pq !== (ms ?? 0) || (ls ?? 0) !== (ms ?? 0)) {
          drift.push({ product_id: p.id, lot_id: null, products_quantity: pq, lot_sum: ls, movement_sum: ms, diff: pq - (ms ?? 0) });
        }
      } else if (pq !== (ms ?? 0)) {
        drift.push({ product_id: p.id, lot_id: null, products_quantity: pq, lot_sum: null, movement_sum: ms, diff: pq - (ms ?? 0) });
      }
    }
    return { data: drift, error: null };
  }

  if (name === 'increment_product_quantity') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:9693 — RETURNS void
    const product = store.products.find((p: any) => p.id === params.p_product_id);
    if (product) {
      product.quantity = Number(product.quantity ?? 0) + Number(params.p_quantity ?? 0);
    }
    return { data: null, error: null };
  }

  if (name === 'get_inventory_report') {
    // Canonical: 20250705000000_phase5_3_rls_policies_remaining_tables_unique_indexes.sql:90 — RETURNS json
    const category = params.p_category ?? '';
    const stockStatus = params.p_stock_status ?? 'all';
    const startDate = params.p_start_date;
    const endDate = params.p_end_date;
    let products = store.products ?? [];
    if (category) products = products.filter((p: any) => p.category === category);
    const productValues: Record<string, { total_value: number; total_qty: number }> = {};
    for (const p of products) {
      const lots = (store.product_lots ?? []).filter((pl: any) => pl.product_id === p.id);
      if (lots.length > 0) {
        const totalValue = lots.reduce((s: number, pl: any) => s + Number(pl.quantity ?? 0) * Number(pl.cost ?? 0), 0);
        const totalQty = lots.reduce((s: number, pl: any) => s + Number(pl.quantity ?? 0), 0);
        productValues[p.id] = { total_value: totalValue, total_qty: totalQty };
      } else {
        productValues[p.id] = { total_value: Number(p.quantity ?? 0) * Number(p.cost ?? 0), total_qty: Number(p.quantity ?? 0) };
      }
    }
    const returnedByProduct: Record<string, number> = {};
    for (const ro of store.return_orders ?? []) {
      if (ro.status === 'cancelled') continue;
      for (const roi of store.return_order_items ?? []) {
        if (roi.return_order_id !== ro.id) continue;
        returnedByProduct[roi.product_id] = (returnedByProduct[roi.product_id] ?? 0) + Number(roi.quantity ?? 0);
      }
    }
    const summary = {
      totalValue: products.reduce((s: number, p: any) => s + productValues[p.id].total_value, 0),
      totalQty: products.reduce((s: number, p: any) => s + productValues[p.id].total_qty, 0),
      lowStockCount: products.filter((p: any) => Number(p.quantity ?? 0) > 0 && p.min_stock != null && Number(p.quantity) <= Number(p.min_stock)).length,
      outOfStockCount: products.filter((p: any) => Number(p.quantity ?? 0) <= 0).length,
    };
    const inventoryByCategory: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category || 'Chưa phân loại';
      inventoryByCategory[cat] = (inventoryByCategory[cat] ?? 0) + productValues[p.id].total_value;
    }
    const exportInPeriod: any[] = [];
    const exportByProduct: Record<string, { product_id: string; name: string; qty: number; value: number }> = {};
    for (const o of store.orders ?? []) {
      if (o.status === 'cancelled') continue;
      const d = new Date(o.date);
      if (startDate && d < new Date(startDate)) continue;
      if (endDate && d > new Date(endDate)) continue;
      for (const oi of store.order_items ?? []) {
        if (oi.order_id !== o.id) continue;
        const returned = returnedByProduct[oi.product_id] ?? 0;
        const netQty = Math.max(0, Number(oi.quantity ?? 0) - returned);
        const product = store.products.find((p: any) => p.id === oi.product_id);
        const cost = Number(oi.cost ?? product?.cost ?? 0);
        if (!exportByProduct[oi.product_id]) {
          exportByProduct[oi.product_id] = { product_id: oi.product_id, name: oi.product_name ?? 'Không xác định', qty: 0, value: 0 };
        }
        exportByProduct[oi.product_id].qty += netQty;
        exportByProduct[oi.product_id].value += netQty * cost;
      }
    }
    for (const k of Object.keys(exportByProduct)) exportInPeriod.push(exportByProduct[k]);
    exportInPeriod.sort((a, b) => b.qty - a.qty);
    const lowStockProducts = products
      .filter((p: any) => Number(p.quantity ?? 0) <= Number(p.min_stock ?? 5))
      .map((p: any) => ({
        id: p.id, code: p.sku ?? p.code ?? '', name: p.name, category: p.category ?? '',
        unit: p.unit ?? '', quantity: Number(p.quantity ?? 0), min_stock: Number(p.min_stock ?? 5),
        cost: Number(p.cost ?? 0), value: productValues[p.id].total_value,
      }))
      .sort((a, b) => a.quantity - b.quantity);
    const productsFiltered = products
      .filter((p: any) => {
        if (stockStatus === 'all') return true;
        if (stockStatus === 'in') return Number(p.quantity) > Number(p.min_stock ?? 5);
        if (stockStatus === 'low') return Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.min_stock ?? 5);
        if (stockStatus === 'out') return Number(p.quantity ?? 0) <= 0;
        return true;
      })
      .map((p: any) => ({
        id: p.id, code: p.sku ?? p.code ?? '', name: p.name, category: p.category ?? '',
        unit: p.unit ?? '', quantity: Number(p.quantity ?? 0), min_stock: Number(p.min_stock ?? 5),
        cost: Number(p.cost ?? 0), value: productValues[p.id].total_value,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const categories = Array.from(new Set(products.map((p: any) => (p.category || '').trim()).filter(Boolean)));
    return {
      data: {
        summary,
        inventoryByCategory: Object.entries(inventoryByCategory).map(([name, value]) => ({ name, value })),
        exportInPeriod,
        lowStockProducts,
        products: productsFiltered,
        categories,
      },
      error: null,
    };
  }

  // ========== End Domain H2 ==========

  // ========== Domain H3 — Orders & Sales (Recovery Wave-02) ==========

  if (name === 'cancel_order') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:2883 — RETURNS jsonb
    if (!params.p_order_id) return { data: null, error: { code: 'P0001', message: 'order_id is required' } };
    const order = store.orders.find((o: any) => o.id === params.p_order_id);
    if (!order) return { data: null, error: { code: 'P0001', message: `Đơn hàng ${params.p_order_id} không tồn tại` } };
    if (order.status === 'cancelled') return { data: null, error: { code: 'P0001', message: `Đơn hàng ${params.p_order_id} đã ở trạng thái Đã huỷ` } };
    const activeReturns = (store.return_orders ?? []).filter((r: any) => r.original_order_id === params.p_order_id && r.status !== 'cancelled').length;
    if (activeReturns > 0) return { data: null, error: { code: 'P0001', message: `Đơn hàng đã có ${activeReturns} phiếu trả còn hiệu lực` } };
    // Restore stock
    for (const item of store.order_items.filter((i: any) => i.order_id === params.p_order_id)) {
      const product = store.products.find((p: any) => p.id === item.product_id);
      if (!product) continue;
      const ratio = 1; // ponytail: ignore unit conversion in mock (sales side already base unit)
      const baseQty = Number(item.quantity ?? 0) * ratio;
      if (product.has_lots && item.lot_id) {
        const lot = store.product_lots.find((pl: any) => pl.id === item.lot_id);
        if (lot) lot.quantity = Number(lot.quantity ?? 0) + baseQty;
      } else {
        product.quantity = Number(product.quantity ?? 0) + baseQty;
      }
    }
    // Reverse customer aggregates
    if (order.customer_id && order.customer_id !== 'guest') {
      const customer = store.customers.find((c: any) => c.id === order.customer_id);
      if (customer) {
        customer.total_spent = Math.max(0, Number(customer.total_spent ?? 0) - Number(order.total_amount ?? 0));
        customer.debt = Math.max(0, Number(customer.debt ?? 0) - Number(order.debt_recorded ?? 0));
        const pointsDiff = Number(order.points_redeemed ?? 0) - Number(order.points_earned ?? 0);
        customer.loyalty_points = Math.max(0, Number(customer.loyalty_points ?? 0) + pointsDiff);
        if (Number(order.debt_recorded ?? 0) > 0) {
          store.customer_payment_ledger.push({
            id: uuid(), customer_id: order.customer_id, reference_type: 'cancel_order',
            reference_id: params.p_order_id, amount: -Number(order.debt_recorded),
            balance_after: 0, reason: `Hủy đơn ${params.p_order_id} — đảo nợ`,
            created_by: 'system', created_at: new Date().toISOString(),
          });
        }
      }
    }
    store.point_history = (store.point_history ?? []).filter((ph: any) => ph.order_id !== params.p_order_id);
    order.status = 'cancelled';
    order.cancelled_at = new Date().toISOString();
    order.debt_recorded = 0;
    order.points_earned = 0;
    order.points_redeemed = 0;
    return { data: { ok: true, cancelled_order_id: params.p_order_id, cancelled_at: order.cancelled_at }, error: null };
  }

  if (name === 'delete_order') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:5622 — RETURNS jsonb
    if (!params.p_order_id) return { data: null, error: { code: 'P0001', message: 'order_id is required' } };
    const order = store.orders.find((o: any) => o.id === params.p_order_id);
    if (!order) return { data: null, error: { code: 'P0001', message: `Đơn hàng ${params.p_order_id} không tồn tại` } };
    const activeReturns = (store.return_orders ?? []).filter((r: any) => r.original_order_id === params.p_order_id && r.status !== 'cancelled').length;
    if (activeReturns > 0) return { data: null, error: { code: 'P0001', message: `Đơn hàng đã có ${activeReturns} phiếu trả còn hiệu lực` } };
    for (const item of store.order_items.filter((i: any) => i.order_id === params.p_order_id)) {
      const product = store.products.find((p: any) => p.id === item.product_id);
      if (!product) continue;
      const baseQty = Number(item.quantity ?? 0);
      if (product.has_lots && item.lot_id) {
        const lot = store.product_lots.find((pl: any) => pl.id === item.lot_id);
        if (lot) lot.quantity = Number(lot.quantity ?? 0) + baseQty;
      } else {
        product.quantity = Number(product.quantity ?? 0) + baseQty;
      }
    }
    if (order.customer_id && order.customer_id !== 'guest') {
      const customer = store.customers.find((c: any) => c.id === order.customer_id);
      if (customer) {
        customer.total_spent = Math.max(0, Number(customer.total_spent ?? 0) - Number(order.total_amount ?? 0));
        customer.debt = Math.max(0, Number(customer.debt ?? 0) - Number(order.debt_recorded ?? 0));
        const pointsDiff = Number(order.points_redeemed ?? 0) - Number(order.points_earned ?? 0);
        customer.loyalty_points = Math.max(0, Number(customer.loyalty_points ?? 0) + pointsDiff);
        if (Number(order.debt_recorded ?? 0) > 0) {
          store.customer_payment_ledger.push({
            id: uuid(), customer_id: order.customer_id, reference_type: 'cancel_order',
            reference_id: params.p_order_id, amount: -Number(order.debt_recorded),
            balance_after: 0, reason: `Xóa đơn ${params.p_order_id} — đảo nợ`,
            created_by: 'system', created_at: new Date().toISOString(),
          });
        }
      }
    }
    store.point_history = (store.point_history ?? []).filter((ph: any) => ph.order_id !== params.p_order_id);
    store.order_items = store.order_items.filter((i: any) => i.order_id !== params.p_order_id);
    store.orders = store.orders.filter((o: any) => o.id !== params.p_order_id);
    return { data: { ok: true, deleted_order_id: params.p_order_id }, error: null };
  }

  if (name === 'get_order_auto_code') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:7908 — RETURNS text ('HD' || LPAD(nextval, 7, '0'))
    orderCodeCounter += 1;
    return { data: 'HD' + String(orderCodeCounter).padStart(7, '0'), error: null };
  }

  if (name === 'get_sales_report') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:8671 — RETURNS json
    const startDate = params.p_start_date;
    const endDate = params.p_end_date;
    const statusFilter = params.p_status ?? 'all';
    const paymentFilter = params.p_payment_method ?? '';
    const productKw = (params.p_product_keyword ?? '').toLowerCase();
    const customerKw = (params.p_customer_keyword ?? '').toLowerCase();
    const inRange = (d: string) => {
      const dt = new Date(d);
      if (startDate && dt < new Date(startDate)) return false;
      if (endDate && dt > new Date(endDate)) return false;
      return true;
    };
    const filtered = (store.orders ?? []).filter((o: any) => {
      if (!inRange(o.date)) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (paymentFilter && o.payment_method !== paymentFilter) return false;
      if (customerKw && !String(o.customer_name ?? '').toLowerCase().includes(customerKw)) return false;
      if (productKw) {
        const hasProduct = store.order_items.some((oi: any) => oi.order_id === o.id && String(oi.product_name ?? '').toLowerCase().includes(productKw));
        if (!hasProduct) return false;
      }
      return true;
    });
    const active = filtered.filter((o: any) => o.status !== 'cancelled');
    const cancelled = filtered.filter((o: any) => o.status === 'cancelled');
    const returnedByProduct: Record<string, number> = {};
    for (const ro of store.return_orders ?? []) {
      if (ro.status === 'cancelled') continue;
      for (const roi of store.return_order_items ?? []) {
        if (roi.return_order_id !== ro.id) continue;
        returnedByProduct[roi.product_id] = (returnedByProduct[roi.product_id] ?? 0) + Number(roi.quantity ?? 0);
      }
    }
    const spanDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
    const prevStart = new Date(new Date(startDate).getTime() - spanDays * 86400000);
    const prevEnd = new Date(new Date(startDate).getTime() - 86400000);
    const prevOrders = (store.orders ?? []).filter((o: any) => {
      const d = new Date(o.date);
      return d >= prevStart && d <= prevEnd && o.status !== 'cancelled';
    });
    const prevRevenue = prevOrders.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0);
    const totalRevenue = active.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0), 0);
    const completedOrders = active.filter((o: any) => o.status === 'completed');
    const completedRevenue = completedOrders.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0), 0);
    const cancelledRevenue = cancelled.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0);
    const uniqueCustomers = new Set(active.map((o: any) => o.customer_id).filter(Boolean)).size;
    const summary = {
      totalRevenue,
      totalOrders: filtered.length,
      avgOrderValue: active.length > 0 ? totalRevenue / active.length : 0,
      uniqueCustomers,
      completedRevenue,
      cancelledRevenue,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelled.length,
      prevRevenue,
      prevOrdersCount: prevOrders.length,
    };
    const dayMap: Record<string, { revenue: number; orders: number; cost: number }> = {};
    for (const o of active) {
      const key = String(o.date).slice(0, 10);
      if (!dayMap[key]) dayMap[key] = { revenue: 0, orders: 0, cost: 0 };
      dayMap[key].revenue += Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0);
      dayMap[key].orders += 1;
    }
    for (const oi of store.order_items ?? []) {
      const o = active.find((x: any) => x.id === oi.order_id);
      if (!o) continue;
      const key = String(o.date).slice(0, 10);
      if (!dayMap[key]) dayMap[key] = { revenue: 0, orders: 0, cost: 0 };
      const returned = returnedByProduct[oi.product_id] ?? 0;
      const netQty = Math.max(0, Number(oi.quantity ?? 0) - returned);
      dayMap[key].cost += Number(oi.cost ?? 0) * netQty;
    }
    const dailyRevenue = Object.entries(dayMap).map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders, profit: v.revenue - v.cost })).sort((a, b) => a.date < b.date ? -1 : 1);
    const paymentMap: Record<string, number> = {};
    for (const o of active) {
      const key = o.payment_method || 'Khác';
      paymentMap[key] = (paymentMap[key] ?? 0) + Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0);
    }
    const paymentData = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));
    const productAgg: Record<string, { key: string; label: string; revenue: number; orders: number; count: number }> = {};
    for (const oi of store.order_items ?? []) {
      const o = active.find((x: any) => x.id === oi.order_id);
      if (!o) continue;
      const returned = returnedByProduct[oi.product_id] ?? 0;
      const netQty = Math.max(0, Number(oi.quantity ?? 0) - returned);
      const revenue = Number(oi.price ?? 0) * netQty;
      const key = oi.product_id ?? '';
      if (!productAgg[key]) productAgg[key] = { key, label: oi.product_name ?? 'Không xác định', revenue: 0, orders: 0, count: 0 };
      productAgg[key].revenue += revenue;
      productAgg[key].count += netQty;
    }
    for (const k of Object.keys(productAgg)) productAgg[k].orders = 0;
    const groupedByProduct = Object.values(productAgg).sort((a, b) => b.revenue - a.revenue);
    const customerAgg: Record<string, { key: string; label: string; revenue: number; orders: number; count: number }> = {};
    for (const o of active) {
      const key = o.customer_id ?? 'guest';
      if (!customerAgg[key]) customerAgg[key] = { key, label: o.customer_name ?? 'Khách lẻ', revenue: 0, orders: 0, count: 0 };
      customerAgg[key].revenue += Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0);
      customerAgg[key].orders += 1;
    }
    const groupedByCustomer = Object.values(customerAgg).sort((a, b) => b.revenue - a.revenue);
    const dayAgg: Record<string, { key: string; label: string; revenue: number; orders: number; count: number }> = {};
    for (const o of active) {
      const key = String(o.date).slice(0, 10);
      if (!dayAgg[key]) dayAgg[key] = { key, label: key, revenue: 0, orders: 0, count: 0 };
      dayAgg[key].revenue += Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0);
      dayAgg[key].orders += 1;
    }
    const groupedByDay = Object.values(dayAgg).sort((a, b) => a.key < b.key ? 1 : -1);
    const orderAgg = active.map((o: any) => ({ key: o.id, label: 'Đơn ' + o.id, revenue: Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0), orders: 1, count: 0 })).sort((a, b) => b.revenue - a.revenue);
    const detailRows: any[] = [];
    for (const oi of store.order_items ?? []) {
      const o = active.find((x: any) => x.id === oi.order_id);
      if (!o) continue;
      const returned = returnedByProduct[oi.product_id] ?? 0;
      const netQty = Number(oi.quantity ?? 0) - returned;
      detailRows.push({
        date: String(o.date).slice(0, 10),
        orderId: o.id,
        productName: oi.product_name ?? '',
        quantity: netQty,
        revenue: Number(oi.price ?? 0) * netQty,
        customerName: o.customer_name ?? '',
        paymentMethod: o.payment_method ?? 'N/A',
      });
    }
    detailRows.sort((a, b) => a.date < b.date ? 1 : -1);
    return {
      data: {
        summary,
        dailyRevenue,
        paymentData,
        groupedByProduct,
        groupedByCustomer,
        groupedByDay,
        groupedByOrder: orderAgg,
        detailRows,
      },
      error: null,
    };
  }

  if (name === 'process_checkout') {
    // Canonical: 20250706000006_phase_p7_0_read_only_tenant_infra.sql:204 — RETURNS jsonb
    const pOrder = params.p_order ?? {};
    const orderId = pOrder.id;
    if (!orderId) return { data: null, error: { code: 'P0001', message: 'order.id is required' } };
    const opId = params.p_op_id;
    if (opId) {
      const existing = store.processed_operations.find((op: any) => op.op_id === opId);
      if (existing) return { data: { ok: true, order_id: orderId, skipped: true, reason: 'op_id already processed' }, error: null };
      store.processed_operations.push({ op_id: opId, op_type: 'checkout', ref_id: orderId, created_at: new Date().toISOString() });
    }
    const customerId = pOrder.customerId && pOrder.customerId !== 'guest' ? pOrder.customerId : null;
    const postingDate = pOrder.date ?? new Date().toISOString();
    const existingOrderIdx = store.orders.findIndex((o: any) => o.id === orderId);
    const orderRow: any = {
      id: orderId,
      order_code: pOrder.orderCode ?? orderId,
      date: postingDate,
      customer_id: customerId,
      customer_name: pOrder.customerName ?? '',
      total_amount: Number(pOrder.totalAmount ?? 0),
      paid_amount: Number(pOrder.paidAmount ?? 0),
      debt_recorded: Number(pOrder.debtRecorded ?? 0),
      payment_method: pOrder.paymentMethod ?? null,
      status: pOrder.status ?? 'completed',
      points_earned: Number(pOrder.pointsEarned ?? 0),
      points_redeemed: Number(pOrder.pointsRedeemed ?? 0),
      rewards_redeemed: pOrder.rewardsRedeemed ?? [],
      applied_promotions: pOrder.appliedPromotions ?? [],
      note: pOrder.note ?? null,
      has_return: false,
      total_returned_amount: 0,
      created_at: existingOrderIdx >= 0 ? store.orders[existingOrderIdx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (existingOrderIdx >= 0) store.orders[existingOrderIdx] = orderRow;
    else store.orders.push(orderRow);
    store.order_items = store.order_items.filter((i: any) => i.order_id !== orderId);
    const items = Array.isArray(params.p_items) ? params.p_items : [];
    for (const item of items) {
      store.order_items.push({
        id: uuid(),
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: Number(item.quantity ?? 0),
        unit_name: item.unitName ?? null,
        price: Number(item.price ?? 0),
        lot_id: item.lotId ?? null,
        lot_code: item.lotCode ?? null,
        cost: Number(item.cost ?? 0),
        created_at: new Date().toISOString(),
      });
    }
    const deltas = Array.isArray(params.p_deltas) ? params.p_deltas : [];
    const allowNegative = !!params.p_allow_negative;
    for (const d of deltas) {
      const deduct = Number(d.deductBaseQty ?? 0);
      if (deduct <= 0) continue;
      const product = store.products.find((p: any) => p.id === d.productId);
      if (!product) return { data: null, error: { code: 'P0001', message: `Sản phẩm ${d.productId} không tồn tại` } };
      if (product.has_lots) {
        if (!d.lotId) return { data: null, error: { code: 'P0001', message: `Sản phẩm "${product.name}" có quản lý lô, phải chọn lô khi bán` } };
        const lot = store.product_lots.find((pl: any) => pl.id === d.lotId);
        if (!lot) return { data: null, error: { code: 'P0001', message: `Lô ${d.lotId} không tồn tại` } };
        const newQty = Number(lot.quantity ?? 0) - deduct;
        if (newQty < 0 && !allowNegative) return { data: null, error: { code: 'P0001', message: `Tồn lô không đủ` } };
        lot.quantity = newQty;
      } else {
        const newQty = Number(product.quantity ?? 0) - deduct;
        if (newQty < 0 && !allowNegative) return { data: null, error: { code: 'P0001', message: `Tồn kho không đủ cho "${product.name}"` } };
        product.quantity = newQty;
      }
      store.stock_movements.push({
        id: uuid(), posting_date: postingDate, voucher_type: 'Sales Invoice',
        voucher_no: orderId, voucher_detail_no: d.lotId ?? d.productId,
        product_id: d.productId, lot_id: d.lotId ?? null, warehouse: 'Kho Chính',
        actual_qty: -deduct, qty_after_transaction: 0, valuation_rate: 0,
        incoming_rate: 0, outgoing_rate: 0, stock_value: 0, balance_value: 0,
        reason: 'Bán hàng', is_cancelled: false, created_at: new Date().toISOString(),
      });
    }
    const rewardDeltas = Array.isArray(params.p_reward_deltas) ? params.p_reward_deltas : [];
    for (const r of rewardDeltas) {
      const reward = store.rewards.find((rw: any) => rw.id === r.rewardId);
      if (reward) reward.redeemed_count = Number(reward.redeemed_count ?? 0) + Number(r.delta ?? 0);
    }
    if (customerId) {
      const cu = params.p_customer_update ?? {};
      const addSpent = Number(cu.addSpent ?? 0);
      const addDebt = Number(cu.addDebt ?? 0);
      const addPoints = Number(cu.addPoints ?? 0);
      if (addSpent > 0 || addDebt !== 0 || addPoints !== 0) {
        const customer = store.customers.find((c: any) => c.id === customerId);
        if (customer) {
          customer.total_spent = Number(customer.total_spent ?? 0) + addSpent;
          customer.debt = Number(customer.debt ?? 0) + addDebt;
          customer.loyalty_points = Number(customer.loyalty_points ?? 0) + addPoints;
          customer.updated_at = new Date().toISOString();
        }
      }
      if (addDebt !== 0) {
        store.customer_payment_ledger.push({
          id: uuid(), customer_id: customerId, reference_type: 'order', reference_id: orderId,
          amount: addDebt, balance_after: 0, reason: 'Nợ từ đơn hàng', created_by: 'system',
          created_at: postingDate,
        });
      }
    }
    const pointHistory = Array.isArray(params.p_point_history) ? params.p_point_history : [];
    for (const ph of pointHistory) {
      store.point_history.push({
        id: ph.id ?? uuid(),
        customer_id: ph.customerId,
        type: ph.type,
        amount: Number(ph.amount ?? 0),
        description: ph.description,
        order_id: ph.orderId ?? null,
        created_at: ph.date ?? new Date().toISOString(),
      });
    }
    return { data: { ok: true, order_id: orderId }, error: null };
  }

  if (name === 'search_orders_rpc') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:11897 — RETURNS json (array of order rows)
    const term = (params.p_search_term || '').toLowerCase();
    const limit = params.p_limit ?? 100;
    let matches = store.orders ?? [];
    if (term) {
      matches = matches.filter((o: any) => {
        if (String(o.id).toLowerCase().includes(term)) return true;
        if (String(o.customer_name ?? '').toLowerCase().includes(term)) return true;
        const customer = store.customers.find((c: any) => c.id === o.customer_id);
        if (customer && String(customer.phone ?? '').toLowerCase().includes(term)) return true;
        const hasProduct = store.order_items.some((oi: any) => oi.order_id === o.id && String(oi.product_name ?? '').toLowerCase().includes(term));
        return hasProduct;
      });
    }
    matches = matches.slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
    return { data: matches, error: null };
  }

  if (name === 'pay_order_debt') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:10280 — RETURNS jsonb
    if (!params.p_order_id) return { data: null, error: { code: 'P0001', message: 'order_id is required' } };
    const amount = Number(params.p_amount ?? 0);
    if (!(amount > 0)) return { data: null, error: { code: 'P0001', message: 'Số tiền thanh toán phải lớn hơn 0' } };
    const order = store.orders.find((o: any) => o.id === params.p_order_id);
    if (!order) return { data: null, error: { code: 'P0001', message: `Đơn hàng ${params.p_order_id} không tồn tại` } };
    if (order.status === 'cancelled') return { data: null, error: { code: 'P0001', message: `Đơn hàng đã bị huỷ` } };
    const remainingDebt = Number(order.debt_recorded ?? 0);
    if (remainingDebt <= 0) return { data: null, error: { code: 'P0001', message: `Đơn hàng đã thanh toán đủ` } };
    const effective = Math.min(amount, remainingDebt);
    const newPaid = Number(order.paid_amount ?? 0) + effective;
    const newOrderDebt = Math.max(0, Number(order.total_amount ?? 0) - newPaid);
    order.paid_amount = newPaid;
    order.debt_recorded = newOrderDebt;
    let newCustomerDebt: number | null = null;
    let ledgerBalanceAfter = 0;
    if (order.customer_id && order.customer_id !== 'guest') {
      const customer = store.customers.find((c: any) => c.id === order.customer_id);
      if (customer) {
        newCustomerDebt = Math.max(0, Number(customer.debt ?? 0) - effective);
        customer.debt = newCustomerDebt;
        ledgerBalanceAfter = newCustomerDebt;
        store.customer_payment_ledger.push({
          id: uuid(), customer_id: order.customer_id, reference_type: 'payment',
          reference_id: params.p_order_id, amount: -effective, balance_after: ledgerBalanceAfter,
          reason: `Thanh toán công nợ đơn ${params.p_order_id}`, created_by: 'system',
          created_at: new Date().toISOString(),
        });
      }
    }
    return {
      data: {
        ok: true,
        order_id: params.p_order_id,
        requested_amount: amount,
        effective_amount: effective,
        change_amount: Math.max(0, amount - effective),
        new_order_paid: newPaid,
        new_order_debt: newOrderDebt,
        new_customer_debt: newCustomerDebt,
        ledger_balance_after: ledgerBalanceAfter,
        fully_paid: newOrderDebt === 0,
      },
      error: null,
    };
  }

  // ========== End Domain H3 ==========

  // ========== Domain H5 — Customers (Recovery Wave-03) ==========

  if (name === 'search_customers_rpc') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:11884 — RETURNS SETOF customers
    // ponytail: param name is `search_term` (no p_ prefix) per migration signature.
    const term = (params.search_term ?? '').toLowerCase();
    const norm = (s: any) => String(s ?? '').toLowerCase();
    let rows = (store.customers ?? []).slice();
    if (term) {
      rows = rows.filter((c: any) =>
        norm(c.name).includes(term) ||
        norm(c.phone).includes(term) ||
        norm(c.code).includes(term));
    }
    rows.sort((a: any, b: any) => norm(a.name) < norm(b.name) ? -1 : norm(a.name) > norm(b.name) ? 1 : 0);
    return { data: rows.slice(0, 500), error: null };
  }

  if (name === 'filter_customers_rpc') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:6027 — RETURNS json
    const term = (params.p_search_term ?? '').toLowerCase();
    const page = params.p_page ?? 1;
    const pageSize = params.p_page_size ?? 20;
    const sortBy = params.p_sort_by ?? 'created_at';
    const sortOrder = params.p_sort_order ?? 'desc';
    const minPoints = params.p_min_points ?? null;
    const maxPoints = params.p_max_points ?? null;
    const hasDebt = params.p_has_debt ?? null;
    const norm = (s: any) => String(s ?? '').toLowerCase();
    let rows = (store.customers ?? []).slice();
    rows = rows.filter((c: any) => {
      if (term) {
        if (!(norm(c.name).includes(term) || norm(c.phone).includes(term) || norm(c.code).includes(term))) return false;
      }
      if (minPoints != null && Number(c.loyalty_points ?? 0) < Number(minPoints)) return false;
      if (maxPoints != null && Number(c.loyalty_points ?? 0) > Number(maxPoints)) return false;
      if (hasDebt === 'true' && !(Number(c.debt ?? 0) > 0)) return false;
      if (hasDebt === 'false' && !(Number(c.debt ?? 0) === 0)) return false;
      return true;
    });
    const total = rows.length;
    const cmpVal = (sel: (c: any) => number | string) => (a: any, b: any) => {
      const va = sel(a), vb = sel(b);
      if (va < vb) return -1; if (va > vb) return 1; return 0;
    };
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'name') rows.sort((a, b) => dir * cmpVal((c: any) => norm(c.name))(a, b));
    else if (sortBy === 'points') rows.sort((a, b) => dir * cmpVal((c: any) => Number(c.loyalty_points ?? 0))(a, b));
    else if (sortBy === 'debt') rows.sort((a, b) => dir * cmpVal((c: any) => Number(c.debt ?? 0))(a, b));
    else if (sortBy === 'spent') rows.sort((a, b) => dir * cmpVal((c: any) => Number(c.total_spent ?? 0))(a, b));
    else rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // ponytail: created_at DESC tiebreak per migration ORDER BY final fallback.
    if (sortBy !== 'created_at') rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const offset = (page - 1) * pageSize;
    return { data: { customers: rows.slice(offset, offset + pageSize), totalCount: total }, error: null };
  }

  if (name === 'get_customer_stats') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:7062 — RETURNS json
    const rows = store.customers ?? [];
    const vipRanks = ['vip', 'vipvip', 'gold', 'diamond', 'platinum'];
    const total = rows.length;
    const vip = rows.filter((c: any) => vipRanks.includes(String(c.rank ?? '').toLowerCase())).length;
    const debt = rows.filter((c: any) => Number(c.debt ?? 0) > 0).length;
    const totalSpent = rows.reduce((s: number, c: any) => s + Number(c.total_spent ?? 0), 0);
    return { data: { total, vip, debt, totalSpent }, error: null };
  }

  if (name === 'get_customer_report') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:7005 — RETURNS json
    const startDate = params.p_start_date;
    const endDate = params.p_end_date;
    const rows = store.customers ?? [];
    const inRange = (d: string) => {
      const dt = new Date(d);
      if (startDate && dt < new Date(String(startDate))) return false;
      if (endDate && dt > new Date(String(endDate))) return false;
      return true;
    };
    const summary = {
      totalCustomers: rows.length,
      newCustomers: rows.filter((c: any) => c.created_at && inRange(String(c.created_at))).length,
      totalDebt: rows.reduce((s: number, c: any) => s + Number(c.debt ?? 0), 0),
      totalPoints: rows.reduce((s: number, c: any) => s + Number(c.loyalty_points ?? 0), 0),
      totalSpent: rows.reduce((s: number, c: any) => s + Number(c.total_spent ?? 0), 0),
    };
    const topCustomers = rows.slice()
      .map((c: any) => ({
        id: c.id, name: c.name,
        total_spent: Number(c.total_spent ?? 0),
        debt: Number(c.debt ?? 0),
        loyalty_points: Number(c.loyalty_points ?? 0),
        order_count: (store.orders ?? []).filter((o: any) => o.customer_id === c.id).length,
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 50);
    const growthMap: Record<string, number> = {};
    for (const c of rows) {
      if (!c.created_at) continue;
      if (!inRange(String(c.created_at))) continue;
      const d = new Date(c.created_at);
      const key = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
      growthMap[key] = (growthMap[key] ?? 0) + 1;
    }
    const customerGrowth = Object.entries(growthMap).map(([date, new_customers]) => ({ date, new_customers }))
      .sort((a, b) => a.date < b.date ? -1 : 1);
    return { data: { summary, topCustomers, customerGrowth }, error: null };
  }

  if (name === 'get_customer_debt_ledger') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:6990 — RETURNS json
    if (!params.p_customer_id) return { data: null, error: { code: 'P0001', message: 'customer_id is required' } };
    const limit = params.p_limit ?? 100;
    const offset = params.p_offset ?? 0;
    const ledger = (store.customer_payment_ledger ?? []).filter((l: any) => l.customer_id === params.p_customer_id);
    const balance = ledger.reduce((s: number, l: any) => s + Number(l.amount ?? 0), 0);
    const total = ledger.length;
    const entries = ledger.slice()
      .sort((a: any, b: any) => {
        const ta = new Date(a.created_at).getTime(), tb = new Date(b.created_at).getTime();
        if (tb !== ta) return tb - ta;
        return String(b.id) < String(a.id) ? -1 : 1;
      })
      .slice(offset, offset + limit)
      .map((l: any) => ({
        id: l.id, customer_id: l.customer_id, reference_type: l.reference_type,
        reference_id: l.reference_id, amount: Number(l.amount ?? 0),
        balance_after: Number(l.balance_after ?? 0), reason: l.reason,
        created_by: l.created_by, created_at: l.created_at,
      }));
    return { data: { customer_id: params.p_customer_id, current_balance: balance, total_entries: total, entries }, error: null };
  }

  if (name === 'adjust_customer_debt') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:1611 — RETURNS jsonb
    if (!params.p_customer_id) return { data: null, error: { code: 'P0001', message: 'customer_id is required' } };
    const amount = Number(params.p_amount ?? 0);
    if (!amount) return { data: null, error: { code: 'P0001', message: 'Số tiền điều chỉnh phải khác 0' } };
    const reason = String(params.p_reason ?? '').trim();
    if (!reason || reason.toLowerCase() === 'khớp') {
      return { data: null, error: { code: 'P0001', message: 'Lý do điều chỉnh công nợ bắt buộc và không được để Khớp' } };
    }
    const customer = (store.customers ?? []).find((c: any) => c.id === params.p_customer_id);
    if (!customer) return { data: null, error: { code: 'P0001', message: `Khách hàng ${params.p_customer_id} không tồn tại` } };
    const newDebt = Math.max(0, Number(customer.debt ?? 0) + amount);
    customer.debt = newDebt;
    customer.updated_at = new Date().toISOString();
    const ledgerBalanceAfter = newDebt;
    store.customer_payment_ledger.push({
      id: uuid(), customer_id: params.p_customer_id, reference_type: 'adjustment',
      reference_id: null, amount, balance_after: ledgerBalanceAfter, reason,
      created_by: 'system', created_at: new Date().toISOString(),
    });
    return {
      data: {
        ok: true, customer_id: params.p_customer_id, adjustment_amount: amount,
        new_customer_debt: newDebt, ledger_balance_after: ledgerBalanceAfter, reason,
      },
      error: null,
    };
  }

  // ========== End Domain H5 ==========

  // ========== Domain H6 — Suppliers (Recovery Wave-03) ==========

  if (name === 'search_suppliers_rpc') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:11969 — RETURNS SETOF suppliers
    const term = (params.p_search_term ?? '').toLowerCase();
    const limit = params.p_limit ?? 100;
    const norm = (s: any) => String(s ?? '').toLowerCase();
    let rows = (store.suppliers ?? []).slice();
    if (term) {
      rows = rows.filter((s: any) =>
        norm(s.name).includes(term) ||
        norm(s.code).includes(term) ||
        norm(s.phone).includes(term));
    }
    rows.sort((a: any, b: any) => norm(a.name) < norm(b.name) ? -1 : norm(a.name) > norm(b.name) ? 1 : 0);
    return { data: rows.slice(0, limit), error: null };
  }

  if (name === 'filter_suppliers_rpc') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:6367 — RETURNS json
    const term = (params.p_search_term ?? '').toLowerCase();
    const page = params.p_page ?? 1;
    const pageSize = params.p_page_size ?? 20;
    const sortBy = params.p_sort_by ?? 'name';
    const sortOrder = params.p_sort_order ?? 'asc';
    const norm = (s: any) => String(s ?? '').toLowerCase();
    let rows = (store.suppliers ?? []).slice();
    if (term) {
      rows = rows.filter((s: any) =>
        norm(s.name).includes(term) ||
        norm(s.code).includes(term) ||
        norm(s.phone).includes(term));
    }
    const total = rows.length;
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'name') {
      rows.sort((a: any, b: any) => {
        const c = norm(a.name) < norm(b.name) ? -1 : norm(a.name) > norm(b.name) ? 1 : 0;
        return dir * c;
      });
    } else if (sortBy === 'debt') {
      rows.sort((a: any, b: any) => {
        const c = Number(a.debt ?? 0) - Number(b.debt ?? 0);
        return dir * (c < 0 ? -1 : c > 0 ? 1 : 0);
      });
    } else {
      rows.sort((a: any, b: any) => norm(a.name) < norm(b.name) ? -1 : 1);
    }
    const offset = (page - 1) * pageSize;
    return { data: { suppliers: rows.slice(offset, offset + pageSize), totalCount: total }, error: null };
  }

  if (name === 'get_supplier_stats') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:9015 — RETURNS json
    const rows = store.suppliers ?? [];
    const total = rows.length;
    const withPhone = rows.filter((s: any) => s.phone != null && String(s.phone) !== '').length;
    const withDebt = rows.filter((s: any) => Number(s.debt ?? 0) > 0).length;
    const totalDebt = rows.reduce((sum: number, s: any) => sum + Number(s.debt ?? 0), 0);
    return { data: { total, withPhone, withDebt, totalDebt }, error: null };
  }

  if (name === 'get_supplier_report') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:8950 — RETURNS json
    const startDate = params.p_start_date;
    const endDate = params.p_end_date;
    const suppliers = store.suppliers ?? [];
    const receipts = (store.import_receipts ?? []).filter((r: any) => r.status === 'completed');
    const inRange = (d: string) => {
      const dt = new Date(d);
      if (startDate && dt < new Date(String(startDate))) return false;
      if (endDate && dt > new Date(String(endDate))) return false;
      return true;
    };
    const summary = {
      totalSuppliers: suppliers.length,
      totalDebt: suppliers.reduce((s: number, x: any) => s + Number(x.debt ?? 0), 0),
      totalPaid: receipts.reduce((s: number, r: any) => s + Number(r.paid_amount ?? 0), 0),
      totalImportValue: receipts.filter((r: any) => r.date && inRange(String(r.date))).reduce((s: number, r: any) => s + Number(r.total_cost ?? 0), 0),
    };
    const topSuppliers = suppliers.map((s: any) => {
      const sReceipts = receipts.filter((r: any) => r.supplier_id === s.id);
      return {
        id: s.id, code: s.code, name: s.name,
        total_import_value: sReceipts.reduce((sum: number, r: any) => sum + Number(r.total_cost ?? 0), 0),
        total_paid: sReceipts.reduce((sum: number, r: any) => sum + Number(r.paid_amount ?? 0), 0),
        debt: Number(s.debt ?? 0),
        import_count: sReceipts.length,
      };
    }).sort((a, b) => b.total_import_value - a.total_import_value).slice(0, 50);
    const growthMap: Record<string, number> = {};
    for (const s of suppliers) {
      if (!s.created_at) continue;
      if (!inRange(String(s.created_at))) continue;
      const d = new Date(s.created_at);
      const key = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
      growthMap[key] = (growthMap[key] ?? 0) + 1;
    }
    const supplierGrowth = Object.entries(growthMap).map(([date, new_suppliers]) => ({ date, new_suppliers }))
      .sort((a, b) => a.date < b.date ? -1 : 1);
    const importBySupplier = suppliers.map((s: any) => {
      const value = receipts.filter((r: any) => r.supplier_id === s.id && r.date && inRange(String(r.date)))
        .reduce((sum: number, r: any) => sum + Number(r.total_cost ?? 0), 0);
      return { id: s.id, name: s.name, value };
    }).filter((x: any) => x.value > 0).sort((a, b) => b.value - a.value);
    return { data: { summary, topSuppliers, supplierGrowth, importBySupplier }, error: null };
  }

  if (name === 'get_supplier_debt_ledger') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:8927 — RETURNS json
    if (!params.p_supplier_id) return { data: null, error: { code: 'P0001', message: 'supplier_id is required' } };
    const limit = params.p_limit ?? 100;
    const offset = params.p_offset ?? 0;
    const ledger = (store.supplier_payment_ledger ?? []).filter((l: any) => l.supplier_id === params.p_supplier_id);
    const balance = ledger.reduce((s: number, l: any) => s + Number(l.amount ?? 0), 0);
    const total = ledger.length;
    const entries = ledger.slice()
      .sort((a: any, b: any) => {
        const ta = new Date(a.created_at).getTime(), tb = new Date(b.created_at).getTime();
        if (tb !== ta) return tb - ta;
        return String(b.id) < String(a.id) ? -1 : 1;
      })
      .slice(offset, offset + limit)
      .map((l: any) => ({
        id: l.id, supplier_id: l.supplier_id, reference_type: l.reference_type,
        reference_id: l.reference_id, amount: Number(l.amount ?? 0),
        balance_after: Number(l.balance_after ?? 0), reason: l.reason,
        created_by: l.created_by, created_at: l.created_at,
      }));
    return { data: { supplier_id: params.p_supplier_id, current_balance: balance, total_entries: total, entries }, error: null };
  }

  if (name === 'adjust_supplier_debt') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:1633 — RETURNS jsonb
    if (!params.p_supplier_id) return { data: null, error: { code: 'P0001', message: 'supplier_id is required' } };
    const amount = Number(params.p_amount ?? 0);
    if (!amount) return { data: null, error: { code: 'P0001', message: 'Số tiền điều chỉnh phải khác 0' } };
    const reason = String(params.p_reason ?? '').trim();
    if (!reason || reason.toLowerCase() === 'khớp') {
      return { data: null, error: { code: 'P0001', message: 'Lý do điều chỉnh công nợ bắt buộc và không được để Khớp' } };
    }
    const supplier = (store.suppliers ?? []).find((s: any) => s.id === params.p_supplier_id);
    if (!supplier) return { data: null, error: { code: 'P0001', message: `Nhà cung cấp ${params.p_supplier_id} không tồn tại` } };
    const newDebt = Math.max(0, Number(supplier.debt ?? 0) + amount);
    supplier.debt = newDebt;
    supplier.updated_at = new Date().toISOString();
    const ledgerBalanceAfter = newDebt;
    store.supplier_payment_ledger.push({
      id: uuid(), supplier_id: params.p_supplier_id, reference_type: 'adjustment',
      reference_id: null, amount, balance_after: ledgerBalanceAfter, reason,
      created_by: 'system', created_at: new Date().toISOString(),
    });
    return {
      data: {
        ok: true, supplier_id: params.p_supplier_id, adjustment_amount: amount,
        new_supplier_debt: newDebt, ledger_balance_after: ledgerBalanceAfter, reason,
      },
      error: null,
    };
  }

  if (name === 'pay_supplier_debt') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:10320 — RETURNS jsonb
    if (!params.p_receipt_id) return { data: null, error: { code: 'P0001', message: 'receipt_id is required' } };
    const amount = Number(params.p_amount ?? 0);
    if (!(amount > 0)) return { data: null, error: { code: 'P0001', message: 'Số tiền thanh toán phải lớn hơn 0' } };
    const receipt = (store.import_receipts ?? []).find((r: any) => r.id === params.p_receipt_id);
    if (!receipt) return { data: null, error: { code: 'P0001', message: `Phiếu nhập ${params.p_receipt_id} không tồn tại` } };
    if (receipt.status !== 'completed') return { data: null, error: { code: 'P0001', message: `Phiếu nhập ${params.p_receipt_id} chưa hoàn thành` } };
    const remainingDebt = Number(receipt.debt_recorded ?? 0);
    if (remainingDebt <= 0) return { data: null, error: { code: 'P0001', message: `Phiếu nhập ${params.p_receipt_id} đã thanh toán đủ` } };
    const effective = Math.min(amount, remainingDebt);
    const newPaid = Number(receipt.paid_amount ?? 0) + effective;
    const newReceiptDebt = Math.max(0, Number(receipt.total_cost ?? 0) - newPaid);
    receipt.paid_amount = newPaid;
    receipt.debt_recorded = newReceiptDebt;
    let newSupplierDebt: number | null = null;
    let ledgerBalanceAfter = 0;
    if (receipt.supplier_id) {
      const supplier = (store.suppliers ?? []).find((s: any) => s.id === receipt.supplier_id);
      if (supplier) {
        newSupplierDebt = Math.max(0, Number(supplier.debt ?? 0) - effective);
        supplier.debt = newSupplierDebt;
        supplier.updated_at = new Date().toISOString();
        ledgerBalanceAfter = newSupplierDebt;
        store.supplier_payment_ledger.push({
          id: uuid(), supplier_id: receipt.supplier_id, reference_type: 'payment',
          reference_id: params.p_receipt_id, amount: -effective, balance_after: ledgerBalanceAfter,
          reason: `Thanh toán công nợ phiếu nhập ${params.p_receipt_id}`,
          created_by: 'system', created_at: new Date().toISOString(),
        });
      }
    }
    return {
      data: {
        ok: true,
        receipt_id: params.p_receipt_id,
        requested_amount: amount,
        effective_amount: effective,
        change_amount: Math.max(0, amount - effective),
        new_receipt_paid: newPaid,
        new_receipt_debt: newReceiptDebt,
        new_supplier_debt: newSupplierDebt,
        ledger_balance_after: ledgerBalanceAfter,
        fully_paid: newReceiptDebt === 0,
      },
      error: null,
    };
  }

  // ========== End Domain H6 ==========

  // ========== Domain H4 — Returns & Exchanges (Recovery Wave-03) ==========

  if (name === 'get_return_order_auto_code') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:8602 — RETURNS text
    returnOrderCodeCounter += 1;
    return { data: 'TH' + String(returnOrderCodeCounter).padStart(7, '0'), error: null };
  }

  if (name === 'filter_return_orders_rpc') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:6325 — RETURNS json
    const term = (params.p_search_term ?? '').toLowerCase();
    const page = params.p_page ?? 1;
    const pageSize = params.p_page_size ?? 20;
    const fromDate = params.p_from_date ?? null;
    const toDate = params.p_to_date ?? null;
    const status = params.p_status ?? null;
    const norm = (s: any) => String(s ?? '').toLowerCase();
    const toEnd = toDate ? new Date(new Date(String(toDate)).getTime() + 86400000) : null;
    let rows = (store.return_orders ?? []).slice();
    rows = rows.filter((r: any) => {
      if (term) {
        if (!(norm(r.id).includes(term) || norm(r.original_order_id).includes(term) || norm(r.customer_name).includes(term))) return false;
      }
      if (fromDate && new Date(r.date) < new Date(String(fromDate))) return false;
      if (toEnd && new Date(r.date) >= toEnd) return false;
      if (status && r.status !== status) return false;
      return true;
    });
    const total = rows.length;
    rows.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const offset = (page - 1) * pageSize;
    return { data: { returnOrders: rows.slice(offset, offset + pageSize), totalCount: total }, error: null };
  }

  if (name === 'create_return_order') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:4645 — RETURNS jsonb
    if (!params.p_id) return { data: null, error: { code: 'P0001', message: 'return_order.id is required' } };
    if (!params.p_original_order_id) return { data: null, error: { code: 'P0001', message: 'original_order_id is required' } };
    const items = Array.isArray(params.p_items) ? params.p_items : [];
    if (items.length === 0) return { data: null, error: { code: 'P0001', message: 'Phiếu trả phải có ít nhất 1 sản phẩm' } };
    const totalRefund = Number(params.p_total_refund_amount ?? 0);
    if (totalRefund < 0) return { data: null, error: { code: 'P0001', message: 'Tổng tiền hoàn không thể âm' } };
    const order = (store.orders ?? []).find((o: any) => o.id === params.p_original_order_id);
    if (!order) return { data: null, error: { code: 'P0001', message: `Đơn hàng gốc ${params.p_original_order_id} không tồn tại` } };
    const newTotalReturned = Number(order.total_returned_amount ?? 0) + totalRefund;
    if (newTotalReturned > Number(order.total_amount ?? 0) + 0.01) {
      return { data: null, error: { code: 'P0001', message: `Tổng tiền trả (${newTotalReturned}) vượt quá tổng tiền đơn hàng (${order.total_amount})` } };
    }
    const customerIdClean = params.p_customer_id && params.p_customer_id !== '' && params.p_customer_id !== 'guest' ? params.p_customer_id : null;
    if (customerIdClean) {
      const customer = (store.customers ?? []).find((c: any) => c.id === customerIdClean);
      if (!customer) return { data: null, error: { code: 'P0001', message: `Khách hàng ${customerIdClean} không tồn tại` } };
    }
    for (const item of items) {
      const qty = Number(item.quantity ?? 0);
      if (qty <= 0) return { data: null, error: { code: 'P0001', message: `Số lượng trả của "${item.productName ?? item.productId}" phải > 0` } };
      const orderedQty = (store.order_items ?? []).filter((oi: any) => oi.order_id === params.p_original_order_id && oi.product_id === item.productId).reduce((s: number, oi: any) => s + Number(oi.quantity ?? 0), 0);
      if (orderedQty === 0) return { data: null, error: { code: 'P0001', message: `Sản phẩm "${item.productName ?? item.productId}" không có trong đơn hàng gốc` } };
      const alreadyReturned = (store.return_order_items ?? [])
        .filter((roi: any) => {
          const ro = (store.return_orders ?? []).find((r: any) => r.id === roi.return_order_id);
          return ro && ro.original_order_id === params.p_original_order_id && roi.product_id === item.productId && ro.status !== 'cancelled';
        })
        .reduce((s: number, roi: any) => s + Number(roi.quantity ?? 0), 0);
      if (alreadyReturned + qty > orderedQty + 0.001) {
        return { data: null, error: { code: 'P0001', message: `Trả vượt số đã bán cho "${item.productName ?? item.productId}" (đã bán ${orderedQty}, đã trả ${alreadyReturned}, đang trả thêm ${qty})` } };
      }
    }
    // ponytail: point rate default 100000 — matches migration fallback when app_settings missing.
    let pointRate: number | null = null;
    const settings = store.system_settings.find((s: any) => s.key === 'default_point_rate');
    if (settings && Number(settings.value ?? 0) > 0) pointRate = Number(settings.value);
    if (!pointRate || pointRate <= 0) pointRate = 100000;
    let eligibleSubtotal = 0;
    for (const item of items) {
      const product = (store.products ?? []).find((p: any) => p.id === item.productId);
      if (product && product.is_point_accumulation_enabled) {
        eligibleSubtotal += Number(item.subtotal ?? 0);
      }
    }
    const pointsToDeduct = Math.floor(eligibleSubtotal / pointRate);
    const now = new Date().toISOString();
    const debtReduction = Number(params.p_debt_reduction ?? 0);
    const cashRefund = Number(params.p_cash_refund ?? 0);
    const grossRefund = params.p_gross_refund_amount != null ? Number(params.p_gross_refund_amount) : totalRefund;
    store.return_orders.push({
      id: params.p_id,
      original_order_id: params.p_original_order_id,
      date: now,
      customer_id: customerIdClean,
      customer_name: params.p_customer_name,
      total_refund_amount: totalRefund,
      refund_method: 'cash',
      debt_reduction: debtReduction,
      cash_refund: cashRefund,
      reason: params.p_reason ?? '',
      note: params.p_note ?? null,
      status: 'completed',
      gross_refund_amount: grossRefund,
      fee_percent: Number(params.p_fee_percent ?? 0),
      fee_amount: Number(params.p_fee_amount ?? 0),
      days_since_purchase: Number(params.p_days_since_purchase ?? 0),
      original_payment_method: params.p_original_payment_method ?? null,
      points_deducted: pointsToDeduct,
      created_at: now,
      updated_at: now,
    });
    for (const item of items) {
      const lotId = item.lotId && item.lotId !== '' ? item.lotId : null;
      const lotCode = item.lotCode && item.lotCode !== '' ? item.lotCode : null;
      store.return_order_items.push({
        id: params.p_id + '_' + item.productId + '_' + (lotId ?? Math.floor(Math.random() * 1000000)),
        return_order_id: params.p_id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: Number(item.quantity ?? 0),
        unit_name: item.unitName ?? null,
        unit_price: Number(item.unitPrice ?? 0),
        subtotal: Number(item.subtotal ?? 0),
        reason: item.reason ?? '',
        lot_id: lotId,
        lot_code: lotCode,
      });
      const qty = Number(item.quantity ?? 0);
      if (qty <= 0) continue;
      const product = (store.products ?? []).find((p: any) => p.id === item.productId);
      if (lotId) {
        let lot = (store.product_lots ?? []).find((pl: any) => pl.id === lotId);
        if (lot) {
          lot.quantity = Number(lot.quantity ?? 0) + qty;
        } else {
          lot = {
            id: lotId, product_id: item.productId, code: lotCode ?? 'RECOVERED_RTN',
            expiry_date: null, quantity: qty, original_quantity: qty,
            created_at: now, updated_at: now,
          };
          store.product_lots.push(lot);
        }
      } else if (product) {
        product.quantity = Number(product.quantity ?? 0) + qty;
      }
    }
    order.has_return = true;
    order.total_returned_amount = newTotalReturned;
    if (customerIdClean) {
      const customer = (store.customers ?? []).find((c: any) => c.id === customerIdClean);
      if (customer) {
        customer.debt = Math.max(0, Number(customer.debt ?? 0) - debtReduction);
        customer.total_spent = Math.max(0, Number(customer.total_spent ?? 0) - totalRefund);
        customer.loyalty_points = Math.max(0, Number(customer.loyalty_points ?? 0) - pointsToDeduct);
        customer.updated_at = now;
        if (debtReduction > 0) {
          store.customer_payment_ledger.push({
            id: uuid(), customer_id: customerIdClean, reference_type: 'return',
            reference_id: params.p_id, amount: -debtReduction, balance_after: customer.debt,
            reason: `Trả hàng giảm nợ ${params.p_id}`, created_by: 'system', created_at: now,
          });
        }
        if (pointsToDeduct > 0) {
          store.point_history.push({
            id: 'PH_RET_' + params.p_id, customer_id: customerIdClean, date: now,
            type: 'return', amount: -pointsToDeduct,
            description: `Trừ điểm do trả hàng từ đơn ${params.p_original_order_id}`,
            order_id: params.p_original_order_id,
          });
        }
      }
    }
    return { data: { ok: true, return_id: params.p_id, new_total_returned: newTotalReturned, points_deducted: pointsToDeduct }, error: null };
  }

  if (name === 'cancel_return_order_v2') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:2973 — RETURNS jsonb
    if (!params.p_return_id) return { data: null, error: { code: 'P0001', message: 'return_id is required' } };
    const ret = (store.return_orders ?? []).find((r: any) => r.id === params.p_return_id);
    if (!ret) return { data: null, error: { code: 'P0001', message: `Phiếu trả ${params.p_return_id} không tồn tại` } };
    if (ret.status === 'cancelled') return { data: null, error: { code: 'P0001', message: `Phiếu trả ${params.p_return_id} đã bị huỷ trước đó` } };
    ret.status = 'cancelled';
    ret.updated_at = new Date().toISOString();
    // Reverse stock additions done at create time
    for (const item of (store.return_order_items ?? []).filter((ri: any) => ri.return_order_id === params.p_return_id)) {
      const qty = Number(item.quantity ?? 0);
      if (qty <= 0) continue;
      const product = (store.products ?? []).find((p: any) => p.id === item.product_id);
      if (item.lot_id) {
        const lot = (store.product_lots ?? []).find((pl: any) => pl.id === item.lot_id);
        if (lot) lot.quantity = Number(lot.quantity ?? 0) - qty;
      } else if (product) {
        product.quantity = Number(product.quantity ?? 0) - qty;
      }
    }
    // Recompute order totals from remaining non-cancelled returns
    const remainingTotal = (store.return_orders ?? [])
      .filter((r: any) => r.original_order_id === ret.original_order_id && r.status !== 'cancelled')
      .reduce((s: number, r: any) => s + Number(r.total_refund_amount ?? 0), 0);
    const order = (store.orders ?? []).find((o: any) => o.id === ret.original_order_id);
    if (order) {
      order.has_return = remainingTotal > 0;
      order.total_returned_amount = remainingTotal;
    }
    const totalRefund = Number(ret.total_refund_amount ?? 0);
    const debtReduction = Number(ret.debt_reduction ?? 0);
    const pointsDeducted = Number(ret.points_deducted ?? 0);
    if (ret.customer_id) {
      const customer = (store.customers ?? []).find((c: any) => c.id === ret.customer_id);
      if (customer) {
        customer.total_spent = Number(customer.total_spent ?? 0) + totalRefund;
        customer.debt = Number(customer.debt ?? 0) + debtReduction;
        customer.loyalty_points = Math.max(0, Number(customer.loyalty_points ?? 0) + pointsDeducted);
        customer.updated_at = new Date().toISOString();
        if (debtReduction > 0) {
          store.customer_payment_ledger.push({
            id: uuid(), customer_id: ret.customer_id, reference_type: 'cancel_return',
            reference_id: params.p_return_id, amount: debtReduction, balance_after: customer.debt,
            reason: `Hủy phiếu trả ${params.p_return_id} — hoàn lại nợ`, created_by: 'system',
            created_at: new Date().toISOString(),
          });
        }
        if (pointsDeducted > 0) {
          store.point_history.push({
            id: 'PH_CANCEL_RET_' + params.p_return_id, customer_id: ret.customer_id,
            date: new Date().toISOString(), type: 'cancel_return', amount: pointsDeducted,
            description: `Hoàn điểm do hủy phiếu trả ${params.p_return_id}`,
            order_id: ret.original_order_id,
          });
        }
      }
    }
    return { data: { ok: true, cancelled_return_id: params.p_return_id, points_restored: pointsDeducted }, error: null };
  }

  if (name === 'create_exchange_transaction') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:3830 — RETURNS jsonb
    const returnItems = Array.isArray(params.p_return_items) ? params.p_return_items : [];
    const exchangeItems = Array.isArray(params.p_exchange_items) ? params.p_exchange_items : [];
    const hasReturn = returnItems.length > 0;
    const hasExchange = exchangeItems.length > 0;
    if (!hasReturn && !hasExchange) {
      return { data: null, error: { code: 'P0001', message: 'Phiếu trống: phải có ít nhất 1 sản phẩm trả hoặc 1 sản phẩm đổi' } };
    }
    const customerIdClean = params.p_customer_id && params.p_customer_id !== '' && params.p_customer_id !== 'guest' ? params.p_customer_id : null;
    if (customerIdClean) {
      const customer = (store.customers ?? []).find((c: any) => c.id === customerIdClean);
      if (!customer) return { data: null, error: { code: 'P0001', message: `Khách hàng ${customerIdClean} không tồn tại` } };
    }
    const now = new Date().toISOString();
    let newTotalReturned: number | null = null;
    let netSpentDelta = 0;
    let netDebtDelta = 0;
    if (hasReturn) {
      if (!params.p_return_id) return { data: null, error: { code: 'P0001', message: 'return_id is required khi có hàng trả' } };
      if (!params.p_original_order_id) return { data: null, error: { code: 'P0001', message: 'original_order_id is required khi có hàng trả' } };
      const totalRefund = Number(params.p_total_refund_amount ?? 0);
      if (totalRefund < 0) return { data: null, error: { code: 'P0001', message: 'Tổng tiền hoàn không thể âm' } };
      const order = (store.orders ?? []).find((o: any) => o.id === params.p_original_order_id);
      if (!order) return { data: null, error: { code: 'P0001', message: `Đơn hàng gốc ${params.p_original_order_id} không tồn tại` } };
      newTotalReturned = Number(order.total_returned_amount ?? 0) + totalRefund;
      if (newTotalReturned > Number(order.total_amount ?? 0) + 0.01) {
        return { data: null, error: { code: 'P0001', message: `Tổng tiền trả (${newTotalReturned}) vượt quá tổng tiền đơn hàng (${order.total_amount})` } };
      }
      for (const item of returnItems) {
        const qty = Number(item.quantity ?? 0);
        if (qty <= 0) return { data: null, error: { code: 'P0001', message: `Số lượng trả của "${item.productName ?? item.productId}" phải > 0` } };
        const orderedQty = (store.order_items ?? []).filter((oi: any) => oi.order_id === params.p_original_order_id && oi.product_id === item.productId).reduce((s: number, oi: any) => s + Number(oi.quantity ?? 0), 0);
        if (orderedQty === 0) return { data: null, error: { code: 'P0001', message: `Sản phẩm "${item.productName ?? item.productId}" không có trong đơn hàng gốc` } };
        const alreadyReturned = (store.return_order_items ?? [])
          .filter((roi: any) => {
            const ro = (store.return_orders ?? []).find((r: any) => r.id === roi.return_order_id);
            return ro && ro.original_order_id === params.p_original_order_id && roi.product_id === item.productId && ro.status !== 'cancelled';
          })
          .reduce((s: number, roi: any) => s + Number(roi.quantity ?? 0), 0);
        if (alreadyReturned + qty > orderedQty + 0.001) {
          return { data: null, error: { code: 'P0001', message: `Trả vượt số đã bán cho "${item.productName ?? item.productId}"` } };
        }
      }
      const debtReduction = Number(params.p_debt_reduction ?? 0);
      const cashRefund = Number(params.p_cash_refund ?? 0);
      const grossRefund = params.p_gross_refund_amount != null ? Number(params.p_gross_refund_amount) : totalRefund;
      store.return_orders.push({
        id: params.p_return_id,
        original_order_id: params.p_original_order_id,
        date: now,
        customer_id: customerIdClean,
        customer_name: params.p_customer_name,
        total_refund_amount: totalRefund,
        refund_method: 'cash',
        debt_reduction: debtReduction,
        cash_refund: cashRefund,
        reason: params.p_reason ?? '',
        note: params.p_note ?? null,
        status: 'completed',
        gross_refund_amount: grossRefund,
        fee_percent: Number(params.p_fee_percent ?? 0),
        fee_amount: Number(params.p_fee_amount ?? 0),
        days_since_purchase: Number(params.p_days_since_purchase ?? 0),
        original_payment_method: params.p_original_payment_method ?? null,
        points_deducted: 0,
        created_at: now,
        updated_at: now,
      });
      for (const item of returnItems) {
        const lotId = item.lotId && item.lotId !== '' ? item.lotId : null;
        const lotCode = item.lotCode && item.lotCode !== '' ? item.lotCode : null;
        store.return_order_items.push({
          id: params.p_return_id + '_' + item.productId + '_' + (lotId ?? Math.floor(Math.random() * 1000000)),
          return_order_id: params.p_return_id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: Number(item.quantity ?? 0),
          unit_name: item.unitName ?? null,
          unit_price: Number(item.unitPrice ?? 0),
          subtotal: Number(item.subtotal ?? 0),
          reason: item.reason ?? '',
          lot_id: lotId,
          lot_code: lotCode,
        });
        const qty = Number(item.quantity ?? 0);
        if (qty <= 0) continue;
        const product = (store.products ?? []).find((p: any) => p.id === item.productId);
        if (lotId) {
          let lot = (store.product_lots ?? []).find((pl: any) => pl.id === lotId);
          if (lot) lot.quantity = Number(lot.quantity ?? 0) + qty;
          else {
            lot = { id: lotId, product_id: item.productId, code: lotCode ?? 'RECOVERED_RTN', expiry_date: null, quantity: qty, original_quantity: qty, created_at: now, updated_at: now };
            store.product_lots.push(lot);
          }
        } else if (product) {
          product.quantity = Number(product.quantity ?? 0) + qty;
        }
      }
      order.has_return = true;
      order.total_returned_amount = newTotalReturned;
      netDebtDelta -= debtReduction;
      netSpentDelta -= totalRefund;
      if (customerIdClean && debtReduction > 0) {
        store.customer_payment_ledger.push({
          id: uuid(), customer_id: customerIdClean, reference_type: 'return',
          reference_id: params.p_return_id, amount: -debtReduction, balance_after: 0,
          reason: `Trả hàng giảm nợ ${params.p_return_id}`, created_by: 'system', created_at: now,
        });
      }
    }
    if (hasExchange) {
      // ponytail: exchange order is upserted into store.orders (matching create_return_order mutation depth).
      const exchangeOrderId = params.p_exchange_order_id;
      const exchangeTotal = Number(params.p_exchange_total ?? 0);
      const exchangePaid = Number(params.p_exchange_paid_amount ?? 0);
      const exchangeDebt = Number(params.p_exchange_debt_recorded ?? 0);
      if (exchangeOrderId) {
        const existingIdx = (store.orders ?? []).findIndex((o: any) => o.id === exchangeOrderId);
        const row: any = {
          id: exchangeOrderId,
          order_code: exchangeOrderId,
          date: now,
          customer_id: customerIdClean,
          customer_name: params.p_customer_name ?? '',
          total_amount: exchangeTotal,
          paid_amount: exchangePaid,
          debt_recorded: exchangeDebt,
          payment_method: params.p_exchange_payment_method ?? 'cash',
          status: 'completed',
          points_earned: 0,
          points_redeemed: 0,
          rewards_redeemed: [],
          applied_promotions: [],
          note: params.p_note ?? null,
          has_return: false,
          total_returned_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (existingIdx >= 0) store.orders[existingIdx] = row;
        else store.orders.push(row);
        store.order_items = (store.order_items ?? []).filter((oi: any) => oi.order_id !== exchangeOrderId);
        for (const item of exchangeItems) {
          store.order_items.push({
            id: uuid(), order_id: exchangeOrderId, product_id: item.productId,
            product_name: item.productName, quantity: Number(item.quantity ?? 0),
            unit_name: item.unitName ?? null, price: Number(item.price ?? 0),
            lot_id: item.lotId ?? null, lot_code: item.lotCode ?? null,
            cost: Number(item.cost ?? 0), created_at: now,
          });
        }
      }
      netSpentDelta += exchangeTotal;
      netDebtDelta += exchangeDebt;
    }
    if (customerIdClean && (netSpentDelta !== 0 || netDebtDelta !== 0)) {
      const customer = (store.customers ?? []).find((c: any) => c.id === customerIdClean);
      if (customer) {
        customer.debt = Math.max(0, Number(customer.debt ?? 0) + netDebtDelta);
        customer.total_spent = Math.max(0, Number(customer.total_spent ?? 0) + netSpentDelta);
        customer.updated_at = now;
        if (netDebtDelta !== 0) {
          store.customer_payment_ledger.push({
            id: uuid(), customer_id: customerIdClean, reference_type: 'exchange',
            reference_id: params.p_return_id, amount: netDebtDelta, balance_after: customer.debt,
            reason: `Đổi hàng ${params.p_return_id} — chênh lệch công nợ`, created_by: 'system', created_at: now,
          });
        }
      }
    }
    return {
      data: {
        ok: true,
        has_return: hasReturn,
        has_exchange: hasExchange,
        return_id: hasReturn ? params.p_return_id : null,
        exchange_order_id: hasExchange ? params.p_exchange_order_id : null,
        new_total_returned: hasReturn ? newTotalReturned : null,
        offset_amount: Number(params.p_offset_amount ?? 0),
        cash_diff: Number(params.p_cash_diff ?? 0),
        net_spent_delta: netSpentDelta,
        net_debt_delta: netDebtDelta,
      },
      error: null,
    };
  }

  if (name === 'create_supplier_exchange') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:4800 — RETURNS jsonb (single p_payload jsonb)
    const payload = params.p_payload ?? {};
    const exchangeId = payload.id;
    if (!exchangeId) return { data: null, error: { code: 'P0001', message: 'Mã phiếu đổi trả không được để trống' } };
    const supplierId = payload.supplier_id;
    if (!supplierId) return { data: null, error: { code: 'P0001', message: 'Vui lòng chọn nhà cung cấp' } };
    const referenceReceiptId = payload.reference_receipt_id;
    if (!referenceReceiptId) return { data: null, error: { code: 'P0001', message: 'Vui lòng chọn phiếu nhập gốc' } };
    const supplier = (store.suppliers ?? []).find((s: any) => s.id === supplierId);
    if (!supplier) return { data: null, error: { code: 'P0001', message: `Nhà cung cấp ${supplierId} không tồn tại` } };
    const refReceipt = (store.import_receipts ?? []).find((r: any) => r.id === referenceReceiptId && r.supplier_id === supplierId);
    if (!refReceipt) return { data: null, error: { code: 'P0001', message: 'Phiếu nhập gốc không tồn tại hoặc không thuộc nhà cung cấp đã chọn' } };
    const returnItems = Array.isArray(payload.return_items) ? payload.return_items : [];
    if (returnItems.length === 0) return { data: null, error: { code: 'P0001', message: 'Phiếu phải có ít nhất 1 dòng hàng trả' } };
    const receivedItems = Array.isArray(payload.received_items) ? payload.received_items : [];
    if (receivedItems.length === 0) return { data: null, error: { code: 'P0001', message: 'Phiếu phải có ít nhất 1 dòng hàng nhận đổi' } };
    let returnTotal = 0;
    for (const it of returnItems) {
      const qty = Number(it.quantity ?? 0);
      const cost = Number(it.cost ?? 0);
      if (qty <= 0) return { data: null, error: { code: 'P0001', message: 'Số lượng trả phải > 0' } };
      const product = (store.products ?? []).find((p: any) => p.id === it.product_id);
      if (!product) return { data: null, error: { code: 'P0001', message: `Sản phẩm ${it.product_id} không tồn tại` } };
      if (!product.has_lots) return { data: null, error: { code: 'P0001', message: `Sản phẩm "${product.name}" không bật quản lý lô, không thể đổi trả theo lô` } };
      const lot = (store.product_lots ?? []).find((pl: any) => pl.id === it.lot_id && pl.product_id === it.product_id);
      if (!lot) return { data: null, error: { code: 'P0001', message: `Lô ${it.lot_id} của sản phẩm "${product.name}" không tồn tại trong kho` } };
      if (Number(lot.quantity ?? 0) < qty) return { data: null, error: { code: 'P0001', message: `Lô "${lot.code}" của "${product.name}" không đủ tồn để trả (còn ${lot.quantity}, cần ${qty})` } };
      returnTotal += qty * cost;
    }
    let receivedTotal = 0;
    for (const it of receivedItems) {
      const qty = Number(it.quantity ?? 0);
      const cost = Number(it.cost ?? 0);
      if (qty <= 0) return { data: null, error: { code: 'P0001', message: 'Số lượng nhận đổi phải > 0' } };
      const product = (store.products ?? []).find((p: any) => p.id === it.product_id);
      if (!product) return { data: null, error: { code: 'P0001', message: `Sản phẩm ${it.product_id} không tồn tại` } };
      if (!product.has_lots) return { data: null, error: { code: 'P0001', message: `Sản phẩm "${product.name}" không bật quản lý lô` } };
      const lotCode = String(it.lot_code ?? '').trim();
      if (!lotCode) return { data: null, error: { code: 'P0001', message: 'Số lô mới không được để trống' } };
      receivedTotal += qty * cost;
    }
    // Same-product rule: received ⊆ return
    const returnProductIds = new Set(returnItems.map((x: any) => x.product_id));
    for (const it of receivedItems) {
      if (!returnProductIds.has(it.product_id)) {
        return { data: null, error: { code: 'P0001', message: 'Chỉ cho phép đổi cùng sản phẩm. Mỗi sản phẩm trả phải có sản phẩm nhận đổi tương ứng' } };
      }
    }
    const debtAdjustment = receivedTotal - returnTotal;
    const now = new Date().toISOString();
    const code = payload.code ?? (() => { supplierExchangeCodeCounter += 1; return 'DH' + String(supplierExchangeCodeCounter).padStart(6, '0'); })();
    const status = payload.status ?? 'completed';
    const date = payload.date ?? now;
    store.supplier_exchanges.push({
      id: exchangeId, code, date, supplier_id: supplierId, supplier_name: supplier.name,
      reference_receipt_id: referenceReceiptId, status,
      return_total_value: returnTotal, received_total_value: receivedTotal,
      debt_adjustment: debtAdjustment, reason: payload.reason ?? '', note: payload.note ?? null,
      created_at: now, updated_at: now,
    });
    for (const it of returnItems) {
      const qty = Number(it.quantity ?? 0);
      const cost = Number(it.cost ?? 0);
      const product = (store.products ?? []).find((p: any) => p.id === it.product_id);
      const lot = (store.product_lots ?? []).find((pl: any) => pl.id === it.lot_id && pl.product_id === it.product_id);
      store.supplier_exchange_return_items.push({
        exchange_id: exchangeId, product_id: it.product_id, product_name: product?.name,
        lot_id: lot?.id, lot_code: lot?.code, expiry_date: lot?.expiry_date,
        quantity: qty, cost, total_value: qty * cost,
        reference_import_item_id: it.reference_import_item_id ?? null,
      });
      if (lot) lot.quantity = Number(lot.quantity ?? 0) - qty;
    }
    for (const it of receivedItems) {
      const qty = Number(it.quantity ?? 0);
      const cost = Number(it.cost ?? 0);
      const cleanLotCode = String(it.lot_code ?? '').trim();
      const cleanExpiry = it.expiry_date && it.expiry_date !== '' ? it.expiry_date : null;
      const product = (store.products ?? []).find((p: any) => p.id === it.product_id);
      let existingLot = (store.product_lots ?? []).find((pl: any) => pl.product_id === it.product_id && pl.code === cleanLotCode);
      let newLotId: string;
      if (existingLot) {
        newLotId = existingLot.id;
        existingLot.quantity = Number(existingLot.quantity ?? 0) + qty;
        existingLot.cost = cost;
        if (cleanExpiry) existingLot.expiry_date = cleanExpiry;
        existingLot.updated_at = now;
      } else {
        newLotId = 'lot_' + it.product_id + '_' + cleanLotCode.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.floor(Date.now() / 1000);
        store.product_lots.push({
          id: newLotId, product_id: it.product_id, code: cleanLotCode, expiry_date: cleanExpiry,
          quantity: qty, original_quantity: qty, cost, created_at: now, updated_at: now,
        });
      }
      store.supplier_exchange_received_items.push({
        exchange_id: exchangeId, product_id: it.product_id, product_name: product?.name,
        lot_id: newLotId, lot_code: cleanLotCode, expiry_date: cleanExpiry,
        quantity: qty, cost, total_value: qty * cost,
      });
    }
    if (debtAdjustment !== 0) {
      supplier.debt = Math.max(0, Number(supplier.debt ?? 0) + debtAdjustment);
      supplier.updated_at = now;
      store.supplier_payment_ledger.push({
        id: uuid(), supplier_id: supplierId, reference_type: 'exchange',
        reference_id: exchangeId, amount: debtAdjustment, balance_after: supplier.debt,
        reason: `Đổi trả NCC ${exchangeId} — chênh lệch công nợ`, created_by: 'system', created_at: now,
      });
    }
    return {
      data: {
        ok: true, exchange_id: exchangeId, code, status,
        return_total_value: returnTotal, received_total_value: receivedTotal,
        debt_adjustment: debtAdjustment,
      },
      error: null,
    };
  }

  if (name === 'cancel_supplier_exchange') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:3051 — RETURNS jsonb
    if (!params.p_exchange_id) return { data: null, error: { code: 'P0001', message: 'exchange_id is required' } };
    const ex = (store.supplier_exchanges ?? []).find((e: any) => e.id === params.p_exchange_id);
    if (!ex) return { data: null, error: { code: 'P0001', message: `Phiếu đổi trả ${params.p_exchange_id} không tồn tại` } };
    if (ex.status === 'cancelled') {
      return { data: { ok: true, skipped: true, reason: 'already cancelled' }, error: null };
    }
    // Restore return-item lots (+qty)
    for (const it of (store.supplier_exchange_return_items ?? []).filter((r: any) => r.exchange_id === params.p_exchange_id)) {
      const qty = Number(it.quantity ?? 0);
      let lot = (store.product_lots ?? []).find((pl: any) => pl.id === it.lot_id);
      if (lot) {
        lot.quantity = Number(lot.quantity ?? 0) + qty;
        lot.updated_at = new Date().toISOString();
      } else if (it.lot_id) {
        store.product_lots.push({
          id: it.lot_id, product_id: it.product_id, code: it.lot_code ?? 'RECOVERED_DTH',
          expiry_date: it.expiry_date, quantity: qty, original_quantity: qty, cost: it.cost,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
      }
    }
    // Subtract received-item lots (-qty) with stock guard
    for (const it of (store.supplier_exchange_received_items ?? []).filter((r: any) => r.exchange_id === params.p_exchange_id)) {
      const qty = Number(it.quantity ?? 0);
      const lot = (store.product_lots ?? []).find((pl: any) => pl.id === it.lot_id);
      if (!lot) return { data: null, error: { code: 'P0001', message: `Lô mới ${it.lot_id} không còn tồn tại, không thể hủy phiếu` } };
      if (Number(lot.quantity ?? 0) < qty) {
        return { data: null, error: { code: 'P0001', message: `Không thể hủy phiếu: lô mới "${it.lot_code}" đã bán giảm (còn ${lot.quantity}, cần trừ ${qty})` } };
      }
      lot.quantity = Number(lot.quantity ?? 0) - qty;
      lot.updated_at = new Date().toISOString();
    }
    const debtAdj = Number(ex.debt_adjustment ?? 0);
    const supplier = (store.suppliers ?? []).find((s: any) => s.id === ex.supplier_id);
    if (supplier && debtAdj !== 0) {
      supplier.debt = Math.max(0, Number(supplier.debt ?? 0) - debtAdj);
      supplier.updated_at = new Date().toISOString();
      store.supplier_payment_ledger.push({
        id: uuid(), supplier_id: ex.supplier_id, reference_type: 'exchange',
        reference_id: params.p_exchange_id, amount: -debtAdj, balance_after: supplier.debt,
        reason: `Hủy phiếu đổi trả NCC ${params.p_exchange_id} — đảo ngược công nợ`,
        created_by: 'system', created_at: new Date().toISOString(),
      });
    }
    ex.status = 'cancelled';
    ex.updated_at = new Date().toISOString();
    return { data: { ok: true, exchange_id: params.p_exchange_id, status: 'cancelled' }, error: null };
  }

  // ========== End Domain H4 ==========

  // ========== Domain H7 — Imports (Recovery Wave-04) ==========

  if (name === 'get_import_stats') {
    const toVN = (v: any) => new Date(v).toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
    const from = params.p_from_date ?? null;
    const to = params.p_to_date ?? null;
    const rows = (store.import_receipts ?? []).filter((r: any) => {
      if (from && toVN(r.date) < String(from)) return false;
      if (to && toVN(r.date) > String(to)) return false;
      return true;
    });
    const totalCount = rows.length;
    const totalCost = rows.reduce((s: number, r: any) => s + Number(r.total_cost ?? 0), 0);
    const totalShipping = rows.reduce((s: number, r: any) => s + Number(r.shipping_cost ?? 0), 0);
    const totalPaid = rows.reduce((s: number, r: any) => s + Number(r.paid_amount ?? 0), 0);
    const totalDebt = rows.reduce((s: number, r: any) => s + Number(r.debt_recorded ?? 0), 0);
    return { data: { totalCount, totalCost, totalShipping, totalPaid, totalDebt }, error: null };
  }

  if (name === 'get_import_receipt_count_by_date') {
    const toVN = (v: any) => new Date(v).toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
    const count = (store.import_receipts ?? []).filter((r: any) => toVN(r.date) === String(params.p_date)).length;
    return { data: count, error: null };
  }

  if (name === 'get_import_receipts_by_supplier_id') {
    const limit = params.p_limit ?? 100;
    const rows = (store.import_receipts ?? [])
      .filter((r: any) => r.supplier_id === params.p_supplier_id)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map((r: any) => ({ ...r, import_items: (store.import_items ?? []).filter((i: any) => i.receipt_id === r.id) }));
    return { data: rows, error: null };
  }

  if (name === 'get_import_receipts_by_product_and_lot') {
    const productId = params.p_product_id;
    const lotId = params.p_lot_id ?? null;
    const lotCodes = new Set<string>();
    if (lotId) {
      const lot = (store.product_lots ?? []).find((pl: any) => pl.id === lotId);
      if (lot?.code) lotCodes.add(lot.code);
      lotCodes.add(lotId);
    }
    const matchedItems = (store.import_items ?? []).filter((i: any) => {
      if (i.product_id !== productId) return false;
      if (!lotId) return true;
      return i.lot_code && lotCodes.has(String(i.lot_code));
    });
    const receiptIds = new Set(matchedItems.map((i: any) => i.receipt_id));
    const rows = (store.import_receipts ?? [])
      .filter((r: any) => receiptIds.has(r.id))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((r: any) => ({ ...r, import_items: matchedItems.filter((i: any) => i.receipt_id === r.id) }));
    return { data: rows, error: null };
  }

  if (name === 'filter_import_receipts_rpc') {
    const term = (params.p_search_term ?? '').toLowerCase();
    const page = params.p_page ?? 1;
    const pageSize = params.p_page_size ?? 20;
    const fromDate = params.p_from_date ?? null;
    const toDate = params.p_to_date ?? null;
    const supplierId = params.p_supplier_id ?? null;
    const status = params.p_status ?? null;
    const toVN = (v: any) => new Date(v).toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
    let rows = (store.import_receipts ?? []).slice();
    rows = rows.filter((r: any) => {
      if (term && !String(r.invoice_number ?? '').toLowerCase().includes(term)) return false;
      if (fromDate && toVN(r.date) < String(fromDate)) return false;
      if (toDate && toVN(r.date) > String(toDate)) return false;
      if (supplierId && r.supplier_id !== supplierId) return false;
      if (status != null && status !== '' && r.status !== status) return false;
      return true;
    });
    rows.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = rows.length;
    const offset = (page - 1) * pageSize;
    return { data: { receipts: rows.slice(offset, offset + pageSize).map((r: any) => ({ ...r, import_items: [] })), totalCount: total }, error: null };
  }

  if (name === 'process_import_v2') {
    const payload = params.p_payload ?? {};
    const receiptId = payload.id;
    if (!receiptId) return { data: null, error: { code: 'P0001', message: 'Mã phiếu nhập hàng không được để trống' } };
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length === 0) return { data: null, error: { code: 'P0001', message: 'Danh sách sản phẩm nhập không được để trống' } };
    const now = new Date().toISOString();
    const date = payload.date ? new Date(payload.date).toISOString() : now;
    const supplierId = payload.supplier_id ?? null;
    const supplierName = payload.supplier_name ?? 'N/A';
    const totalCost = Number(payload.total_cost ?? 0);
    const shippingCost = Number(payload.shipping_cost ?? 0);
    const discountTotal = Number(payload.discount_total ?? 0);
    const paidAmount = Number(payload.paid_amount ?? 0);
    const debtRecorded = Number(payload.debt_recorded ?? 0);
    const status = payload.status ?? 'completed';
    const note = payload.note ?? null;
    const invoiceNumber = payload.invoice_number ?? null;

    const existingIdx = (store.import_receipts ?? []).findIndex((r: any) => r.id === receiptId);
    if (existingIdx >= 0) {
      const existing = store.import_receipts[existingIdx];
      if (existing.status === 'completed') return { data: null, error: { code: 'P0001', message: `Phiếu nhập ${receiptId} đã hoàn thành trước đó, không thể ghi đè.` } };
      store.import_items = (store.import_items ?? []).filter((i: any) => i.receipt_id !== receiptId);
      store.import_receipts.splice(existingIdx, 1);
    }

    const totalValue = items.reduce((s: number, it: any) => s + Math.max(0, Number(it.quantity ?? 0) * Number(it.cost ?? 0) - Number(it.discount ?? 0)), 0);
    const shippingFactor = totalValue > 0 ? shippingCost / totalValue : 0;

    store.import_receipts.push({
      id: receiptId,
      invoice_number: invoiceNumber,
      date,
      supplier_id: supplierId,
      supplier_name: supplierName,
      total_cost: totalCost,
      shipping_cost: shippingCost,
      discount_total: discountTotal,
      paid_amount: paidAmount,
      debt_recorded: debtRecorded,
      status,
      note,
      created_at: now,
      updated_at: now,
    });

    const affectedProducts: string[] = [];
    let totalAddedQty = 0;

    for (const it of items) {
      const productId = it.product_id;
      const productName = it.product_name ?? '';
      const qty = Number(it.quantity ?? 0);
      const cost = Number(it.cost ?? 0);
      const discount = Number(it.discount ?? 0);
      const lotCodeRaw = it.lot_code ?? null;
      const lotCode = lotCodeRaw ? String(lotCodeRaw).trim() : null;
      const expiryDate = it.expiry_date && String(it.expiry_date) !== '' ? String(it.expiry_date).slice(0, 10) : null;

      const lineNet = qty > 0 ? Math.max(0, cost * qty - discount) / qty : 0;
      const adjustedCost = Math.round(lineNet * (1 + shippingFactor) * 100) / 100;

      const product = (store.products ?? []).find((p: any) => p.id === productId);
      if (!product) return { data: null, error: { code: 'P0001', message: `Sản phẩm ${productId} không tồn tại trong hệ thống` } };

      store.import_items.push({
        id: uuid(),
        receipt_id: receiptId,
        product_id: productId,
        product_name: productName,
        quantity: qty,
        cost,
        discount,
        adjusted_cost: adjustedCost,
        lot_code: lotCode,
        expiry_date: expiryDate,
        created_at: now,
      });

      if (status === 'completed') {
        const existingQty = Number(product.quantity ?? 0);
        const existingCost = Number(product.cost ?? 0);
        const newQty = existingQty + qty;
        const newCost = newQty > 0 ? Math.round((existingQty * existingCost + qty * adjustedCost) / newQty * 100) / 100 : adjustedCost;
        product.quantity = newQty;
        product.cost = newCost;

        if (product.has_lots) {
          if (!lotCode) return { data: null, error: { code: 'P0001', message: `Sản phẩm ${productName} (ID: ${productId}) đang bật quản lý lô, bắt buộc phải nhập số lô` } };
          const existingLot = (store.product_lots ?? []).find((pl: any) => pl.product_id === productId && pl.code === lotCode);
          if (existingLot) {
            const existingLotQty = Number(existingLot.quantity ?? 0);
            const existingLotCost = Number(existingLot.cost ?? 0);
            const newLotQty = existingLotQty + qty;
            const newLotCost = newLotQty > 0 ? Math.round((existingLotQty * existingLotCost + qty * adjustedCost) / newLotQty * 100) / 100 : adjustedCost;
            existingLot.quantity = newLotQty;
            existingLot.cost = newLotCost;
            if (expiryDate) existingLot.expiry_date = expiryDate;
            existingLot.updated_at = now;
          } else {
            const lotTs = Math.floor(Date.now() / 1000);
            const newLotId = 'lot_' + productId + '_' + lotCode.replace(/[^a-zA-Z0-9]/g, '_') + '_' + lotTs;
            store.product_lots.push({
              id: newLotId,
              product_id: productId,
              code: lotCode,
              expiry_date: expiryDate,
              quantity: qty,
              original_quantity: qty,
              cost: adjustedCost,
              created_at: now,
              updated_at: now,
            });
          }
          const lots = (store.product_lots ?? []).filter((pl: any) => pl.product_id === productId);
          product.quantity = lots.reduce((s: number, pl: any) => s + Number(pl.quantity ?? 0), 0);
        }

        affectedProducts.push(productId);
        totalAddedQty += qty;
      }
    }

    if (status === 'completed' && debtRecorded > 0 && supplierId) {
      const supplier = (store.suppliers ?? []).find((s: any) => s.id === supplierId);
      if (supplier) {
        supplier.debt = Number(supplier.debt ?? 0) + debtRecorded;
        supplier.updated_at = now;
      }
    }

    return { data: { receipt_id: receiptId, affected_products: affectedProducts, total_qty_added: totalAddedQty, status }, error: null };
  }

  if (name === 'delete_import_v2') {
    const receiptId = params.p_receipt_id;
    const receiptIdx = (store.import_receipts ?? []).findIndex((r: any) => r.id === receiptId);
    if (receiptIdx < 0) return { data: null, error: { code: 'P0001', message: `Phiếu nhập ${receiptId} không tồn tại trong hệ thống` } };
    const receipt = store.import_receipts[receiptIdx];

    if (receipt.status === 'draft') {
      store.import_items = (store.import_items ?? []).filter((i: any) => i.receipt_id !== receiptId);
      store.import_receipts.splice(receiptIdx, 1);
      return { data: { receipt_id: receiptId, status: 'draft_deleted' }, error: null };
    }

    const allowNegative = false;
    const affectedProducts: string[] = [];
    let totalRemovedQty = 0;
    const items = (store.import_items ?? []).filter((i: any) => i.receipt_id === receiptId);

    for (const item of items) {
      const productId = item.product_id;
      const qty = Number(item.quantity ?? 0);
      const itemCost = Number(item.adjusted_cost ?? item.cost ?? 0);
      const product = (store.products ?? []).find((p: any) => p.id === productId);
      if (!product) return { data: null, error: { code: 'P0001', message: `Sản phẩm ${productId} không tồn tại` } };
      const currentQty = Number(product.quantity ?? 0);
      const currentCost = Number(product.cost ?? 0);

      if (!allowNegative && currentQty < qty) {
        return { data: null, error: { code: 'P0001', message: `Không thể xóa phiếu nhập ${receiptId}: Sản phẩm ${item.product_name} đã bán vượt quá số lượng nhập (Tồn hiện tại ${currentQty}, yêu cầu trả ${qty})` } };
      }
      const newQty = Math.max(0, currentQty - qty);
      let newCost = 0;
      if (newQty > 0) {
        newCost = Math.max(0, Math.round((currentQty * currentCost - qty * itemCost) / newQty * 100) / 100);
      }
      product.quantity = newQty;
      product.cost = newCost;

      if (product.has_lots) {
        const lotCode = item.lot_code;
        const existingLot = (store.product_lots ?? []).find((pl: any) => pl.product_id === productId && pl.code === lotCode);
        if (!allowNegative && (!existingLot || Number(existingLot.quantity ?? 0) < qty)) {
          return { data: null, error: { code: 'P0001', message: `Không thể xóa phiếu nhập ${receiptId}: Lô ${lotCode} của sản phẩm ${item.product_name} không đủ tồn kho để giảm trừ (Lô hiện có ${existingLot?.quantity ?? 0}, yêu cầu trừ ${qty})` } };
        }
        const existingLotQty = Number(existingLot?.quantity ?? 0);
        const existingLotCost = Number(existingLot?.cost ?? 0);
        const newLotQty = Math.max(0, existingLotQty - qty);
        let newLotCost = 0;
        if (newLotQty > 0) {
          newLotCost = Math.max(0, Math.round((existingLotQty * existingLotCost - qty * itemCost) / newLotQty * 100) / 100);
        }
        if (existingLot) {
          existingLot.quantity = newLotQty;
          existingLot.cost = newLotCost;
          existingLot.updated_at = new Date().toISOString();
          if (newLotQty <= 0) {
            store.product_lots = (store.product_lots ?? []).filter((pl: any) => pl !== existingLot);
          }
        }
        const lots = (store.product_lots ?? []).filter((pl: any) => pl.product_id === productId);
        product.quantity = lots.reduce((s: number, pl: any) => s + Number(pl.quantity ?? 0), 0);
      }

      affectedProducts.push(productId);
      totalRemovedQty += qty;
    }

    if (Number(receipt.debt_recorded ?? 0) > 0 && receipt.supplier_id) {
      const supplier = (store.suppliers ?? []).find((s: any) => s.id === receipt.supplier_id);
      if (supplier) {
        supplier.debt = Math.max(0, Number(supplier.debt ?? 0) - Number(receipt.debt_recorded));
        supplier.updated_at = new Date().toISOString();
      }
    }

    store.import_items = (store.import_items ?? []).filter((i: any) => i.receipt_id !== receiptId);
    store.import_receipts.splice(receiptIdx, 1);

    return { data: { receipt_id: receiptId, affected_products: affectedProducts, total_qty_removed: totalRemovedQty, status: 'completed_deleted' }, error: null };
  }

  if (name === 'update_import_v2') {
    const receiptId = params.p_receipt_id;
    if (!receiptId) return { data: null, error: { code: 'P0001', message: 'Mã phiếu nhập cần sửa không được để trống' } };
    const payload = { ...(params.p_payload ?? {}), id: receiptId };
    const del = await rpc('delete_import_v2', { p_receipt_id: receiptId });
    if (del.error) return del;
    return rpc('process_import_v2', { p_payload: payload });
  }

  // ========== End Domain H7 ==========

  // ========== Domain H8 — Disposals (Recovery Wave-04) ==========

  if (name === 'get_disposal_auto_code') {
    const count = (store.disposals ?? []).length;
    return { data: 'XH' + String(count + 1).padStart(6, '0'), error: null };
  }

  if (name === 'complete_disposal') {
    const disposalId = params.p_disposal_id;
    const disposal = (store.disposals ?? []).find((d: any) => d.id === disposalId);
    if (!disposal) return { data: null, error: { code: 'P0001', message: `Phiếu xuất hủy không tồn tại (${disposalId})` } };
    if (disposal.status === 'COMPLETED') return { data: null, error: { code: 'P0001', message: 'Phiếu xuất hủy đã hoàn thành trước đó' } };
    const now = new Date().toISOString();
    const items = (store.disposal_items ?? []).filter((di: any) => di.disposal_id === disposalId);

    for (const item of items) {
      const productId = item.product_id;
      const qty = Number(item.quantity ?? 0);
      const product = (store.products ?? []).find((p: any) => p.id === productId);
      if (!product) return { data: null, error: { code: 'P0001', message: `Sản phẩm ${productId} không tồn tại trong kho` } };
      const productQty = Number(product.quantity ?? 0);
      if (productQty < qty) return { data: null, error: { code: 'P0001', message: `Sản phẩm ${productId} không đủ tồn kho` } };

      if (item.lot_id) {
        const lot = (store.product_lots ?? []).find((pl: any) => pl.id === item.lot_id);
        if (!lot) return { data: null, error: { code: 'P0001', message: `Lô ${item.lot_id} không tồn tại` } };
        const lotQty = Number(lot.quantity ?? 0);
        if (lotQty < qty) return { data: null, error: { code: 'P0001', message: `Lô ${item.lot_id} không đủ số lượng` } };
        lot.quantity = lotQty - qty;
        lot.updated_at = now;
        const lots = (store.product_lots ?? []).filter((pl: any) => pl.product_id === productId);
        product.quantity = lots.reduce((s: number, pl: any) => s + Number(pl.quantity ?? 0), 0);
        product.updated_at = now;
      } else {
        product.quantity = productQty - qty;
        product.updated_at = now;
      }
    }

    disposal.status = 'COMPLETED';
    disposal.updated_at = now;
    return { data: [{ id: disposal.id, code: disposal.code, status: disposal.status }], error: null };
  }

  if (name === 'delete_disposal_with_restore') {
    const disposalId = params.p_disposal_id;
    const disposalIdx = (store.disposals ?? []).findIndex((d: any) => d.id === disposalId);
    if (disposalIdx < 0) return { data: null, error: { code: 'P0001', message: 'Phiếu xuất hủy không tồn tại' } };
    const disposal = store.disposals[disposalIdx];
    const now = new Date().toISOString();

    if (disposal.status === 'COMPLETED') {
      const items = (store.disposal_items ?? []).filter((di: any) => di.disposal_id === disposalId);
      for (const item of items) {
        const productId = item.product_id;
        const qty = Number(item.quantity ?? 0);
        const product = (store.products ?? []).find((p: any) => p.id === productId);
        if (item.lot_id) {
          let lot = (store.product_lots ?? []).find((pl: any) => pl.id === item.lot_id);
          if (lot) {
            lot.quantity = Number(lot.quantity ?? 0) + qty;
            lot.updated_at = now;
          } else {
            store.product_lots.push({
              id: item.lot_id,
              product_id: productId,
              code: item.lot_code ?? 'RECOVERED_DSP',
              expiry_date: item.expiry_date,
              quantity: qty,
              original_quantity: qty,
              cost: item.cost_price ?? 0,
              created_at: now,
              updated_at: now,
            });
          }
          const lots = (store.product_lots ?? []).filter((pl: any) => pl.product_id === productId);
          if (product) product.quantity = lots.reduce((s: number, pl: any) => s + Number(pl.quantity ?? 0), 0);
        } else if (product) {
          product.quantity = Number(product.quantity ?? 0) + qty;
          product.updated_at = now;
        }
      }
    }

    store.disposal_items = (store.disposal_items ?? []).filter((di: any) => di.disposal_id !== disposalId);
    store.disposals.splice(disposalIdx, 1);
    return { data: null, error: null };
  }

  if (name === 'filter_disposals_rpc') {
    const term = (params.p_search_term ?? '').toLowerCase();
    const page = params.p_page ?? 1;
    const pageSize = params.p_page_size ?? 20;
    const fromDate = params.p_from_date ?? null;
    const toDate = params.p_to_date ?? null;
    const status = params.p_status ?? null;
    const toVN = (v: any) => new Date(v).toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
    let rows = (store.disposals ?? []).slice();
    rows = rows.filter((d: any) => {
      if (term && !String(d.code ?? '').toLowerCase().includes(term)) return false;
      if (fromDate && toVN(d.date) < String(fromDate)) return false;
      if (toDate && toVN(d.date) > String(toDate)) return false;
      if (status != null && status !== '' && d.status !== status) return false;
      return true;
    });
    rows.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = rows.length;
    const offset = (page - 1) * pageSize;
    const paged = rows.slice(offset, offset + pageSize).map((d: any) => {
      const items = (store.disposal_items ?? [])
        .filter((di: any) => di.disposal_id === d.id)
        .map((di: any) => ({
          id: di.id,
          disposal_id: di.disposal_id,
          product_id: di.product_id,
          product_code: di.product_code,
          product_name: di.product_name,
          quantity: di.quantity,
          cost_price: di.cost_price,
          total_value: di.total_value,
          lot_id: di.lot_id,
          lot_code: di.lot_code,
          expiry_date: di.expiry_date,
          category_id: di.category_id,
          category_name: di.category_name,
          brand_id: di.brand_id,
          brand_name: di.brand_name,
        }));
      return { ...d, disposal_items: items };
    });
    return { data: { disposals: paged, totalCount: total }, error: null };
  }

  // ========== End Domain H8 ==========

  // ========== Domain H9 — Reports & Dashboard (Recovery Wave-05) ==========

  if (name === 'get_dashboard_summary') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:7090 — RETURNS json
    const fromDate = params.p_from || null;
    const toDate = params.p_to || null;
    const toVN = (v: any) => new Date(v).toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
    const fmtDM = (sv: string) => sv.slice(8, 10) + '/' + sv.slice(5, 7);
    const inRange = (d: string) => {
      const s = toVN(d);
      if (fromDate && s < String(fromDate)) return false;
      if (toDate && s > String(toDate)) return false;
      return true;
    };
    const orders = store.orders ?? [];
    const orderItems = store.order_items ?? [];
    const products = store.products ?? [];
    const customers = store.customers ?? [];

    const revMap: Record<string, { date: string; revenue: number; profit: number; orders: number }> = {};
    for (const o of orders) {
      if (!inRange(o.date)) continue;
      const key = fmtDM(toVN(o.date));
      if (!revMap[key]) revMap[key] = { date: key, revenue: 0, profit: 0, orders: 0 };
      const revenue = Number(o.total_amount ?? 0);
      const cost = orderItems
        .filter((oi: any) => oi.order_id === o.id)
        .reduce((s: number, oi: any) => {
          const p = products.find((pr: any) => pr.id === oi.product_id);
          return s + Number(p?.cost ?? 0) * Number(oi.quantity ?? 0);
        }, 0);
      revMap[key].revenue += revenue;
      revMap[key].profit += revenue - cost;
      revMap[key].orders += 1;
    }
    const revenueData = Object.values(revMap).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

    const topProductMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const oi of orderItems) {
      const o = orders.find((x: any) => x.id === oi.order_id);
      if (!o || !inRange(o.date)) continue;
      const key = oi.product_id ?? '';
      if (!topProductMap[key]) topProductMap[key] = { name: oi.product_name ?? 'Không xác định', quantity: 0, revenue: 0 };
      const qty = Number(oi.quantity ?? 0);
      topProductMap[key].quantity += qty;
      topProductMap[key].revenue += Number(oi.price ?? 0) * qty;
    }
    const topProducts = Object.values(topProductMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10);

    const inventoryValue = products.reduce((s: number, p: any) => s + Number(p.cost ?? 0) * Number(p.quantity ?? 0), 0);
    const inventoryRetailValue = products.reduce((s: number, p: any) => s + Number(p.price ?? 0) * Number(p.quantity ?? 0), 0);

    const debtCustomers = customers
      .filter((c: any) => Number(c.debt ?? 0) > 0)
      .sort((a: any, b: any) => Number(b.debt) - Number(a.debt))
      .map((c: any) => ({ ...c }));

    const topCustomers = customers
      .slice()
      .sort((a: any, b: any) => Number(b.total_spent ?? 0) - Number(a.total_spent ?? 0))
      .slice(0, 10)
      .map((c: any) => ({ ...c, order_count: orders.filter((o: any) => o.customer_id === c.id).length }));

    const totalDebt = customers.reduce((s: number, c: any) => s + Number(c.debt ?? 0), 0);
    const totalCustomers = customers.length;
    const totalProducts = products.length;
    const activeProducts = products.filter((p: any) => Number(p.quantity ?? 0) > 0).length;

    const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
    const yesterday = addDays(today, -1);
    const todayOrders = orders.filter((o: any) => toVN(o.date) === today);
    const yesterdayOrders = orders.filter((o: any) => toVN(o.date) === yesterday);
    const todayRevenue = todayOrders.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0);
    const todaySoldProducts = todayOrders.reduce((s: number, o: any) => s + orderItems.filter((oi: any) => oi.order_id === o.id).reduce((ss: number, oi: any) => ss + Number(oi.quantity ?? 0), 0), 0);
    const todayCustomers = new Set(todayOrders.map((o: any) => o.customer_id).filter(Boolean)).size;
    const yesterdayRevenue = yesterdayOrders.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0);

    return {
      data: {
        revenueData,
        topProducts,
        inventoryValue,
        inventoryRetailValue,
        debtCustomers,
        topCustomers,
        totalDebt,
        totalCustomers,
        totalProducts,
        activeProducts,
        todayRevenue,
        todayOrders: todayOrders.length,
        todaySoldProducts,
        todayCustomers,
        yesterdayRevenue,
      },
      error: null,
    };
  }

  if (name === 'get_profit_report') {
    // Canonical: 20250703000000_baseline_pre_tenant_schema.sql:8151 — RETURNS json
    const startDate = String(params.p_start_date ?? '');
    const endDate = String(params.p_end_date ?? '');
    const statusFilter = params.p_status ?? 'all';
    const paymentFilter = params.p_payment_method ?? '';
    const productKw = String(params.p_product_keyword ?? '').toLowerCase();
    const customerKw = String(params.p_customer_keyword ?? '').toLowerCase();
    const compareMode = params.p_compare_mode ?? 'prev';
    const toVN = (v: any) => new Date(v).toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
    const fmtDM = (sv: string) => sv.slice(8, 10) + '/' + sv.slice(5, 7);
    const inRange = (d: string, from: string, to: string) => {
      const s = toVN(d);
      return s >= from && s <= to;
    };

    const orders = store.orders ?? [];
    const orderItems = store.order_items ?? [];
    const products = store.products ?? [];
    const returnOrders = store.return_orders ?? [];
    const returnOrderItems = store.return_order_items ?? [];

    const spanDays = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
    const compareStart = compareMode === 'samePeriod' ? addMonths(startDate, -12) : addDays(startDate, -spanDays);
    const compareEnd = compareMode === 'samePeriod' ? addMonths(endDate, -12) : addDays(startDate, -1);

    const filteredOrders = orders.filter((o: any) => {
      if (!inRange(String(o.date), startDate, endDate)) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (paymentFilter && String(o.payment_method ?? '') !== paymentFilter) return false;
      if (customerKw && !String(o.customer_name ?? '').toLowerCase().includes(customerKw)) return false;
      if (productKw && !orderItems.some((oi: any) => oi.order_id === o.id && String(oi.product_name ?? '').toLowerCase().includes(productKw))) return false;
      return true;
    });
    const activeOrders = filteredOrders.filter((o: any) => o.status !== 'cancelled');

    const compareOrders = orders.filter((o: any) => o.status !== 'cancelled' && inRange(String(o.date), compareStart, compareEnd));

    const returnedMap: Record<string, Record<string, number>> = {};
    for (const ro of returnOrders) {
      if (ro.status === 'cancelled') continue;
      const items = returnOrderItems.filter((roi: any) => roi.return_order_id === ro.id);
      for (const roi of items) {
        const oid = ro.original_order_id ?? '';
        const pid = roi.product_id ?? '';
        returnedMap[oid] = returnedMap[oid] || {};
        returnedMap[oid][pid] = (returnedMap[oid][pid] || 0) + Number(roi.quantity ?? 0);
      }
    }

    const makeItems = (sourceOrders: any[]) => {
      const items: any[] = [];
      for (const o of sourceOrders) {
        const ois = orderItems.filter((oi: any) => oi.order_id === o.id);
        for (const oi of ois) {
          const product = products.find((p: any) => p.id === oi.product_id);
          const unitCost = Number(oi.cost ?? product?.cost ?? 0);
          const returned = returnedMap[o.id]?.[oi.product_id] ?? 0;
          const netQty = Math.max(0, Number(oi.quantity ?? 0) - returned);
          const itemRevenue = Number(oi.price ?? 0) * netQty;
          const itemCost = unitCost * netQty;
          items.push({
            order_id: o.id,
            date: o.date,
            customer_id: o.customer_id,
            customer_name: o.customer_name,
            product_id: oi.product_id,
            product_name: oi.product_name,
            quantity: Number(oi.quantity ?? 0),
            price: Number(oi.price ?? 0),
            unitCost,
            returned,
            netQty,
            itemRevenue,
            itemCost,
          });
        }
      }
      return items;
    };

    const allItems = makeItems(activeOrders);
    const compareItems = makeItems(compareOrders);

    const sumRevenue = (ords: any[]) => ords.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0), 0);
    const activeRevenue = sumRevenue(activeOrders);
    const activeCost = allItems.reduce((s: number, it: any) => s + it.itemCost, 0);
    const profit = activeRevenue - activeCost;
    const margin = activeRevenue > 0 ? (profit / activeRevenue) * 100 : 0;
    const prevRevenue = sumRevenue(compareOrders);
    const prevCost = compareItems.reduce((s: number, it: any) => s + it.itemCost, 0);
    const prevProfit = prevRevenue - prevCost;
    const profitChange = prevProfit > 0 ? ((profit - prevProfit) / prevProfit) * 100 : 0;
    const summary = { totalRevenue: activeRevenue, totalCost: activeCost, profit, margin, prevRevenue, prevCost, prevProfit, profitChange };

    const daySet = new Set<string>();
    for (const o of activeOrders) daySet.add(fmtDM(toVN(o.date)));
    for (const it of allItems) daySet.add(fmtDM(toVN(it.date)));
    for (const o of compareOrders) daySet.add(fmtDM(toVN(o.date)));
    for (const it of compareItems) daySet.add(fmtDM(toVN(it.date)));
    const dailyProfit = Array.from(daySet).sort().map((d: string) => {
      const currentRevenue = activeOrders
        .filter((o: any) => fmtDM(toVN(o.date)) === d)
        .reduce((s: number, o: any) => s + Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0), 0);
      const currentCost = allItems
        .filter((it: any) => fmtDM(toVN(it.date)) === d)
        .reduce((s: number, it: any) => s + it.itemCost, 0);
      const prevRevenue = compareOrders
        .filter((o: any) => fmtDM(toVN(o.date)) === d)
        .reduce((s: number, o: any) => s + Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0), 0);
      const prevCost = compareItems
        .filter((it: any) => fmtDM(toVN(it.date)) === d)
        .reduce((s: number, it: any) => s + it.itemCost, 0);
      return { date: d, currentRevenue, currentProfit: currentRevenue - currentCost, prevRevenue, prevProfit: prevRevenue - prevCost };
    });

    const profitDetails = allItems
      .map((it: any) => ({
        date: fmtDM(toVN(it.date)),
        orderId: it.order_id,
        productName: it.product_name ?? '',
        revenue: it.itemRevenue,
        cost: it.itemCost,
        profit: it.itemRevenue - it.itemCost,
        margin: it.itemRevenue > 0 ? ((it.itemRevenue - it.itemCost) / it.itemRevenue) * 100 : 0,
      }))
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

    const prodAgg: Record<string, { key: string; label: string; revenue: number; cost: number; profit: number; count: number }> = {};
    for (const it of allItems) {
      const key = it.product_id ?? '';
      if (!prodAgg[key]) prodAgg[key] = { key, label: it.product_name ?? 'Không xác định', revenue: 0, cost: 0, profit: 0, count: 0 };
      prodAgg[key].revenue += it.itemRevenue;
      prodAgg[key].cost += it.itemCost;
      prodAgg[key].profit += it.itemRevenue - it.itemCost;
      prodAgg[key].count += it.netQty;
    }
    const groupedByProduct = Object.values(prodAgg).sort((a: any, b: any) => b.profit - a.profit);

    const custAgg: Record<string, { key: string; label: string; revenue: number; cost: number; profit: number; count: number }> = {};
    for (const o of activeOrders) {
      const key = o.customer_id ?? 'guest';
      if (!custAgg[key]) custAgg[key] = { key, label: o.customer_name ?? 'Khách lẻ', revenue: 0, cost: 0, profit: 0, count: 0 };
      custAgg[key].revenue += Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0);
      custAgg[key].count += 1;
    }
    for (const it of allItems) {
      const key = it.customer_id ?? 'guest';
      if (custAgg[key]) custAgg[key].cost += it.itemCost;
    }
    for (const k of Object.keys(custAgg)) custAgg[k].profit = custAgg[k].revenue - custAgg[k].cost;
    const groupedByCustomer = Object.values(custAgg).sort((a: any, b: any) => b.profit - a.profit);

    const dayAgg: Record<string, { key: string; label: string; revenue: number; cost: number; profit: number; count: number }> = {};
    for (const o of activeOrders) {
      const key = fmtDM(toVN(o.date));
      if (!dayAgg[key]) dayAgg[key] = { key, label: key, revenue: 0, cost: 0, profit: 0, count: 0 };
      dayAgg[key].revenue += Number(o.total_amount ?? 0) - Number(o.total_returned_amount ?? 0);
      dayAgg[key].count += 1;
    }
    for (const it of allItems) {
      const key = fmtDM(toVN(it.date));
      if (dayAgg[key]) dayAgg[key].cost += it.itemCost;
    }
    for (const k of Object.keys(dayAgg)) dayAgg[k].profit = dayAgg[k].revenue - dayAgg[k].cost;
    const groupedByDay = Object.values(dayAgg).sort((a: any, b: any) => (a.key < b.key ? 1 : -1));

    return {
      data: { summary, dailyProfit, profitDetails, groupedByProduct, groupedByCustomer, groupedByDay },
      error: null,
    };
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
    const memberCount = store.tenant_memberships.filter(
      m => m.tenant_id === tenant_id && ['pending', 'active'].includes(m.status)
    ).length;
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
      status: 'pending',
      is_active: true,
      invited_by: currentUserId,
      invited_at: new Date().toISOString(),
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

  if (name === 'delete-tenant') {
    if (!isSystemAdmin) {
      return { data: { success: false, error: 'Chỉ system admin được xóa tenant' }, error: null };
    }
    const { tenant_id } = body;
    const tenant = store.tenants.find(t => t.id === tenant_id);
    if (!tenant) {
      return { data: { success: false, error: 'Tenant không tồn tại' }, error: null };
    }
    store.tenants = store.tenants.filter(t => t.id !== tenant_id);
    store.tenant_memberships = store.tenant_memberships.filter(m => m.tenant_id !== tenant_id);
    store.tenant_subscriptions = store.tenant_subscriptions.filter(s => s.tenant_id !== tenant_id);
    store.tenant_credentials = store.tenant_credentials.filter(c => c.tenant_id !== tenant_id);
    store.app_audit_log = store.app_audit_log.filter(l => l.tenant_id !== tenant_id);
    return {
      data: {
        success: true,
        tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain },
        storageDeleted: 0,
        storageFailures: 0,
        authDeleted: 0,
        authFailures: 0,
      },
      error: null,
    };
  }

  if (name === 'check-subdomain') {
    const { subdomain } = body;
    const s = (subdomain || '').trim().toLowerCase();
    const reserved = ['admin', 'www', 'api', 'app'];
    const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!s) return { data: { available: false, error: 'Subdomain không được để trống' }, error: null };
    if (s.length < 3 || s.length > 63 || !SUBDOMAIN_REGEX.test(s)) {
      return { data: { available: false, error: 'Subdomain phải dài 3-63 ký tự, chỉ chứa chữ thường, số và dấu gạch ngang, không bắt đầu/kết thúc bằng gạch ngang' }, error: null };
    }
    if (reserved.includes(s)) {
      return { data: { available: false, error: `Subdomain "${s}" thuộc danh sách dự trữ` }, error: null };
    }
    const existing = store.tenants.find(t => t.subdomain === s && t.status !== 'archived');
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

  if (name === 'send-sms') {
    const { to, body: messageBody, test } = body;
    const recipients = Array.isArray(to) ? to : [to];
    if (!recipients.length || !messageBody) {
      return { data: { error: 'to và body không được để trống' }, error: null };
    }
    return {
      data: {
        success: true,
        id: `sms-${uuid()}`,
        ids: recipients.map(() => `sms-${uuid()}`),
        to: recipients,
        body: messageBody,
        provider: 'twilio',
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

  if (name === 'create-system-admin') {
    if (!isSystemAdmin) {
      return { data: { error: 'Only system admins can create system admins' }, error: null };
    }
    const { email, password } = body || {};
    if (!email || typeof email !== 'string' || !email.trim().includes('@')) {
      return { data: { error: 'Email is required' }, error: null };
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return { data: { error: 'Password must be at least 6 characters' }, error: null };
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (store.users.some((u: any) => u.email === normalizedEmail)) {
      return { data: { error: 'Email already exists' }, error: null };
    }
    const userId = uuid();
    store.users.push({ id: userId, email: normalizedEmail });
    store.system_admins.push({ user_id: userId, created_at: new Date().toISOString() });
    store.app_audit_log.push({
      action: 'create_system_admin',
      target_user_id: userId,
      email: normalizedEmail,
      creator_id: currentUserId,
      created_at: new Date().toISOString(),
    });
    return { data: { success: true, userId, email: normalizedEmail }, error: null };
  }

  return { data: null, error: { code: 'PGRST116', message: 'RPC not found' } };
};

export const mockSupabase = {
  auth: {
    getUser: vi.fn(async () => ({ data: { user: currentUserId ? { id: currentUserId } : null }, error: null })),
    admin: {
      createUser: vi.fn(async ({ email, password, email_confirm }: { email: string; password: string; email_confirm?: boolean }) => {
        if (!email || !email.includes('@')) {
          return { data: { user: null }, error: { message: 'Invalid email', status: 422 } };
        }
        if (!password || password.length < 6) {
          return { data: { user: null }, error: { message: 'Password should be at least 6 characters', status: 422 } };
        }
        const existing = store.users.find(u => u.email === email);
        if (existing) {
          return { data: { user: null }, error: { message: 'User already registered', status: 422 } };
        }
        const user = { id: uuid(), email, email_confirmed_at: email_confirm ? new Date().toISOString() : null, created_at: new Date().toISOString() };
        store.users.push(user);
        return { data: { user }, error: null };
      }),
      deleteUser: vi.fn(async (userId: string) => {
        store.users = store.users.filter(u => u.id !== userId);
        return { data: { user: null }, error: null };
      }),
      getUserById: vi.fn(async (userId: string) => {
        const user = store.users.find(u => u.id === userId) ?? null;
        return { data: { user }, error: user ? null : { message: 'User not found', status: 404 } };
      }),
    },
  },
  from: vi.fn((table: string) => queryBuilder(table)),
  rpc: vi.fn(rpc),
  functions: {
    invoke: vi.fn(functionsInvoke),
  },
};
