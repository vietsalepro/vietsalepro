# Phase 2 — Cập nhật service, mocks, tests, docs

**Mục tiêu:** Đảm bảo TypeScript service, test mocks, smoke tests và tài liệu contract khớp với SQL đã sửa ở Phase 1.

**Ưu tiên:** Cao — phải làm trước khi deploy.

---

## 1. Lỗi / thiếu sót cần xử lý

| STT | File | Vấn đề |
|-----|------|--------|
| 1 | `services/tenantService.ts` | `getTopTenants` gọi `p_offset` nhưng SQL cũ không có; `getTenantsAdmin` gọi `get_tenants_admin` chưa tồn tại; `getCurrentUserTenants` gọi `get_current_user_tenants` chưa tồn tại. |
| 2 | `tests/mocks/supabase.ts` | Mock `get_top_tenants` cần trả về `{ data, count }`; cần thêm mock cho `get_current_user_tenants` và `get_tenants_admin`. |
| 3 | `tests/smoke/admin-dashboard-p4-system-analytics.test.ts` | Test `getTopTenants` cần cập nhật nếu signature thay đổi. |
| 4 | `docs/admin-dashboard/RPC_CONTRACTS.md` | Cần cập nhật signature `get_top_tenants` và bổ sung `get_current_user_tenants`, `get_tenants_admin`. |

---

## 2. Cập nhật `services/tenantService.ts`

Sau khi SQL đã đúng, kiểm tra lại các hàm sau:

### `getTopTenants`

Đã gọi đúng 2 params (`p_limit`, `p_offset`) và mong object `{ data, count }`. Nếu Phase 1 đã sửa SQL, phần TypeScript này **không cần đổi**.

```typescript
export async function getTopTenants(options: {
  limit?: number;
  offset?: number;
} = {}): Promise<{ data: TopTenant[]; count: number }> {
  const { data, error } = await supabase.rpc('get_top_tenants', {
    p_limit: options.limit ?? 10,
    p_offset: options.offset ?? 0,
  });
  if (error) throw error;
  return { data: data?.data ?? [], count: data?.count ?? 0 };
}
```

### `getTenantsAdmin`

Đảm bảo params gửi lên khớp với SQL:

```typescript
export async function getTenantsAdmin(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus | 'all';
  plan?: TenantPlan | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ items: Tenant[]; total: number }> {
  const { data, error } = await supabase.rpc('get_tenants_admin', {
    p_page: options.page ?? 1,
    p_limit: options.limit ?? 20,
    p_search: options.search ?? null,
    p_status: options.status ?? 'all',
    p_plan: options.plan ?? 'all',
    p_sort_by: options.sortBy ?? 'created_at',
    p_sort_order: options.sortOrder ?? 'desc',
  });
  if (error) throw error;
  return {
    items: (data?.data ?? []).map(mapTenantFromDB),
    total: data?.total ?? 0,
  };
}
```

### `getCurrentUserTenants`

```typescript
export async function getCurrentUserTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase.rpc('get_current_user_tenants');
  if (error) throw error;
  return (data ?? []).map(mapTenantFromDB);
}
```

---

## 3. Cập nhật `tests/mocks/supabase.ts`

### `get_top_tenants`

Giữ nguyên cấu trúc trả về `{ data, count }`:

```typescript
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
```

### `get_current_user_tenants` — thêm mới

```typescript
if (name === 'get_current_user_tenants') {
  const memberships = store.tenant_memberships.filter(m => m.user_id === currentUserId);
  const tenantIds = memberships.map(m => m.tenant_id);
  const rows = store.tenants
    .filter(t => tenantIds.includes(t.id) && t.status !== 'archived')
    .map(mapTenantFromDB);
  return { data: rows, error: null };
}
```

### `get_tenants_admin` — thêm mới

```typescript
if (name === 'get_tenants_admin') {
  if (!isSystemAdmin) {
    return { data: null, error: { code: '42501', message: 'Chỉ system admin mới được gọi get_tenants_admin' } };
  }
  const limit = params.p_limit ?? 20;
  const offset = ((params.p_page ?? 1) - 1) * limit;
  const search = (params.p_search ?? '').toLowerCase();
  const statusFilter = params.p_status ?? 'all';
  const planFilter = params.p_plan ?? 'all';

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
  rows = rows.slice(offset, offset + limit);
  return { data: { data: rows.map(mapTenantFromDB), total }, error: null };
}
```

---

## 4. Cập nhật smoke tests

### `tests/smoke/admin-dashboard-p4-system-analytics.test.ts`

Kiểm tra dòng 80–85. Nếu `getTopTenants` trả về `{ data, count }`, test hiện tại đã đúng:

```typescript
const top = await getTopTenants({ limit: 2 });
expect(top.data.length).toBe(2);
expect(top.data[0].id).toBe(a.id);
```

Nếu sau này thêm offset:

```typescript
const top = await getTopTenants({ limit: 2, offset: 0 });
expect(top.data.length).toBe(2);
expect(top.count).toBeGreaterThanOrEqual(2);
```

### Bổ sung smoke test cho `get_tenants_admin`

Nên thêm 1 test file mới hoặc bổ sung vào file hiện có để kiểm tra:

- System admin gọi được.
- Non-system admin bị từ chối.
- Search, filter status/plan hoạt động.

---

## 5. Cập nhật `docs/admin-dashboard/RPC_CONTRACTS.md`

Đảm bảo các dòng sau chính xác:

| RPC | Tham số | Trả về |
|-----|---------|--------|
| `get_tenants_admin` | `p_page`, `p_limit`, `p_search`, `p_status`, `p_plan`, `p_sort_by`, `p_sort_order` | `{ items: Tenant[], total: number }` |
| `get_current_user_tenants` | — | `Tenant[]` |
| `get_top_tenants` | `p_limit`, `p_offset` | `{ data: TopTenant[], count: number }` |

---

## 6. Checklist Phase 2

- [ ] Kiểm tra `services/tenantService.ts` không cần sửa gì nhiều sau Phase 1.
- [ ] Cập nhật mock `get_top_tenants` với `p_offset` và `count` đúng.
- [ ] Thêm mock `get_current_user_tenants`.
- [ ] Thêm mock `get_tenants_admin`.
- [ ] Cập nhật / bổ sung smoke tests.
- [ ] Cập nhật `RPC_CONTRACTS.md`.
- [ ] Chạy `npm run lint`.
- [ ] Chạy `npx vitest run`.
- [ ] Chuyển sang **Phase 3** để deploy.
