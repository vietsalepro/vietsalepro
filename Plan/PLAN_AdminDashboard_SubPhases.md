# Admin Dashboard Sub-Phase Execution Plan

> **For Hermes:** Use subagent-driven-development skill to implement each sub-phase sequentially. Each sub-phase must be fully completed (backup → implement → test → deploy → log) before starting the next.

**Goal:** Chia `PLAN_AdminDashboard_Implementation_Phases.md` thành các sub-phase nhỏ, có thể thực hiện từng bước một, với đầy đủ mô tả scope, out-of-scope, backup, test, deploy và log.

**Architecture:** Giữ nguyên stack Vite + React 19 + Supabase. Mỗi sub-phase là một đơn vị giao việc độc lập, kết thúc bằng commit/push/deploy và ghi log.

**Tech Stack:** Vite, React 19, TypeScript 5.8, Tailwind CSS 4, Supabase, Vitest, Vercel.

---

## Tổng quan quy trình mỗi Sub-Phase

Mọi sub-phase đều tuân thủ chuỗi sau:

```
Backup → Implement → Test → Code Review → Commit/Push → Staging Migration → Staging Test PASS → Production Migration → Production Test PASS → Log
```

### Các thư mục chuẩn

| Mục đích | Đường dẫn |
|----------|-----------|
| Backup trước mỗi sub-phase | `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-<phase>-<num>-<timestamp>` |
| File plan sub-phase (này) | `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\PLAN_AdminDashboard_SubPhases.md` |
| Log hoạt động | `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Log\SP-<phase>-<num>-<timestamp>.md` |
| Migration artifacts | `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\Migration\` |
| Edge Function artifacts | `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\Plan\EdgeFunction\` |

### Các skill bắt buộc sau mỗi sub-phase

1. **`/systematic-debugging`** — kiểm tra lỗi, root cause nếu test fail.
2. **`/test-driven-development`** — đảm bảo test đỏ → xanh → refactor.
3. **`/requesting-code-review`** — pre-commit review: security, quality, lint.

> Lưu ý: Các skill trên được gọi trong quá trình thực thi sub-phase, không phải trong giai đoạn lập plan này.

---

## Index các Sub-Phase

| SP | Tên | Phase | Tính năng chính | Status |
|----|-----|-------|-----------------|--------|
| SP-1.0 | Setup test harness & permissions | Cross-cutting | Foundation | Partial |
| SP-1.1 | Review current tenant schema | 1 | Tenant Management | Done |
| SP-1.2 | Add tenant subdomain/custom domain columns | 1 | Subdomain/Custom Domain | Done |
| SP-1.3 | Audit existing RLS policies | 1 | Tenant Management | Done |
| SP-1.4 | Add missing RLS policies | 1 | Tenant Management | Done |
| SP-1.5 | Write RLS isolation test | 1 | Tenant Management | Done |
| SP-1.6 | Expand audit log event types | 1 | Audit Log | Done |
| SP-2.0 | Build Dashboard overview page | 2 | Dashboard | Done |
| SP-2.1 | Refactor AdminShell navigation | 2 | Dashboard / System Settings | Done |
| SP-2.2 | Build Tenant Management page | 2 | Tenant Management | Done |
| SP-2.3 | Build System Settings page | 2 | System Settings | Done |
| SP-2.4 | Build Announcement Manager page | 2 | Announcement | Done |
| SP-2.5 | Build Activity Feed page | 2 | Activity | Done |
| SP-2.6 | Build Global Config page | 2 | Global Config | Done |
| SP-2.7 | Build User Management page | 2 | User Management | Done |
| SP-2.8 | Build Team/Role Management page | 2 | Team / Role Management | Done |
| SP-2.9 | Build Audit Log page | 2 | Audit Log | Done |
| SP-3.1 | Refactor Plans CRUD | 3 | Subscription / Package Management | Done |
| SP-3.2 | Subscription lifecycle RPC | 3 | Subscription | Done |
| SP-3.3 | Payment provider registry | 3 | Payment | Done |
| SP-3.4 | Usage metering | 3 | Usage | Done |
| SP-3.5 | Invoice PDF generation | 3 | Invoice | Done |
| SP-4.1 | Feature Flag service | 4 | Feature Flag | Done |
| SP-4.2 | Impersonation flow | 4 | Impersonate User | Done |
| SP-4.3 | API Key lifecycle | 4 | API Key | Done |
| SP-4.4 | Webhook delivery system | 4 | Webhook | Done |
| SP-5.1 | System Health panel data | 5 | System Monitor | Done |
| SP-5.2 | Queue Monitor | 5 | Queue Monitor | Partial |
| SP-5.3 | Cron Monitor | 5 | Cron Monitor | Done |
| SP-5.4 | Backup automation | 5 | Backup | Done |
| SP-5.5 | Restore workflow | 5 | Restore | Done |
| SP-5.6 | Database maintenance panel | 5 | Database Maintenance | Partial |
| SP-5.7 | Storage Management panel | 5 | Storage | Partial |
| SP-6.1 | Email service integration | 6 | Email Service | Done |
| SP-6.2 | SMS service integration | 6 | SMS Service | Done |
| SP-6.3 | Support ticket system | 6 | Support | Done |
| SP-7.1 | Subdomain availability check | 7 | Subdomain Management | Done |
| SP-7.2 | Custom domain verification | 7 | Custom Domain | Done |
| SP-7.3 | License management | 7 | License | Done |
| SP-7.4 | Rate limiting & security settings | 7 | System Settings / Security | Done |
| SP-7.5 | Advanced audit export | 7 | Audit Log | Done |
| SP-C.3 | Documentation of open-source references | Cross-cutting | Compliance | Done |

> **Chú thích Status:** `Done` = đã có page/service/migration khớp tính năng; `Partial` = có nền tảng nhưng UI/flow chưa hoàn chỉnh; `Pending` = chưa triển khai.

---

## SP-1.0: Setup Test Harness & Admin Permission Constants

### Yêu cầu ban đầu (từ PLAN_Reference)

Xây dựng nền tảng multi-tenancy, auth, audit log. Mỗi tính năng cần test đảm bảo RLS và permission đúng.

### Yêu cầu phase đang thực hiện (từ PLAN_Implementation)

Tạo test helpers (`createTestTenant`, `createTestUser`, `getClientForUser`) và chuẩn hóa permission constants trước khi các phase khác bắt đầu.

### Kết quả cần có

- `services/admin/permissions.ts` có `ADMIN_PERMISSIONS` constants (đã có).
- Helpers (`createTestTenant`, `createTestUser`, `getClientForUser`) được tập trung vào `tests/test-helpers.ts` hoặc tái sử dụng từ `tests/setup.ts` / `tests/mocks/supabase.ts`.
- Các test sau này tái sử dụng helpers.

### Nhiệm vụ đã hoàn thành trước đó

- `PLAN_AdminDashboard_OpenSource_Reference.md` đã được review.
- `PLAN_AdminDashboard_Implementation_Phases.md` đã được duyệt.
- Các thư mục `Plan/Log`, `Plan/Migration`, `Plan/EdgeFunction`, `Back up Admin dashboard step` cần được tạo trong sub-phase này nếu chưa tồn tại.

### Nhiệm vụ trong sub-phase này

1. Tạo các thư mục `Plan/Log`, `Plan/Migration`, `Plan/EdgeFunction`, `Back up Admin dashboard step` nếu chưa có.
2. Backup toàn bộ project vào `Back up Admin dashboard step\SP-1.0-<timestamp>`.
3. Rà soát `tests/setup.ts` và `tests/mocks/supabase.ts`, consolidate thành `tests/test-helpers.ts` nếu cần.
4. Thêm `ADMIN_PERMISSIONS` vào `services/admin/permissions.ts` (nếu chưa có đầy đủ).
5. Viết test đảm bảo helpers và permissions hoạt động.
6. Chạy `npm run lint && npm run test`.

### Out-of-Scope (không thực hiện)

- Không viết migration schema: đây chỉ là setup test harness.
- Không thay đổi UI components: chưa đến giai đoạn UI.
- Không triển khai production migration: chưa có schema thay đổi.

Lý do: Setup phải độc lập, tránh kéo theo logic nghiệp vụ khác làm phức tạp.

### Backup Procedure

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-1.0-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\*" -Destination $backupDir -Recurse -Force
```

### Execution Steps

```bash
git checkout -b feat/SP-1.0-test-harness
# refactor tests/setup.ts + tests/mocks/supabase.ts into tests/test-helpers.ts if needed
# modify services/admin/permissions.ts
npm run lint
npm run test -- tests/integration/tenant-isolation.test.ts
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu test fail, trace root cause trong helpers hoặc permissions.
2. **`/test-driven-development`**: Viết test cho helper trước, sau đó implement.
3. **`/requesting-code-review`**: Review security, đảm bảo không leak test credentials.

### Deploy & Log

```bash
git add tests/test-helpers.ts tests/setup.ts tests/mocks/supabase.ts services/admin/permissions.ts
git commit -m "test(admin): SP-1.0 test harness and permission constants"
git push origin feat/SP-1.0-test-harness
# Vercel auto-deploy branch preview
# No migration needed
```

Ghi log: `Plan\Log\SP-1.0-<timestamp>.md`.

### Artifact Locations

- Code: `tests/test-helpers.ts` (hoặc `tests/setup.ts` + `tests/mocks/supabase.ts`), `services/admin/permissions.ts`
- Log: `Plan\Log\SP-1.0-<timestamp>.md`

---

## SP-1.1: Review Current Tenant Schema

### Yêu cầu ban đầu

Củng cố multi-tenancy: rà soát schema, so sánh với `trentas/saas-scaffolding` và `usebasejump/basejump`, chuẩn hóa bảng `tenants`, `tenant_members`, `roles`, `audit_logs`, `subscriptions`.

### Yêu cầu phase

Đọc và phân tích schema hiện tại để xác định bảng nào thiếu `tenant_id` hoặc FK, so sánh với Basejump.

### Kết quả cần có

- File `docs/schema-gap-analysis.md` liệt kê các bảng cần sửa.
- Không thay đổi schema trong sub-phase này.

### Nhiệm vụ đã hoàn thành trước đó

- SP-1.0 hoàn thành.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Đọc `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.
3. Đọc `supabase/migrations/20250704000000_phase2_tenant_foundation.sql`.
4. Clone/read `usebasejump/basejump/supabase/`.
5. Viết `docs/schema-gap-analysis.md`.

