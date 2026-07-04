# Hướng dẫn sử dụng OpenSpec — Multi-Tenancy Migration

> OpenSpec store: `multi-tenancy-nhom-1`
> Schema: `multi-tenancy`
> Source plan: `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`

## Cấu trúc OpenSpec cho plan này

```text
OPENSPEC/openspec/
├── config.yaml                         # schema: multi-tenancy
├── schemas/
│   └── multi-tenancy/
│       ├── schema.yaml
│       └── templates/
│           ├── proposal.md
│           ├── design.md
│           ├── spec.md
│           ├── review.md
│           ├── rollback.md
│           ├── tasks.md
│           └── handoff.md
├── specs/
│   └── .gitkeep
└── changes/
    ├── multi-tenancy-master-plan/      # kế hoạch tổng thể
    │   ├── .openspec.yaml
    │   ├── proposal.md
    │   ├── design.md
    │   ├── specs/multi-tenancy-master/spec.md
    │   ├── review.md
    │   ├── rollback.md
    │   ├── tasks.md
    │   └── handoff.md
    ├── multi-tenancy-phase-0-.../      # Phase 0
    ├── multi-tenancy-phase-1-.../      # Phase 1
    ├── multi-tenancy-phase-2-.../      # Phase 2
    ├── multi-tenancy-phase-3-1-.../    # Phase 3.1
    ├── multi-tenancy-phase-3-2-.../    # Phase 3.2
    ├── multi-tenancy-phase-3-3-.../    # Phase 3.3
    ├── multi-tenancy-phase-4-1-.../    # Phase 4.1
    ├── multi-tenancy-phase-4-2-.../    # Phase 4.2
    ├── multi-tenancy-phase-5-1-.../    # Phase 5.1
    ├── multi-tenancy-phase-5-2-.../    # Phase 5.2
    ├── multi-tenancy-phase-5-3-.../    # Phase 5.3
    ├── multi-tenancy-phase-6-1-.../    # Phase 6.1
    ├── multi-tenancy-phase-6-2-.../    # Phase 6.2
    ├── multi-tenancy-phase-6-3-.../    # Phase 6.3
    ├── multi-tenancy-phase-6-4-.../    # Phase 6.4
    ├── multi-tenancy-phase-7-.../      # Phase 7
    ├── multi-tenancy-phase-8-.../      # Phase 8
    ├── multi-tenancy-phase-9-1-.../    # Phase 9.1
    ├── multi-tenancy-phase-9-2-.../    # Phase 9.2
    ├── multi-tenancy-phase-9-3-.../    # Phase 9.3
    ├── multi-tenancy-phase-9-4-.../    # Phase 9.4
    ├── multi-tenancy-phase-9-5-.../    # Phase 9.5
    ├── multi-tenancy-phase-9-6-.../    # Phase 9.6
    ├── multi-tenancy-phase-10-1-.../   # Phase 10.1
    ├── multi-tenancy-phase-10-2-.../   # Phase 10.2
    ├── multi-tenancy-phase-11-.../     # Phase 11
    ├── multi-tenancy-phase-12-1-.../   # Phase 12.1
    ├── multi-tenancy-phase-12-2-.../   # Phase 12.2
    ├── multi-tenancy-phase-12-3-.../   # Phase 12.3
    ├── multi-tenancy-phase-13-1-.../   # Phase 13.1
    ├── multi-tenancy-phase-13-2-.../   # Phase 13.2
    ├── multi-tenancy-phase-13-3-.../   # Phase 13.3
    ├── multi-tenancy-phase-14-.../     # Phase 14
    ├── multi-tenancy-phase-15-.../     # Phase 15
    ├── multi-tenancy-phase-16-.../     # Phase 16
    └── multi-tenancy-phase-17-.../     # Phase 17
```

## Các lệnh CLI hữu ích

```powershell
# Kiểm tra trạng thái một change
openspec status --change multi-tenancy-master-plan --store multi-tenancy-nhom-1

# Validate toàn bộ change
openspec validate --changes --store multi-tenancy-nhom-1

# Validate một change
openspec validate multi-tenancy-phase-3-1-core-business-tables --type change --store multi-tenancy-nhom-1

# Liệt kê các change
openspec list --store multi-tenancy-nhom-1

# Xem chi tiết change
openspec show multi-tenancy-phase-3-1-core-business-tables --store multi-tenancy-nhom-1

# Xem instructions cho tasks
openspec instructions tasks --change multi-tenancy-phase-3-1-core-business-tables --store multi-tenancy-nhom-1 --json
```

