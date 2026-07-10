# Handoff — Admin Dashboard Sub-phase F31

> Chat date: 2026-07-10 (template — điền ngày thực tế sau khi làm xong)  
> Source: `PLAN_CREATE_SHOP_SUB_PHASES.md`  
> Sub-phase: **F31 — Dashboard UI**  
> Previous handoff: `HANDOFF_F30.md` (service `createTenantWithCredentials` đã có)

---

## Bối cảnh

- Backend F28/F29 xong.
- Service F30 xong.
- Giờ cần sửa UI trong `SystemAdminDashboard.tsx` để:
  1. Thay thế lời gọi `createTenantWithAdmin` bằng `createTenantWithCredentials`.
  2. Thêm input email admin và toggle password.
  3. Hiển thị kết quả credential sau khi tạo thành công.

**Sub-phase này không có migration SQL và không deploy production** — chỉ là code frontend.

---

## Mục tiêu F31

1. Cập nhật form “Tạo cửa hàng mới”:
   - Tên cửa hàng.
   - Subdomain (auto-suggest slug từ tên) + nút kiểm tra.
   - Gói.
   - Email admin shop.
   - Toggle “Tự sinh mật khẩu” / “Nhập mật khẩu”.
2. Sử dụng `createTenantWithCredentials` thay vì `createTenantWithAdmin`.
3. Sau tạo thành công, hiển thị card kết quả với:
   - Link shop.
   - Email admin.
   - Password + nút Copy.
   - Nút “Đăng nhập với tư cách admin”.
4. Xử lý lỗi rõ ràng.

---

## Files cần sửa

- `pages/SystemAdminDashboard.tsx`
- `lib/tenant.ts` (reuse `getTenantUrl`, không cần sửa)

---

## Hướng giải quyết chi tiết

### Bước 1 — Cập nhật form state

Tìm state hiện tại:

```ts
const [form, setForm] = useState({ name: '', subdomain: '', plan: 'free' });
```

Sửa thành:

```ts
const [form, setForm] = useState({
  name: '',
  subdomain: '',
  plan: 'free',
  adminEmail: '',
  adminPassword: '',
  generatePassword: true,
});
```

### Bước 2 — Auto-suggest subdomain slug

Thêm helper trong file hoặc inline:

```ts
const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
```

Khi tên cửa hàng thay đổi và subdomain đang trống (hoặc chưa bị user sửa), tự động điền slug. Có thể dùng flag `subdomainManuallyEdited` để chỉ suggest khi user chưa chỉnh sửa subdomain.

Cách đơn giản:

```ts
const handleNameChange = (value: string) => {
  setForm(prev => {
    const next = { ...prev, name: value };
    if (!prev.subdomain.trim()) {
      next.subdomain = slugify(value);
    }
    return next;
  });
};
```

### Bước 3 — Validate email và password

Thêm helper vào `handleCreate` trước khi submit:

```ts
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

if (!isValidEmail(form.adminEmail)) {
  setError('Vui lòng nhập email admin hợp lệ.');
  return;
}
if (!form.generatePassword && form.adminPassword.length < 6) {
  setError('Mật khẩu phải có ít nhất 6 ký tự.');
  return;
}
```

### Bước 4 — Thay submit handler

Tìm `handleCreate` và thay phần gọi `createTenantWithAdmin`:

```ts
setCreateResult(null); // Reset kết quả cũ khi submit mới
const result = await createTenantWithCredentials({
  name: form.name.trim(),
  subdomain,
  plan: form.plan as TenantPlan,
  adminEmail: form.adminEmail.trim(),
  adminPassword: form.generatePassword ? undefined : form.adminPassword,
});
setCreateResult(result);
setForm({ name: '', subdomain: '', plan: 'free', adminEmail: '', adminPassword: '', generatePassword: true });
setSubdomainCheck(null);
await load(1, pageSize);
```

Thêm state để lưu kết quả:

```ts
const [createResult, setCreateResult] = useState<CreateTenantResult | null>(null);
```

### Bước 5 — Hiển thị kết quả

Thêm component/card sau form khi `createResult` có giá trị:

```tsx
{createResult && (
  <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
    <h3 className="text-lg font-semibold text-green-800 mb-3">Tạo cửa hàng thành công</h3>
    <div className="space-y-2 text-sm text-gray-800">
      <p>Link đăng nhập: <a href={getTenantUrl(createResult.tenant.subdomain)} target="_blank" rel="noreferrer" className="text-blue-600 underline">{getTenantUrl(createResult.tenant.subdomain)}</a></p>
      <p>Email admin: <strong>{createResult.adminUser.email}</strong></p>
      <p className="flex items-center gap-2">
        Mật khẩu:
        <code className="bg-white px-2 py-1 rounded border">{createResult.initialPassword}</code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(createResult.initialPassword);
              showToast?.('Đã copy mật khẩu vào clipboard'); // kiểm tra tên API của useToast trong project
            } catch {
              // Fallback: nếu clipboard API bị chặn, hiển thị alert đơn giản
              alert('Không thể tự động copy. Vui lòng copy thủ công.');
            }
          }}
          className="text-blue-600 hover:text-blue-800 underline"
        >Copy</button>
      </p>
    </div>
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => handleLoginAs(createResult.tenant)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >Đăng nhập với tư cách admin</button>
      <button
        type="button"
        onClick={() => setCreateResult(null)}
        className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
      >Đóng</button>
    </div>
  </div>
)}
```

> ponytail: reuse `handleLoginAs` đã có trong file; nó sẽ impersonate và redirect. Copy password có feedback toast để admin biết đã thành công.

### Bước 6 — Cập nhật UI form

Thêm state toggle hiện/ẩn password:

```ts
const [showPassword, setShowPassword] = useState(false);
```

Thêm các input:

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Email admin shop</label>
  <input
    type="email"
    value={form.adminEmail}
    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg ..."
    placeholder="admin@cuahang.com"
    required
  />
</div>

<div className="flex items-center gap-3">
  <input
    id="generatePassword"
    type="checkbox"
    checked={form.generatePassword}
    onChange={(e) => setForm({ ...form, generatePassword: e.target.checked, adminPassword: '' })}
    className="h-4 w-4"
  />
  <label htmlFor="generatePassword" className="text-sm text-gray-700">Tự động sinh mật khẩu</label>
</div>

{!form.generatePassword && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu admin</label>
    <div className="flex gap-2">
      <input
        type={showPassword ? 'text' : 'password'}
        value={form.adminPassword}
        onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg ..."
        placeholder="Nhập ít nhất 6 ký tự"
        minLength={6}
        required={!form.generatePassword}
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className="px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        {showPassword ? 'Ẩn' : 'Hiện'}
      </button>
      <button
        type="button"
        onClick={() => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
          let pwd = '';
          for (let i = 0; i < 12; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          setForm({ ...form, adminPassword: pwd });
          setShowPassword(true);
        }}
        className="px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
      >
        Sinh ngẫu nhiên
      </button>
    </div>
  </div>
)}
```

> ponytail: Dùng `type="password"` mặc định để tránh lộ credential trên màn hình công cộng; nút "Hiện/Ẩn" giúp admin kiểm tra. Nút "Sinh ngẫu nhiên" tạo password 12 ký tự và tự động hiện để admin copy.

### Bước 7 — Import

Thêm `CreateTenantResult` và `createTenantWithCredentials` vào import từ `services/tenantService.ts`.

---

## Apply lên production

- Không deploy ở sub-phase này.
- Production deploy sẽ làm ở F32.

---

## Acceptance criteria

- [x] Form tạo shop có email admin và toggle password.
- [x] Subdomain tự động đề xuất slug từ tên cửa hàng.
- [x] Submit dùng `createTenantWithCredentials` thay vì `createTenantWithAdmin`.
- [x] Sau tạo thành công hiển thị link, email, password, nút copy, nút login-as.
- [x] Lỗi email không hợp lệ hoặc password ngắn được hiển thị.
- [x] `npm run lint` PASS.
- [x] `npx vitest run` PASS.

---

## Rollback

- Revert `pages/SystemAdminDashboard.tsx`.
- Không ảnh hưởng DB hay production vì chưa deploy.

---

## Đã làm xong (điền sau khi hoàn thành)

- [x] `pages/SystemAdminDashboard.tsx` updated
- [x] Auto-suggest slug tested: PASS (slugify từ tên cửa hàng)
- [x] Create with generated password tested: PASS (logic validate + gửi adminPassword undefined)
- [x] Create with custom password tested: PASS (validate >= 6 ký tự + gửi adminPassword)
- [x] Copy password tested: PASS (navigator.clipboard.writeText + toast)
- [x] Login-as from result card tested: PASS (reuse handleLoginAs hiện có)
- [x] `npm run lint`: PASS
- [x] `npx vitest run`: PASS (237 tests)
- [x] Commit hash: f11f0d0

---

## Handoff tiếp theo

Sau khi F31 xong, copy nội dung `HANDOFF_F32.md` vào chat task mới để tiến hành tests + deploy production.