### Out-of-Scope

- Không sửa schema, không tạo migration. Chỉ phân tích.
- Không viết UI/service. Lý do: phân tích phải hoàn thành trước khi thay đổi để tránh sửa đi sửa lại.

### Backup Procedure

Tương tự SP-1.0, thay `SP-1.0` bằng `SP-1.1`.

### Execution Steps

```bash
git checkout -b docs/SP-1.1-schema-review
# write docs/schema-gap-analysis.md
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu phân tích thiếu sót, trace lại các bảng core.
2. **`/test-driven-development`**: Không áp dụng (không có code logic).
3. **`/requesting-code-review`**: Review độ chính xác của gap analysis.

### Deploy & Log

```bash
git add docs/schema-gap-analysis.md
git commit -m "docs(admin): SP-1.1 tenant schema gap analysis"
git push origin docs/SP-1.1-schema-review
# No migration
```

Ghi log: `Plan\Log\SP-1.1-<timestamp>.md`.

### Artifact Locations

- Doc: `docs/schema-gap-analysis.md`
- Log: `Plan\Log\SP-1.1-<timestamp>.md`

---

## SP-1.2: Add Tenant Subdomain & Custom Domain Columns

### Yêu cầu ban đầu

Subdomain Management (#3) và Custom Domain (#4): tham khảo `trentas/saas-scaffolding`, `Cal.com`, `Dub.co`, `Papermark` để làm routing, domain verification, SSL.

### Yêu cầu phase

Đảm bảo bảng `tenants` có các cột `subdomain`, `custom_domain`, `slug` (generated), `white_label`, v.v. phục vụ routing và custom domain.

### Kết quả cần có

- Các cột `subdomain`, `custom_domain` đã tồn tại trong `tenants` (baseline migration `20250703000000_baseline_pre_tenant_schema.sql`).
- Cột `slug` được bổ sung qua `20260713000001_standardize_tenants_and_memberships.sql`.
- Các index phù hợp (`tenants_subdomain_key`, v.v.).

### Nhiệm vụ đã hoàn thành trước đó

- SP-1.0, SP-1.1.
- Baseline tenant schema đã được thiết lập trong `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Đọc `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` để xác nhận các cột `subdomain`, `custom_domain`.
3. Đọc `supabase/migrations/20260713000001_standardize_tenants_and_memberships.sql` để xác nhận cột `slug`.
4. Kiểm tra cột trong `information_schema.columns`.
5. (Optional) Viết migration bổ sung nếu còn thiếu cột hoặc index.

### Out-of-Scope

- Không viết UI custom domain. Lý do: UI phụ thuộc vào schema đã ổn định.
- Không implement DNS verification. Lý do: thuộc SP-7.2.

### Backup Procedure

Backup toàn bộ project + snapshot DB nếu có.

### Execution Steps

```bash
git checkout -b feat/SP-1.2-tenant-domain-columns
# read supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql
# read supabase/migrations/20260713000001_standardize_tenants_and_memberships.sql
# write additional migration only if missing columns/indexes
supabase migration up
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu migration fail, kiểm tra conflict cột/index.
2. **`/test-driven-development`**: Viết test kiểm tra cột tồn tại.
3. **`/requesting-code-review`**: Review migration idempotency.

### Deploy & Log

```bash
# only add migration if you created one
git add supabase/migrations/<new_migration_if_any>.sql
git commit -m "feat(db): SP-1.2 verify tenant subdomain/custom domain/slug columns"
git push origin feat/SP-1.2-tenant-domain-columns
# Deploy staging → production
```

Copy migration (nếu có) vào `Plan\Migration\`.
Ghi log: `Plan\Log\SP-1.2-<timestamp>.md`.

### Artifact Locations

- Migration: `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql`, `supabase/migrations/20260713000001_standardize_tenants_and_memberships.sql` (+ `Plan\Migration\` nếu thêm migration)
- Log: `Plan\Log\SP-1.2-<timestamp>.md`

---

## SP-1.3: Audit Existing RLS Policies

### Yêu cầu ban đầu

Tenant Management (#2): tham khảo RLS, tenant isolation, onboarding từ `trentas/saas-scaffolding`, `Basejump`, `Cal.com`.

### Yêu cầu phase

Liệt kê policies hiện tại, xác định bảng thiếu policy hoặc policy lỏng lẻo.

### Kết quả cần có

- `docs/rls-gap-analysis.md` với danh sách bảng thiếu policy.
- Không thay đổi policies trong sub-phase này.

### Nhiệm vụ đã hoàn thành trước đó

- SP-1.0, SP-1.1, SP-1.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Query `pg_policies`.
3. So sánh với danh sách bảng từ `20250703000000_baseline_pre_tenant_schema.sql`.
4. Viết gap analysis.

### Out-of-Scope

- Không sửa policies. Lý do: cần phân tích đầy đủ trước khi sửa.
- Không viết test RLS. Lý do: test sẽ viết ở SP-1.5 sau khi policies được bổ sung.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b docs/SP-1.3-rls-audit
# write docs/rls-gap-analysis.md
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu query policies không đầy đủ, trace lại schema.
2. **`/test-driven-development`**: Không áp dụng.
3. **`/requesting-code-review`**: Review gap analysis.

### Deploy & Log

```bash
git add docs/rls-gap-analysis.md
git commit -m "docs(admin): SP-1.3 RLS policy gap audit"
git push origin docs/SP-1.3-rls-audit
```

Ghi log: `Plan\Log\SP-1.3-<timestamp>.md`.

### Artifact Locations

- Doc: `docs/rls-gap-analysis.md`
- Log: `Plan\Log\SP-1.3-<timestamp>.md`

---

## SP-1.4: Add Missing RLS Policies

### Yêu cầu ban đầu

Củng cố RLS policies cho tất cả các bảng đã tồn tại (Phase 1 Foundation).

### Yêu cầu phase

Viết migration bổ sung policies dựa trên `docs/rls-gap-analysis.md`.

### Kết quả cần có

- Xác nhận RLS policies đã có trong `supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql` và các migration RLS sau đó.
- Nếu còn thiếu, migration mới theo đúng timestamp hiện tại (ví dụ `<YYYYmmddHHMMSS>_rls_missing_tables.sql`).
- Tất cả bảng tenant-scoped có policy.

### Nhiệm vụ đã hoàn thành trước đó

- SP-1.0, SP-1.1, SP-1.2, SP-1.3.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết migration với `ENABLE ROW LEVEL SECURITY` và policies.
3. Chạy `supabase migration up`.
4. Verify `pg_policies` count tăng.

### Out-of-Scope

- Không viết test RLS chi tiết (sẽ làm ở SP-1.5).
- Không thay đổi schema bảng. Lý do: chỉ thêm policies.

### Backup Procedure

Backup project + DB.

### Execution Steps

```bash
git checkout -b feat/SP-1.4-rls-policies
# write migration
supabase migration up
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu policy syntax lỗi, trace lỗi PostgreSQL.
2. **`/test-driven-development`**: Viết test cơ bản kiểm tra policy count.
3. **`/requesting-code-review`**: Review policy expression đúng `tenant_id`.

### Deploy & Log

```bash
# chỉ add migration nếu thực sự tạo mới
git add supabase/migrations/<new_migration_if_any>.sql
git commit -m "feat(db): SP-1.4 missing RLS policies"
git push origin feat/SP-1.4-rls-policies
# Deploy staging → production
```