## Nguyên tắc chia chat

Mỗi chat chỉ làm **một sub-phase** (một OpenSpec change). Không gộp nhiều sub-phase lớn vào một chat vì lịch sử sẽ cộng dồn và nhanh vượt 250K context.

| Phase | Sub-phase | Change ID | Ghi chú |
|-------|-----------|-------------|---------|
| 0 | Environment & backup | `multi-tenancy-phase-0-chu-n-b-m-i-tr-ng-backup-gi-nguy-n` | Chỉ thao tác infra, không sửa code nghiệp vụ |
| 1 | Security cleanup | `multi-tenancy-phase-1-d-n-d-p-b-o-m-t-hi-n-t-i-gi-nguy-n` | Drop public policy, tắt self-registration |
| 2 | Foundation tables | `multi-tenancy-phase-2-t-o-foundation-multi-tenancy-gi-nguy-n` | Tạo tenants, memberships, subscriptions, system_admins |
| 3.1 | Core business tables | `multi-tenancy-phase-3-1-core-business-tables` | Thêm tenant_id cho 6 bảng core |
| 3.2 | Inventory & stock tables | `multi-tenancy-phase-3-2-inventory-stock-tables` | Thêm tenant_id cho 13 bảng inventory |
| 3.3 | Config & misc tables | `multi-tenancy-phase-3-3-config-misc-tables` | Thêm tenant_id cho 12 bảng config |
| 4.1 | Initial tenant + core backfill | `multi-tenancy-phase-4-1-t-o-tenant-u-backfill-core-tables` | Tạo tenant main, backfill core |
| 4.2 | Remaining backfill + FK | `multi-tenancy-phase-4-2-backfill-remaining-tables-orphan-cleanup-fk` | Backfill 27 bảng, xóa orphan, thêm FK |
| 5.1 | Helper functions + fetch wrapper | `multi-tenancy-phase-5-1-helper-functions-custom-fetch-wrapper` | current_tenant_id(), lib/tenant.ts, lib/supabase.ts |
| 5.2 | RLS core tables | `multi-tenancy-phase-5-2-rls-policies-core-tables` | Policy cho 5 bảng core |
| 5.3 | RLS remaining + unique indexes | `multi-tenancy-phase-5-3-rls-policies-remaining-tables-unique-indexes` | Policy cho 27 bảng còn lại |
| 6.1 | TenantContext + routing | `multi-tenancy-phase-6-1-tenantcontext-routing-subdomain` | Subdomain resolution, 404, suspended |
| 6.2 | Service layer inject | `multi-tenancy-phase-6-2-custom-fetch-wrapper-service-layer-inject` | Inject tenant_id vào supabaseService.ts |
| 6.3 | App.tsx + global loading | `multi-tenancy-phase-6-3-app-tsx-global-data-loading` | Bọc TenantProvider, update dependencies |
| 6.4 | Page-level loading | `multi-tenancy-phase-6-4-page-level-data-loading` | Sửa các page chính, hook useTenant |
| 7 | Subscription limits | `multi-tenancy-phase-7-thi-t-k-gi-i-h-n-v-g-i-d-ch-v-gi-nguy-n` | Trigger Free/VIP limits |
| 8 | Admin dashboard | `multi-tenancy-phase-8-t-o-admin-dashboard-cho-ch-h-th-ng-gi-nguy-n` | SystemAdminDashboard + RPC |
| 9.1 | create-tenant Edge Function | `multi-tenancy-phase-9-1-create-tenant` | System admin tạo tenant |
| 9.2 | invite-member Edge Function | `multi-tenancy-phase-9-2-invite-member` | Admin mời nhân viên |
| 9.3 | check-subdomain Edge Function | `multi-tenancy-phase-9-3-check-subdomain` | Kiểm tra subdomain available |
| 9.4 | reset-password Edge Function | `multi-tenancy-phase-9-4-reset-password` | Reset/invite password |
| 9.5 | process-checkout Edge Function | `multi-tenancy-phase-9-5-process-checkout` | Xử lý đơn hàng theo tenant |
| 9.6 | audit-log + rate limiting | `multi-tenancy-phase-9-6-audit-log-writer-rate-limiting` | Audit log writer, rate_limit_logs |
| 10.1 | DB policies by role | `multi-tenancy-phase-10-1-db-policies-theo-role` | RBAC ở DB |
| 10.2 | UI permissions | `multi-tenancy-phase-10-2-ui-permissions` | usePermissions hook, menu/button guards |
| 11 | Audit log | `multi-tenancy-phase-11-th-m-audit-log-gi-nguy-n` | app_audit_log table + triggers + page |
| 12.1 | TS strict core | `multi-tenancy-phase-12-1-b-t-strict-fix-core-services-types` | Bật strict, fix services/types/utils/hooks |
| 12.2 | TS strict pages | `multi-tenancy-phase-12-2-fix-pages` | Fix pages/ |
| 12.3 | TS strict components | `multi-tenancy-phase-12-3-fix-components-final-build` | Fix components/ + final build |
| 13.1 | Unit tests | `multi-tenancy-phase-13-1-unit-tests-tenant-auth-rls` | tenant/auth/RLS tests |
| 13.2 | Integration tests | `multi-tenancy-phase-13-2-integration-tests-tenant-isolation` | tenant isolation tests |
| 13.3 | Smoke tests | `multi-tenancy-phase-13-3-smoke-tests-rbac-subscription-offline` | RBAC/subscription/offline tests |
| 14 | Codebase cleanup | `multi-tenancy-phase-14-d-n-d-p-codebase` | Xóa backup tables, dead code |
| 15 | Staging tests | `multi-tenancy-phase-15-test-tr-n-staging-gi-nguy-n` | Chạy checklist trên staging |
| 16 | Production deploy | `multi-tenancy-phase-16-deploy-production` | DNS, Storage RLS, migration, deploy |
| 17 | Long-term operations | `multi-tenancy-phase-17-thi-t-l-p-v-n-h-nh-d-i-h-n` | Backup, retention, monitoring, runbook |

