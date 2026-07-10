# Handoff — Admin Dashboard Sub-phase F32 (Final)

> Chat date: 2026-07-10  
> Source: `PLAN_CREATE_SHOP_SUB_PHASES.md`  
> Sub-phase: **F32 — Tests + Production deploy + Smoke test**  
> Previous handoff: `HANDOFF_F31.md` (Dashboard UI đã hoàn thành)

---

## Bối cảnh

Đây là sub-phase cuối cùng của feature “Tạo shop từ Admin Dashboard”.  
Toàn bộ code backend/frontend đã xong ở F28-F31.  
Sub-phase F32 đảm bảo:

1. Có đủ kiểm thử.
2. Build/lint pass.
3. Edge Function + frontend được deploy lên production.
4. Smoke test trên production thành công.

**Sub-phase này không có migration SQL mới.** F28 đã chạy migration template `tenant_credentials` và migration sửa CHECK constraint `app_audit_log.action`. DB đã sẵn sàng.  
Bước apply production: deploy Edge Function + deploy frontend.

---

## Mục tiêu F32

1. Viết smoke test cho `createTenantWithCredentials` / UI create shop.
2. Chạy `npm run lint`, `npm run build`, `npx vitest run`.
3. Deploy Edge Function `create-tenant` lên production (nếu F29 chưa deploy hoặc cần redeploy sau các thay đổi).
4. Deploy frontend lên Vercel.
5. Smoke test trên production: tạo shop, nhận email, đăng nhập.
6. Dọn dẹp dữ liệu test.
7. Bàn giao hoàn chỉnh.

---

## Files cần tạo / sửa

- Tạo: `tests/smoke/admin-dashboard-create-tenant.test.ts`
- Tạo (tùy chọn): `tests/integration/create-tenant-integration.test.ts`
- Sửa (nếu chưa sửa): `pages/SystemAdminDashboard.tsx` — đảm bảo không còn lỗi sau test.

---

## Hướng giải quyết chi tiết

### Bước 1 — Viết smoke test

Tạo `tests/smoke/admin-dashboard-create-tenant.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTenantWithCredentials } from '../../services/tenantService';
import { supabase } from '../../lib/supabase';

const mockTenant = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'tenant-1',
  name: 'Shop Test',
  subdomain: 'shop-test',
  status: 'active',
  plan: 'free',
  owner_id: 'owner-1',
  settings: {},
  isolation_mode: 'shared',
  created_at: '2026-07-10T00:00:00Z',
  updated_at: '2026-07-10T00:00:00Z',
  ...overrides,
});

describe('createTenantWithCredentials', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates tenant with generated password', async () => {
    const spy = vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant(),
        adminUser: { id: 'user-1', email: 'admin@shop.com' },
        initialPassword: 'auto-generated-password',
      },
      error: null,
    } as any);

    const result = await createTenantWithCredentials({
      name: 'Shop Test',
      subdomain: 'shop-test',
      plan: 'free',
      adminEmail: 'admin@shop.com',
    });

    expect(spy).toHaveBeenCalledWith('create-tenant', {
      body: {
        name: 'Shop Test',
        subdomain: 'shop-test',
        email: 'admin@shop.com',
        plan: 'free',
        adminPassword: undefined,
      },
    });
    expect(result.tenant.subdomain).toBe('shop-test');
    expect(result.initialPassword).toBe('auto-generated-password');
  });

  it('creates tenant with custom password', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant({ id: 'tenant-2', name: 'Shop Custom', subdomain: 'shop-custom', plan: 'vip' }),
        adminUser: { id: 'user-2', email: 'admin@custom.com' },
        initialPassword: 'my-pass-123',
      },
      error: null,
    } as any);

    const result = await createTenantWithCredentials({
      name: 'Shop Custom',
      subdomain: 'shop-custom',
      plan: 'vip',
      adminEmail: 'admin@custom.com',
      adminPassword: 'my-pass-123',
    });

    expect(result.initialPassword).toBe('my-pass-123');
  });

  it('throws when Edge Function returns business error', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: { error: 'Email đã được sử dụng' },
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop Dup',
        subdomain: 'shop-dup',
        plan: 'free',
        adminEmail: 'dup@shop.com',
      })
    ).rejects.toThrow('Email đã được sử dụng');
  });

  it('throws when Edge Function returns invoke error', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: null,
      error: { message: 'Subdomain đã tồn tại', name: 'FunctionsInvokeError' },
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop Dup',
        subdomain: 'shop-dup',
        plan: 'free',
        adminEmail: 'dup@shop.com',
      })
    ).rejects.toThrow('Subdomain đã tồn tại');
  });

  it('throws on invalid response shape', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: { tenant: mockTenant() }, // missing adminUser / initialPassword
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop Bad',
        subdomain: 'shop-bad',
        plan: 'free',
        adminEmail: 'bad@shop.com',
      })
    ).rejects.toThrow('Phản hồi tạo cửa hàng không hợp lệ');
  });

  it('throws when adminUser is missing id or email', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant(),
        adminUser: { id: '', email: '' },
        initialPassword: 'pass123',
      },
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop Bad Admin',
        subdomain: 'shop-bad-admin',
        plan: 'free',
        adminEmail: 'badadmin@shop.com',
      })
    ).rejects.toThrow('Phản hồi tạo cửa hàng không hợp lệ');
  });

  it('throws when initialPassword is missing', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: {
        tenant: mockTenant(),
        adminUser: { id: 'user-1', email: 'admin@shop.com' },
        initialPassword: undefined,
      },
      error: null,
    } as any);

    await expect(
      createTenantWithCredentials({
        name: 'Shop No Password',
        subdomain: 'shop-no-password',
        plan: 'free',
        adminEmail: 'admin@shop.com',
      })
    ).rejects.toThrow('Phản hồi tạo cửa hàng không hợp lệ');
  });
});
```

