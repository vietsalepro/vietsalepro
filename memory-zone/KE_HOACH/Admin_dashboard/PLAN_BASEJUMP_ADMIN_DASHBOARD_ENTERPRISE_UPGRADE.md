```markdown
# Kế hoạch nâng cấp Admin Dashboard theo mô hình Basejump

> **Mục tiêu:** Hoàn thiện Admin Dashboard theo chuẩn enterprise, học hỏi từ `usebasejump/basejump` và `basejump-next`, đồng thời khắc phục tình trạng code hiện tại bị rối, nhiều lỗi, build không ổn định.

---

## 1. Tình trạng hiện tại (nhanh)

- `pages/SystemAdminDashboard.tsx` là một file khổng lồ (~2.776 dòng, chunk JS ~362 KB) chứa gần như toàn bộ tính năng admin: tenant, member, billing, audit, health, storage, API keys, webhooks, white-label, ...
- Các tính năng khác nhau đang dùng chung state, effect, helper function nội bộ, dễ gây lỗi khi sửa một chỗ ảnh hưởng chỗ khác.
- Gần đây đã phải fix TypeScript errors và missing exports để build được (`c0b4ffa3`, `961670b3`), nhưng vẫn còn rủi ro build trên Vercel.
- Có nhiều smoke tests nhưng chưa có test DB (pgtap) hoặc RLS test chặt chẽ.

## 2. Những gì Basejump làm tốt mình nên học

| Basejump pattern | Mô tả | Cách áp dụng vào VietSale |
|------------------|-------|---------------------------|
| **Account model** | `basejump.accounts` + `basejump.account_user` với role `owner/member`. Tự động tạo personal account khi user đăng ký. | `public.tenants` tương ứng `accounts`, `public.tenant_memberships` tương ứng `account_user`. Chuẩn hóa role, trigger, RLS. |
| **RLS-first permissions** | Helper functions `has_role_on_account`, `get_accounts_with_role`, policies dựa trên hàm này. | Thay vì kiểm tra `is_system_admin()` rải rác, tập trung vào `permissions` helper + policies. |
| **Slug-based routing** | `dashboard/[accountSlug]/...` | Chuyển admin dashboard từ tab trong một file sang route `/admin/tenants/:slug`, `/admin/billing/:id`, ... |
| **Atomic UI components** | `AccountSelector`, `DashboardHeader`, `SettingsNavigation`, `UserAccountButton`, dùng shadcn/ui primitives. | Giữ `AdminShell`, `AdminSidebar`, `AdminTabs` nhưng tách thành composable hơn, giảm CSS custom. |
| **Service layer qua RPC** | Mọi truy vấn đi qua RPC `SECURITY INVOKER`/`SECURITY DEFINER` rõ ràng, type-safe. | Mỗi domain có service file gọi RPC, không query trực tiếp auth schema từ client. |
| **Billing schema** | `billing_customers`, `billing_subscriptions`, `service_role_upsert_customer_subscription`. | Cập nhật `tenant_subscriptions` thành subscription/customer model rõ ràng, hỗ trợ nhiều provider. |
| **pgtap tests** | Test DB logic và RLS ngay trong migration repo. | Bổ sung `supabase/tests/` cho core admin functions. |

## 3. Kiến trúc đề xuất
```