## Các bước lặp lại cho mỗi chat

1. **Tạo backup** (quan trọng vì không có git):
   ```powershell
   Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_<PHASE>_<YYYYMMDD_HHMMSS>" -Recurse
   ```
2. **Mở chat mới** trong Windsurf.
3. **Dán prompt mẫu** tương ứng bên dưới.
4. **Để AI thực hiện**. AI sẽ đọc plan, tasks.md, sửa code, đánh dấu task.
5. **Kiểm tra sau khi AI báo xong**:
   ```powershell
   npm run lint
   ```
   Nếu chat này là **cuối phase lớn** (2, 4.2, 5.3, 6.4, 7, 8, 9.6, 10.2, 11, 12.3, 13.3), thêm:
   ```powershell
   npm run build
   ```
6. **Archive** (tùy chọn sau mỗi phase lớn):
   ```powershell
   openspec archive <change-id> --store multi-tenancy-nhom-1
   ```
   > Lưu ý: archive sẽ merge delta specs vào baseline. Nếu muốn giữ change active để tiếp tục, đừng archive quá sớm.
7. **Lưu lại backup path** và mở chat mới cho sub-phase kế tiếp.

---

## Prompt mẫu — Copy toàn bộ đoạn tương ứng

### Phase 0 — Environment & backup

```text
Thực hiện Phase 0 — Chuẩn bị môi trường & backup cho kế hoạch Multi-Tenancy.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 0.
- Đọc OpenSpec change `multi-tenancy-phase-0-chu-n-b-m-i-tr-ng-backup-gi-nguy-n` tại `OPENSPEC/openspec/changes/multi-tenancy-phase-0-chu-n-b-m-i-tr-ng-backup-gi-nguy-n/`.
- Thực hiện các bước trong tasks.md của change này.
- Tạo staging project, mirror data, tạo nhánh git, thêm `.env.staging`, backup production.
- Đảm bảo `npm run lint` + `npm run build` pass.
- Ghi rõ backup path vào cuối chat.
```

### Phase 1 — Security cleanup

```text
Thực hiện Phase 1 — Dọn dẹp bảo mật hiện tại cho kế hoạch Multi-Tenancy.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 1.
- Đọc OpenSpec change `multi-tenancy-phase-1-d-n-d-p-b-o-m-t-hi-n-t-i-gi-nguy-n`.
- Drop public access policies trên các bảng kinh doanh.
- Tạo temporary policy `authenticated_full_access_temp`.
- Tắt self-registration, xóa social providers, cập nhật Site URL / Redirect URLs.
- Sửa `Login.tsx` để không có link đăng ký.
- Đảm bảo không commit `VITE_SUPABASE_SERVICE_ROLE_KEY`.
- Kiểm thử: user đăng nhập vẫn thấy data, user chưa đăng nhập bị chặn, signUp bị từ chối.
```

