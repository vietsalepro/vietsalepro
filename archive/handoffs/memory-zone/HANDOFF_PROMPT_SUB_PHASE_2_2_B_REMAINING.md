# Handoff — Sub-Phase 2.2 (hướng B): Phần còn lại

## Đã hoàn thành trong session này

1. Tạo sub-plan: `memory-zone/KE_HOACH/Admin_dashboard/PLAN_SUB_PHASE_2_2_B.md`
2. Tạo generic hook: `hooks/useAdminList.ts`
3. Tách `pages/admin/Tenants.tsx` thành standalone page dùng `useAdminList`
4. Tách `pages/admin/Members.tsx` thành standalone page dùng `useAdminList` (cho tenant selector)
5. `npm run build` PASS sau mỗi file
6. Cập nhật `openspec/changes/basejump-admin-dashboard-phase-2-2/tasks.md` cho các task đã xong

## Files đã thay đổi

- `hooks/useAdminList.ts` (mới)
- `pages/admin/Tenants.tsx` (thay thế wrapper cũ)
- `pages/admin/Members.tsx` (thay thế wrapper cũ)
- `memory-zone/KE_HOACH/Admin_dashboard/PLAN_SUB_PHASE_2_2_B.md` (mới)
- `openspec-stores/admin-dashboard/openspec/changes/basejump-admin-dashboard-phase-2-2/tasks.md`

## API của `useAdminList`

```typescript
const {
  data,           // TItem[]
  totalCount,     // number
  isLoading,      // boolean
  error,          // string | null
  page, pageSize,
  searchTerm, filters,
  setPage, setPageSize,
  setSearchTerm,
  setFilters, setFilter,
  refresh,
} = useAdminList<TItem, TFilter>(
  fetcher: (params: { page, pageSize, search } & TFilter) => Promise<{ items: TItem[]; totalCount: number }>,
  { initialFilters, initialPage, initialPageSize, debounceMs }
);
```

- Tự động debounce `searchTerm`.
- Reset về trang 1 khi search/filters thay đổi.
- Cancel request cũ khi có request mới.

## Việc còn lại

### 1. `pages/admin/Audit.tsx` — standalone audit log page

**Mục tiêu:** Thay thế wrapper `<AdminDashboardInner activeTab="audit" />` bằng trang standalone dùng `useAdminList` với `getAuditLogs`.

**Service & types cần dùng:**
- `import { getAuditLogs, AuditLogEntry, AuditAction } from '../../services/auditService'`
- `import { listAccounts } from '../../services/admin/tenantAdminService'`
- `import { Tenant } from '../../types/tenant'`
- `import { useAdminList } from '../../hooks/useAdminList'`
- `import { useConfirmDialog } from '../../hooks/useConfirmDialog'` (nếu cần)

**Adapter fetcher cho useAdminList:**

```typescript
interface AuditFilters {
  tenantId: string;
  userId: string;
  action: AuditAction | '';
  tableName: string;
  dateFrom: string;
  dateTo: string;
}

const PAGE_SIZE = 50;

const {
  data: logs,
  totalCount,
  isLoading,
  error,
  page,
  searchTerm,
  filters,
  setPage,
  setSearchTerm,
  setFilters,
} = useAdminList<AuditLogEntry, AuditFilters>(
  async (params) => {
    const offset = (params.page - 1) * PAGE_SIZE;
    const result = await getAuditLogs({
      limit: PAGE_SIZE,
      offset,
      tenantId: params.tenantId || null,
      userId: params.userId || null,
      action: params.action || null,
      tableName: params.tableName || null,
      dateFrom: params.dateFrom || null,
      dateTo: params.dateTo || null,
    });
    return { items: result.data, totalCount: result.count ?? 0 };
  },
  {
    initialFilters: { tenantId: '', userId: '', action: '', tableName: '', dateFrom: '', dateTo: '' },
    initialPageSize: PAGE_SIZE,
  },
);
```

**Gợi ý UI:**
- Copy/chuyển đổi UI từ `pages/AuditLog.tsx`.
- Thêm tenant selector (dùng `useAdminList<Tenant>` với `listAccounts`) nếu muốn gần giống `AuditLog systemAdmin tenants={allTenants}`.
- Các filter: action (select), tableName, userId, dateFrom, dateTo.
- Bảng các cột: thời gian, tenant, user, action, table, recordId, data preview.

**Lưu ý:**
- `AuditLog.tsx` hiện tại có prop `systemAdmin` và `tenants`. Trang standalone `pages/admin/Audit.tsx` dùng cho system admin nên có thể hardcode `systemAdmin = true`.
- Đảm bảo reset `page = 1` khi bất kỳ filter nào thay đổi (hook đã tự xử lý cho search/filters).

### 2. `pages/admin/Billing.tsx` — standalone billing page

**Mục tiêu:** Thay thế wrapper `<AdminDashboardInner activeTab="billing" />` bằng trang standalone dùng `useAdminList`.

**Vấn đề:** `BillingConfig` hiện tại không có list phân trang; nó chỉ có form thông tin công ty + danh sách tài khoản ngân hàng trả về toàn bộ.

**Hướng xử lý đề xuất:** Dùng `useAdminList` cho danh sách tài khoản ngân hàng, phân trang client-side.

