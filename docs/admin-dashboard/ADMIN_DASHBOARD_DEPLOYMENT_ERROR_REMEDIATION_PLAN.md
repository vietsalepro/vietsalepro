# Kế hoạch khắc phục lỗi Admin Dashboard sau deploy

**Ngày lập:** 2026-07-11  
**Môi trường lỗi:** Production (`admin.vietsalepro.com`) kết nối đến Supabase project `rsialbfjswnrkzcxarnj`  
**Mục tiêu:** Khôi phục hoạt động admin dashboard, đồng thời thiết lập nền tảng vận hành ổn định > 20 năm theo các pattern của Basejump.

---

## Tóm tắt điều tra

Frontend admin dashboard đã được build và deploy lên Vercel. Tuy nhiên, phía backend trên Supabase remote **chưa đồng bộ** với codebase:

- Một số RPC function trong code **chưa tồn tại** trong database.
- Một số RPC function đã có trong migration nhưng **chưa được push lên remote**.
- Một số function đã deploy nhưng **không khớp signature** với code gọi.
- Edge function `audit-log` chưa deploy hoặc request body không đúng.
- Một số lỗi phụ khác liên quan routing, realtime, chart rendering.

---

## Các Phase xử lý

| Phase | Mục tiêu | File kế hoạch | Ưu tiên |
|-------|----------|---------------|---------|
| **Phase 1** | Sửa SQL migrations — bổ sung các RPC còn thiếu, sửa signature | [ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md](./ADMIN_DASHBOARD_PHASE_1_SQL_FIX.md) | **Khẩn cấp** |
| **Phase 2** | Cập nhật service, mocks, tests, docs cho khớp với SQL | [ADMIN_DASHBOARD_PHASE_2_SERVICE_TESTS.md](./ADMIN_DASHBOARD_PHASE_2_SERVICE_TESTS.md) | Cao |
| **Phase 3** | Deploy migrations & edge functions lên Supabase remote | [ADMIN_DASHBOARD_PHASE_3_DEPLOY.md](./ADMIN_DASHBOARD_PHASE_3_DEPLOY.md) | Cao |
| **Phase 4** | Verify & khắc phục lỗi phụ UI / routing / realtime | [ADMIN_DASHBOARD_PHASE_4_VERIFY_UI.md](./ADMIN_DASHBOARD_PHASE_4_VERIFY_UI.md) | Trung bình |
| **Phase 5** | Long-term hardening — contract audit, monitoring, feature flags | [ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md](./ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md) | Thấp / ongoing |

---

## Nguyên tắc giải quyết theo Basejump / long-term

1. **Contract-first:** mọi RPC phải có định nghĩa SQL, tài liệu contract và service TypeScript khớp 1-1.
2. **Idempotent migrations:** mọi thay đổi DB phải qua migration có thể chạy lại mà không lỗi.
3. **Explicit grants:** không để Supabase tự động expose function; dùng `GRANT EXECUTE` rõ ràng.
4. **Least privilege:** ưu tiên `SECURITY INVOKER`; `SECURITY DEFINER` chỉ khi cần vượt RLS và phải có `SET search_path = public`.
5. **Defensive service layer:** frontend/service không bao giờ tin tưởng backend trả về đúng định dạng; luôn có fallback.
6. **Observability:** mọi lỗi deploy phải được log, đo và cảnh báo.

---

## Bảng tổng hợp lỗi

| STT | Lỗi / HTTP | RPC / Edge Function | Mức độ | Phase xử lý |
|-----|------------|---------------------|--------|---------------|
| 1 | 400/404 | `get_top_tenants` | Cao | Phase 1 |
| 2 | 404 | `get_current_user_tenants` | Cao | Phase 1 |
| 3 | 404 | `get_tenants_admin` | Cao | Phase 1 |
| 4 | 404 | `search_tenant_members` | Cao | Phase 3 |
| 5 | 403 | `get_gdpr_requests` | Trung bình | Phase 4 |
| 6 | 400 | `audit-log` Edge Function | Trung bình | Phase 3 |
| 7 | 400 | `audit-log` lặp lại | Trung bình | Phase 4 |
| 8 | Warning | `No routes matched location "/profile"` | Thấp | Phase 4 |
| 9 | Warning | WebSocket realtime đóng trước khi kết nối | Thấp | Phase 4 |
| 10 | Warning | Chart width/height = -1 | Thấp | Phase 4 |
| 11 | Error | `billing:1 Uncaught (in promise) Object` | Trung bình | Phase 4 |

---

## Câu hỏi cần làm rõ trước khi implement

1. Bạn muốn đặt các migration mới ở đâu — tạo file mới hay bổ sung vào file phase hiện có?
2. Bạn có quyền chạy `supabase db push` lên project `rsialbfjswnrkzcxarnj` không?
3. Production DB đã bật PITR backup chưa?
4. Có cần tôi implement luôn các phase không?