### Phase 2 — Foundation tables

```text
Thực hiện Phase 2 — Tạo foundation multi-tenancy.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 2.
- Đọc OpenSpec change `multi-tenancy-phase-2-t-o-foundation-multi-tenancy-gi-nguy-n`.
- Tạo các bảng: `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins`.
- Tạo helper functions: `is_system_admin`, `is_tenant_member`, `is_tenant_admin`, `has_tenant_role`, `get_tenant_by_subdomain`.
- Bật RLS và tạo policies cơ bản cho foundation tables.
- Tạo `types/tenant.ts` với `Tenant`, `TenantMembership`, `TenantRole`, `TenantSubscription`.
- Tạo `services/tenantService.ts` với các hàm cơ bản.
- Kiểm thử: tạo tenant, thêm member, user A không thấy tenant của user B.
```

### Phase 3.1 — Core business tables

```text
Thực hiện Phase 3.1 — Thêm `tenant_id` vào core business tables.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 3.1.
- Đọc OpenSpec change `multi-tenancy-phase-3-1-core-business-tables`.
- Bảng: `products`, `customers`, `orders`, `order_items`, `suppliers`, `promotions`.
- Thêm cột `tenant_id UUID`, FK đến `public.tenants(id) ON DELETE CASCADE`, index `idx_<table>_tenant_id`.
- Thêm `tenant_id` vào interface của 6 bảng trong `types.ts`.
- Kiểm thử: tất cả 6 bảng đã có cột `tenant_id` và FK.
```

### Phase 3.2 — Inventory & stock tables

```text
Thực hiện Phase 3.2 — Thêm `tenant_id` vào inventory & stock tables.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 3.2.
- Đọc OpenSpec change `multi-tenancy-phase-3-2-inventory-stock-tables`.
- Bảng: `import_receipts`, `import_items`, `inventory_counts`, `inventory_count_items`, `inventory_movements`, `disposals`, `disposal_items`, `product_lots`, `stock_movements`, `return_orders`, `return_order_items`, `supplier_exchanges`, `supplier_exchange_return_items`, `supplier_exchange_received_items`.
- Thêm cột `tenant_id UUID`, FK, index cho từng bảng.
- Thêm `tenant_id` vào interface của 13 bảng trong `types.ts`.
- Kiểm thử: các bảng inventory đã có cột `tenant_id` và FK.
```

### Phase 3.3 — Config & misc tables

```text
Thực hiện Phase 3.3 — Thêm `tenant_id` vào config & misc tables.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 3.3.
- Đọc OpenSpec change `multi-tenancy-phase-3-3-config-misc-tables`.
- Bảng: `app_settings`, `brands`, `categories`, `einvoice_config`, `einvoice_orders`, `point_history`, `processed_operations`, `rank_configs`, `rank_history`, `rewards`, `customer_payment_ledger`, `supplier_payment_ledger`.
- Thêm cột `tenant_id UUID`, FK, index cho từng bảng.
- Thêm `tenant_id` vào interface của 12 bảng trong `types.ts`.
- Kiểm thử: các bảng config đã có cột `tenant_id` và FK; `types.ts` không lỗi TS.
```

### Phase 4.1 — Initial tenant + core backfill

```text
Thực hiện Phase 4.1 — Tạo tenant đầu + backfill core tables.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 4.1.
- Đọc OpenSpec change `multi-tenancy-phase-4-1-t-o-tenant-u-backfill-core-tables`.
- Tạo tenant `main` với plan `vip`.
- Tạo subscription row VIP cho tenant đầu.
- Tất cả user hiện có trở thành admin của tenant đầu.
- Backfill core tables: `products`, `customers`, `suppliers`, `orders`, `order_items`, `promotions`.
- Set `NOT NULL` cho `tenant_id` trên 6 bảng core.
- Kiểm thử: `tenant_id IS NULL` count = 0; memberships có admin cho mỗi user; subscription có row.
```

### Phase 4.2 — Remaining backfill + orphan cleanup + FK

