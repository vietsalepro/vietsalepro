# BẢNG KẾ HOẠCH CHI TIẾT: BIẾN VIETSALE PRO THÀNH HỆ THỐNG VẬN HÀNH 10–20 NĂM

> **Ngày lập:** 2026-07-04  
> **Trạng thái:** Đã duyệt, sẵn sàng triển khai  
> **Mục tiêu:** Biến phần mềm từ trạng thái "chạy được" sang trạng thái có thể vận hành thực tế 10–20 năm.

---

## PHẦN 1: TOÀN BỘ NHU CẦU CẦN LÀM

| STT | Nhóm nhu cầu | Nhu cầu cụ thể |
|---|---|---|
| 1 | Chuyển đổi mô hình | Biến VietSale Pro từ phần mềm 1 cửa hàng thành SaaS nhiều cửa hàng |
| 2 | Mô hình kinh doanh | Khách hàng không tự đăng ký được, phải liên hệ bạn để được tạo cửa hàng |
| 3 | Mô hình kinh doanh | Bạn tự tạo cửa hàng và tài khoản admin thủ công qua dashboard riêng |
| 4 | Subdomain | Mỗi cửa hàng có subdomain riêng: `ten-cuahang.vietsalepro.com` |
| 5 | Subdomain | Có trang landing chính `vietsalepro.com` |
| 6 | Subdomain | Có admin dashboard tại `admin.vietsalepro.com` chỉ cho chủ hệ thống |
| 7 | Cách ly dữ liệu | Dữ liệu cửa hàng A không hiển thị cho cửa hàng B |
| 8 | Cách ly dữ liệu | Nhân viên cửa hàng A không đăng nhập được vào subdomain cửa hàng B |
| 9 | Cách ly dữ liệu | Một user có thể thuộc nhiều cửa hàng, nhưng mỗi lần chỉ thấy dữ liệu của subdomain đang truy cập |
| 10 | Phân quyền | Hệ thống có 4 role: admin, cashier, inventory_manager, accountant |
| 11 | Phân quyền | admin có toàn quyền cửa hàng |
| 12 | Phân quyền | cashier chỉ được tạo đơn, thanh toán nợ, xem khách/sản phẩm |
| 13 | Phân quyền | inventory_manager chỉ được nhập hàng, kiểm kê, xuất hủy, quản lý lô/tồn kho |
| 14 | Phân quyền | accountant chỉ được xem báo cáo, công nợ, không sửa đơn/tồn kho |
| 15 | Kiến trúc | Dùng một Supabase project duy nhất cho production |
| 16 | Kiến trúc | Dùng shared database + `tenant_id` + RLS để cách ly dữ liệu |
| 17 | Kiến trúc | Subdomain là định danh duy nhất của tenant |
| 18 | Kiến trúc | `auth.users` global, quan hệ user-tenant-role lưu trong bảng riêng |
| 19 | Kiến trúc | Role không lưu trong `auth.users.raw_user_meta_data` |
| 20 | Bảo mật | Xóa toàn bộ policy `public`/`anon` đang cho phép truy cập tự do |
| 21 | Bảo mật | Tắt self-registration trong Supabase Auth |
| 22 | Bảo mật | Tắt các social providers |
| 23 | Bảo mật | Không để `service_role key` lộ ra frontend |
| 24 | Bảo mật | Bật RLS trên 100% bảng kinh doanh |
| 25 | Dữ liệu | Thêm cột `tenant_id` vào tất cả bảng kinh doanh |
| 26 | Dữ liệu | Các bảng con cũng phải có `tenant_id` |
| 27 | Dữ liệu | Xử lý dữ liệu hiện có để gán về tenant đầu tiên |
| 28 | Dữ liệu | Thêm foreign key còn thiếu (ví dụ `order_items.lot_id`) |
| 29 | Dữ liệu | Xử lý record mồ côi hiện tại |
| 30 | Luồng hoạt động | Luồng khách đăng ký dịch vụ qua liên hệ thủ công |
| 31 | Luồng hoạt động | Luồng đăng nhập theo subdomain |
| 32 | Luồng hoạt động | Luồng admin cửa hàng mời nhân viên |
| 33 | Luồng hoạt động | Luồng tạo cửa hàng và admin user trong dashboard chủ hệ thống |
| 34 | Giới hạn & gói dịch vụ | Thiết kế 2 gói: Free và VIP |
| 35 | Giới hạn & gói dịch vụ | Giới hạn số user theo gói |
| 36 | Giới hạn & gói dịch vụ | Giới hạn số sản phẩm theo gói |
| 37 | Giới hạn & gói dịch vụ | Giới hạn số đơn hàng/tháng theo gói |
| 38 | Giới hạn & gói dịch vụ | Cảnh báo khi tenant gần đạt giới hạn |
| 39 | Kiến trúc | Dùng `tenant_id` kiểu UUID đồng bộ với `auth.users(id)` |
| 40 | Kiến trúc | Không lưu `tenant_id` vào `localStorage`; lấy từ subdomain runtime |
| 41 | Bảo mật | RLS phải kiểm tra cả `tenant_id` từ header và `is_tenant_member(tenant_id)` |
| 42 | Bảo mật | Không fallback tenant khi request thiếu header `x-tenant-id` |
| 43 | Audit log | Ghi log các thao tác quan trọng: tạo/xóa đơn, nhập hàng, xuất hủy, đổi cài đặt, đăng nhập/xuất |
| 44 | Audit log | Chỉ admin cửa hàng và system admin được xem log |
| 45 | Kiến trúc / Storage | Storage RLS cách ly file giữa các tenant: bucket `tenant-assets` dùng chung, path bắt đầu bằng `tenant_id/` |
| 46 | Kiến trúc / DNS | Hosting trên Cloudflare Pages, DNS wildcard `*.vietsalepro.com`, SSL tự động |
| 47 | Vận hành | Có môi trường staging riêng trước khi đụng production |
| 48 | Vận hành | Backup trước mỗi migration sửa dữ liệu |
| 49 | Vận hành | Test cách ly dữ liệu giữa các tenant |
| 50 | Vận hành | Test RBAC: cashier không xóa đơn, accountant không tạo đơn |
| 51 | Vận hành | Test chặn self-registration |
| 52 | Vận hành | Test xử lý subdomain không tồn tại |
| 53 | Vận hành | Test xử lý tenant bị suspend |
| 54 | Chất lượng code | Bật TypeScript strict |
| 55 | Chất lượng code | Viết unit tests |
| 56 | Chất lượng code | Viết integration tests cho các luồng chính |
| 57 | Chất lượng code | Dọn dẹp backup tables, file rác |
| 58 | Chất lượng code | Chuẩn hóa error handling |
| 59 | Scale | Chuẩn bị index và partition khi dữ liệu tăng |
| 60 | Scale | Cân nhắc read replica, connection pooling khi cần |
| 61 | Data | Backfill membership cho user hiện có thành admin tenant đầu tiên |
| 62 | Data | SKU / mã đơn / mã hóa đơn unique theo tenant |
| 63 | Bảo mật | Password reset flow cho user thuộc tenant, dùng email mặc định của Supabase Auth |
| 64 | Bảo mật | Rate limiting đăng nhập, tạo tenant, check subdomain, mời nhân viên bằng bảng `rate_limit_logs` |
| 65 | Offline | Offline queue cách ly theo tenant, không sync chéo tenant |
| 66 | Vận hành | Backup: Free plan dùng `supabase db dump`, khi vận hành thật nâng Pro + bật PITR, test restore định kỳ |
| 67 | Vận hành | Data retention: dùng Supabase cron extension để archive đơn hàng, partition audit log, clean processed_operations |