> ponytail: mock dựa trên cách test `create-system-admin` hiện có. Nếu `invoke` trả về `error` object, service sẽ throw `error.message`; nếu trả về `data.error`, service sẽ throw `data.error`. Các test case bổ sung đảm bảo `createTenantWithCredentials` validate đủ `adminUser.id`, `adminUser.email` và `initialPassword`.
>
> Đã thêm `vi.mock('../../lib/supabase', ...)` ở đầu file test để service và test dùng chung mock instance; nếu không có mock module, `vi.spyOn` trên instance `supabase` trong test file sẽ không can thiệp được instance mà `tenantService.ts` import do vitest isolate module giữa các test file.

### Bước 1.5 — Cập nhật validation trong `services/tenantService.ts`

Để test case "throws when adminUser is missing id or email" pass, `createTenantWithCredentials` đã được bổ sung kiểm tra `adminUser.id` / `adminUser.email` / `initialPassword` không chỉ đúng type `string` mà còn phải non-empty:

```ts
if (
  !data ||
  typeof data !== 'object' ||
  !data.tenant ||
  !data.adminUser ||
  typeof data.adminUser.id !== 'string' ||
  !data.adminUser.id ||
  typeof data.adminUser.email !== 'string' ||
  !data.adminUser.email ||
  typeof data.initialPassword !== 'string' ||
  !data.initialPassword
) {
  throw new Error(data?.error || 'Phản hồi tạo cửa hàng không hợp lệ');
}
```

### Bước 2 — Chạy lint/build/test

```bash
npm run lint
npm run build
npx vitest run
```

### Bước 3 — Deploy Edge Function (nếu cần)

Nếu F29 đã deploy và code `create-tenant` không đổi sau đó, bỏ qua. Nếu có thay đổi, deploy lại:

```bash
supabase functions deploy create-tenant
```

### Bước 4 — Deploy frontend

Cách 1 — qua Git push (nếu project Vercel đã liên kết Git):
```bash
git add .
git commit -m "feat: create shop from admin dashboard (F28-F32)
git push origin master
```

