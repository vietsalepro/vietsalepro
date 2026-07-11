# Sub-Plan phụ: Sub-Phase 2.2 — Hướng B: Tách 4 trang list thành standalone pages

## Bối cảnh

Sub-Phase 2.2 yêu cầu tạo `hooks/useAdminList.ts` và áp dụng cho:
- `pages/admin/Tenants.tsx`
- `pages/admin/Members.tsx`
- `pages/admin/Audit.tsx`
- `pages/admin/Billing.tsx`

Thực tế hiện tại: 4 file trên chỉ là wrapper render `<AdminDashboardInner activeTab="..." />`. Logic list/search/pagination thật sự nằm trong:
- `AdminDashboardInner.tsx` (tab tenants)
- `components/MemberManagement.tsx` (tab members)
- `pages/AuditLog.tsx` (tab audit)
- `components/BillingConfig.tsx` (tab billing, không có list phân trang)

Quyết định: thực hiện **hướng B** — biến 4 wrapper pages thành **standalone pages** tự fetch list qua `useAdminList`, bắt đầu tách monolith `AdminDashboardInner` dần dần.

## Phạm vi

### Trong sub-plan này (2 file đầu)
1. Tạo `hooks/useAdminList.ts` — generic hook cho loading, search, filters, pagination, debounce.
2. Tách `pages/admin/Tenants.tsx` thành standalone page:
   - Dùng `useAdminList` với `tenantAdminService.listAccounts`.
   - Giữ search, filters (status, plan), pagination, KPI cards, create form, table cơ bản.
   - Các action đơn giản (archive, restore, delete) giữ lại; modal chỉnh sửa chi tiết có thể chuyển sang handoff nếu quá lớn.
3. Tách `pages/admin/Members.tsx` thành standalone page:
   - Dùng `useAdminList` với `memberAdminService.searchTenantMembers`.
   - Thêm tenant selector (dùng `tenantAdminService.listAccounts` hoặc `getAllTenants`).
   - Tái sử dụng UI từ `MemberManagement` nếu có thể, hoặc copy phần list cần thiết.
4. Chạy `npm run build` sau mỗi file.

### Handoff (2 file còn lại + docs)
1. `pages/admin/Audit.tsx`: standalone page dùng `useAdminList` với `auditAdminService.getAuditLogs`.
2. `pages/admin/Billing.tsx`: standalone page. Vì `BillingConfig` không có list phân trang, có thể dùng `useAdminList` cho danh sách tài khoản ngân hàng (`getBankAccounts`) hoặc chuyển sang component list hóa đơn nếu có.
3. Tạo `docs/admin-dashboard/RPC_CONTRACTS.md`.
4. Chạy `npm run build` và `openspec validate`.

## Rủi ro

- Duplicate UI tạm thời giữa `AdminDashboardInner` và các standalone pages.
- Code cũ trong `AdminDashboardInner` trở thành dead code cho đến khi các tab còn lại được tách.
- Cần đảm bảo các route `/admin/tenants`, `/admin/members` vẫn hoạt động.

## Tiêu chí hoàn thành

- `npm run build` pass sau mỗi file.
- 2 file đầu (`Tenants.tsx`, `Members.tsx`) render standalone list bằng `useAdminList`.
- Handoff rõ ràng cho 2 file còn lại + RPC contracts.
