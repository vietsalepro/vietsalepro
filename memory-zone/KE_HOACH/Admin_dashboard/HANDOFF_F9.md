# Handoff — Admin Dashboard Sub-phase F9

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Tiếp theo: **F10 — P3.2: Subdomain & proration**
> Context: **Nặng** — file `pages/SystemAdminDashboard.tsx` ~2.456 dòng / ~112 KB. **Không gộp F10**.

---

## Đã làm xong (F8)

### F8 — P3.1a: React success/error & dead state

- `pages/SystemAdminDashboard.tsx`
  - Thêm state `success: string | null` cạnh `error`.
  - `handleRestoreSubmit`: success path dùng `setSuccess(...)` thay vì `setError(...)`; error path vẫn `setError(...)`; xóa `success` cũ khi bắt đầu thao tác.
  - `handleResetDemo`: tương tự — success path dùng `setSuccess(...)`, error path `setError(...)`.
  - Render success banner màu xanh (`bg-green-50 text-green-700 border-green-100`) ngay sau error banner màu đỏ.
  - Kiểm tra `impersonatingTenantId`: **không phải dead code** — được dùng trong `handleLoginAs` để disable nút `Login as` và hiển thị `Đang xử lý...`, nên giữ nguyên.

---

## Đã làm xong (F9)

### F9 — P3.1b: React useEffect dependencies

- `pages/SystemAdminDashboard.tsx`
  - Thêm `useCallback` vào import React.
  - Bọc các hàm load trong `useCallback` với đúng dependency:
    - `load` → deps `[debouncedSearchTerm, filters.status, filters.plan]`
    - `loadOverview` → deps `[]`
    - `loadRateLimitLogs` → deps `[]`
    - `loadSystemAdmins` → deps `[]`
    - `loadLoginHistory` → deps `[]`
    - `loadLoginAlerts` → deps `[]`
    - `loadOperations` → deps `[]`
    - `loadAllTenantsForSelector` → deps `[]`
    - `loadMembers` → deps `[]`
  - Cập nhật dependency array của các `useEffect` tương ứng để bao gồm các hàm `load*` đã wrap:
    - Load tenant list: `[load, page, pageSize]`
    - Overview: `[activeTab, loadOverview]`
    - Rate limit: `[activeTab, rateLimitPage, loadRateLimitLogs]`
    - System admins: `[activeTab, loadSystemAdmins]`
    - Login history: `[activeTab, loginHistoryPage, loginHistoryStatus, loadLoginHistory, loadLoginAlerts]`
    - Operations: `[activeTab, loadOperations]`
    - Members tenant selector: `[activeTab, loadAllTenantsForSelector]`
    - Members list: `[memberTenantId, loadMembers]`
  - Xóa các comment `// ponytail: eslint exhaustive-deps không được bật...` liên quan đến các `useEffect` đã fix.

---

## Backup files

- F8 không cần backup (chỉ sửa TypeScript React, dễ revert bằng git).
- F9 không cần backup (chỉ sửa TypeScript React, dễ revert bằng git).

---

## Verification (F9)

- `npm run lint`: PASS
- `npm run build`: PASS
- Các hàm `load*` đã được bọc `useCallback` với đúng deps.
- Các `useEffect` gọi `load*` đã cập nhật dependency array đầy đủ, không còn lý do bỏ qua `exhaustive-deps`.
- Không gây infinite loop: các `useCallback` chỉ thay đổi identity khi deps thực sự thay đổi (state setter/stable imports không làm thay đổi identity).

---

## Limit / lưu ý

- F9 chỉ xử lý `useEffect` dependencies và stale closure trên `SystemAdminDashboard.tsx`.
- Không thay đổi logic nghiệp vụ của các tab, chỉ refactor cách khai báo hàm load và deps array.
- F10 xử lý subdomain validation & proration trên cùng file `SystemAdminDashboard.tsx`, theo quy tắc **KHÔNG gộp** với F9.

---

## Sub-phase tiếp theo

**F10..F15 — gộp trong 1 task chat**

F10 đơn lẻ (~127.5 KB context) chưa đủ 200K, nên gộp chung F10..F15 (~197.7 KB) để xử lý trong 1 task chat:

- **F10 — P3.2: Subdomain & proration** (`SystemAdminDashboard.tsx`, `services/tenantService.ts`)
- **F11 — P4.1: Dynamic pricing** (2 migration: invoice create + expiry renewal cron)
- **F12 — P4.2: Atomic expire/renewal** (2 migration: expiry renewal cron + billing automation dashboard)
- **F13 — P4.3: Usage counter & custom limits** (1 migration: subscription usage)
- **F14 — P4.4: Voucher fixes** (2 migration: voucher schema + voucher invoice apply)
- **F15 — P5.1a: Ticket policy** (1 migration: ticket schema backend)

Chi tiết công việc / acceptance / rollback xem `HANDOFF_F10.md`.

---

## Context assessment

- F9 đã là **Nặng** vì phải đọc toàn bộ `SystemAdminDashboard.tsx` (~2.456 dòng) để truy vết các `useEffect` và `load*` function.
- Theo quy tắc 200K context, F9 **KHÔNG** được gộp với F10 hay bất kỳ phase nào khác trong cùng 1 task chat.
- F10 đơn lẻ nhỏ hơn 200K, nên gộp F10..F15 để tận dụng context; F16 để riêng vì gộp thêm sẽ vượt 200K.
