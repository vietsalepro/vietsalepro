# Plan: Fix AdminDashboardInner `toLocaleString` crash

## Context
Production admin dashboard crashes with:

```
TypeError: Cannot read properties of undefined (reading 'toLocaleString')
    at AdminDashboardInner-BjGd0QZb.js:10:77955
    at Array.map (<anonymous>)
```

## Root cause
`pages/admin/AdminDashboardInner.tsx:496` renders:

```tsx
<td className="px-6 py-4 text-sm text-gray-700">{t.ordersThisMonth.toLocaleString()}</td>
```

inside `topTenants.map(...)`. When `ordersThisMonth` is `undefined`, React crashes the whole dashboard.

## Steps

### 1. RED — Viết regression test
- Tạo file mới: `tests/admin-dashboard/AdminDashboardInner.test.tsx`
- Mock:
  - `../../lib/supabase`
  - `../../services/admin/tenantAdminService` (override `getTopTenants`, `getTenantGrowth`)
  - `../../services/admin/systemAdminService` (override `getSystemOverview`)
  - `../../services/admin/auditAdminService` (override `getRateLimitLogs`, `getAdminLoginHistory`, `getAdminLoginAlerts`)
- Render `<AdminDashboardInner activeTab="overview" />` với `getTopTenants` trả về:

```ts
{
  data: [
    {
      id: 't-1',
      name: 'Store A',
      subdomain: 'store-a',
      status: 'active',
      plan: 'free',
      ordersThisMonth: undefined,
      userCount: 0,
      productCount: 0,
    },
  ],
  count: 1,
}
```

- Assert: render không throw, và cell hiển thị `0`.
- Chạy test → expect **RED** (crash).

```bash
npx vitest run tests/admin-dashboard/AdminDashboardInner.test.tsx
```

### 2. GREEN — Apply minimal fix
- File: `pages/admin/AdminDashboardInner.tsx:496`
- Thay:

```tsx
<td className="px-6 py-4 text-sm text-gray-700">{t.ordersThisMonth.toLocaleString()}</td>
```

bằng:

```tsx
<td className="px-6 py-4 text-sm text-gray-700">{(t.ordersThisMonth ?? 0).toLocaleString()}</td>
```

- Chạy lại test → expect **GREEN**.

### 3. Regression check
- Chạy full test suite:

```bash
npx vitest run
```

- Fix bất kỳ failure mới nào (nếu có).

### 4. Lint / typecheck
```bash
npx tsc --noEmit
npx eslint pages/admin/AdminDashboardInner.tsx tests/admin-dashboard/AdminDashboardInner.test.tsx
```

### 5. Pre-commit review
- Dùng skill `requesting-code-review` để verify diff trước khi commit.

### Commit message đề xuất
```
fix(admin): guard undefined ordersThisMonth in top tenants table
```

## Notes
- Chỉ sửa 1 dòng render + thêm 1 test file.
- Không refactor code liên quan khác.
- Nếu muốn tái sử dụng, có thể tách helper nhỏ `formatNumber` sau bước GREEN.
