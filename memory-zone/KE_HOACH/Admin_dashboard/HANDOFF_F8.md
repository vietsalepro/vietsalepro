# Handoff — Admin Dashboard Sub-phase F8 hoàn thành

> Chat date: 2026-07-09
> Source: `KE_HOACH_XU_LY_LOI_ADMIN_DASHBOARD_SUB_PHASE.md`
> Tiếp theo: **F9 — P3.1b: React useEffect dependencies**

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

## Backup files

- F8 không cần backup (chỉ sửa TypeScript React, dễ revert bằng git).

---

## Verification

- `npm run lint`: PASS
- `npm run build`: PASS
- `success` state được dùng trong cả 2 handlers yêu cầu.
- `impersonatingTenantId` vẫn được sử dụng — không xóa.

---

## Limit / lưu ý

- Chỉ chuyển 2 thao tác thành công (`Restore`, `Reset demo`) sang banner xanh. Các thao tác khác (tạo tenant, mời thành viên, v.v.) vẫn để error-only theo phạm vi F8.
- F9 sẽ xử lý `useEffect` dependencies và stale closure trên cùng file `SystemAdminDashboard.tsx`.

---

## Sub-phase tiếp theo

**F9 — P3.1b: React useEffect dependencies**

Files cần đọc/sửa:
- `pages/SystemAdminDashboard.tsx` (chỉ phần `useEffect` và các hàm `load*`, `loadMembers`, `loadOverview`, `loadRateLimitLogs`, `loadSystemAdmins`, `loadLoginHistory`, `loadOperations`)

Công việc:
1. Đưa các hàm `load*` vào dependency array HOẶC bọc trong `useCallback` với đúng deps.
2. Hoặc refactor thành `useEffect` inline call để tránh stale closure.

Acceptance:
- ESLint `exhaustive-deps` không còn warning trên file này.
- Không gây infinite loop sau khi fix deps.
- `npm run lint` + `npm run build` pass.

Rollback: Revert `SystemAdminDashboard.tsx` nếu lỗi.

Handoff sang: F10.