```text
Thực hiện Phase 4.2 — Backfill remaining tables + orphan cleanup + FK.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 4.2.
- Đọc OpenSpec change `multi-tenancy-phase-4-2-backfill-remaining-tables-orphan-cleanup-fk`.
- Backfill 27 bảng còn lại từ tenant đầu.
- Set `NOT NULL` cho `tenant_id` trên 27 bảng.
- Backup orphan records vào `orphan_records_backup`.
- Xóa orphan records trong các bảng cha-con.
- Thêm missing FKs: `order_items.lot_id`, `return_order_items.lot_id`, `import_items.lot_id`.
- Kiểm thử: không còn orphan; FK đã có; subscription row tồn tại.
```

### Phase 5.1 — Helper functions + custom fetch wrapper

```text
Thực hiện Phase 5.1 — Helper functions + custom fetch wrapper.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 5.1.
- Đọc OpenSpec change `multi-tenancy-phase-5-1-helper-functions-custom-fetch-wrapper`.
- Tạo `current_tenant_id()` đọc từ header `x-tenant-id`.
- Tạo `lib/tenant.ts`: `getSubdomain()`, `getTenantId()`.
- Tạo `lib/supabase.ts`: custom fetch wrapper inject `x-tenant-id`.
- Kiểm thử: header `x-tenant-id` được gửi kèm request.
```

### Phase 5.2 — RLS policies — core tables

```text
Thực hiện Phase 5.2 — RLS policies cho core tables.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 5.2.
- Đọc OpenSpec change `multi-tenancy-phase-5-2-rls-policies-core-tables`.
- Bảng: `products`, `customers`, `orders`, `order_items`, `suppliers`.
- Tạo 4 policies: `tenant_isolation_select`, `tenant_isolation_insert`, `tenant_isolation_update`, `tenant_isolation_delete`.
- Delete chỉ cho admin.
- Kiểm thử: user tenant A chỉ thấy data tenant A; insert tenant_id khác bị từ chối.
```

### Phase 5.3 — RLS policies — remaining tables + unique indexes

```text
Thực hiện Phase 5.3 — RLS policies cho remaining tables + unique indexes.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 5.3.
- Đọc OpenSpec change `multi-tenancy-phase-5-3-rls-policies-remaining-tables-unique-indexes`.
- Tạo RLS policies cho 27 bảng còn lại theo mẫu Phase 5.
- Tạo unique indexes per tenant:
  - `idx_products_sku_per_tenant`
  - `idx_products_barcode_per_tenant`
  - `idx_orders_code_per_tenant`
  - `idx_einvoice_orders_invoice_number_per_tenant`
- Kiểm thử: tất cả bảng có RLS; SKU/barcode/order_code/invoice_number unique theo tenant.
```

### Phase 6.1 — TenantContext + routing/subdomain

```text
Thực hiện Phase 6.1 — TenantContext + routing/subdomain.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 6.1.
- Đọc OpenSpec change `multi-tenancy-phase-6-1-tenantcontext-routing-subdomain`.
- Tạo `contexts/TenantContext.tsx`.
- Subdomain `admin` hoặc root domain → không resolve tenant; routing cho SystemAdminDashboard/LandingPage.
- Subdomain không tồn tại → redirect root hoặc 404.
- Tenant suspended → trang tạm dừng.
- User không thuộc tenant → trang không có quyền.
- Kiểm thử: 404, suspended, user không thuộc tenant.
```

### Phase 6.2 — Custom fetch wrapper + service layer inject

```text
Thực hiện Phase 6.2 — Custom fetch wrapper + service layer inject.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 6.2.
- Đọc OpenSpec change `multi-tenancy-phase-6-2-custom-fetch-wrapper-service-layer-inject`.
- Hoàn thiện `lib/supabase.ts`.
- Rà soát `services/supabaseService.ts`:
  - Thêm `tenantId` vào các mapper `mapXxxToDB`.
  - Hàm insert/update luôn inject `tenant_id` từ `TenantContext`/`getCurrentTenantId()`.
  - Không cho client ghi đè `tenant_id`.
- Xử lý `processed_operations` / offline queue lưu `tenant_id`.
- Kiểm thử: tạo product có tenant_id đúng; API từ subdomain khác không thấy data.
```

### Phase 6.3 — App.tsx + global data loading

```text
Thực hiện Phase 6.3 — App.tsx + global data loading.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 6.3.
- Đọc OpenSpec change `multi-tenancy-phase-6-3-app-tsx-global-data-loading`.
- Bọc `TenantProvider` trong `App.tsx`.
- Sửa global data loading: thêm `tenantId` vào dependency của useEffect.
- Đảm bảo global load chỉ chạy khi tenant đã xác định.
- Kiểm thử: chuyển subdomain thấy data khác; tenant A → subdomain B không thấy data A.
```

