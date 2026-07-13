# Admin Dashboard Merge & Remediation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Đưa toàn bộ code admin dashboard từ các branch feature riêng và artifacts trong `Plan/` vào `master`, đảm bảo migration, edge function, service, component, page, test nằm đúng vị trí, và pass toàn bộ verification pipeline.

**Architecture:** Không thay đổi stack. Chỉ merge/cherry-pick/di chuyển code đã viết, giải quyết conflict, hoàn thiện placeholder, và dọn dẹp kỹ thuật.

**Tech Stack:** Vite, React 19, TypeScript 5.8, Tailwind CSS 4, Supabase, Vitest.

---

## Context / Assumptions

- Các sub-phase đã được implement trên branch riêng: `feat/SP-6.2-sms-service`, `feat/SP-7.1-subdomain-check`, `feat/SP-7.2-custom-domain`, `feat/SP-7.3-license-management`, `feat/SP-7.4-security-settings`, `docs/SP-C.3-opensource-references`.
- Commit orphan: `c27f3521` (SP-7.5 advanced audit export), `0edae743` (SP-C.3 open-source references docs).
- Trên `master` (`ccb25c8c`), code chỉ còn artifacts trong `Plan/EdgeFunction/`, `Plan/Log/`, `Plan/Migration/`.
- Verification pipeline hiện pass: `npm run lint`, `npx vitest run`, `npm run build`, `npm run audit:rpc`.
- Không deploy production trong plan này.

---

## Step-by-Step Plan

### Task 1: Khôi phục commit orphan SP-7.5 và SP-C.3

**Objective:** Lấy lại code từ các commit không thuộc branch nào.

**Files:**
- Read: `git show c27f3521 --name-only`
- Read: `git show 0edae743 --name-only`

**Step 1: Kiểm tra commit tồn tại**

Run:
```bash
git show --stat --oneline c27f3521
git show --stat --oneline 0edae743
```

Expected: Hiển thị danh sách file thay đổi.

**Step 2: Tạo branch tạm từ commit**

Run:
```bash
git branch recover-sp-7.5 c27f3521
git branch recover-sp-c.3 0edae743
```

**Step 3: Verify**

Run:
```bash
git branch -a | findstr "recover-"
```