Copy migration (nếu có) vào `Plan\Migration\`.
Ghi log: `Plan\Log\SP-1.4-<timestamp>.md`.

### Artifact Locations

- Migration: `supabase/migrations/20250705000008_phase10_1_db_policies_theo_role.sql` (+ `<new_migration_if_any>.sql` nếu thêm) + `Plan\Migration\`
- Log: `Plan\Log\SP-1.4-<timestamp>.md`

---

## SP-1.5: Write RLS Isolation Test

### Yêu cầu ban đầu

Đảm bảo tenant isolation đúng, user A tenant 1 không đọc data tenant 2.

### Yêu cầu phase

Viết `tests/integration/tenant-isolation.test.ts` sử dụng helpers từ SP-1.0.

### Kết quả cần có

- Test pass, chứng minh RLS hoạt động.

### Nhiệm vụ đã hoàn thành trước đó

- SP-1.0 đến SP-1.4.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết test tạo 2 tenants, 2 users.
3. Kiểm tra user chỉ đọc data của tenant mình.

### Out-of-Scope

- Không sửa schema/policy nếu test fail. Lý do: nếu fail, cần quay lại SP-1.4.
- Không viết UI. Lý do: sub-phase chỉ là test.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b test/SP-1.5-rls-isolation
# write tests/integration/tenant-isolation.test.ts
npm run test -- tests/integration/tenant-isolation.test.ts
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu test fail, xác định là do test hay do RLS policy.
2. **`/test-driven-development`**: Test viết trước, chạy RED, sau đó xanh.
3. **`/requesting-code-review`**: Review test coverage.

### Deploy & Log

```bash
git add tests/integration/tenant-isolation.test.ts
git commit -m "test(admin): SP-1.5 RLS isolation test"
git push origin test/SP-1.5-rls-isolation
```

Ghi log: `Plan\Log\SP-1.5-<timestamp>.md`.

### Artifact Locations

- Test: `tests/integration/tenant-isolation.test.ts`
- Log: `Plan\Log\SP-1.5-<timestamp>.md`

---

## SP-1.6: Expand Audit Log Event Types

### Yêu cầu ban đầu

Audit Log (#11): tham khảo Cal.com, `trentas/saas-scaffolding`, Documenso; event logging, actor tracking, impersonation.

### Yêu cầu phase

Bổ sung event types: login, logout, impersonation_start, impersonation_stop, role_changed, password_changed, tenant_created, tenant_deleted, subscription_created, subscription_cancelled.

### Kết quả cần có

- `services/admin/auditAdminService.ts` có type `AuditAction` và helper `logAudit`.
- Trigger migration được cập nhật (nếu cần).

### Nhiệm vụ đã hoàn thành trước đó

- SP-1.0 đến SP-1.5.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Thêm `AuditAction` type.
3. Thêm `logAudit` helper.
4. Cập nhật trigger migration nếu cần.
5. Viết test cho helper.

### Out-of-Scope

- Không viết UI Activity Feed. Lý do: UI thuộc SP-2.5.
- Không ghi audit cho tất cả actions trong hệ thống. Lý do: tích hợp dần từng chỗ khi implement feature.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-1.6-audit-events
# modify services/admin/auditAdminService.ts
npm run test -- tests/admin-dashboard/audit-admin-service.test.ts
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu trigger lỗi, trace lỗi SQL.
2. **`/test-driven-development`**: Viết test `logAudit` ghi đúng action.
3. **`/requesting-code-review`**: Review PII trong metadata.

### Deploy & Log

```bash
git add services/admin/auditAdminService.ts
git commit -m "feat(admin): SP-1.6 expand audit log event types"
git push origin feat/SP-1.6-audit-events
```

Ghi log: `Plan\Log\SP-1.6-<timestamp>.md`.

### Artifact Locations

- Code: `services/admin/auditAdminService.ts`
- Log: `Plan\Log\SP-1.6-<timestamp>.md`

---

## SP-2.0: Build Dashboard Overview Page

### Yêu cầu ban đầu

Dashboard (#1): tham khảo `trentas/saas-scaffolding`, Cal.com, Documenso; layout KPI cards, charts, navigation.

### Yêu cầu phase

Tạo trang tổng quan admin với KPI cards và charts, route `/admin/overview`.

### Kết quả cần có

- `pages/admin/Overview.tsx`.
- `components/admin/OverviewPanel.tsx`.
- `services/admin/dashboardAdminService.ts`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-1.6.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service `getDashboardKPIs` / `getDashboardTrends`.
3. Tạo `OverviewPanel` hiển thị KPI cards + `recharts` trends.
4. Thêm route `/admin/overview`.
5. Viết test.

### Out-of-Scope

- Không implement real-time widgets phức tạp. Lý do: dùng polling đơn giản trước.
- Không tích hợp notification center. Lý do: thuộc feature riêng.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.0-dashboard-overview
# create pages/admin/Overview.tsx
# create components/admin/OverviewPanel.tsx
# create services/admin/dashboardAdminService.ts
npm run lint
npm run test -- tests/admin-dashboard/OverviewPage.test.tsx
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu KPIs sai, trace service query.
2. **`/test-driven-development`**: Viết test render KPI cards trước.
3. **`/requesting-code-review`**: Review không hard-code tenant data.

### Deploy & Log

```bash
git add pages/admin/Overview.tsx components/admin/OverviewPanel.tsx services/admin/dashboardAdminService.ts
git commit -m "feat(admin): SP-2.0 dashboard overview page"
git push origin feat/SP-2.0-dashboard-overview
```

Ghi log: `Plan\Log\SP-2.0-<timestamp>.md`.

### Artifact Locations

- Code: `pages/admin/Overview.tsx`, `components/admin/OverviewPanel.tsx`, `services/admin/dashboardAdminService.ts`
- Log: `Plan\Log\SP-2.0-<timestamp>.md`

---

## SP-2.1: Refactor AdminShell Navigation

### Yêu cầu ban đầu

Dashboard (#1): tham khảo layout KPI cards, charts, navigation từ `trentas/saas-scaffolding`, `Cal.com`, `Documenso`.

### Yêu cầu phase

Tổ chức sidebar thành nhóm: Overview, Management, Billing, Operations.

### Kết quả cần có

- `components/AdminSidebar.tsx` render nav groups.
- Layout admin có breadcrumb, tenant switcher, top bar.

### Nhiệm vụ đã hoàn thành trước đó

- SP-2.0.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Refactor `AdminSidebar.tsx`.
3. Thêm breadcrumb nếu chưa có.
4. Kiểm tra responsive.

### Out-of-Scope

- Không xây dựng nội dung các trang con (Tenants, Plans, v.v.). Lý do: từng trang sẽ làm ở sub-phase riêng.
- Không implement tenant switcher logic nếu phức tạp. Lý do: có thể tách thành SP nhỏ.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.1-admin-navigation
# modify components/AdminSidebar.tsx
npm run lint
npm run test -- tests/admin-dashboard/AdminSidebar.test.tsx
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu navigation không render, trace route config.
2. **`/test-driven-development`**: Viết test render đúng số nav groups.
3. **`/requesting-code-review`**: Review accessibility và responsive.

### Deploy & Log

```bash
git add components/AdminSidebar.tsx
git commit -m "feat(ui): SP-2.1 refactor admin navigation groups"
git push origin feat/SP-2.1-admin-navigation
```

Ghi log: `Plan\Log\SP-2.1-<timestamp>.md`.

### Artifact Locations

- Code: `components/AdminSidebar.tsx`
- Log: `Plan\Log\SP-2.1-<timestamp>.md`

---

## SP-2.2: Build Tenant Management Page

### Yêu cầu ban đầu

Tenant Management (#2): quản lý tenant, RLS, isolation, onboarding.

### Yêu cầu phase

Trang quản lý tenants với CRUD cơ bản.

### Kết quả cần có

- `pages/admin/TenantsPage.tsx`
- `components/admin/TenantManagementPanel.tsx`
- Service `getTenants`, `updateTenantStatus`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-2.1.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Thêm service functions.
3. Xây component bảng tenants.
4. Thêm route `/admin/tenants`.

### Out-of-Scope

- Không implement subdomain/custom domain UI. Lý do: thuộc SP-7.1/7.2.
- Không implement tenant delete. Lý do: destructive action cần confirm + audit riêng.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.2-tenant-management-page
# create pages/admin/TenantsPage.tsx
# create components/admin/TenantManagementPanel.tsx
npm run test -- tests/admin-dashboard/TenantsPage.test.tsx
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu table không load, trace service query.
2. **`/test-driven-development`**: Test filter và status update.
3. **`/requesting-code-review`**: Review RLS trong query.

### Deploy & Log

```bash
git add pages/admin/TenantsPage.tsx components/admin/TenantManagementPanel.tsx services/admin/tenantAdminService.ts
git commit -m "feat(admin): SP-2.2 tenant management page"
git push origin feat/SP-2.2-tenant-management-page
```

Ghi log: `Plan\Log\SP-2.2-<timestamp>.md`.

### Artifact Locations

- Code: `pages/admin/TenantsPage.tsx`, `components/admin/TenantManagementPanel.tsx`, `services/admin/tenantAdminService.ts`
- Log: `Plan\Log\SP-2.2-<timestamp>.md`

---

## SP-2.3: Build System Settings Page

### Yêu cầu ban đầu

System Settings (#9): organization settings, branding từ `trentas/saas-scaffolding`, `Cal.com`, `Documenso`.

### Yêu cầu phase

Trang cấu hình app-level: app_name, language, timezone, session timeout, IP allowlist.

### Kết quả cần có

- `pages/admin/SystemSettingsPage.tsx`
- `components/admin/SystemSettingsPanel.tsx`
- Service update settings.

### Nhiệm vụ đã hoàn thành trước đó

- SP-2.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Thêm RPC/service.
3. Xây form component.
4. Thêm route.

### Out-of-Scope

- Không thay đổi branding logo upload. Lý do: storage policies cần xem xét riêng.
- Không implement IP allowlist enforcement. Lý do: cần middleware/login flow riêng.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.3-system-settings
# create pages/admin/SystemSettingsPage.tsx
# create components/admin/SystemSettingsPanel.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu form không save, trace RPC.
2. **`/test-driven-development`**: Test submit form cập nhật DB.
3. **`/requesting-code-review`**: Review validation input.

### Deploy & Log

```bash
git add pages/admin/SystemSettingsPage.tsx components/admin/SystemSettingsPanel.tsx services/admin/systemAdminService.ts
git commit -m "feat(admin): SP-2.3 system settings page"
git push origin feat/SP-2.3-system-settings
```

Ghi log: `Plan\Log\SP-2.3-<timestamp>.md`.

### Artifact Locations

- Code: `pages/admin/SystemSettingsPage.tsx`, `components/admin/SystemSettingsPanel.tsx`, `services/admin/systemAdminService.ts`
- Log: `Plan\Log\SP-2.3-<timestamp>.md`

---

## SP-2.4: Build Announcement Manager Page

### Yêu cầu ban đầu

Announcement (#10): banner, changelog, maintenance notice từ `Cal.com`, `Documenso`.

### Yêu cầu phase

CRUD announcement với audience, active_from, active_to, preview banner.

### Kết quả cần có

- `pages/admin/AnnouncementsPage.tsx`
- Migration thêm cột audience/active_from/active_to.
- Component refactor từ `AnnouncementManager.tsx`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-2.3.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết migration.
3. Refactor `AnnouncementManager.tsx`.
4. Thêm route.

### Out-of-Scope

- Không implement maintenance mode IP whitelist. Lý do: liên quan đến auth middleware.
- Không gửi notification realtime. Lý do: cần realtime setup riêng.

### Backup Procedure

Backup project + DB.

### Execution Steps

```bash
git checkout -b feat/SP-2.4-announcement-manager
# write migration
# refactor components/AnnouncementManager.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu banner không hiển thị, trace active time range.
2. **`/test-driven-development`**: Test CRUD announcement.
3. **`/requesting-code-review`**: Review SQL injection trong filter.

### Deploy & Log