### Phase 6.4 — Page-level data loading

```text
Thực hiện Phase 6.4 — Page-level data loading.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 6.4.
- Đọc OpenSpec change `multi-tenancy-phase-6-4-page-level-data-loading`.
- Tạo hook `useTenant()`.
- Sửa các page chính: POS, orders, products, customers, reports, inventory.
- Thêm `tenantId` vào dependency array của các useEffect fetch data.
- Kiểm thử: mỗi page chỉ hiển thị data của tenant hiện tại.
```

### Phase 7 — Subscription limits

```text
Thực hiện Phase 7 — Thiết kế giới hạn và gói dịch vụ.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 7.
- Đọc OpenSpec change `multi-tenancy-phase-7-thi-t-k-gi-i-h-n-v-g-i-d-ch-v-gi-nguy-n`.
- Tạo function `check_tenant_limits()` và trigger cho `tenant_memberships`, `products`.
- Tạo function `increment_monthly_order_count()` và trigger cho `orders`.
- Tạo `services/subscriptionService.ts`.
- Gói Free: 50 SKU, 300 đơn/tháng, 1 user. VIP: 999.999 SKU, 999.999 đơn/tháng, 999 user.
- Kiểm thử: Free tenant không thêm user thứ 2, sản phẩm thứ 51, đơn thứ 301.
```

### Phase 8 — Admin dashboard