Expected: Có 2 branch recover.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(plan): create recovery branches for orphan SP-7.5 and SP-C.3 commits"
```

---

### Task 2: Merge các branch feature vào master

**Objective:** Tích hợp các branch chưa merge theo thứ tự dependency.

**Files:**
- Modify: merge các branch
- Resolve: conflicts nếu có

**Step 1: Checkout master và tạo integration branch**

Run:
```bash
git checkout master
git checkout -b integrate/admin-dashboard-features
```

**Step 2: Merge từng branch theo thứ tự**

Run:
```bash
git merge feat/SP-6.2-sms-service --no-ff -m "feat(comms): merge SP-6.2 SMS service"
git merge feat/SP-7.1-subdomain-check --no-ff -m "feat(enterprise): merge SP-7.1 subdomain check"
git merge feat/SP-7.2-custom-domain --no-ff -m "feat(enterprise): merge SP-7.2 custom domain verification"
git merge feat/SP-7.3-license-management --no-ff -m "feat(enterprise): merge SP-7.3 license management"
git merge feat/SP-7.4-security-settings --no-ff -m "feat(enterprise): merge SP-7.4 security settings"
git merge docs/SP-C.3-opensource-references --no-ff -m "docs(admin): merge SP-C.3 open-source references"
git merge recover-sp-7.5 --no-ff -m "feat(enterprise): merge SP-7.5 advanced audit export"
```

**Step 3: Resolve conflicts nếu có**

Nếu conflict xảy ra, ưu tiên:
- Giữ code từ branch feature (chứa implementation mới).
- Nếu cả 2 bên đều sửa cùng file, kiểm tra manual và giữ phần hợp lý.
- Không giữ artifacts `Plan/` nếu đã có file thực tế ở vị trí đúng.

**Step 4: Verify branch list**

Run:
```bash
git log --oneline --graph --decorate -20
```

Expected: Thấy các commit merge nối tiếp.

---

### Task 3: Di chuyển artifacts từ Plan/ sang đúng vị trí

**Objective:** Đảm bảo các file trong `Plan/EdgeFunction/` và `Plan/Migration/` được chuyển vào `supabase/functions/` và `supabase/migrations/` nếu chưa có.

**Files:**
- Kiểm tra: `Plan/EdgeFunction/*.ts`
- Kiểm tra: `Plan/Migration/*.sql`
- Tạo/Sửa: `supabase/functions/<name>/index.ts`
- Tạo/Sửa: `supabase/migrations/<timestamp>_<name>.sql`

**Step 1: Liệt kê artifacts cần xử lý**

Run:
```bash
git ls-tree HEAD Plan/EdgeFunction/ Plan/Migration/
```

Expected: Danh sách file artifacts.

**Step 2: Di chuyển edge function artifacts**

Với mỗi file `Plan/EdgeFunction/<name>.ts` chưa có `supabase/functions/<name>/index.ts`:
- Tạo thư mục `supabase/functions/<name>/`
- Copy nội dung sang `supabase/functions/<name>/index.ts`
- Kiểm tra import path (ví dụ `../_shared/...` đúng)

Cụ thể:
- `Plan/EdgeFunction/send-sms.ts` → `supabase/functions/send-sms/index.ts`
- `Plan/EdgeFunction/verify-domain.ts` → `supabase/functions/verify-domain/index.ts`
- `Plan/EdgeFunction/db-maintenance.ts` → `supabase/functions/db-maintenance/index.ts`
- `Plan/EdgeFunction/webhook-delivery.ts` → `supabase/functions/webhook-delivery/index.ts` (nếu chưa có)

**Step 3: Di chuyển migration artifacts**

Với mỗi file `Plan/Migration/<timestamp>_<name>.sql` chưa có trong `supabase/migrations/`:
- Copy sang `supabase/migrations/<timestamp>_<name>.sql`

Cụ thể:
- `Plan/Migration/20260718000000_phase6_3_support_ticket_sla.sql`
- `Plan/Migration/20260718000001_sp_7_1_set_tenant_subdomain.sql`
- `Plan/Migration/20260719000001_sp_7_2_custom_domain_verification.sql`
- `Plan/Migration/20260720000001_sp_7_3_licenses.sql`
- `Plan/Migration/20260728000000_sp5_6_db_maintenance.sql`
- (và các migration khác chưa có)

**Step 4: Verify**

Run:
```bash
find_file_by_name pattern supabase/functions/*sms*
find_file_by_name pattern supabase/functions/*verify-domain*
find_file_by_name pattern supabase/migrations/20260720000001_sp_7_3_licenses.sql
```

Expected: Các file đã tồn tại.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore(admin): move Plan/ artifacts to supabase/functions and supabase/migrations"
```

---

### Task 4: Hoàn thiện `pages/admin/TenantDetail.tsx`

**Objective:** Thay thế placeholder bằng tích hợp các panel subdomain, custom domain, license.

**Files:**
- Modify: `pages/admin/TenantDetail.tsx`
- Read: `components/admin/SubdomainManagerPanel.tsx`
- Read: `components/admin/CustomDomainPanel.tsx`
- Read: `components/admin/LicenseManagerPanel.tsx`

**Step 1: Kiểm tra các panel đã tồn tại**

Run:
```bash
find_file_by_name pattern components/admin/SubdomainManagerPanel.tsx
find_file_by_name pattern components/admin/CustomDomainPanel.tsx
find_file_by_name pattern components/admin/LicenseManagerPanel.tsx
```

Expected: Cả 3 file đều tồn tại sau khi merge.

**Step 2: Viết test cho TenantDetail**

Create: `tests/admin-dashboard/TenantDetail.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import TenantDetail from '../../pages/admin/TenantDetail';

// ... test stub
```

Run:
```bash
npx vitest run tests/admin-dashboard/TenantDetail.test.tsx
```

Expected: FAIL (placeholder chưa render panel).

**Step 3: Implement TenantDetail**

Modify `pages/admin/TenantDetail.tsx`:

```tsx
import { useParams } from 'react-router-dom';
import SubdomainManagerPanel from '../../components/admin/SubdomainManagerPanel';
import CustomDomainPanel from '../../components/admin/CustomDomainPanel';
import LicenseManagerPanel from '../../components/admin/LicenseManagerPanel';

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <div>Missing tenant id</div>;
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">Tenant Detail</h1>
      <SubdomainManagerPanel tenantId={id} />
      <CustomDomainPanel tenantId={id} />
      <LicenseManagerPanel tenantId={id} />
    </div>
  );
}
```

**Step 4: Verify test pass**

Run:
```bash
npx vitest run tests/admin-dashboard/TenantDetail.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add pages/admin/TenantDetail.tsx tests/admin-dashboard/TenantDetail.test.tsx
git commit -m "feat(admin): integrate subdomain, custom domain, license panels into TenantDetail"
```

---

### Task 5: Chạy full verification pipeline

**Objective:** Đảm bảo không có regression.

**Step 1: Lint**

Run:
```bash
npm run lint
```

Expected: exit 0.

**Step 2: Tests**

Run:
```bash
npx vitest run
```

Expected: all pass.

**Step 3: Build**

Run:
```bash
npm run build
```

Expected: production build success.

**Step 4: RPC audit**

Run:
```bash
npm run audit:rpc
```

Expected: RPC contracts and service code in sync.

**Step 5: Commit nếu cần**

Nếu không có thay đổi, không cần commit. Nếu có file được tạo (ví dụ `dist/`), không commit `dist/`.

---

### Task 6: Dọn dẹp console.log và TODO

**Objective:** Loại bỏ log/debug/TODO trong production code.

**Files:**
- Modify: `supabase/functions/delete-tenant/index.ts`
- Modify: `supabase/functions/billing-webhooks/index.ts`
- Modify: `supabase/functions/system-backup/index.ts`

**Step 1: Tìm console.log và TODO**

Run:
```bash
grep -n "console.log\|TODO" supabase/functions/delete-tenant/index.ts supabase/functions/billing-webhooks/index.ts supabase/functions/system-backup/index.ts
```

**Step 2: Thay thế console.log**

Trong `delete-tenant/index.ts` và `system-backup/index.ts`:
- Thay `console.log` bằng `console.error` cho lỗi, hoặc xóa nếu không cần.

Trong `billing-webhooks/index.ts`:
- Hoàn thiện `TODO: verify signature with crypto.subtle + STRIPE_WEBHOOK_SECRET` hoặc tạo task follow-up.

**Step 3: Verify**

Run:
```bash
grep -rn "console.log\|TODO" supabase/functions/
```

Expected: Không còn console.log/TODO trong production edge functions (trừ `audit-rpc-contracts.ts`).

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(admin): clean up console.log and TODO in edge functions"
```

---

### Task 7: Cập nhật `PLAN_AdminDashboard_SubPhases.md` status

**Objective:** Sửa status cho khớp với thực tế trên master.

**Files:**
- Modify: `Plan/PLAN_AdminDashboard_SubPhases.md`

**Step 1: Sửa status**

- SP-6.2: `Pending` → `Done`
- SP-7.1: `Done` → `Done` (nếu đã merge đúng)
- SP-7.3: `Pending` → `Done`
- SP-7.5: thêm dòng hoặc đổi status thành `Done`
- SP-C.3: `Pending` → `Done`

**Step 2: Verify**

Run:
```bash
grep -n "| SP-6.2 \| SP-7.3 \| SP-C.3" Plan/PLAN_AdminDashboard_SubPhases.md
```

Expected: Status đã cập nhật.

**Step 3: Commit**

```bash
git add Plan/PLAN_AdminDashboard_SubPhases.md
git commit -m "docs(plan): update sub-phase status after merge"
```

---

### Task 8: Final review và push preparation

**Objective:** Đảm bảo sẵn sàng push.

**Step 1: Kiểm tra git status**

Run:
```bash
git status --short
git log --oneline -10
```

Expected: Clean, các commit rõ ràng.

**Step 2: Kiểm tra lại các file quan trọng**

Run:
```bash
find_file_by_name pattern services/admin/smsService.ts
find_file_by_name pattern services/admin/licenseService.ts
find_file_by_name pattern components/admin/CustomDomainPanel.tsx
find_file_by_name pattern docs/opensource-references.md
```

Expected: Tất cả đều tồn tại.

**Step 3: Ghi chú cho người dùng**

Không push trong plan này. Chỉ báo cáo sẵn sàng.

---

## Tests / Validation

- `npm run lint`
- `npx vitest run`
- `npm run build`
- `npm run audit:rpc`
- Smoke test các trang admin mới (nếu có dev server).

## Risks, Tradeoffs, and Open Questions

| Risk | Mitigation |
|------|------------|
| Merge conflict nghiêm trọng giữa các branch | Resolve từng bước, ưu tiên code implementation, xóa artifacts trùng |
| Commit orphan SP-7.5/SP-C.3 bị garbage collected | Khôi phục ngay bằng recovery branch |
| Migration timestamp trùng lặp | Kiểm tra thứ tự, rename nếu cần |
| Edge function import path sai sau khi di chuyển | Review và chạy `deno check` nếu có |
| Tests bị fail sau merge | Chạy từng file test, fix theo TDD |

---

**Open Questions:**
1. Có nên dùng `git merge --no-ff` hay `git rebase` để tích hợp các branch?
2. Có nên xóa thư mục `Plan/EdgeFunction/` và `Plan/Migration/` sau khi di chuyển xong?
3. Có cần chạy `supabase migration up` trên local để verify schema không?

---

**Plan complete and saved.**