```bash
git add supabase/migrations/... pages/admin/AnnouncementsPage.tsx components/AnnouncementManager.tsx
git commit -m "feat(admin): SP-2.4 announcement manager"
git push origin feat/SP-2.4-announcement-manager
```

Copy migration vào `Plan\Migration\`.
Ghi log: `Plan\Log\SP-2.4-<timestamp>.md`.

### Artifact Locations

- Migration: `Plan\Migration\`
- Code: `pages/admin/AnnouncementsPage.tsx`, `components/AnnouncementManager.tsx`
- Log: `Plan\Log\SP-2.4-<timestamp>.md`

---

## SP-2.5: Build Activity Feed Page

### Yêu cầu ban đầu

Activity (#27): activity feed, recent events từ `Cal.com`, `trentas/saas-scaffolding`, `Documenso`.

### Yêu cầu phase

Hiển thị audit log dưới dạng timeline với filter.

### Kết quả cần có

- `pages/admin/ActivityPage.tsx`
- `components/admin/ActivityFeedPanel.tsx`
- Service query `getActivityFeed`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-2.4, SP-1.6.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Thêm service query.
3. Xây timeline component.
4. Thêm route.

### Out-of-Scope

- Không implement real-time activity updates. Lý do: cần Supabase realtime setup.
- Không export audit log. Lý do: thuộc SP-7.5.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.5-activity-feed
# create pages/admin/ActivityPage.tsx
# create components/admin/ActivityFeedPanel.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu timeline không render, trace service data.
2. **`/test-driven-development`**: Test filter theo action type.
3. **`/requesting-code-review`**: Review performance pagination.

### Deploy & Log

```bash
git add pages/admin/ActivityPage.tsx components/admin/ActivityFeedPanel.tsx services/admin/auditAdminService.ts
git commit -m "feat(admin): SP-2.5 activity feed page"
git push origin feat/SP-2.5-activity-feed
```

Ghi log: `Plan\Log\SP-2.5-<timestamp>.md`.

### Artifact Locations

- Code: `pages/admin/ActivityPage.tsx`, `components/admin/ActivityFeedPanel.tsx`, `services/admin/auditAdminService.ts`
- Log: `Plan\Log\SP-2.5-<timestamp>.md`

---

## SP-2.6: Build Global Config Page

### Yêu cầu ban đầu

Global Config (#29): feature flags, app settings, env config từ `trentas/saas-scaffolding`, `Cal.com`, `Documenso`.

### Yêu cầu phase

Quản lý `app_settings` với caching trong React Context hoặc localStorage TTL 5 phút.

### Kết quả cần có

- `pages/admin/GlobalConfigPage.tsx`
- `components/admin/GlobalConfigPanel.tsx`
- `hooks/useGlobalConfig.ts`

### Nhiệm vụ đã hoàn thành trước đó

- SP-2.5.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Tạo service `globalConfigService.ts`.
3. Tạo hook caching.
4. Xây form component.

### Out-of-Scope

- Không implement feature flag evaluation. Lý do: thuộc SP-4.1.
- Không đồng bộ config realtime. Lý do: polling/cache đủ cho phase này.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.6-global-config
# create services/admin/globalConfigService.ts
# create hooks/useGlobalConfig.ts
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu cache không invalidate, trace hook state.
2. **`/test-driven-development`**: Test cache TTL.
3. **`/requesting-code-review`**: Review race condition khi update.

### Deploy & Log

```bash
git add pages/admin/GlobalConfigPage.tsx components/admin/GlobalConfigPanel.tsx services/admin/globalConfigService.ts hooks/useGlobalConfig.ts
git commit -m "feat(admin): SP-2.6 global config page with caching"
git push origin feat/SP-2.6-global-config
```

Ghi log: `Plan\Log\SP-2.6-<timestamp>.md`.

### Artifact Locations

- Code: `pages/admin/GlobalConfigPage.tsx`, `components/admin/GlobalConfigPanel.tsx`, `services/admin/globalConfigService.ts`, `hooks/useGlobalConfig.ts`
- Log: `Plan\Log\SP-2.6-<timestamp>.md`

---

## SP-2.7: Build User Management Page

### Yêu cầu ban đầu

User Management: trang quản lý users trong hệ thống, tham khảo `trentas/saas-scaffolding`, Cal.com, Documenso.

### Yêu cầu phase

Tạo trang quản lý users với bảng, filter, cập nhật status.

### Kết quả cần có

- `pages/admin/UsersPage.tsx`.
- `components/admin/UserManagementPanel.tsx`.
- `services/admin/userAdminService.ts`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-2.6.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service `getUsers`, `updateUserStatus`.
3. Tạo bảng users với filter/search.
4. Viết test.

### Out-of-Scope

- Không gán role chi tiết. Lý do: thuộc SP-2.8.
- Không xóa vĩnh viễn user. Lý do: chỉ disable/soft-delete.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.7-user-management
# create pages/admin/UsersPage.tsx
# create components/admin/UserManagementPanel.tsx
# modify services/admin/userAdminService.ts
npm run test -- tests/admin-dashboard/UsersPage.test.tsx
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu user list sai, trace RLS query.
2. **`/test-driven-development`**: Viết test filter status trước.
3. **`/requesting-code-review`**: Review không leak PII.

### Deploy & Log

```bash
git add pages/admin/UsersPage.tsx components/admin/UserManagementPanel.tsx services/admin/userAdminService.ts
git commit -m "feat(admin): SP-2.7 user management page"
git push origin feat/SP-2.7-user-management
```

Ghi log: `Plan\Log\SP-2.7-<timestamp>.md`.

### Artifact Locations

- Code: `pages/admin/UsersPage.tsx`, `components/admin/UserManagementPanel.tsx`, `services/admin/userAdminService.ts`
- Log: `Plan\Log\SP-2.7-<timestamp>.md`

---

## SP-2.8: Build Team/Role Management Page

### Yêu cầu ban đầu

Team/Role Management: quản lý teams/roles và permissions, tham khảo `trentas/saas-scaffolding`, `Basejump`, Cal.com.

### Yêu cầu phase

Tạo trang CRUD roles, gán permissions, gán role cho user.

### Kết quả cần có

- `pages/admin/RolesPage.tsx`.
- `components/admin/RoleManagementPanel.tsx`.
- `services/admin/permissions.ts` cập nhật.

### Nhiệm vụ đã hoàn thành trước đó

- SP-2.7.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Mở rộng `ADMIN_PERMISSIONS` và service roles.
3. Tạo UI CRUD roles + assign user role.
4. Viết test.

### Out-of-Scope

- Không implement org/team hierarchy. Lý do: không có trong 29 tính năng core.
- Không làm UI policy editor. Lý do: dùng predefined permissions.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.8-role-management
# create pages/admin/RolesPage.tsx
# create components/admin/RoleManagementPanel.tsx
# modify services/admin/permissions.ts
npm run test -- tests/admin-dashboard/RolesPage.test.tsx
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu permission không apply, trace role assignment.
2. **`/test-driven-development`**: Viết test assign role trước.
3. **`/requesting-code-review`**: Review không cho phép role escalation.

### Deploy & Log

```bash
git add pages/admin/RolesPage.tsx components/admin/RoleManagementPanel.tsx services/admin/permissions.ts
git commit -m "feat(admin): SP-2.8 team/role management page"
git push origin feat/SP-2.8-role-management
```

Ghi log: `Plan\Log\SP-2.8-<timestamp>.md`.

### Artifact Locations

- Code: `pages/admin/RolesPage.tsx`, `components/admin/RoleManagementPanel.tsx`, `services/admin/permissions.ts`
- Log: `Plan\Log\SP-2.8-<timestamp>.md`

---

## SP-2.9: Build Audit Log Page

### Yêu cầu ban đầu

Audit Log (#11): event logging, actor tracking; trang audit log đầy đủ thay vì chỉ activity feed.

### Yêu cầu phase

Tạo trang `/admin/audit-log` hiển thị toàn bộ audit log với filter và phân trang.

### Kết quả cần có

- `pages/admin/AuditLogPage.tsx`.
- `components/admin/AuditLogPanel.tsx`.
- `services/admin/auditAdminService.ts` cập nhật.

### Nhiệm vụ đã hoàn thành trước đó

- SP-1.6, SP-2.5, SP-2.8.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service `getAuditLogs` với filter/phân trang.
3. Tạo bảng audit log với date range, action, actor filters.
4. Viết test.

### Out-of-Scope

- Không export CSV. Lý do: thuộc SP-7.5.
- Không retention policies. Lý do: cần scheduled job.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-2.9-audit-log-page
# create pages/admin/AuditLogPage.tsx
# create components/admin/AuditLogPanel.tsx
# modify services/admin/auditAdminService.ts
npm run test -- tests/admin-dashboard/AuditLogPage.test.tsx
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu filter sai, trace query params.
2. **`/test-driven-development`**: Viết test filter by action trước.
3. **`/requesting-code-review`**: Review PII trong metadata.

### Deploy & Log

```bash
git add pages/admin/AuditLogPage.tsx components/admin/AuditLogPanel.tsx services/admin/auditAdminService.ts
git commit -m "feat(admin): SP-2.9 audit log page"
git push origin feat/SP-2.9-audit-log-page
```

Ghi log: `Plan\Log\SP-2.9-<timestamp>.md`.

### Artifact Locations

- Code: `pages/admin/AuditLogPage.tsx`, `components/admin/AuditLogPanel.tsx`, `services/admin/auditAdminService.ts`
- Log: `Plan\Log\SP-2.9-<timestamp>.md`

---

## SP-3.1: Refactor Plans CRUD

### Yêu cầu ban đầu

Subscription (#5), Package Management (#8): billing lifecycle, plan limits, seat limits từ `trentas/saas-scaffolding`, `Basejump`, `Lago`.

### Yêu cầu phase

Quản lý plans với features, seat_limit, usage_limits.

### Kết quả cần có

- `components/SubscriptionManager.tsx` refactor.
- Service `getPlans`, `createPlan`, `updatePlan`.

### Nhiệm vụ đã hoàn thành trước đó

- Phase 2 hoàn thành.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Refactor service.
3. Refactor UI form.
4. Viết test.

### Out-of-Scope

- Không xử lý subscription lifecycle. Lý do: thuộc SP-3.2.
- Không tích hợp payment gateway. Lý do: thuộc SP-3.3.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-3.1-plans-crud
# modify components/SubscriptionManager.tsx
# modify services/admin/billingAdminService.ts
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu plan không save, trace JSONB fields.
2. **`/test-driven-development`**: Test create/update plan.
3. **`/requesting-code-review`**: Review validation limits.

### Deploy & Log

```bash
git add components/SubscriptionManager.tsx services/admin/billingAdminService.ts
git commit -m "feat(billing): SP-3.1 plans CRUD"
git push origin feat/SP-3.1-plans-crud
```

Ghi log: `Plan\Log\SP-3.1-<timestamp>.md`.

### Artifact Locations

- Code: `components/SubscriptionManager.tsx`, `services/admin/billingAdminService.ts`
- Log: `Plan\Log\SP-3.1-<timestamp>.md`

---

## SP-3.2: Subscription Lifecycle RPC

### Yêu cầu ban đầu

Subscription (#5): billing lifecycle, plans, trials từ `trentas/saas-scaffolding`, `Basejump`, `Lago`.

### Yêu cầu phase

Viết RPC xử lý trial, active, past_due, canceled, **upgrade, downgrade**.

### Kết quả cần có

- Migration `supabase/migrations/20250713000022_phase3_subscription_lifecycle_rpc.sql`.
- RPC `create_subscription`, `upgrade_subscription`, `downgrade_subscription`, `cancel_subscription`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-3.1.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết migration RPC bao gồm create, upgrade, downgrade, cancel.
3. Chạy `supabase migration up`.
4. Viết test gọi RPC.

### Out-of-Scope

- Không tích hợp Stripe webhook. Lý do: thuộc SP-3.3.
- Không tạo UI subscription. Lý do: component có thể dùng lại `SubscriptionManager`.

### Backup Procedure

Backup project + DB.

### Execution Steps

```bash
git checkout -b feat/SP-3.2-subscription-lifecycle
# write migration
supabase migration up
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu RPC fail, trace PostgreSQL logs.
2. **`/test-driven-development`**: Test trial → active → canceled; test upgrade/downgrade.
3. **`/requesting-code-review`**: Review SECURITY DEFINER usage.