---

## PHẦN 2: CÁC BƯỚC XỬ LÝ CẦN LÀM

| Bước | Tên bước | Mục tiêu đầu ra |
|---|---|---|
| 1 | Chuẩn bị môi trường | Có staging riêng, backup production, đảm bảo lint/build pass |
| 2 | Dọn dẹp bảo mật hiện tại | Xóa policy public cũ, tắt self-registration, đóng social providers |
| 3 | Tạo foundation multi-tenancy | Có bảng `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins` |
| 4 | Thêm `tenant_id` vào toàn bộ bảng kinh doanh | Mọi bảng dữ liệu cửa hàng có cột `tenant_id` |
| 5 | Sửa dữ liệu hiện có | Backfill dữ liệu cũ về tenant đầu tiên, tạo membership cho user hiện có, xử lý record mồ côi có backup |
| 6 | Thêm unique index theo tenant | SKU, barcode, mã đơn, mã hóa đơn unique trong tenant |
| 7 | Thêm helper functions và RLS policies | Có `is_tenant_member`, `is_tenant_admin`, `has_tenant_role`, `get_tenant_by_subdomain` |
| 8 | Sửa frontend nhận diện tenant | Subdomain → tenant_id, AuthContext lưu tenant, mọi request gắn tenant_id qua custom fetch wrapper |
| 9 | Thiết kế giới hạn và gói dịch vụ | 2 gói: Free (50 SKU, 300 đơn/tháng, 1 user) và VIP (69K/tháng, không giới hạn) |
| 10 | Tạo admin dashboard cho chủ hệ thống | Trang `admin.vietsalepro.com` để tạo/sửa/suspend cửa hàng |
| 11 | Tạo Edge Functions | Tạo cửa hàng + admin, mời nhân viên, kiểm tra subdomain, reset password |
| 12 | Cập nhật RBAC trong DB và UI | Policies theo role, menu ẩn/hiện theo quyền |
| 13 | Thêm audit log | Bảng log, trigger ghi log, RLS cho log |
| 14 | Thêm rate limiting và offline queue tenant isolation | Lockout đăng nhập sai, giới hạn Edge Functions bằng bảng `rate_limit_logs`, offline queue không sync chéo tenant |
| 15 | Bật TypeScript strict | Bật từng flag, sửa lỗi dần |
| 16 | Viết tests | Unit tests cho utils, integration tests cho luồng chính |
| 17 | Dọn dẹp codebase | Xóa backup tables, file rác, chuẩn hóa error handling |
| 18 | Test trên staging | Tạo 2-3 tenant, test cách ly, RBAC, suspend, subdomain lỗi, password reset, rate limiting |
| 19 | Deploy production | Cloudflare Pages + DNS wildcard + SSL + Storage RLS (bucket `tenant-assets` chung), chạy migration, backfill, deploy frontend, smoke test. PITR bật khi nâng Pro |
| 20 | Thiết lập vận hành dài hạn | Backup định kỳ, test restore, data retention bằng Supabase cron extension, monitoring, tài liệu vận hành |

