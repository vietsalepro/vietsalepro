# F33 — Members Enterprise Upgrade: Sub-phase index

Kế hoạch tổng: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`

## Cách dùng

Mỗi chat chỉ đọc **một file handoff sub-phase** và làm đúng scope của nó. Sau khi xong, cập nhật trạng thái trong file index này và chuyển sang sub-phase tiếp theo.

## Lộ trình

| # | File | Mục tiêu | Files chính | Dự trữ context* | Trạng thái |
|---|------|----------|-------------|-----------------|------------|
| 1 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P1_DB_FOUNDATION.md` | Thêm cột `status`/`is_active`/`invited_at`/`accepted_at` + indexes + backfill | `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` | ~3K tokens | Hoàn thành |
| 2 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P2_SEARCH_RPC.md` | Tạo `search_tenant_members` RPC | baseline function (9280-9314) | ~3K tokens | Chưa làm |
| 3 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P3_GUARDRAILS.md` | Trigger bảo vệ owner / admin cuối cùng | `supabase/migrations/*` | ~2K tokens | Hoàn thành |
| 4 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P4_INVITE_EDGE.md` | Sửa `invite-member` edge function | `supabase/functions/invite-member/index.ts` | ~5K tokens | Chưa làm |
| 5 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P5_RESET_AND_STATUS.md` | Status activation + kiểm tra reset-password | `supabase/functions/reset-password/index.ts`, `contexts/AuthContext.tsx` | ~5K tokens | Hoàn thành |
| 6 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P6_TYPES_SERVICE.md` | Types + service layer frontend | `types/tenant.ts`, `services/tenantService.ts` | ~15K tokens | Chưa làm |
| 7 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P7_DATAGRID_CONTAINER.md` | `MemberManagement` container + DataGrid | `components/DataGrid.tsx` | ~15K tokens | Chưa làm |
| 8 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P8_SUBCOMPONENTS.md` | InviteModal, BulkActions, DetailDrawer | `components/DataGrid.tsx` | ~15K tokens | Chưa làm |
| 9 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P9_SYSTEM_ADMIN_INTEGRATION.md` | Thay thế tab Members trong `SystemAdminDashboard` | `pages/SystemAdminDashboard.tsx` | ~35K tokens | Chưa làm |
| 10 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P10_TENANT_ADMIN_NAVIGATION.md` | Thêm menu/route cho tenant admin | `App.tsx`, `AppTopbar.tsx`, `MobileLayout.tsx`, `FeaturePicker.tsx`, `BottomNav.tsx` | ~10K tokens | Chưa làm |
| 11 | `HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P11_TESTS_POLISH.md` | Tests + UX polish | `tests/smoke/admin-dashboard-p3-member-management.test.ts`, `tests/mocks/supabase.ts` | ~10K tokens | Hoàn thành |

\*Dự trữ context = ước tính tổng số token của handoff + các file phải đọc. Tất cả đều nhỏ hơn rất nhiều so với giới hạn 220K tokens/chat.

## Quy tắc chung

- Không đụng UI trong P1..P5.
- Không đụng DB trong P6..P11 (trừ khi sub-phase yêu cầu).
- Chạy `npm run lint`, `npm run build`, `npx vitest run` trước khi commit.
- Nếu sub-phase nào cần migration Supabase, deploy ngay khi xong (hoặc ghi chú trong file).