### Deploy & Log

```bash
git add supabase/migrations/20250713000022_phase3_subscription_lifecycle_rpc.sql
git commit -m "feat(db): SP-3.2 subscription lifecycle RPC"
git push origin feat/SP-3.2-subscription-lifecycle
```

Copy migration vào `Plan\Migration\`.
Ghi log: `Plan\Log\SP-3.2-<timestamp>.md`.

### Artifact Locations

- Migration: `supabase/migrations/20250713000022_phase3_subscription_lifecycle_rpc.sql` + `Plan\Migration\`
- Log: `Plan\Log\SP-3.2-<timestamp>.md`

---

## SP-3.3: Payment Provider Registry

### Yêu cầu ban đầu

Payment (#6): Stripe integration patterns từ `trentas/saas-scaffolding`, `Lago`, `Kill Bill`.

### Yêu cầu phase

Chuẩn hóa interface `BillingProvider` cho Stripe/VNPay/MoMo.

### Kết quả cần có

- `services/admin/billingProviderRegistry.ts` có interface.
- Các provider implement interface.

### Nhiệm vụ đã hoàn thành trước đó

- SP-3.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Định nghĩa interface.
3. Refactor providers.
4. Viết test.

### Out-of-Scope

- Không thay đổi UI thanh toán. Lý do: UI có thể đã tồn tại, cần adapt sau.
- Không implement payment retry. Lý do: thuộc webhook handler.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-3.3-payment-provider-registry
# modify services/admin/billingProviderRegistry.ts
# modify providers
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu provider không match interface, trace TypeScript errors.
2. **`/test-driven-development`**: Test mỗi provider implements interface.
3. **`/requesting-code-review`**: Review secret handling.

### Deploy & Log

```bash
git add services/admin/billingProviderRegistry.ts services/admin/providers/*
git commit -m "feat(billing): SP-3.3 payment provider registry"
git push origin feat/SP-3.3-payment-provider-registry
```

Ghi log: `Plan\Log\SP-3.3-<timestamp>.md`.

### Artifact Locations

- Code: `services/admin/billingProviderRegistry.ts`, `services/admin/providers/*`
- Log: `Plan\Log\SP-3.3-<timestamp>.md`

---

## SP-3.4: Usage Metering

### Yêu cầu ban đầu

Usage (#25): usage metering, quota tracking từ `Lago`, `Kill Bill`.

### Yêu cầu phase

Tạo bảng `tenant_usage_records` và service ghi/tổng hợp usage.

### Kết quả cần có

- Migration bảng usage.
- `services/admin/usageService.ts`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-3.3.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết migration.
3. Viết service.
4. Viết test.

### Out-of-Scope

- Không hiển thị usage dashboard. Lý do: UI có thể làm sau hoặc tích hợp vào plan page.
- Không cảnh báo quota. Lý do: cần job định kỳ.

### Backup Procedure

Backup project + DB.

### Execution Steps

```bash
git checkout -b feat/SP-3.4-usage-metering
# write migration
# create services/admin/usageService.ts
supabase migration up
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu usage summary sai, trace aggregation query.
2. **`/test-driven-development`**: Test record và summary.
3. **`/requesting-code-review`**: Review tenant isolation trong bảng usage.

### Deploy & Log

```bash
git add supabase/migrations/... services/admin/usageService.ts
git commit -m "feat(billing): SP-3.4 usage metering"
git push origin feat/SP-3.4-usage-metering
```

Copy migration vào `Plan\Migration\`.
Ghi log: `Plan\Log\SP-3.4-<timestamp>.md`.

### Artifact Locations

- Migration: `Plan\Migration\`
- Code: `services/admin/usageService.ts`
- Log: `Plan\Log\SP-3.4-<timestamp>.md`

---

## SP-3.5: Invoice PDF Generation

### Yêu cầu ban đầu

Invoice (#26): invoice generation, PDF, history từ `Lago`, `Kill Bill`, `Stripe`.

### Yêu cầu phase

Tạo PDF hóa đơn từ invoice data dùng jspdf.

### Kết quả cần có

- `lib/invoicePdf.ts`.
- Nút download trong `InvoiceManager.tsx`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-3.4.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết `generateInvoicePdf`.
3. Thêm nút download.
4. Viết test kiểm tra PDF output.

### Out-of-Scope

- Không thiết kế template phức tạp. Lý do: basic PDF trước.
- Không tích hợp email gửi invoice. Lý do: thuộc SP-6.1.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-3.5-invoice-pdf
# create lib/invoicePdf.ts
# modify components/InvoiceManager.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu PDF không render, trace jsPDF usage.
2. **`/test-driven-development`**: Test PDF có chứa invoice number.
3. **`/requesting-code-review`**: Review bundle size impact của jspdf.

### Deploy & Log

```bash
git add lib/invoicePdf.ts components/InvoiceManager.tsx
git commit -m "feat(billing): SP-3.5 invoice PDF generation"
git push origin feat/SP-3.5-invoice-pdf
```

Ghi log: `Plan\Log\SP-3.5-<timestamp>.md`.

### Artifact Locations

- Code: `lib/invoicePdf.ts`, `components/InvoiceManager.tsx`
- Log: `Plan\Log\SP-3.5-<timestamp>.md`

---

## SP-4.1: Feature Flag Service

### Yêu cầu ban đầu

Feature Flag (#7): flag evaluation, plan-based gating từ `Flagsmith`, `Unleash`, `Flipt`, `trentas/saas-scaffolding`.

### Yêu cầu phase

Tạo service đánh giá feature theo plan/tenant.

### Kết quả cần có

- `services/admin/featureFlagService.ts`.
- `components/FeaturePicker.tsx` kết nối service.

### Nhiệm vụ đã hoàn thành trước đó

- Phase 3 hoàn thành.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service.
3. Kết nối component.
4. Viết test.

### Out-of-Scope

- Không tích hợp Flagsmith SDK. Lý do: tự implement trước, tích hợp SDK sau nếu cần.
- Không làm A/B testing. Lý do: ngoài scope.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-4.1-feature-flags
# create services/admin/featureFlagService.ts
# modify components/FeaturePicker.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu feature không bật/tắt đúng, trace evaluation logic.
2. **`/test-driven-development`**: Test feature theo plan.
3. **`/requesting-code-review`**: Review plan-feature mapping.

### Deploy & Log

```bash
git add services/admin/featureFlagService.ts components/FeaturePicker.tsx
git commit -m "feat(admin): SP-4.1 feature flag service"
git push origin feat/SP-4.1-feature-flags
```

Ghi log: `Plan\Log\SP-4.1-<timestamp>.md`.

### Artifact Locations

- Code: `services/admin/featureFlagService.ts`, `components/FeaturePicker.tsx`
- Log: `Plan\Log\SP-4.1-<timestamp>.md`

---

## SP-4.2: Impersonation Flow

### Yêu cầu ban đầu

Impersonate User (#13): audit log impersonation, session switch từ `Cal.com`, `ixartz/SaaS-Boilerplate`.

### Yêu cầu phase

Implement impersonation với audit log.

### Kết quả cần có

- Service `startImpersonation`, `endImpersonation`.
- `ImpersonationBanner.tsx` hiển thị khi đang impersonate.

### Nhiệm vụ đã hoàn thành trước đó

- SP-4.1, SP-1.6.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service.
3. Cập nhật banner.
4. Viết test audit log.

### Out-of-Scope

- Không cho phép impersonate cross-tenant. Lý do: bảo mật, phải kiểm tra quyền.
- Không persist impersonation qua reload. Lý do: scope cơ bản.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-4.2-impersonation
# modify services/admin/systemAdminService.ts
# modify components/ImpersonationBanner.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu session không restore, trace storage logic.
2. **`/test-driven-development`**: Test start/end + audit log.
3. **`/requesting-code-review`**: Review security, đảm bảo chỉ admin được impersonate.

### Deploy & Log

```bash
git add services/admin/systemAdminService.ts components/ImpersonationBanner.tsx
git commit -m "feat(admin): SP-4.2 impersonation flow with audit log"
git push origin feat/SP-4.2-impersonation
```

Ghi log: `Plan\Log\SP-4.2-<timestamp>.md`.

### Artifact Locations

- Code: `services/admin/systemAdminService.ts`, `components/ImpersonationBanner.tsx`
- Log: `Plan\Log\SP-4.2-<timestamp>.md`

---

## SP-4.3: API Key Lifecycle

### Yêu cầu ban đầu

API Key (#23): API key lifecycle, usage analytics từ `Unkey`, `trentas/saas-scaffolding`.

### Yêu cầu phase

Create/revoke/rotate API keys.

### Kết quả cần có

- `components/ApiKeyManager.tsx` hoàn thiện.
- Service create/revoke.

### Nhiệm vụ đã hoàn thành trước đó

- SP-4.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service.
3. Cập nhật UI.
4. Viết test.

### Out-of-Scope

- Không implement rate limiting per API key. Lý do: thuộc SP-7.4.
- Không làm analytics dashboard. Lý do: cần aggregation job.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-4.3-api-key-lifecycle
# modify components/ApiKeyManager.tsx
# add service functions
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu revoked key vẫn hoạt động, trace middleware.
2. **`/test-driven-development`**: Test create/revoke.
3. **`/requesting-code-review`**: Review key hashing (chỉ hiển thị 1 lần).

### Deploy & Log

```bash
git add components/ApiKeyManager.tsx services/admin/permissions.ts
git commit -m "feat(admin): SP-4.3 API key lifecycle"
git push origin feat/SP-4.3-api-key-lifecycle
```

Ghi log: `Plan\Log\SP-4.3-<timestamp>.md`.

### Artifact Locations

- Code: `components/ApiKeyManager.tsx`, `services/admin/permissions.ts`
- Log: `Plan\Log\SP-4.3-<timestamp>.md`

---

## SP-4.4: Webhook Delivery System

### Yêu cầu ban đầu

Webhook (#22): webhook delivery, retries, signatures từ `Svix`, `trentas/saas-scaffolding`.

### Yêu cầu phase

Tạo edge function gửi webhook với HMAC signature và retry 3 lần.

### Kết quả cần có

- `supabase/functions/webhook-delivery/index.ts`.
- Retry logic và delivery logs.

### Nhiệm vụ đã hoàn thành trước đó

- SP-4.3.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết edge function.
3. Cập nhật `WebhookManager.tsx`.
4. Viết test.

### Out-of-Scope

- Không implement webhook portal cho receiver. Lý do: chỉ admin dashboard.
- Không làm fan-out event bus. Lý do: cơ bản retry trước.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-4.4-webhook-delivery
# create supabase/functions/webhook-delivery/index.ts
supabase functions deploy webhook-delivery
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu retry không đúng, trace backoff logic.
2. **`/test-driven-development`**: Test failed webhook retry 3 lần.
3. **`/requesting-code-review`**: Review HMAC secret storage.

### Deploy & Log

```bash
git add supabase/functions/webhook-delivery/index.ts components/WebhookManager.tsx
git commit -m "feat(admin): SP-4.4 webhook delivery system"
git push origin feat/SP-4.4-webhook-delivery
```

Copy edge function vào `Plan\EdgeFunction\webhook-delivery.ts`.
Ghi log: `Plan\Log\SP-4.4-<timestamp>.md`.

### Artifact Locations

- Edge Function: `supabase/functions/webhook-delivery/index.ts` + `Plan\EdgeFunction\`
- Code: `components/WebhookManager.tsx`
- Log: `Plan\Log\SP-4.4-<timestamp>.md`

---

## SP-5.1: System Health Panel Data

### Yêu cầu ban đầu

System Monitor (#14): CPU, memory, disk, health checks từ `Coolify`, `cvsloane/infra-dashboard`.

### Yêu cầu phase

Thu thập metrics qua edge function.

### Kết quả cần có

- `supabase/functions/system-health/index.ts`.
- `SystemHealthPanel.tsx` hiển thị metrics.

### Nhiệm vụ đã hoàn thành trước đó

- Phase 4 hoàn thành.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết edge function.
3. Cập nhật panel.
4. Viết test.

### Out-of-Scope

- Không cài agent trên server. Lý do: dùng Supabase metrics API.
- Không cảnh báo PagerDuty. Lý do: cần integration riêng.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-5.1-system-health
# create supabase/functions/system-health/index.ts
# modify components/SystemHealthPanel.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu metrics không về, trace edge function logs.
2. **`/test-driven-development`**: Test API shape.
3. **`/requesting-code-review`**: Review API key leak.

### Deploy & Log

```bash
git add supabase/functions/system-health/index.ts components/SystemHealthPanel.tsx
git commit -m "feat(ops): SP-5.1 system health panel"
git push origin feat/SP-5.1-system-health
```

Copy edge function vào `Plan\EdgeFunction\system-health.ts`.
Ghi log: `Plan\Log\SP-5.1-<timestamp>.md`.

### Artifact Locations

- Edge Function: `supabase/functions/system-health/index.ts` + `Plan\EdgeFunction\`
- Code: `components/SystemHealthPanel.tsx`
- Log: `Plan\Log\SP-5.1-<timestamp>.md`

---

## SP-5.2: Queue Monitor

### Yêu cầu ban đầu

Queue Monitor (#15): BullMQ/Supabase queue monitoring từ `Coolify`, `cvsloane/infra-dashboard`.

### Yêu cầu phase

Hiển thị `heavy_ops_jobs` queue.

### Kết quả cần có

- `services/admin/queueService.ts`.
- `ReadReplicaQueueManager.tsx` cập nhật.

### Nhiệm vụ đã hoàn thành trước đó

- SP-5.1.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service.
3. Cập nhật UI.
4. Viết test.

### Out-of-Scope

- Không implement queue worker mới. Lý do: chỉ monitor existing queue.
- Không retry job tự động. Lý do: chỉ hỗ trợ manual retry.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-5.2-queue-monitor
# create services/admin/queueService.ts
# modify components/ReadReplicaQueueManager.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu queue count sai, trace query.
2. **`/test-driven-development`**: Test retry job.
3. **`/requesting-code-review`**: Review RLS trong job query.

### Deploy & Log

```bash
git add services/admin/queueService.ts components/ReadReplicaQueueManager.tsx
git commit -m "feat(ops): SP-5.2 queue monitor"
git push origin feat/SP-5.2-queue-monitor
```

Ghi log: `Plan\Log\SP-5.2-<timestamp>.md`.

### Artifact Locations

- Code: `services/admin/queueService.ts`, `components/ReadReplicaQueueManager.tsx`
- Log: `Plan\Log\SP-5.2-<timestamp>.md`

---

## SP-5.3: Cron Monitor

### Yêu cầu ban đầu

Cron Monitor (#16): scheduled jobs, execution logs từ `Coolify`, `cvsloane/infra-dashboard`.

### Yêu cầu phase

Dashboard hiển thị cron job logs.

### Kết quả cần có

- `components/admin/CronMonitorPanel.tsx`.
- Service `getCronLogs`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-5.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service.
3. Xây component.
4. Thêm route.

### Out-of-Scope

- Không tạo cron job mới. Lý do: chỉ monitor existing `cron-admin-tasks`.
- Không gửi alert khi cron fail. Lý do: cần notification service.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-5.3-cron-monitor
# create components/admin/CronMonitorPanel.tsx
# create service
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu logs không hiển thị, trace cron_job_logs query.
2. **`/test-driven-development`**: Test display last run log.
3. **`/requesting-code-review`**: Review polling interval.

### Deploy & Log

```bash
git add components/admin/CronMonitorPanel.tsx services/admin/cronService.ts
git commit -m "feat(ops): SP-5.3 cron monitor"
git push origin feat/SP-5.3-cron-monitor
```

Ghi log: `Plan\Log\SP-5.3-<timestamp>.md`.

### Artifact Locations

- Code: `components/admin/CronMonitorPanel.tsx`, `services/admin/cronService.ts`
- Log: `Plan\Log\SP-5.3-<timestamp>.md`

---

## SP-5.4: Backup Automation

### Yêu cầu ban đầu

Backup (#18): pg_dump, scheduled backups từ `Coolify`, supabase-backup patterns.

### Yêu cầu phase

Tự động pg_dump và lưu storage.

### Kết quả cần có

- Edge function hoặc scheduled job backup.
- `StorageBackupPanel.tsx` cập nhật.

### Nhiệm vụ đã hoàn thành trước đó

- SP-5.3.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết backup job.
3. Lưu snapshot metadata.
4. Viết test.

### Out-of-Scope

- Không restore trong sub-phase này. Lý do: thuộc SP-5.5.
- Không tích hợp S3 riêng. Lý do: dùng Supabase Storage.

### Backup Procedure

Backup project + DB.

### Execution Steps

```bash
git checkout -b feat/SP-5.4-backup-automation
# modify services/tenantBackupService.ts
# modify components/StorageBackupPanel.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu backup không tạo file, trace job logs.
2. **`/test-driven-development`**: Test backup metadata.
3. **`/requesting-code-review`**: Review credential access.

### Deploy & Log

```bash
git add services/tenantBackupService.ts components/StorageBackupPanel.tsx
git commit -m "feat(ops): SP-5.4 backup automation"
git push origin feat/SP-5.4-backup-automation
```

Ghi log: `Plan\Log\SP-5.4-<timestamp>.md`.

### Artifact Locations

- Code: `services/tenantBackupService.ts`, `components/StorageBackupPanel.tsx`
- Log: `Plan\Log\SP-5.4-<timestamp>.md`

---

## SP-5.5: Restore Workflow

### Yêu cầu ban đầu

Restore (#19): restore procedures, point-in-time từ `Coolify`, supabase-backup patterns.

### Yêu cầu phase

Restore từ snapshot với validate.

### Kết quả cần có

- `components/admin/RestorePanel.tsx`.
- Service `restoreTenantFromSnapshot`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-5.4.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Validate snapshot (checksum, schema version).
3. Viết restore flow.
4. Viết test trên test tenant.

### Out-of-Scope

- Không restore production tenant trong test. Lý do: destructive, chỉ test tenant.
- Không làm point-in-time restore. Lý do: cần WAL archive riêng.

### Backup Procedure

Backup project + DB.

### Execution Steps

```bash
git checkout -b feat/SP-5.5-restore-workflow
# modify services/tenantRestoreService.ts
# create components/admin/RestorePanel.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu restore fail, trace validation/checksum.
2. **`/test-driven-development`**: Test restore test tenant.
3. **`/requesting-code-review`**: Review destructive action guards.

### Deploy & Log

```bash
git add services/tenantRestoreService.ts components/admin/RestorePanel.tsx
git commit -m "feat(ops): SP-5.5 restore workflow"
git push origin feat/SP-5.5-restore-workflow
```

Ghi log: `Plan\Log\SP-5.5-<timestamp>.md`.

### Artifact Locations

- Code: `services/tenantRestoreService.ts`, `components/admin/RestorePanel.tsx`
- Log: `Plan\Log\SP-5.5-<timestamp>.md`

---

## SP-5.6: Database Maintenance Panel

### Yêu cầu ban đầu

Database Maintenance (#28): vacuum, analyze, index monitoring từ Supabase CLI + Coolify.

### Yêu cầu phase

VACUUM ANALYZE, index rebuild, bloat monitoring.

### Kết quả cần có

- `supabase/functions/db-maintenance/index.ts`.
- `BulkMaintenancePanel.tsx` cập nhật.

### Nhiệm vụ đã hoàn thành trước đó

- SP-5.5.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết edge function.
3. Cập nhật UI.
4. Viết test.

### Out-of-Scope

- Không tự động chạy maintenance định kỳ. Lý do: chỉ manual trigger trước.
- Không optimize query plans. Lý do: cần analysis riêng.

### Backup Procedure

Backup project + DB.

### Execution Steps

```bash
git checkout -b feat/SP-5.6-db-maintenance
# create supabase/functions/db-maintenance/index.ts
# modify components/BulkMaintenancePanel.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu maintenance job lỗi, trace PostgreSQL logs.
2. **`/test-driven-development`**: Test job log.
3. **`/requesting-code-review`**: Review permission của edge function.

### Deploy & Log

```bash
git add supabase/functions/db-maintenance/index.ts components/BulkMaintenancePanel.tsx
git commit -m "feat(ops): SP-5.6 database maintenance panel"
git push origin feat/SP-5.6-db-maintenance
```

Copy edge function vào `Plan\EdgeFunction\db-maintenance.ts`.
Ghi log: `Plan\Log\SP-5.6-<timestamp>.md`.

### Artifact Locations

- Edge Function: `supabase/functions/db-maintenance/index.ts` + `Plan\EdgeFunction\`
- Code: `components/BulkMaintenancePanel.tsx`
- Log: `Plan\Log\SP-5.6-<timestamp>.md`

---

## SP-5.7: Storage Management Panel

### Yêu cầu ban đầu

Storage (#17): Supabase Storage buckets, policies, usage stats, cleanup từ Supabase native + `trentas/saas-scaffolding`.

### Yêu cầu phase

Tạo panel quản lý Storage buckets, hiển thị usage, cấu hình lifecycle/cleanup policy.

### Kết quả cần có

- `components/admin/StorageManagementPanel.tsx` (hoặc cập nhật `components/StorageBackupPanel.tsx`).
- `services/admin/storageAdminService.ts`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-5.6.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service `getBuckets`, `getBucketUsage`, `setBucketLifecycle`.
3. Tạo UI hiển thị buckets + usage bar + lifecycle config.
4. Viết test.

### Out-of-Scope

- Không implement S3-compatible migration. Lý do: không có trong 29 tính năng core.
- Không làm CDN config. Lý do: thuộc infrastructure.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-5.7-storage-management
# create components/admin/StorageManagementPanel.tsx
# create services/admin/storageAdminService.ts
npm run test -- tests/admin-dashboard/StorageManagementPanel.test.tsx
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu usage stats sai, trace Supabase Storage API.
2. **`/test-driven-development`**: Viết test list buckets trước.
3. **`/requesting-code-review`**: Review RLS/policy không leak bucket private objects.

### Deploy & Log

```bash
git add components/admin/StorageManagementPanel.tsx services/admin/storageAdminService.ts
git commit -m "feat(ops): SP-5.7 storage management panel"
git push origin feat/SP-5.7-storage-management
```

Ghi log: `Plan\Log\SP-5.7-<timestamp>.md`.

### Artifact Locations

- Code: `components/admin/StorageManagementPanel.tsx`, `services/admin/storageAdminService.ts`
- Log: `Plan\Log\SP-5.7-<timestamp>.md`

---

## SP-6.1: Email Service Integration

### Yêu cầu ban đầu

Email Service (#20): self-hosted email campaigns, transactional từ `Listmonk`, `trentas/saas-scaffolding`.

### Yêu cầu phase

Gửi email qua Resend/SendGrid edge function với template variables.

### Kết quả cần có

- `supabase/functions/send-email/index.ts`.
- `EmailTemplateManager.tsx` cập nhật.

### Nhiệm vụ đã hoàn thành trước đó

- Phase 5 hoàn thành.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết edge function.
3. Cập nhật template manager.
4. Viết test.

### Out-of-Scope

- Không self-host Listmonk. Lý do: Resend/SendGrid đủ cho transactional.
- Không làm campaign management. Lý do: ngoài scope cơ bản.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-6.1-email-service
# create supabase/functions/send-email/index.ts
# modify components/EmailTemplateManager.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu email không gửi, trace edge function logs.
2. **`/test-driven-development`**: Test template variable render.
3. **`/requesting-code-review`**: Review API key secret.

### Deploy & Log

```bash
git add supabase/functions/send-email/index.ts components/EmailTemplateManager.tsx
git commit -m "feat(comms): SP-6.1 email service integration"
git push origin feat/SP-6.1-email-service
```

Copy edge function vào `Plan\EdgeFunction\send-email.ts`.
Ghi log: `Plan\Log\SP-6.1-<timestamp>.md`.

### Artifact Locations

- Edge Function: `supabase/functions/send-email/index.ts` + `Plan\EdgeFunction\`
- Code: `components/EmailTemplateManager.tsx`
- Log: `Plan\Log\SP-6.1-<timestamp>.md`

---

## SP-6.2: SMS Service Integration

### Yêu cầu ban đầu

SMS Service (#21): tích hợp Twilio/Vonage/provider địa phương.

### Yêu cầu phase

Gửi SMS qua local provider.

### Kết quả cần có

- `services/admin/smsService.ts`.
- `supabase/functions/send-sms/index.ts`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-6.1.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service.
3. Viết edge function.
4. Viết test với mock provider.

### Out-of-Scope

- Không tích hợp nhiều provider cùng lúc. Lý do: chọn 1 provider chính trước.
- Không làm SMS campaign. Lý do: cơ bản transactional trước.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-6.2-sms-service
# create services/admin/smsService.ts
# create supabase/functions/send-sms/index.ts
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu SMS fail, trace provider response.
2. **`/test-driven-development`**: Test với provider mock.
3. **`/requesting-code-review`**: Review provider credentials.

### Deploy & Log

```bash
git add services/admin/smsService.ts supabase/functions/send-sms/index.ts
git commit -m "feat(comms): SP-6.2 SMS service integration"
git push origin feat/SP-6.2-sms-service
```

Copy edge function vào `Plan\EdgeFunction\send-sms.ts`.
Ghi log: `Plan\Log\SP-6.2-<timestamp>.md`.

### Artifact Locations

- Edge Function: `supabase/functions/send-sms/index.ts` + `Plan\EdgeFunction\`
- Code: `services/admin/smsService.ts`
- Log: `Plan\Log\SP-6.2-<timestamp>.md`

---

## SP-6.3: Support Ticket System

### Yêu cầu ban đầu

Support (#12): ticket system hoặc knowledge base từ `Cal.com`, Outline.

### Yêu cầu phase

Hoàn thiện ticket inbox với CRUD, replies, templates, SLA.

### Kết quả cần có

- `TicketInbox.tsx` hoàn thiện.
- Service CRUD tickets/replies.

### Nhiệm vụ đã hoàn thành trước đó

- SP-6.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Thêm SLA column.
3. Viết service.
4. Cập nhật UI.

### Out-of-Scope

- Không làm knowledge base. Lý do: ngoài scope.
- Không gửi email notification khi có reply. Lý do: thuộc SP-6.1.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-6.3-support-tickets
# modify components/TicketInbox.tsx
# create services/admin/supportService.ts
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu thread reply không hiển thị, trace join query.
2. **`/test-driven-development`**: Test thread reply.
3. **`/requesting-code-review`**: Review ticket access permissions.

### Deploy & Log

```bash
git add components/TicketInbox.tsx services/admin/supportService.ts
git commit -m "feat(comms): SP-6.3 support ticket system"
git push origin feat/SP-6.3-support-tickets
```

Ghi log: `Plan\Log\SP-6.3-<timestamp>.md`.

### Artifact Locations

- Code: `components/TicketInbox.tsx`, `services/admin/supportService.ts`
- Log: `Plan\Log\SP-6.3-<timestamp>.md`

---

## SP-7.1: Subdomain Availability Check

### Yêu cầu ban đầu

Subdomain Management (#3): routing, middleware, tenant resolution từ `trentas/saas-scaffolding`, `Cal.com`.

### Yêu cầu phase

Cho phép tenant chọn subdomain, kiểm tra availability.

### Kết quả cần có

- `components/admin/SubdomainManagerPanel.tsx`.
- Service `checkSubdomainAvailability`, `setTenantSubdomain`.

### Nhiệm vụ đã hoàn thành trước đó

- Phase 6 hoàn thành, SP-1.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service.
3. Xây component.
4. Thêm route.

### Out-of-Scope

- Không implement routing theo subdomain. Lý do: cần DNS/proxy config.
- Không tích hợp custom domain. Lý do: thuộc SP-7.2.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-7.1-subdomain-check
# create components/admin/SubdomainManagerPanel.tsx
# modify services/admin/tenantAdminService.ts
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu duplicate không bị từ chối, trace unique constraint.
2. **`/test-driven-development`**: Test subdomain duplicate rejected.
3. **`/requesting-code-review`**: Review subdomain validation.

### Deploy & Log

```bash
git add components/admin/SubdomainManagerPanel.tsx services/admin/tenantAdminService.ts
git commit -m "feat(enterprise): SP-7.1 subdomain availability check"
git push origin feat/SP-7.1-subdomain-check
```

Ghi log: `Plan\Log\SP-7.1-<timestamp>.md`.

### Artifact Locations

- Code: `components/admin/SubdomainManagerPanel.tsx`, `services/admin/tenantAdminService.ts`
- Log: `Plan\Log\SP-7.1-<timestamp>.md`

---

## SP-7.2: Custom Domain Verification

### Yêu cầu ban đầu

Custom Domain (#4): domain verification, SSL, routing từ `Cal.com`, `Dub.co`, `Papermark`.

### Yêu cầu phase

Verify custom domain qua DNS TXT.

### Kết quả cần có

- `components/admin/CustomDomainPanel.tsx`.
- `supabase/functions/verify-domain/index.ts`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-7.1, SP-1.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Tạo verification token.
3. Viết edge function DNS lookup.
4. Xây UI.

### Out-of-Scope

- Không cấu hình SSL. Lý do: dùng Supabase/Cloudflare managed SSL.
- Không implement reverse proxy routing. Lý do: infra config riêng.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-7.2-custom-domain
# create components/admin/CustomDomainPanel.tsx
# create supabase/functions/verify-domain/index.ts
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu verify fail, trace DNS lookup.
2. **`/test-driven-development`**: Test verify success/failure.
3. **`/requesting-code-review`**: Review token entropy.

### Deploy & Log

```bash
git add components/admin/CustomDomainPanel.tsx supabase/functions/verify-domain/index.ts
git commit -m "feat(enterprise): SP-7.2 custom domain verification"
git push origin feat/SP-7.2-custom-domain
```

Copy edge function vào `Plan\EdgeFunction\verify-domain.ts`.
Ghi log: `Plan\Log\SP-7.2-<timestamp>.md`.

### Artifact Locations

- Edge Function: `supabase/functions/verify-domain/index.ts` + `Plan\EdgeFunction\`
- Code: `components/admin/CustomDomainPanel.tsx`
- Log: `Plan\Log\SP-7.2-<timestamp>.md`

---

## SP-7.3: License Management

### Yêu cầu ban đầu

License (#24): license generation, validation từ Keygen.

### Yêu cầu phase

Quản lý license key theo business model.

### Kết quả cần có

- `components/admin/LicenseManagerPanel.tsx`.
- `services/admin/licenseService.ts`.
- Migration bảng `licenses`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-7.2.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết migration.
3. Viết service generate/validate.
4. Xây UI.

### Out-of-Scope

- Không tích hợp payment cho license. Lý do: billing đã có ở Phase 3.
- Không làm offline license activation. Lý do: scope online trước.

### Backup Procedure

Backup project + DB.

### Execution Steps

```bash
git checkout -b feat/SP-7.3-license-management
# write supabase/migrations/20250713000023_phase7_licenses.sql
# create services/admin/licenseService.ts
# create components/admin/LicenseManagerPanel.tsx
supabase migration up
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu validate license sai, trace expiry logic.
2. **`/test-driven-development`**: Test expired license.
3. **`/requesting-code-review`**: Review license key generation security.

### Deploy & Log

```bash
git add supabase/migrations/20250713000023_phase7_licenses.sql services/admin/licenseService.ts components/admin/LicenseManagerPanel.tsx
git commit -m "feat(enterprise): SP-7.3 license management"
git push origin feat/SP-7.3-license-management
```

Copy migration vào `Plan\Migration\`.
Ghi log: `Plan\Log\SP-7.3-<timestamp>.md`.

### Artifact Locations

- Migration: `supabase/migrations/20250713000023_phase7_licenses.sql` + `Plan\Migration\`
- Code: `services/admin/licenseService.ts`, `components/admin/LicenseManagerPanel.tsx`
- Log: `Plan\Log\SP-7.3-<timestamp>.md`

---

## SP-7.4: Rate Limiting & Security Settings

### Yêu cầu ban đầu

Global Config (#29), System Settings (#9): feature flags, app settings, security.

### Yêu cầu phase

Thêm rate limit, lockout, session timeout.

### Kết quả cần có

- `components/admin/SecuritySettingsPanel.tsx`.
- Service `recordLoginAttempt`, `updateTenantSessionTimeout`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-7.3.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service.
3. Xây UI.
4. Viết test lockout.

### Out-of-Scope

- Không implement 2FA. Lý do: codebase đã có admin_2fa_backup_codes.
- Không làm SSO/SAML. Lý do: thuộc enterprise optional.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-7.4-security-settings
# modify services/admin/systemAdminService.ts
# create components/admin/SecuritySettingsPanel.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu lockout không hoạt động, trace login_attempts query.
2. **`/test-driven-development`**: Test lockout after N failed attempts.
3. **`/requesting-code-review`**: Review rate limit thresholds.

### Deploy & Log

```bash
git add services/admin/systemAdminService.ts components/admin/SecuritySettingsPanel.tsx
git commit -m "feat(enterprise): SP-7.4 rate limiting and security settings"
git push origin feat/SP-7.4-security-settings
```

Ghi log: `Plan\Log\SP-7.4-<timestamp>.md`.

### Artifact Locations

- Code: `services/admin/systemAdminService.ts`, `components/admin/SecuritySettingsPanel.tsx`
- Log: `Plan\Log\SP-7.4-<timestamp>.md`

---

## SP-7.5: Advanced Audit Export

### Yêu cầu ban đầu

Audit Log (#11): event logging, actor tracking; Advanced Audit & Compliance.

### Yêu cầu phase

Export audit log theo filter (CSV/JSON).

### Kết quả cần có

- `components/admin/AuditExportPanel.tsx`.
- Service `exportAuditLogs`.

### Nhiệm vụ đã hoàn thành trước đó

- SP-7.4, SP-1.6, SP-2.5.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Viết service export.
3. Xây UI.
4. Viết test.

### Out-of-Scope

- Không implement retention policies. Lý do: cần job định kỳ.
- Không làm GDPR deletion. Lý do: codebase đã có gdpr tables.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b feat/SP-7.5-audit-export
# modify services/admin/auditAdminService.ts
# create components/admin/AuditExportPanel.tsx
npm run test
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Nếu export sai số dòng, trace filter query.
2. **`/test-driven-development`**: Test CSV row count.
3. **`/requesting-code-review`**: Review PII in export.

### Deploy & Log

```bash
git add services/admin/auditAdminService.ts components/admin/AuditExportPanel.tsx
git commit -m "feat(enterprise): SP-7.5 advanced audit export"
git push origin feat/SP-7.5-audit-export
```

Ghi log: `Plan\Log\SP-7.5-<timestamp>.md`.

### Artifact Locations

- Code: `services/admin/auditAdminService.ts`, `components/admin/AuditExportPanel.tsx`
- Log: `Plan\Log\SP-7.5-<timestamp>.md`

---

## SP-C.3: Documentation of Open-Source References

### Yêu cầu ban đầu

Quy tắc tham khảo mã nguồn mở: phân biệt license, ghi chép nguồn tham khảo.

### Yêu cầu phase

Ghi lại nguồn tham khảo để tránh vấn đề pháp lý.

### Kết quả cần có

- `docs/opensource-references.md`.

### Nhiệm vụ đã hoàn thành trước đó

- Tất cả các phase trước đó.

### Nhiệm vụ trong sub-phase này

1. Backup project.
2. Liệt kê repo, license, phần tham khảo, cách implement lại.
3. Review với team.

### Out-of-Scope

- Không thay đổi code. Lý do: chỉ documentation.
- Không xin phép license. Lý do: chỉ ghi chú tham khảo.

### Backup Procedure

Backup project.

### Execution Steps

```bash
git checkout -b docs/SP-C.3-opensource-references
# write docs/opensource-references.md
```

### Testing & Quality Gates

1. **`/systematic-debugging`**: Không áp dụng.
2. **`/test-driven-development`**: Không áp dụng.
3. **`/requesting-code-review`**: Review đầy đủ repo và license.

### Deploy & Log

```bash
git add docs/opensource-references.md
git commit -m "docs(admin): SP-C.3 open-source reference documentation"
git push origin docs/SP-C.3-opensource-references
```

Ghi log: `Plan\Log\SP-C.3-<timestamp>.md`.

### Artifact Locations

- Doc: `docs/opensource-references.md`
- Log: `Plan\Log\SP-C.3-<timestamp>.md`

---

## Global Verification Checklist

Sau khi tất cả sub-phase hoàn thành:

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] `npm run audit:rpc` passes
- [ ] All migrations copied to `Plan\Migration\`
- [ ] All edge functions copied to `Plan\EdgeFunction\`
- [ ] All logs written to `Plan\Log\`
- [ ] `docs/opensource-references.md` reviewed

---

## Execution Handoff

Plan complete and saved. Ready to execute using subagent-driven-development — I'll dispatch a fresh subagent per sub-phase with two-stage review (spec compliance then code quality). Shall I proceed?