Admin Dashboard (enterprise) ├── Layout: AdminShell + AdminSidebar + AdminTabs (reuse) ├── Routes / Pages │ ├── /admin/overview │ ├── /admin/tenants │ ├── /admin/tenants/:tenantId │ ├── /admin/members │ ├── /admin/billing │ ├── /admin/audit │ ├── /admin/settings │ └── ... (health, storage, webhooks, ...) ├── Services │ ├── services/admin/tenantAdminService.ts │ ├── services/admin/memberAdminService.ts │ ├── services/admin/billingAdminService.ts │ ├── services/admin/auditAdminService.ts │ └── services/admin/systemAdminService.ts ├── Permissions │ └── lib/permissions.ts <-- hasTenantRole, isSystemAdmin, canManageBilling, ... ├── DB │ ├── RLS helper functions │ ├── tenant_memberships policies │ └── audit_log triggers └── Tests ├── supabase/tests/admin/*.sql └── tests/admin-dashboard/*.test.ts

```javascript

---

## 4. Implementation Plan

### Overview

Kế hoạch chia làm 7 phase, mỗi phase gồm nhiều task nhỏ theo mô hình vertical slicing. Mỗi task có acceptance criteria rõ ràng, verification steps, và dependency mapping. Các phase được sắp xếp theo dependency graph: ổn định build trước → tách layout/routing → service layer → DB/permissions → billing → RBAC/audit → testing.

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **React.lazy() cho pages ít dùng** | Giảm chunk JS từ ~362 KB xuống ~100 KB initial load |
| **Mỗi domain một service file riêng** | Tránh shared state lộn xộn, dễ test, dễ maintain |
| **RLS-first thay vì is_system_admin() rải rác** | Bảo mật ở DB layer, không phụ thuộc client-side check |
| **Route-based navigation thay vì tab trong 1 file** | Giảm complexity, hỗ trợ deep linking, code-splitting tự nhiên |
| **Mỗi phase là một OpenSpec change riêng** | Tránh scope creep, dễ review và rollback |

---

### Phase 0 — Ổn định build & test hiện tại

**Mô tả:** Đảm bảo CI/CD xanh trước khi refactor. Phát hiện và khắc phục mọi lỗi build, lint, test hiện tại.

**Dependencies:** None

#### Task 0.1: Kiểm tra và khắc phục lỗi build Vercel

**Description:** Xem xét Vercel build logs, xác định nguyên nhân fail (nếu có). Kiểm tra env variables, loại trừ test files khỏi production build, kiểm tra chunk size.

**Acceptance criteria:**
- [ ] `npm run build` chạy thành công ở local không lỗi
- [ ] Vercel preview deployment build xanh
- [ ] Chunk JS của admin dashboard giảm xuống dưới 250 KB (bằng cách loại trừ test files và code splitting cơ bản)

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: deploy lên Vercel preview và verify build log

**Files likely touched:**
- `vercel.json`
- `vite.config.ts`
- `package.json`

**Estimated scope:** Small (1-2 files)

#### Task 0.2: Đảm bảo lint và test local xanh

**Description:** Chạy `npm run lint` và `npm run test`, fix tất cả lỗi hiện có. Ghi lại build/test commands vào `AGENTS.md`.

**Acceptance criteria:**
- [ ] `npm run lint` không còn lỗi (warning có thể chấp nhận)
- [ ] `npm run test` pass 100%
- [ ] `AGENTS.md` có section build/test commands

**Verification:**
- [ ] Tests pass: `npm run test`
- [ ] Lint pass: `npm run lint`

**Files likely touched:**
- `memory-zone/AGENTS.md`
- Các file test bị fail

**Estimated scope:** Small (1-3 files)

#### Task 0.3: Kiểm tra TypeScript strict mode

**Description:** Chạy `tsc --noEmit` để phát hiện type errors tiềm ẩn. Fix các lỗi type nghiêm trọng.

**Acceptance criteria:**
- [ ] `tsc --noEmit` không còn lỗi (có thể dùng `// @ts-expect-error` cho các trường hợp đặc biệt)
- [ ] Không có `any` type không cần thiết trong admin dashboard code

**Verification:**
- [ ] Build succeeds: `tsc --noEmit`

**Files likely touched:**
- `tsconfig.json`
- Các file `.ts`/`.tsx` trong `pages/` và `components/`

**Estimated scope:** Medium (3-5 files)

---

### Checkpoint: Phase 0

- [ ] `npm run build` xanh
- [ ] `npm run lint` xanh
- [ ] `npm run test` xanh
- [ ] `tsc --noEmit` xanh
- [ ] Vercel preview deploy xanh
- [ ] **Review với human trước khi sang Phase 1**

---

### Phase 1 — Tách layout & routing

**Mô tả:** Tách `SystemAdminDashboard.tsx` (monolith ~2.776 dòng) thành các page riêng với routing rõ ràng. Dùng `AdminShell` làm shared layout, `React.lazy()` cho code splitting.

**Dependencies:** Phase 0

#### Task 1.1: Tạo thư mục pages/admin/ và route structure

**Description:** Tạo cấu trúc thư mục `pages/admin/` với các page con. Thiết lập routing trong `App.tsx` (hoặc router config) cho các route `/admin/*`.

**Acceptance criteria:**
- [ ] Thư mục `pages/admin/` tồn tại với các file: `Overview.tsx`, `Tenants.tsx`, `TenantDetail.tsx`, `Members.tsx`, `Billing.tsx`, `Audit.tsx`, `Settings.tsx`
- [ ] Router config có các route tương ứng
- [ ] Navigation từ `AdminSidebar` hoạt động với các route mới

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: click từng item trong sidebar và thấy URL thay đổi

**Files likely touched:**
- `App.tsx`
- `pages/admin/Overview.tsx` (new)
- `pages/admin/Tenants.tsx` (new)
- `pages/admin/TenantDetail.tsx` (new)
- `pages/admin/Members.tsx` (new)
- `pages/admin/Billing.tsx` (new)
- `pages/admin/Audit.tsx` (new)
- `pages/admin/Settings.tsx` (new)

**Estimated scope:** Medium (3-5 files)

#### Task 1.2: Refactor SystemAdminDashboard.tsx — tách Overview tab

**Description:** Di chuyển code của Overview tab từ `SystemAdminDashboard.tsx` sang `pages/admin/Overview.tsx`. Đảm bảo tất cả state, effect, helper function cần thiết được chuyển theo.

**Acceptance criteria:**
- [ ] `pages/admin/Overview.tsx` render đúng nội dung Overview (KPI cards, system health, ...)
- [ ] `SystemAdminDashboard.tsx` giảm được ít nhất 300 dòng
- [ ] Không có regression: Overview hoạt động giống hệt trước khi tách

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: route `/admin/overview` hiển thị đúng dữ liệu

**Files likely touched:**
- `pages/SystemAdminDashboard.tsx`
- `pages/admin/Overview.tsx`

**Estimated scope:** Medium (3-5 files)

#### Task 1.3: Refactor SystemAdminDashboard.tsx — tách Tenants & TenantDetail

**Description:** Di chuyển code của Tenants tab và Tenant detail modal sang `pages/admin/Tenants.tsx` và `pages/admin/TenantDetail.tsx`.

**Acceptance criteria:**
- [ ] `pages/admin/Tenants.tsx` hiển thị danh sách tenants với filter, search, pagination
- [ ] `pages/admin/TenantDetail.tsx` hiển thị chi tiết tenant khi click
- [ ] `SystemAdminDashboard.tsx` giảm thêm ít nhất 500 dòng

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: route `/admin/tenants` list đúng, click vào tenant thấy detail

**Files likely touched:**
- `pages/SystemAdminDashboard.tsx`
- `pages/admin/Tenants.tsx`
- `pages/admin/TenantDetail.tsx`

**Estimated scope:** Medium (3-5 files)

#### Task 1.4: Refactor SystemAdminDashboard.tsx — tách Members, Billing, Audit, Settings

**Description:** Di chuyển các tab còn lại (Members, Billing, Audit, Settings) thành page riêng.

**Acceptance criteria:**
- [ ] Mỗi page con render đúng chức năng tương ứng
- [ ] `SystemAdminDashboard.tsx` chỉ còn là container điều hướng (hoặc có thể xóa hoàn toàn)
- [ ] Tất cả chức năng hoạt động không regression

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: từng route `/admin/members`, `/admin/billing`, `/admin/audit`, `/admin/settings` hoạt động

**Files likely touched:**
- `pages/SystemAdminDashboard.tsx`
- `pages/admin/Members.tsx`
- `pages/admin/Billing.tsx`
- `pages/admin/Audit.tsx`
- `pages/admin/Settings.tsx`

**Estimated scope:** Large (5-8 files) — cần chia nhỏ nếu quá lớn

#### Task 1.5: Áp dụng React.lazy() cho code splitting

**Description:** Dùng `React.lazy()` + `Suspense` cho các page ít dùng (Audit, Settings, Billing history) để giảm initial chunk size.

**Acceptance criteria:**
- [ ] Chunk JS initial load giảm từ ~362 KB xuống ≤ 150 KB
- [ ] Các page được lazy-load hiển thị đúng khi người dùng điều hướng đến
- [ ] Loading state hiển thị trong khi chunk đang tải

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: inspect Network tab thấy chunk riêng cho mỗi page

**Files likely touched:**
- `App.tsx` (hoặc router config)
- `components/LoadingState.tsx`

**Estimated scope:** Small (1-2 files)

---

### Checkpoint: Phase 1

- [ ] `npm run build` xanh
- [ ] Tất cả route `/admin/*` hoạt động
- [ ] Chunk JS ≤ 150 KB initial load
- [ ] `SystemAdminDashboard.tsx` đã được tách hoàn toàn hoặc giảm ≥ 80% dòng code
- [ ] **Review với human trước khi sang Phase 2**

---

### Phase 2 — Chuẩn hóa service layer theo Basejump

**Mô tả:** Tách logic gọi Supabase khỏi UI components vào service layer riêng. Mỗi domain có service file gọi RPC rõ ràng, typed.

**Dependencies:** Phase 1

#### Task 2.1: Tạo service layer structure

**Description:** Tạo thư mục `services/admin/` và các file service cho từng domain. Định nghĩa interface/types cho mỗi service.

**Acceptance criteria:**
- [ ] `services/admin/tenantAdminService.ts` tồn tại với các hàm CRUD typed
- [ ] `services/admin/memberAdminService.ts` tồn tại
- [ ] `services/admin/billingAdminService.ts` tồn tại
- [ ] `services/admin/auditAdminService.ts` tồn tại
- [ ] `services/admin/systemAdminService.ts` tồn tại
- [ ] Mỗi service export typed functions, không export raw Supabase client

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] TypeScript check: `tsc --noEmit`

**Files likely touched:**
- `services/admin/tenantAdminService.ts` (new)
- `services/admin/memberAdminService.ts` (new)
- `services/admin/billingAdminService.ts` (new)
- `services/admin/auditAdminService.ts` (new)
- `services/admin/systemAdminService.ts` (new)

**Estimated scope:** Medium (3-5 files)

#### Task 2.2: Migrate tenant queries từ UI vào service

**Description:** Chuyển tất cả Supabase query liên quan đến tenant từ `SystemAdminDashboard.tsx` (hoặc các page con) vào `tenantAdminService.ts`. Cập nhật UI components để gọi service functions.

**Acceptance criteria:**
- [ ] Không còn Supabase query trực tiếp trong UI components cho tenant operations
- [ ] `tenantAdminService.ts` xử lý tất cả: list, get, create, update, delete tenant
- [ ] Error handling tập trung trong service layer

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: tất cả tenant operations hoạt động (list, create, edit, delete)

**Files likely touched:**
- `services/admin/tenantAdminService.ts`
- `pages/admin/Tenants.tsx`
- `pages/admin/TenantDetail.tsx`
- `pages/SystemAdminDashboard.tsx` (nếu còn)

**Estimated scope:** Medium (3-5 files)

#### Task 2.3: Migrate member/billing/audit/system queries vào service

**Description:** Tương tự Task 2.2 nhưng cho các domain còn lại: members, billing, audit, system.

**Acceptance criteria:**
- [ ] UI components không còn Supabase query trực tiếp
- [ ] Mỗi service file hoàn chỉnh với typed functions
- [ ] Error handling và validation tập trung trong service layer

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: tất cả operations hoạt động

**Files likely touched:**
- `services/admin/memberAdminService.ts`
- `services/admin/billingAdminService.ts`
- `services/admin/auditAdminService.ts`
- `services/admin/systemAdminService.ts`
- Các page components tương ứng

**Estimated scope:** Large (5-8 files)

---

### Checkpoint: Phase 2

- [ ] `npm run build` xanh
- [ ] Không còn Supabase query trực tiếp trong UI components
- [ ] Mỗi service file có typed functions và error handling
- [ ] **Review với human trước khi sang Phase 3**

---

### Phase 3 — Áp dụng Basejump account/team model

**Mô tả:** Chuẩn hóa DB schema, RLS policies, và permission helpers theo mô hình Basejump. Migration an toàn với backfill và rollback plan.

**Dependencies:** Phase 2

#### Task 3.1: Migration chuẩn hóa tenant_memberships

**Description:** Tạo migration để chuẩn hóa `tenant_memberships`: thêm role enum (`owner`, `admin`, `cashier`, `inventory_manager`, `accountant`, `viewer`), thêm `status`, `invited_by`, `invited_at` columns. Backfill dữ liệu cũ.

**Acceptance criteria:**
- [ ] Migration chạy thành công (up và down)
- [ ] `tenant_memberships` có đầy đủ columns mới
- [ ] Dữ liệu cũ được backfill đúng (mặc định role = 'admin' cho members hiện tại)
- [ ] Có rollback script

**Verification:**
- [ ] Migration up: `supabase migration up`
- [ ] Migration down: `supabase migration down` — verify dữ liệu không mất
- [ ] Manual check: query `tenant_memberships` thấy columns mới

**Files likely touched:**
- `supabase/migrations/xxxx_add_tenant_memberships_standard.sql` (new)
- `supabase/migrations/xxxx_add_tenant_memberships_standard_down.sql` (new)

**Estimated scope:** Medium (3-5 files)

#### Task 3.2: Tạo DB helper functions cho RLS

**Description:** Tạo các hàm SQL helper: `has_tenant_role(tenant_id, role)`, `get_tenants_for_user(role)`, `is_tenant_owner(tenant_id)`. Đây là nền tảng cho RLS policies.

**Acceptance criteria:**
- [ ] `has_tenant_role()` function tồn tại và hoạt động đúng
- [ ] `get_tenants_for_user()` function tồn tại và hoạt động đúng
- [ ] `is_tenant_owner()` function tồn tại và hoạt động đúng
- [ ] Các function được đánh dấu `SECURITY INVOKER` hoặc `SECURITY DEFINER` phù hợp

**Verification:**
- [ ] Migration up thành công
- [ ] Test SQL: gọi từng function và verify kết quả

**Files likely touched:**
- `supabase/migrations/xxxx_create_rls_helper_functions.sql` (new)

**Estimated scope:** Small (1-2 files)

#### Task 3.3: Bật RLS trên tenants và tenant_memberships

**Description:** Enable RLS trên `tenants` và `tenant_memberships` tables. Viết policies dùng helper functions từ Task 3.2.

**Acceptance criteria:**
- [ ] RLS enabled trên `tenants` table
- [ ] RLS enabled trên `tenant_memberships` table
- [ ] Policies: owner có full access, admin có CRUD, member có read-only
- [ ] Policies: system admin (trong `user_roles`) có thể xem tất cả
- [ ] Các query hiện tại không bị broken (policies phải tương thích với code)

**Verification:**
- [ ] Migration up thành công
- [ ] Test: user với role khác nhau query tenants và nhận đúng kết quả

**Files likely touched:**
- `supabase/migrations/xxxx_enable_rls_tenants.sql` (new)

**Estimated scope:** Medium (3-5 files)

#### Task 3.4: Cập nhật lib/permissions.ts

**Description:** Tạo/ cập nhật `lib/permissions.ts` với các helper: `hasTenantRole()`, `isSystemAdmin()`, `canManageBilling()`, `canManageMembers()`. Các hàm này gọi RPC helper functions thay vì tự query.

**Acceptance criteria:**
- [ ] `lib/permissions.ts` export đầy đủ permission helpers
- [ ] Các helper gọi RPC (không query trực tiếp)
- [ ] UI components dùng `lib/permissions.ts` thay vì tự kiểm tra role

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: user với role khác nhau thấy đúng UI elements

**Files likely touched:**
- `lib/permissions.ts` (new)
- Các UI components dùng permission check

**Estimated scope:** Medium (3-5 files)

#### Task 3.5: Cập nhật edge functions dùng service_role đúng cách

**Description:** Rà soát và cập nhật edge functions để dùng `service_role` key đúng cách, không query `auth.users` trực tiếp từ client.

**Acceptance criteria:**
- [ ] Edge functions không query `auth.users` từ client
- [ ] Edge functions dùng `service_role` cho admin operations
- [ ] Tất cả edge functions hoạt động sau khi cập nhật

**Verification:**
- [ ] Build succeeds: `supabase functions build`
- [ ] Manual check: từng edge function hoạt động

**Files likely touched:**
- `supabase/functions/**/*.ts`

**Estimated scope:** Medium (3-5 files)

---

### Checkpoint: Phase 3

- [ ] Migration up/down hoạt động
- [ ] RLS policies hoạt động đúng
- [ ] `lib/permissions.ts` hoàn chỉnh
- [ ] Edge functions dùng service_role đúng cách
- [ ] **Review với human trước khi sang Phase 4**

---

### Phase 4 — Billing & Subscription enterprise

**Mô tả:** Cập nhật billing schema, tách UI billing thành components riêng, hỗ trợ subscription lifecycle.

**Dependencies:** Phase 2, Phase 3

#### Task 4.1: Cập nhật schema tenant_subscriptions

**Description:** Migration cập nhật `tenant_subscriptions`: thêm `billing_customers` table, chuẩn hóa subscription status (trial → active → past_due → suspended → cancelled), thêm provider field.

**Acceptance criteria:**
- [ ] `billing_customers` table tồn tại với foreign key tới tenants
- [ ] `tenant_subscriptions` có status enum đầy đủ lifecycle
- [ ] Migration có rollback script

**Verification:**
- [ ] Migration up/down thành công
- [ ] Query: insert subscription với mỗi status và verify

**Files likely touched:**
- `supabase/migrations/xxxx_update_billing_schema.sql` (new)

**Estimated scope:** Medium (3-5 files)

#### Task 4.2: Tách UI billing thành components

**Description:** Tách billing UI từ monolith thành các component: `SubscriptionManager`, `InvoiceManager`, `PaymentManager`. Mỗi component gọi `billingAdminService.ts`.

**Acceptance criteria:**
- [ ] `SubscriptionManager` hiển thị subscription info, cho phép upgrade/downgrade
- [ ] `InvoiceManager` hiển thị lịch sử invoices
- [ ] `PaymentManager` hiển thị payment methods và lịch sử
- [ ] Tất cả đều typed và gọi service layer

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: billing page hoạt động đầy đủ

**Files likely touched:**
- `components/SubscriptionManager.tsx` (new)
- `components/InvoiceManager.tsx` (refactor)
- `components/PaymentManager.tsx` (new)
- `pages/admin/Billing.tsx`

**Estimated scope:** Medium (3-5 files)

#### Task 4.3: Hỗ trợ subscription lifecycle

**Description:** Implement lifecycle transitions: trial → active → past_due → suspended → cancelled. Thêm UI warning khi sắp hết hạn, xử lý past_due.

**Acceptance criteria:**
- [ ] UI hiển thị đúng trạng thái subscription hiện tại
- [ ] Warning banner khi subscription sắp hết hạn (≤ 7 ngày)
- [ ] UI bị hạn chế khi subscription suspended
- [ ] Cancel flow hoạt động

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: thay đổi subscription status và verify UI phản hồi đúng

**Files likely touched:**
- `components/SubscriptionManager.tsx`
- `services/admin/billingAdminService.ts`

**Estimated scope:** Medium (3-5 files)

---

### Checkpoint: Phase 4

- [ ] Migration billing schema thành công
- [ ] Subscription lifecycle hoạt động
- [ ] UI billing components hoàn chỉnh
- [ ] **Review với human trước khi sang Phase 5**

---

### Phase 5 — RBAC, invitations, audit logs

**Mô tả:** Phân quyền chi tiết, mời thành viên qua email, audit log tự động.

**Dependencies:** Phase 3

#### Task 5.1: Mời thành viên qua email (invitations)

**Description:** Implement flow mời thành viên: nhập email → chọn role → gửi invitation → accept/decline. Inspired by `basejump-invitations`.

**Acceptance criteria:**
- [ ] UI invite member: nhập email, chọn role, gửi
- [ ] Invitation được lưu trong DB với status `pending`
- [ ] Email notification gửi đến người được mời (dùng edge function)
- [ ] Người được mời có thể accept/decline
- [ ] Sau khi accept, tự động thêm vào `tenant_memberships`

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: mời member, kiểm tra email, accept, verify membership

**Files likely touched:**
- `components/MemberManagement/MemberInviteModal.tsx` (refactor)
- `services/admin/memberAdminService.ts`
- `supabase/migrations/xxxx_create_invitations_table.sql` (new)
- `supabase/functions/send-invitation-email/` (new)

**Estimated scope:** Large (5-8 files)

#### Task 5.2: Phân quyền chi tiết (RBAC)

**Description:** Implement RBAC với các role: owner, admin, cashier, inventory_manager, accountant, viewer. Mỗi role có quyền cụ thể trên từng domain.

**Acceptance criteria:**
- [ ] Role enum đầy đủ: owner, admin, cashier, inventory_manager, accountant, viewer
- [ ] Permission matrix được định nghĩa rõ ràng (role → allowed actions)
- [ ] UI ẩn/hiện elements dựa trên role
- [ ] API/RLS enforce permissions ở DB layer

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: user với role khác nhau thấy UI khác nhau

**Files likely touched:**
- `lib/permissions.ts`
- `types.ts` (role enum)
- `supabase/migrations/xxxx_add_role_enum.sql` (new)
- Các UI components

**Estimated scope:** Large (5-8 files)

#### Task 5.3: Audit log tự động

**Description:** Tạo audit log trigger/service ghi lại mọi admin action (insert/update/delete) trên các tables quan trọng (tenants, tenant_memberships, billing).

**Acceptance criteria:**
- [ ] Audit log table tồn tại với: action, table_name, record_id, old_data, new_data, performed_by, performed_at
- [ ] Trigger tự động ghi log khi có thay đổi trên tables quan trọng
- [ ] UI audit log page hiển thị lịch sử với filter
- [ ] Có service function để query audit logs

**Verification:**
- [ ] Migration up thành công
- [ ] Manual check: thực hiện action, kiểm tra audit log xuất hiện

**Files likely touched:**
- `supabase/migrations/xxxx_create_audit_log_table.sql` (new)
- `supabase/migrations/xxxx_create_audit_triggers.sql` (new)
- `services/admin/auditAdminService.ts`
- `pages/admin/Audit.tsx`

**Estimated scope:** Medium (3-5 files)

---

### Checkpoint: Phase 5

- [ ] Invitation flow hoạt động end-to-end
- [ ] RBAC enforcement ở cả UI và DB layer
- [ ] Audit log ghi lại mọi action
- [ ] **Review với human trước khi sang Phase 6**

---

### Phase 6 — Testing & CI

**Mô tả:** Bổ sung pgtap tests cho DB, Vitest tests cho UI, CI pipeline.

**Dependencies:** Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5

#### Task 6.1: Viết pgtap tests cho DB helper functions

**Description:** Viết pgtap tests cho các DB helper functions từ Phase 3: `has_tenant_role()`, `get_tenants_for_user()`, `is_tenant_owner()`. Test cả RLS policies.

**Acceptance criteria:**
- [ ] `supabase/tests/admin/` directory tồn tại
- [ ] Test cho `has_tenant_role()`: đúng role → true, sai role → false
- [ ] Test cho `get_tenants_for_user()`: trả về đúng tenants theo role
- [ ] Test cho RLS policies: user chỉ thấy được tenants mình có quyền
- [ ] Tất cả tests pass

**Verification:**
- [ ] Tests pass: `supabase test db`

**Files likely touched:**
- `supabase/tests/admin/test_helper_functions.sql` (new)
- `supabase/tests/admin/test_rls_policies.sql` (new)

**Estimated scope:** Medium (3-5 files)

#### Task 6.2: Viết pgtap tests cho billing và audit

**Description:** Viết pgtap tests cho billing schema (Phase 4) và audit log triggers (Phase 5).

**Acceptance criteria:**
- [ ] Test cho billing: subscription lifecycle transitions
- [ ] Test cho audit log: insert trigger ghi log đúng
- [ ] Tất cả tests pass

**Verification:**
- [ ] Tests pass: `supabase test db`

**Files likely touched:**
- `supabase/tests/admin/test_billing.sql` (new)
- `supabase/tests/admin/test_audit_log.sql` (new)

**Estimated scope:** Medium (3-5 files)

#### Task 6.3: Viết Vitest tests cho UI flows

**Description:** Viết Vitest tests cho mỗi page component: Overview, Tenants, Members, Billing, Audit, Settings. Test rendering, loading state, error state, empty state.

**Acceptance criteria:**
- [ ] `tests/admin-dashboard/` directory tồn tại
- [ ] Test cho Overview page: render KPI cards
- [ ] Test cho Tenants page: list, filter, pagination
- [ ] Test cho Members page: list, invite
- [ ] Test cho Billing page: subscription display
- [ ] Test cho Audit page: log list, filter
- [ ] Tất cả tests pass

**Verification:**
- [ ] Tests pass: `npm run test`

**Files likely touched:**
- `tests/admin-dashboard/Overview.test.tsx` (new)
- `tests/admin-dashboard/Tenants.test.tsx` (new)
- `tests/admin-dashboard/Members.test.tsx` (new)
- `tests/admin-dashboard/Billing.test.tsx` (new)
- `tests/admin-dashboard/Audit.test.tsx` (new)

**Estimated scope:** Large (5-8 files)

#### Task 6.4: CI pipeline và pre-commit hooks

**Description:** Cập nhật CI pipeline (GitHub Actions) để chạy lint, type check, test tự động. Thêm pre-commit hook.

**Acceptance criteria:**
- [ ] GitHub Actions workflow chạy: lint → type-check → test → build
- [ ] Pre-commit hook chạy lint và type-check
- [ ] CI fail nếu có lỗi

**Verification:**
- [ ] Push lên branch mới, CI chạy tự động và xanh

**Files likely touched:**
- `.github/workflows/ci.yml` (new)
- `package.json` (pre-commit script)
- `workflow.yml`

**Estimated scope:** Small (1-2 files)

---

### Checkpoint: Phase 6

- [ ] pgtap tests pass cho tất cả DB functions
- [ ] Vitest tests pass cho tất cả UI pages
- [ ] CI pipeline xanh
- [ ] **Review với human trước khi hoàn thành**

---

## 5. Dependency Graph
```

