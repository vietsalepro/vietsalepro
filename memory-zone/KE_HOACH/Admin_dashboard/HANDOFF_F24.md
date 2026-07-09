# Handoff — Admin Dashboard Sub-phases F24..F25

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Tiếp theo: **F24 — P6.2: Shell components polish** + **F25 — P7.1: Tests & type check**
> Context: **~71 KB** — gộp F24+F25 để tận dụng context; vẫn an toàn dưới ngưỡng 200K.

---

## Đã làm xong (F21..F23)

### F21 — P6.1a: SystemAdminDashboard confirm/alert

- Thay 7 `window.confirm()` và 1 `alert()` trong `pages/SystemAdminDashboard.tsx` bằng `ConfirmDialog` + `useToast`.
- Các flow async (archive, restore, impersonate, reset demo, reset counter, remove system admin, remove member, reset password) vẫn chờ user confirm trước khi thực hiện.

### F22 — P6.1b: BillingConfig & TwoFactorManager confirm/alert

- `components/BillingConfig.tsx`: thay `window.confirm()` xóa tài khoản ngân hàng bằng `ConfirmDialog`; thêm toast success sau khi xóa.
- `components/TwoFactorManager.tsx`: thay `alert()` override 2FA thành công bằng `useToast`.

### F23 — P6.1c: VoucherManager & WebhookManager confirm/alert

- `components/VoucherManager.tsx`: thay 2 `window.confirm()` (xóa voucher / promotion rule) bằng `ConfirmDialog`; thêm toast success.
- `components/WebhookManager.tsx`: thay `window.confirm()` xóa webhook và `window.alert()` test webhook bằng `ConfirmDialog` + toast.

- Tạo hook tái sử dụng: `hooks/useConfirmDialog.tsx`.
- `npm run lint`: PASS
- `npm run build`: PASS
- Không còn `window.confirm()` / `window.alert()` trong 5 file trên.

---

## Sub-phases tiếp theo (gộp F24..F25)

### F24 — P6.2: Shell components polish

Files cần đọc/sửa:
- `components/AdminShell.tsx` (~6.4 KB, 193 dòng)
- `components/AdminShell.css` (~5.0 KB)
- `components/AdminSidebar.tsx` (~8.5 KB, 239 dòng)
- `components/AdminSidebar.css` (~9.4 KB)
- `components/AdminTabs.tsx` (~3.0 KB, 93 dòng)
- `components/AdminTabs.css` (~1.6 KB)
- `components/AdminKpiCards.tsx` (~3.5 KB, 100 dòng)
- `components/AdminKpiCards.css` (~1.8 KB)

Công việc:
1. **AdminShell.tsx (6.3)**
   - Xóa empty `admin-shell__topbar-center` (dòng 111).
   - Render `pageTitle` trong `admin-shell__page-header` (hiện chỉ có `pageDescription`).
   - Đảm bảo page title hiển thị đúng 2 vị trí: topbar + page header.

2. **AdminSidebar.tsx (6.4)**
   - Thay `window.innerWidth` + resize listener bằng `window.matchMedia('(max-width: 767px)')`.
   - Thêm debounce/cleanup nếu cần để tránh re-render liên tục khi resize.
   - Giữ behavior: tự động đóng mobile sidebar khi chuyển sang desktop.

3. **AdminTabs.tsx (6.5)**
   - Reset `tabRefs.current` khi `tabs` thay đổi, hoặc chuyển sang dùng `Map<string, HTMLButtonElement>`.
   - Xóa ref cũ khi tab bị xóa để tránh focus sai tab / lỗi keyboard navigation.

4. **AdminKpiCards.tsx (6.6)**
   - Khi `trend === 0`, render icon neutral (`—`) thay vì arrow up/down.
   - Đổi `key={index}` thành `key={card.label}` để tránh key trùng khi reorder.

Acceptance:
- Page title hiển thị đúng 2 vị trí (topbar + page header).
- Sidebar responsive, không re-render liên tục khi resize.
- Thêm/xóa tab không lỗi focus.
- Trend 0 hiển thị neutral.
- `npm run lint` + `npm run build` pass.

Rollback: Revert 4 component + CSS nếu layout bị vỡ.

---

### F25 — P7.1: Tests & type check

Files cần đọc/sửa:
- `pages/SystemAdminDashboard.tsx` (~phần đầu: `calculateProration`, `planLabel`)
- `services/tenantService.ts` (`mapTenantFromDB`)
- `services/tenantRestoreService.ts` (`validateBackup`)
- `tests/voucher-ui.test.ts` (pattern test tham khảo)
- `tests/admin-dashboard-utils.test.ts` (file test mới)

Công việc:
1. **Export các hàm cần test** (nếu chưa export):
   - `calculateProration` đã export.
   - `planLabel`: export hoặc di chuyển ra util để test.
   - `mapTenantFromDB`: export từ `services/tenantService.ts`.
   - `validateBackup`: export từ `services/tenantRestoreService.ts`.

2. **Viết test trong `tests/admin-dashboard-utils.test.ts`**:
   - `calculateProration`: test các trường hợp:
     - Cùng plan → null.
     - Hết hạn / không có expiresAt → null.
     - Còn hạn, upgrade từ free → vip → net dương.
     - Còn hạn, downgrade từ vip → free → net âm (refund).
   - `planLabel`: test 'free' → 'Free', 'vip' → 'VIP', 'other' → 'OTHER'.
   - `mapTenantFromDB`: test mapping từ DB row sang `Tenant` object đúng kiểu.
   - `validateBackup`: test backup hợp lệ, thiếu `tables`, `tables` không phải object.

3. **Chạy verification**:
   - `npx vitest run` pass.
   - `npm run lint` pass, không warning mới.
   - `npm run build` pass.

Acceptance:
- `npx vitest run` pass.
- `npm run lint` pass.
- `npm run build` pass.
- Các hàm đã test được cover đủ edge cases.

Rollback: Xóa/bỏ qua test nếu gây lỗi build; ưu tiên fix code.

---

## Verification tổng hợp (F24..F25)

- `npm run lint`: PASS
- `npm run build`: PASS
- `npx vitest run`: PASS (F25)
- Page title hiển thị đúng 2 vị trí.
- Sidebar responsive, không re-render liên tục khi resize.
- Thêm/xóa tab không lỗi focus.
- Trend 0 hiển thị neutral.
- Các hàm `calculateProration`, `planLabel`, `mapTenantFromDB`, `validateBackup` có test pass.

---

## Context assessment

| Sub-phase | File context (KB) | Ghi chú |
|-----------|-------------------|---------|
| F24 | ~39.2 | 4 component + 4 CSS file nhỏ |
| F25 | ~32.0 | 2 service + 1 test pattern + phần đầu `SystemAdminDashboard.tsx` |
| **F24+F25** | **~71.2** | Vừa dưới 200K, gộp để tận dụng 1 chat |
| F26 | ~545+ (migrations) | Nếu gộp thêm F26 sẽ vượt ngưỡng, để riêng |

- F24 đơn lẻ ~39 KB < 200K; nếu để riêng sẽ lãng phí context.
- F25 nhỏ, gộp vào F24 không tăng đáng kể.
- Gộp thêm F26 (toàn bộ migrations) sẽ vượt ngưỡng, nên để F26 riêng.

Handoff sang: **F26 — P7.2: Migration QA & security review**.