```text
Thực hiện Phase 8 — Tạo admin dashboard cho chủ hệ thống.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 8.
- Đọc OpenSpec change `multi-tenancy-phase-8-t-o-admin-dashboard-cho-ch-h-th-ng-gi-nguy-n`.
- Tạo `pages/SystemAdminDashboard.tsx`.
- Route `/admin/*` hoặc subdomain `admin.vietsalepro.com`.
- Tạo RPC `create_tenant_with_admin`, `update_tenant_status`.
- Chỉ `system_admins` truy cập.
- Kiểm thử: system admin tạo tenant; user thường không vào được.
```

### Phase 9.1 — create-tenant Edge Function

```text
Thực hiện Phase 9.1 — Edge Function `create-tenant`.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 9.1.
- Đọc OpenSpec change `multi-tenancy-phase-9-1-create-tenant`.
- Tạo `supabase/functions/create-tenant/index.ts`.
- Rate limiting 10 req/phút/IP.
- Kiểm tra caller là system admin.
- Validate subdomain, kiểm tra trùng, không trùng reserved.
- Tạo user admin, tenant, subscription, membership.
- Ghi audit log.
- Trả về `{ tenant, adminUser, initialPassword }`.
- Kiểm thử: tạo tenant qua function; subdomain invalid bị từ chối; tenant có subscription.
```

### Phase 9.2 — invite-member Edge Function

```text
Thực hiện Phase 9.2 — Edge Function `invite-member`.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 9.2.
- Đọc OpenSpec change `multi-tenancy-phase-9-2-invite-member`.
- Tạo `supabase/functions/invite-member/index.ts`.
- Rate limiting 10 req/phút/IP.
- Kiểm tra caller là admin của tenant.
- Kiểm tra giới hạn số user.
- Email đã tồn tại → thêm membership; chưa tồn tại → tạo user + gửi recovery link về subdomain.
- Ghi audit log.
- Kiểm thử: invite qua email; vượt giới hạn bị từ chối.
```

### Phase 9.3 — check-subdomain Edge Function

```text
Thực hiện Phase 9.3 — Edge Function `check-subdomain`.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 9.3.
- Đọc OpenSpec change `multi-tenancy-phase-9-3-check-subdomain`.
- Tạo `supabase/functions/check-subdomain/index.ts`.
- Rate limiting 10 req/phút/IP.
- Kiểm thử: subdomain tồn tại → false; subdomain trống → true.
```

### Phase 9.4 — reset-password Edge Function

```text
Thực hiện Phase 9.4 — Edge Function `reset-password`.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 9.4.
- Đọc OpenSpec change `multi-tenancy-phase-9-4-reset-password`.
- Tạo `supabase/functions/reset-password/index.ts`.
- Kiểm tra caller là admin tenant hoặc system admin.
- User đã từng đăng nhập → recovery link; user mới → invite link.
- Redirect về đúng subdomain.
- Kiểm thử: redirect về đúng subdomain.
```

### Phase 9.5 — process-checkout Edge Function

```text
Thực hiện Phase 9.5 — Edge Function `process-checkout`.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 9.5.
- Đọc OpenSpec change `multi-tenancy-phase-9-5-process-checkout`.
- Tạo `supabase/functions/process-checkout/index.ts`.
- Nhận `x-tenant-id` hoặc `x-subdomain`.
- Xử lý đơn hàng, cập nhật tồn kho, điểm thưởng trong phạm vi tenant.
- Kiểm thử: tạo đơn hàng qua Edge Function.
```

### Phase 9.6 — audit-log-writer + rate limiting

```text
Thực hiện Phase 9.6 — Edge Function `audit-log` + rate limiting.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 9.6.
- Đọc OpenSpec change `multi-tenancy-phase-9-6-audit-log-writer-rate-limiting`.
- Tạo `supabase/functions/audit-log/index.ts`.
- Tạo bảng `rate_limit_logs`.
- Quy tắc: login sai ≥ 5 lần/15 phút/IP → lockout; tạo tenant/check subdomain/invite: 10 req/phút/IP.
- Dọn data cũ > 24h.
- Kiểm thử: rate limiting chặn brute-force và spam.
```

### Phase 10.1 — DB policies by role

```text
Thực hiện Phase 10.1 — DB policies theo role.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 10.1.
- Đọc OpenSpec change `multi-tenancy-phase-10-1-db-policies-theo-role`.
- Tạo `user_tenant_role()`.
- DROP generic Phase 5 policies trước khi thêm role-based policies.
- Phân quyền:
  - orders: admin/cashier tạo; chỉ admin sửa/xóa.
  - products/import/inventory: admin/inventory_manager tạo; chỉ admin sửa/xóa.
  - customers: admin/cashier tạo; chỉ admin sửa/xóa.
  - suppliers: admin/inventory_manager tạo; chỉ admin sửa/xóa.
  - config tables: chỉ admin.
- Kiểm thử: cashier tạo đơn OK, sửa/xóa bị từ chối; accountant không tạo đơn; inventory manager không xem báo cáo.
```

### Phase 10.2 — UI permissions

```text
Thực hiện Phase 10.2 — UI permissions.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 10.2.
- Đọc OpenSpec change `multi-tenancy-phase-10-2-ui-permissions`.
- Tạo `hooks/usePermissions.ts`.
- Sửa `AppShell`/`BottomNav`: ẩn menu theo role.
- Sửa các page: disable/hide button tạo/xóa/sửa.
- Kiểm thử: cashier không thấy menu nhập hàng/báo cáo/quản lý user; accountant không thấy nút tạo đơn/nhập hàng.
```

### Phase 11 — Audit log

```text
Thực hiện Phase 11 — Thêm audit log.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 11.
- Đọc OpenSpec change `multi-tenancy-phase-11-th-m-audit-log-gi-nguy-n`.
- Tạo bảng `app_audit_log`.
- Bật RLS và policy chỉ admin/system admin.
- Tạo function `write_audit_log()`.
- Gắn trigger cho `orders`, `products`, `import_receipts`, `disposals`, `app_settings`.
- Tạo `services/auditService.ts`.
- Tạo page xem audit log.
- Trong `AuthContext`: gọi LOGIN/LOGOUT audit.
- Kiểm thử: mỗi thao tác quan trọng tạo log; chỉ admin/system admin xem được.
```

### Phase 12.1 — TypeScript strict core

```text
Thực hiện Phase 12.1 — Bật TypeScript strict + fix core services/types.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 12.1.
- Đọc OpenSpec change `multi-tenancy-phase-12-1-b-t-strict-fix-core-services-types`.
- Bật `"strict": true` trong `tsconfig.json`.
- Fix `services/supabaseService.ts` (CRUD cơ bản, không chạm logic nghiệp vụ sâu).
- Fix `types.ts`, `utils/`, `hooks/`.
- Kiểm thử: `npm run lint` pass; `npm run build` pass.
```

### Phase 12.2 — TypeScript strict pages

```text
Thực hiện Phase 12.2 — Fix TypeScript strict cho pages.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 12.2.
- Đọc OpenSpec change `multi-tenancy-phase-12-2-fix-pages`.
- Sửa từng page để pass strict.
- Ưu tiên POS, orders, products, customers.
- Kiểm thử: `npm run lint` pass; `npm run build` pass.
```

### Phase 12.3 — TypeScript strict components + final build

```text
Thực hiện Phase 12.3 — Fix TypeScript strict cho components + final build.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 12.3.
- Đọc OpenSpec change `multi-tenancy-phase-12-3-fix-components-final-build`.
- Sửa từng component để pass strict.
- Chạy `npm run build` cuối cùng.
- Kiểm thử: `npm run lint` pass; `npm run build` pass.
```

### Phase 13.1 — Unit tests tenant/auth/RLS

```text
Thực hiện Phase 13.1 — Unit tests cho tenant/auth/RLS.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 13.1.
- Đọc OpenSpec change `multi-tenancy-phase-13-1-unit-tests-tenant-auth-rls`.
- Setup Vitest (nếu chưa có): `npm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react`.
- Tạo `tests/tenant.test.ts`, `tests/rls.test.ts`.
- Mock Supabase client.
- Kiểm thử: tạo tenant/user/membership; cross-query trả về 0 row; insert tenant_id sai bị từ chối.
```

### Phase 13.2 — Integration tests tenant isolation

```text
Thực hiện Phase 13.2 — Integration tests cho tenant isolation.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 13.2.
- Đọc OpenSpec change `multi-tenancy-phase-13-2-integration-tests-tenant-isolation`.
- Tạo `tests/integration/tenant-isolation.test.ts`.
- Kiểm thử: tenant A tạo products/orders; tenant B không thấy; subdomain đổi → tenant đổi.
```

### Phase 13.3 — Smoke tests RBAC/subscription/offline

```text
Thực hiện Phase 13.3 — Smoke tests cho RBAC, subscription, offline.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Sub-phase 13.3.
- Đọc OpenSpec change `multi-tenancy-phase-13-3-smoke-tests-rbac-subscription-offline`.
- Tạo `tests/smoke/rbac.test.ts`, `tests/smoke/subscription.test.ts`, `tests/smoke/offline-tenant.test.ts`.
- Kiểm thử: cashier không xóa đơn; Free tenant đạt giới hạn; offline queue cách ly theo tenant.
```

### Phase 14 — Codebase cleanup

```text
Thực hiện Phase 14 — Dọn dẹp codebase.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 14.
- Đọc OpenSpec change `multi-tenancy-phase-14-d-n-d-p-codebase`.
- Drop các backup tables đã deploy.
- Xóa `components/MobilePOS.backup.tsx` nếu còn.
- Xóa file test tạm, console.log, dead code.
- Chuẩn hóa error handling với `AppError` class.
- Kiểm thử: `npm run lint` pass; `npm run build` pass; không còn file/import thừa.
```

### Phase 15 — Staging tests

```text
Thực hiện Phase 15 — Test trên staging.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 15.
- Đọc OpenSpec change `multi-tenancy-phase-15-test-tr-n-staging-gi-nguy-n`.
- Tạo 3 tenants: `store-a`, `store-b`, `store-c`.
- Mỗi tenant có 1 admin, 1 cashier, 1 inventory_manager, 1 accountant.
- Chạy checklist: data isolation, RBAC, suspend, 404, storage RLS, subscription limits, password reset, rate limiting, offline sync, audit log.
- Ghi kết quả staging test.
```

### Phase 16 — Production deploy

```text
Thực hiện Phase 16 — Deploy production.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 16.
- Đọc OpenSpec change `multi-tenancy-phase-16-deploy-production`.
- Backup production.
- Cấu hình Cloudflare Pages: domain `vietsalepro.com`, wildcard `*.vietsalepro.com`.
- Tạo Storage RLS policy cho bucket `tenant-assets`.
- Chạy migration từ Phase 1 → Phase 13.
- Deploy frontend.
- Smoke test.
- Nếu smoke pass → chạy Phase 14 (dọn backup tables).
- Theo dõi lỗi 24h.
```

### Phase 17 — Long-term operations

```text
Thực hiện Phase 17 — Thiết lập vận hành dài hạn.

Yêu cầu:
- Đọc `memory-zone/KE_HOACH/NHOM_1/KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`, section Phase 17.
- Đọc OpenSpec change `multi-tenancy-phase-17-thi-t-l-p-v-n-h-nh-d-i-h-n`.
- Archive đơn hàng > 2 năm.
- Partition `app_audit_log` theo tháng (khi cần).
- Setup cron `data-retention-daily`.
- Xây dựng backup strategy: Supabase CLI hoặc PITR.
- Bật monitoring: Supabase Log Explorer, disk usage alert, tenant/user growth alert.
- Viết `runbook.md`.
```