---

## PHẦN 3: CHI TIẾT GÓI DỊCH VỤ (ĐÃ CHỐT)

| Gói | Giá | SKU | Đơn hàng/tháng | User | Đối tượng |
|---|---|---|---|---|---|
| **Free** | 0đ | 50 | 300 | 1 | Cửa hàng siêu nhỏ, cá nhân dùng thử |
| **VIP** | 69K/tháng | Không giới hạn* | Không giới hạn* | Không giới hạn* | Cửa hàng đang hoạt động thật, có nhân viên |

> *Giới hạn kỹ thuật đặt rất cao (999.999 SKU, 999.999 đơn/tháng, 999 user) để tránh abuse. Thực tế coi như không giới hạn.

---

## PHẦN 4: CÁC ĐIỂM THEN CHỐT ĐỂ THÀNH CÔNG

1. RLS phải đúng trên 100% bảng kinh doanh.
2. Tắt sign-up tự do hoàn toàn.
3. Service role key không bao giờ lộ ra frontend.
4. Có staging environment để test multi-tenancy.
5. Luôn backup trước mỗi thay đổi lớn trên production.
6. Không chạy migration production vào giờ cao điểm.

---

## PHẦN 5: TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)

Trước khi coi hệ thống "sẵn sàng 10–20 năm":

1. Không còn policy `public`/`anon` ALL trên bảng dữ liệu.
2. `npm run lint` pass với `strict: true`.
3. `npm run build` pass.
4. Có ít nhất 30 unit tests và 5 integration tests pass.
5. Không còn record mồ côi trong các bảng chính.
6. Có FK trên `order_items.lot_id`, `return_order_items.lot_id`, `import_items.lot_id`.
7. Có runbook vận hành.
8. Có backup tự động và đã test restore thành công ít nhất 1 lần.
9. Cách ly dữ liệu giữa tenant A/B đã test (A không thấy dữ liệu B).
10. RBAC đã test: cashier không xóa đơn, accountant không tạo đơn, inventory manager không xem báo cáo.
11. Self-registration bị tắt hoàn toàn.
12. Service role key không lộ ra frontend.
13. Subdomain không tồn tại và tenant bị suspend xử lý đúng.
14. Audit log hoạt động và chỉ admin/system admin xem được.
15. Storage RLS đã test cách ly file giữa các tenant.
16. Subscription limits đã test: user, sản phẩm, đơn hàng/tháng.
17. Đã xóa backup tables và file rác không cần thiết.
18. Kiểu `tenant_id` là UUID đồng bộ toàn hệ thống.
19. Không lưu `tenant_id` vào `localStorage`; mọi request xác định từ subdomain qua custom fetch wrapper.
20. Password reset flow hoạt động và redirect về đúng subdomain.
21. Rate limiting đã test: lockout đăng nhập sai, giới hạn tạo tenant/check subdomain.
22. SKU / mã đơn / mã hóa đơn unique theo tenant đã test.
23. Offline queue cách ly theo tenant: đổi subdomain không sync chéo dữ liệu.
24. Data retention policy đã có và test archive/partition dữ liệu cũ.
25. Backup strategy dùng Supabase CLI hoặc PITR, không dùng `pg_dump` thuần.

---

*File được tạo tự động từ kế hoạch đã duyệt trong phiên chat.*