**Service cần dùng:**
- `import { getBankAccounts, BankAccount } from '../../services/admin/billingAdminService'`
- `import { useAdminList } from '../../hooks/useAdminList'`

**Adapter fetcher:**

```typescript
const PAGE_SIZE = 10;

const {
  data: accounts,
  totalCount,
  isLoading,
  error,
  page,
  setPage,
} = useAdminList<BankAccount>(
  async (params) => {
    // ponytail: getBankAccounts không hỗ trợ server-side pagination, nên paginate client-side.
    const all = await getBankAccounts();
    const start = (params.page - 1) * params.pageSize;
    return {
      items: all.slice(start, start + params.pageSize),
      totalCount: all.length,
    };
  },
  { initialPageSize: PAGE_SIZE },
);
```

**Gợi ý UI:**
- Copy phần form thông tin công ty và bảng tài khoản ngân hàng từ `components/BillingConfig.tsx`.
- Giữ CRUD tài khoản ngân hàng (create/update/delete) — sau mỗi thao tác gọi `refresh()` của `useAdminList`.
- Hoặc nếu muốn đơn giản hơn: giữ nguyên `BillingConfig` như một phần của trang, chỉ thêm một section "Tài khoản ngân hàng" dùng `useAdminList`.

### 3. `docs/admin-dashboard/RPC_CONTRACTS.md`

**Mục tiêu:** Tài liệu hóa các RPC functions được dùng bởi admin dashboard.

**Cách làm:**
- Tạo thư mục `docs/admin-dashboard/` nếu chưa có.
- Tạo file `RPC_CONTRACTS.md`.
- Grep `\.rpc\(` trong `services/admin/`, `services/tenantService.ts`, `services/systemAdminService.ts`, `services/auditService.ts`, `services/loginHistoryService.ts`, `services/operationsService.ts`, v.v.
- Tổng hợp thành bảng với các cột:
  - Tên RPC
  - Mục đích
  - Tham số chính
  - Trả về
  - File/service sử dụng

**Một số RPC quan trọng đã biết:**

| RPC | Mục đích | Tham số | Trả về | Sử dụng |
|-----|----------|---------|--------|---------|
| `get_tenants_admin` | Lấy danh sách tenants (admin) | `p_page`, `p_page_size` | `{ items: Tenant[], total: number }` | tenantAdminService |
| `search_tenants` | Tìm tenants | `p_search_term`, `p_status`, `p_plan`, `p_page`, `p_page_size` | `SearchTenantsResult` | tenantAdminService |
| `create_tenant_with_admin` | Tạo tenant + admin | `p_name`, `p_subdomain`, `p_plan`, `p_admin_email` | `Tenant` | tenantAdminService |
| `delete_tenant_safe` | Lưu trữ tenant | `p_tenant_id` | `Tenant` | tenantAdminService |
| `update_tenant` | Cập nhật tenant | `p_tenant_id`, ... | `Tenant` | tenantAdminService |
| `search_tenant_members` | Tìm thành viên | `p_tenant_id`, `p_search`, `p_role`, `p_status`, ... | `SearchMembersResult` | memberAdminService |
| `get_audit_logs` | Lấy audit logs | `p_limit`, `p_offset`, `p_tenant_id`, ... | `{ data: AuditLogEntry[], count: number }` | auditService |
| `get_admin_login_history` | Lịch sử đăng nhập admin | `p_limit`, `p_offset`, ... | `{ data, count }` | loginHistoryService |
| `get_rate_limit_logs` | Rate limit logs | `p_limit`, `p_offset` | `{ data, count }` | systemAdminService |
| `get_system_overview` | Tổng quan hệ thống | — | `SystemOverview` | tenantAdminService |
| `is_system_admin` | Kiểm tra system admin | — | `boolean` | permissions, tenantService |
| `get_bank_accounts` | Danh sách TK ngân hàng | — | `BankAccount[]` | billingAdminService |
| `admin_update_subscription` | Cập nhật subscription | `p_tenant_id`, ... | `TenantSubscription` | tenantService |

**Lưu ý:** Cần duyệt lại code để đảm bảo bảng đầy đủ và chính xác.

## Lệnh cần chạy để xác minh

```bash
npm run build
openspec validate basejump-admin-dashboard-phase-2-2 --store admin-dashboard --json
```

## Lưu ý quan trọng khi tiếp tục

- `AdminDashboardInner.tsx` vẫn còn code của các tab tenants/members/audit/billing. Code này hiện là dead code cho đến khi tất cả các tab được tách xong. Không xóa vội để tránh ảnh hưởng các tab khác (overview, settings, security, health, v.v.).
- `pages/admin/Tenants.tsx` và `Members.tsx` đã trở thành standalone pages; route `/admin/tenants` và `/admin/members` sẽ render các trang mới.
- Các hành động phức tạp của tenant (edit subscription, feature flags, backup, restore, reset demo, export CSV) chưa được chuyển sang `Tenants.tsx` standalone. Nếu cần, xử lý ở phase sau hoặc chuyển sang trang `TenantDetail.tsx`.
- `MemberManagement` vẫn quản lý state list nội bộ. Nếu muốn tách hoàn toàn, cần refactor `MemberManagement` để dùng `useAdminList` cho member list (cần mở rộng hook hỗ trợ sort nếu cần).

## Build status hiện tại

`npm run build`: ✅ PASS