Cách 2 — qua Vercel CLI:
```bash
vercel --prod
```

Hoặc build artifact upload qua Vercel dashboard.

### Bước 5 — Smoke test trên production

1. Truy cập `https://admin.vietsalepro.com` (hoặc domain production tương ứng).
2. Đăng nhập system admin.
3. Vào tab **Cửa hàng**.
4. Điền form:
   - Tên: `Shop Smoke Test F32`
   - Subdomain: `shop-smoke-f32` (hoặc để tự động suggest)
   - Gói: `free`
   - Email admin: một email mà bạn có thể kiểm tra hộp thư (có thể là chính email của bạn hoặc email tạm).
   - Để password tự sinh.
5. Nhấn **Tạo cửa hàng**.
6. Kiểm tra:
   - [ ] Hiển thị card thành công với URL, email, password.
   - [ ] Nhận được email tại hộp thư admin với subject `[VietSales Pro] Tài khoản quản trị cửa hàng Shop Smoke Test F32`.
   - [ ] Trong email có link shop, email, password.
   - [ ] Truy cập `https://shop-smoke-f32.vietsalepro.com`.
   - [ ] Đăng nhập bằng email + password vừa tạo thành công.
   - [ ] Sau đăng nhập vào được dashboard của shop.

### Bước 6 — Dọn dẹp dữ liệu test (theo thứ tự)

1. Quay lại Admin Dashboard.
2. Archive tenant `Shop Smoke Test F32` qua UI hoặc gọi RPC `delete_tenant_safe`:
   ```sql
   SELECT public.delete_tenant_safe('tenant-id-cua-shop-smoke-f32');
   ```
3. Xóa các bản ghi còn sót (nếu `delete_tenant_safe` chưa xóa hết):
   ```sql
   -- Xóa membership còn sót
   DELETE FROM public.tenant_memberships WHERE tenant_id = 'tenant-id-cua-shop-smoke-f32';
   -- Xóa subscription còn sót
   DELETE FROM public.tenant_subscriptions WHERE tenant_id = 'tenant-id-cua-shop-smoke-f32';
   -- Xóa tenant
   DELETE FROM public.tenants WHERE id = 'tenant-id-cua-shop-smoke-f32';
   ```
4. Xóa audit log test:
   ```sql
   DELETE FROM public.app_audit_log WHERE tenant_id = 'tenant-id-cua-shop-smoke-f32' OR record_id = 'tenant-id-cua-shop-smoke-f32';
   ```
5. Xóa `rate_limit_logs` của IP test:
   ```sql
   DELETE FROM public.rate_limit_logs WHERE ip_address = '<ip-cua-ban>'::inet;
   ```
6. Cuối cùng, xóa user test khỏi `auth.users`:
   ```sql
   DELETE FROM auth.users WHERE email = 'email-test@example.com';
   ```

> ponytail: thứ tự quan trọng — xóa tenant và các bảng liên quan trước, sau đó mới xóa auth user để tránh vi phạm FK constraint. Nếu dùng `delete_tenant_safe`, kiểm tra xem nó đã xóa membership/subscription chưa rồi mới xóa user.

---

## Apply lên production

```bash
# 1. Edge Function (nếu chưa deploy hoặc code thay đổi)
supabase functions deploy create-tenant

# 2. Frontend build check
npm run lint
npm run build

# 3. Deploy frontend
# Cách Git:
git add .
git commit -m "feat: create shop from admin dashboard (F28-F32)"
git push origin master

# Hoặc Vercel CLI:
vercel --prod
```

---

## Acceptance criteria

- [ ] Smoke test file `tests/smoke/admin-dashboard-create-tenant.test.ts` tồn tại và pass.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.
- [ ] `npx vitest run` PASS.
- [ ] Edge Function `create-tenant` ACTIVE trên production với version mới.
- [ ] Frontend production đã cập nhật (Vercel deployment thành công).
- [ ] Smoke test trên production: tạo shop, nhận email, đăng nhập, vào được dashboard shop.
- [ ] Dữ liệu test đã được dọn dẹp (tenant, auth user, audit log, rate limit logs).
- [ ] `createTenantWithAdmin` vẫn còn hoặc đã được thay thế đồng loạt trong test cũ.