Phase 0 (Build stability) │ ▼ Phase 1 (Layout & routing) │ ▼ Phase 2 (Service layer) │ ├──────────────────┐ ▼ ▼ Phase 3 (DB/RLS) Phase 4 (Billing) │ │ ├──────────────────┘ ▼ Phase 5 (RBAC, invitations, audit) │ ▼ Phase 6 (Testing & CI)

```javascript

## 6. Task Summary

| Phase | Tasks | Size | Dependencies |
|-------|-------|------|-------------|
| Phase 0: Build stability | 3 tasks (0.1, 0.2, 0.3) | S-M | None |
| Phase 1: Layout & routing | 5 tasks (1.1-1.5) | S-L | Phase 0 |
| Phase 2: Service layer | 3 tasks (2.1-2.3) | M-L | Phase 1 |
| Phase 3: DB/RLS model | 5 tasks (3.1-3.5) | S-M | Phase 2 |
| Phase 4: Billing | 3 tasks (4.1-4.3) | M | Phase 2, Phase 3 |
| Phase 5: RBAC/Invite/Audit | 3 tasks (5.1-5.3) | M-L | Phase 3 |
| Phase 6: Testing & CI | 4 tasks (6.1-6.4) | S-L | Phase 0-5 |

## 7. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking DB changes (Phase 3, 4, 5) | High — có thể mất dữ liệu | Migration có rollback script, backfill dữ liệu cũ, test trên staging trước |
| Build Vercel fail sau mỗi phase | High — chặn deployment | Phase 0 phải xanh trước, mỗi phase đều có checkpoint build |
| Scope creep (Phase 5 invitations) | Medium — dễ kéo dài | Mỗi phase là OpenSpec change riêng, không gộp |
| Regression do refactor (Phase 1) | Medium — UI có thể broken | Smoke tests trước và sau mỗi task, manual check ở checkpoint |
| RLS policies quá strict (Phase 3) | Medium — user không truy cập được | Test kỹ với nhiều role, có fallback cho system admin |
| Thiếu typed interfaces (Phase 2) | Low — type errors | TypeScript strict mode, review type definitions trước |

## 8. Open Questions

- Có cần giữ `SystemAdminDashboard.tsx` như container điều hướng sau Phase 1 không, hay xóa hoàn toàn?
- Billing provider: chỉ support Stripe hay cần thêm provider khác (Momo, VNPay)?
- Invitation email: dùng Resend, SendGrid, hay Supabase built-in email?
- Audit log retention: giữ bao lâu? Có cần archive tự động?
- Pre-commit hook: dùng husky + lint-staged hay giải pháp khác?

## 9. Next step đề xuất

Bắt đầu với **Phase 0** (Task 0.1 → 0.2 → 0.3) để ổn định build trước. Sau checkpoint review với human, tiếp tục Phase 1.
```
