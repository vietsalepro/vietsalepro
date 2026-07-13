# SP-1.2: Add Tenant Subdomain & Custom Domain Columns — Execution Log

> **Sub-phase:** SP-1.2  
> **Date:** 2026-07-12 12:54:15  
> **Branch:** `feat/SP-1.2-tenant-domain-columns`  
> **Status:** Completed locally, **not pushed**

---

## 1. Scope

Đảm bảo bảng `public.tenants` đã có các cột phục vụ routing và custom domain:

- `subdomain` (NOT NULL, UNIQUE)
- `custom_domain` (TEXT, nullable)
- `slug` (GENERATED ALWAYS AS `subdomain`)
- `white_label` (JSONB)

Out-of-scope: UI custom domain, DNS verification (SP-7.2).

---

## 2. Backup

- **Source:** `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7`
- **Destination:** `C:\Users\SUACAUBA\Downloads\Project\Back up Admin dashboard step\SP-1.2-20260712_125107`
- **Method:** Full recursive copy via PowerShell `Copy-Item -Recurse -Force`
- **Result:** Backup completed successfully

---

## 3. Schema Verification

Các cột đã tồn tại trong migration hiện tại:

| Cột | Migration | Ghi chú |
|-----|-----------|---------|
| `subdomain` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | `NOT NULL`, unique constraint `tenants_subdomain_key` |
| `custom_domain` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | `TEXT` nullable |
| `white_label` | `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` | `JSONB DEFAULT '{}'` |
| `slug` | `supabase/migrations/20260713000001_standardize_tenants_and_memberships.sql` | `GENERATED ALWAYS AS (subdomain) STORED` |

Kết luận: **không cần viết thêm migration** vì tất cả các cột và index cần thiết đã có.

---

## 4. TDD Implementation

### RED
- Viết `tests/tenant-domain-columns.test.ts` kiểm tra tenant row trong mock DB phải có `subdomain`, `custom_domain`, `white_label`, và `slug`.
- Test fail vì mock hiện tại chưa sinh cột `slug`.

### GREEN
- Bổ sung `slug: params.p_subdomain` trong `tests/mocks/supabase.ts` (RPC `create_tenant_with_admin`) để mirror generated column trong schema thật.
- Test pass.

### REFACTOR
- Không cần refactor thêm.

### Files changed

- `tests/tenant-domain-columns.test.ts` (new)
- `tests/mocks/supabase.ts`

---

## 5. Quality Gates

### `/systematic-debugging`
- Không có lỗi trong quá trình chạy. Test ban đầu fail do mock thiếu `slug`; root cause xác định và fix tại nguồn (mock row) thay vì patch từng caller.

### `/test-driven-development`
- RED: `tests/tenant-domain-columns.test.ts` fail (`row.slug` undefined)
- GREEN: bổ sung `slug` trong mock
- Tất cả test pass

### `/requesting-code-review`
- Static scan: no hardcoded secrets, no eval/exec, no shell injection, no SQL injection patterns
- Self-review checklist: passed
- Independent reviewer subagent: passed
- Commit được đánh dấu `[verified]`

---

## 6. Test & Lint Results

```text
npm run lint        → passed (tsc --noEmit)
npx vitest run      → 55 test files passed, 302 tests passed
```

No new warnings or regressions.

---

## 7. Commit

```text
[feat/SP-1.2-tenant-domain-columns 5d667b3] [verified] test(admin): SP-1.2 verify tenant subdomain/custom domain/slug columns
 2 files changed, 50 insertions(+)
 create mode 100644 tests/tenant-domain-columns.test.ts
```

---

## 8. Deploy Status

- **Pushed:** No
- **Staging migration:** Not applicable — no new SQL migration was required
- **Production migration:** Not applicable

---

## 9. Artifacts

### Migration files generated in this phase
- **None** — all required columns/indexes already existed in baseline and standardize migrations.

### Edge Functions generated in this phase
- **None** — SP-1.2 is schema verification only.

### Code files changed
- `tests/tenant-domain-columns.test.ts`
- `tests/mocks/supabase.ts`

### Migrations/Edge Functions not yet pushed
- Not applicable (no new migration or Edge Function created).

---

## 10. Notes

- Mock `create_tenant_with_admin` giờ đã phản ánh generated column `slug`, giúp các test tạo tenant sau này không bị sai lệch so với schema thật.
- Nếu sau này cần expose `slug` ra `Tenant` type hoặc UI, có thể bổ sung `slug` vào `types/tenant.ts` và `mapTenantFromDB`; hiện tại chưa cần vì service vẫn dùng `subdomain` cho lookup.