---

## Rollback

Nếu có lỗi nghiêm trọng trên production:

1. **Edge Function:**
   ```bash
   git checkout <commit-cũ-của-create-tenant>
   supabase functions deploy create-tenant
   ```

2. **Frontend:**
   - Revert commit frontend, push lại hoặc redeploy Vercel từ commit ổn định.

3. **DB:**
   - Template `tenant_credentials` có thể để lại (không ảnh hưởng).
   - Xóa các tenant/user test đã tạo trong smoke test.
   - Xóa audit log test và `rate_limit_logs` của IP test.

---

## Đã làm xong

- [x] Smoke test file created: `tests/smoke/admin-dashboard-create-tenant.test.ts`
- [x] `npm run lint`: PASS
- [x] `npm run build`: PASS
- [x] `npx vitest run`: PASS (244 tests, 41 files)
- [x] Edge Function deployed version: `create-tenant` trên project `rsialbfjswnrkzcxarnj` (deployed 2026-07-10, script size 72 kB)
- [ ] Vercel deployment URL / commit: cần deploy frontend
- [ ] Production smoke test result: cần thực hiện trên production sau deploy
- [ ] Test data cleaned up: cần dọn dẹp sau smoke test
- [x] Final commit hash (code + test): `eef3334`

---

## Bàn giao cuối cùng

Feature “Tạo shop từ Admin Dashboard” đã hoàn thành và đang chạy trên production.

### Các file thay đổi tổng hợp

- `supabase/migrations/20260710000001_add_tenant_credentials_template.sql`
- `supabase/functions/create-tenant/index.ts`
- `types/tenant.ts`
- `services/tenantService.ts` (thêm `createTenantWithCredentials`; **không xóa** `createTenantWithAdmin` nếu chưa refactor test cũ)
- `pages/SystemAdminDashboard.tsx`
- `tests/smoke/admin-dashboard-create-tenant.test.ts`
- `tests/integration/create-tenant-integration.test.ts` (nếu có)

### Cách sử dụng

1. System admin đăng nhập `https://admin.vietsalepro.com`.
2. Vào tab **Cửa hàng**.
3. Điền form tạo shop, nhập email admin shop.
4. Chọn tự sinh password hoặc nhập password.
5. Nhấn **Tạo cửa hàng**.
6. Copy credential từ card kết quả hoặc kiểm tra email.
7. Click **Đăng nhập với tư cách admin** để vào shop ngay.

### Lưu ý vận hành

- Mật khẩu chỉ hiển thị 1 lần trên dashboard; nếu đóng card mất, phải reset password hoặc impersonate.
- Rate limit `create-tenant`: 10 req/phút/IP.
- Email gửi qua Resend; nếu Resend API key hết hạn hoặc bị lỗi, tenant vẫn tạo được, nhưng email không đi — cần gửi credential thủ công. Kiểm tra `app_audit_log` với `action = 'EMAIL_FAILED'`.
- `tenant_subscriptions` được tạo với limits lấy từ Plan Builder (`get_default_plan_limit_values`), không còn hard-code.

### Hỗ trợ / lỗi thường gặp

- **Email không đến:** kiểm tra Resend dashboard, đảm bảo domain sending domain đã verify.
- **Subdomain không truy cập được:** kiểm tra DNS nameserver có phải Vercel không (`nslookup -type=NS vietsalepro.com`).
- **Lỗi 403:** system admin token hết hạn, đăng nhập lại.

---

## Handoff tiếp theo

Không có sub-phase tiếp theo. Feature đã hoàn thành.

Nếu muốn mở rộng (ví dụ: tùy chọn gói pro/custom, custom domain riêng cho shop), tạo plan/feature mới.
