# Phase 4 — Verify & khắc phục lỗi phụ UI / routing / realtime

**Mục tiêu:** Đảm bảo admin dashboard chạy mượt trên production sau khi RPC đã deploy, đồng thời xử lý các warning/lỗi phụ trong console.

**Ưu tiên:** Trung bình — làm sau khi Phase 3 hoàn thành.

---

## 1. Verify các RPC chính trên production

### 1.1 Test thủ công từ browser

1. Mở `https://admin.vietsalepro.com`.
2. Đăng nhập bằng system admin.
3. Nhấn `Ctrl + Shift + R` để hard refresh.
4. Mở DevTools → Network, kiểm tra không còn lỗi:
   - 404 với `get_top_tenants`
   - 404 với `get_current_user_tenants`
   - 404 với `get_tenants_admin`
   - 404 với `search_tenant_members`

### 1.2 Kiểm tra từng tab

- [ ] Tab **Tổng quan**: hiển thị KPI cards, top tenants, biểu đồ tăng trưởng.
- [ ] Tab **Cửa hàng / Tenants**: danh sách tenants load được, phân trang hoạt động.
- [ ] Tab **Thành viên / Members**: danh sách members load được, search/filter hoạt động.
- [ ] Tab **Audit log / GDPR**: nếu user là system admin thì không còn 403.

---

## 2. Lỗi phụ cần xử lý

### 2.1 `get_gdpr_requests` 403

**Nguyên nhân:** Function chỉ cho phép system admin. Nếu user hiện tại không phải system admin sẽ bị 403.

**Cách fix:**

1. Đảm bảo migration `20260716000002_gdpr_export_functions.sql` đã deploy (kiểm tra trong SQL Editor).
2. Kiểm tra user đăng nhập có role system admin:
   ```sql
   SELECT public.is_system_admin();
   ```
3. Nếu user không phải system admin, UI nên ẩn menu GDPR hoặc hiển thị thông báo.

**Files liên quan:**
- `services/admin/complianceAdminService.ts`
- `pages/admin/ComplianceManager.tsx`
- `components/AdminSidebar.tsx` hoặc nơi render menu GDPR

### 2.2 `audit-log` Edge Function 400

**Nguyên nhân:** Request body gửi lên thiếu field bắt buộc (`tenant_id`, `table_name`, `action`) hoặc action không nằm trong whitelist.

**Cách fix:**

1. Tìm tất cả caller của audit-log:
   ```bash
   grep -r "audit-log" --include="*.ts" --include="*.tsx" services/ pages/ hooks/
   ```
2. Thêm guard trước khi gọi:
   ```typescript
   if (!tenantId || !tableName || !action) {
     console.warn('audit-log skipped: missing required fields');
     return;
   }
   ```
3. Đảm bảo `action` nằm trong tập `INSERT`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `EXPORT`, `IMPERSONATE`, `IMPERSONATE_END`.

**Files liên quan:**
- `supabase/functions/audit-log/index.ts`
- Các file gọi audit-log trong `services/`

### 2.3 `No routes matched location "/profile"`

**Nguyên nhân:** React Router báo route `/profile` không khớp. Có thể do:
- App chạy trên subdomain `admin.vietsalepro.com` nhưng `BrowserRouter` không có basename phù hợp.
- Một link trong UI trỏ đến `/profile` nhưng route chỉ tồn tại trên main domain.

**Cách fix:**

1. Kiểm tra `App.tsx`:
   ```tsx
   <Route path="/profile" element={<Profile />} />
   ```
2. Nếu `/profile` chỉ dùng trên main domain, không nên link từ admin subdomain.
3. Nếu admin subdomain cũng cần `/profile`, kiểm tra `BrowserRouter` basename:
   ```tsx
   <BrowserRouter basename="/admin">
   ```
   hoặc điều chỉnh route cho phù hợp.

**Files liên quan:**
- `App.tsx`
- `pages/admin/AdminLayout.tsx`

### 2.4 WebSocket realtime đóng trước khi kết nối

**Nguyên nhân:**
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` sai.
- Realtime chưa bật trên Supabase project.
- Network/firewall chặn WebSocket.

**Cách fix:**

1. Kiểm tra env trong build Vercel:
   - `VITE_SUPABASE_URL=https://rsialbfjswnrkzcxarnj.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=...`
2. Kiểm tra Supabase Dashboard → Realtime → Status.
3. Nếu admin dashboard không cần realtime, tắt tạm trong Supabase client:
   ```typescript
   const supabase = createClient(url, key, {
     realtime: { enabled: false }
   });
   ```

**Files liên quan:**
- `lib/supabase.ts` hoặc nơi khởi tạo Supabase client
- `.env.production`

### 2.5 Chart width/height = -1

**Nguyên nhân:** Recharts container không có kích thước khi render, thường do lazy-loaded panel hoặc tab ẩn.

**Cách fix:**

Thêm `minWidth` / `minHeight` cho container:

```tsx
<ResponsiveContainer width="100%" height={300} minWidth={0}>
  <BarChart ... />
</ResponsiveContainer>
```

Hoặc đảm bảo container cha có kích thước xác định:

```tsx
<div className="h-[300px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart ... />
  </ResponsiveContainer>
</div>
```

**Files liên quan:**
- `pages/admin/AdminDashboardInner.tsx`
- Các lazy panels có chart

### 2.6 `billing:1 Uncaught (in promise) Object`

**Nguyên nhân:** Promise trong `pages/admin/Billing.tsx` bị reject nhưng không có catch.

**Cách fix:**

1. Tìm các promise trong `Billing.tsx`.
2. Thêm try/catch hoặc `.catch()`:
   ```typescript
   try {
     await someBillingCall();
   } catch (err) {
     console.error('Billing error:', err);
     toast.error('Không thể tải dữ liệu billing');
   }
   ```
3. Đảm bảo lỗi được hiển thị rõ ràng cho user thay vì chỉ nằm trong console.

**Files liên quan:**
- `pages/admin/Billing.tsx`
- `services/admin/billingAdminService.ts` (nếu có)

---

## 3. Checklist Phase 4

- [ ] Hard refresh admin dashboard trên production.
- [ ] Không còn lỗi 404/400 từ các RPC chính.
- [ ] Các tab Tổng quan, Cửa hàng, Thành viên hoạt động.
- [ ] Xử lý 403 `get_gdpr_requests` (deploy migration + kiểm tra quyền system admin).
- [ ] Xử lý 400 `audit-log` (thêm guard hoặc fix caller).
- [ ] Kiểm tra `/profile` route warning.
- [ ] Kiểm tra WebSocket realtime (bật đúng config hoặc tắt nếu không cần).
- [ ] Sửa chart container width/height.
- [ ] Thêm error handling trong `Billing.tsx`.
- [ ] Chạy lại `npm run lint` và `npx vitest run` nếu có sửa code.
- [ ] Chuyển sang **Phase 5** để long-term hardening.
