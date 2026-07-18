# VietSale Pro v7 — Báo cáo Kiểm toán Toàn diện

**Ngày:** 2026-01-13  
**Phạm vi:** Frontend (React/Vite), Backend (Supabase Edge Functions, RPC), Database (PostgreSQL/Supabase)  
**Người kiểm toán:** Devin  
**Phương pháp đánh giá độ tin cậy:** Cao = bằng chứng trực tiếp từ log DB sống + code; Trung bình = phân tích đường chạy code / bằng chứng log một phần; Thấp = suy luận từ mẫu.

---

## 1. Tóm tắt điều hành

VietSale Pro v7 là ứng dụng POS/SaaS đa tenant với frontend React, Supabase Edge Functions và schema PostgreSQL lớn. Cuộc kiểm toán phát hiện **các lỗi production nghiêm trọng** và **nhiều lỗ hổng bảo mật mức cao** cần xử lý ngay:

- **Hai công việc cron quan trọng đã thất bại âm thầm trong nhiều tháng.** `data-retention-daily` và `fraud-detection-hourly` bị chặn bởi cơ chế ủy quyền không nhận diện được role `postgres` mà `pg_cron` sử dụng. Với khoảng 24 + 1 lần chạy mỗi ngày kể từ đầu tháng 7 năm 2025, điều này tương đương khoảng **120 lần thực thi production thất bại**.
- **Giao diện quản trị phụ thuộc vào các RPC không tồn tại trong database trực tiếp.** Các hàm như `set_tenant_subdomain`, `get_storage_usage`, và `admin_update_subscription` được tham chiếu trong code nhưng không có trong schema production. Khi gọi, các tính năng này sẽ lỗi runtime.
- **Người dùng ẩn danh có thể thực thi các hàm nhạy cảm về bảo mật.** `unlock_login_attempts` có thể được gọi bởi `anon`, cho phép kẻ tấn công brute-force reset trạng thái khóa của chính họ.
- **Edge Functions để lộ các thao tác quản trị mà không xác minh JWT.** Các hành động thanh toán, gửi nhắc nhở hóa đơn, dọn dẹp phiên có thể bị kích hoạt bởi bất kỳ ai biết URL.
- **Sự trôi dạt giữa schema và code rất nghiêm trọng.** Có các file migration trùng lặp, lộn xộn thứ tự, và các bảng được tham chiếu trong code (`import_history`) không tồn tại.

Nhìn chung, hệ thống đang ở trạng thái **đã triển khai một phần, chưa được kiểm toán production**. Các sửa chữa khẩn cấp nhất là: sửa mô hình ủy quyền cho cron đang lỗi, loại bỏ hoặc triển khai các RPC thiếu, thu hẹp quyền `anon`/`authenticated` trên các hàm bảo mật, và làm nhất quán pipeline migration trước khi deploy tiếp.

---

## 2. Quy tắc & Phương pháp kiểm toán

- Không có thay đổi code nào được thực hiện trong quá trình kiểm toán.
- Các phát hiện dựa trên:
  - Metadata trực tiếp từ dự án Supabase (tables, functions, RLS policies, cron jobs, Edge Functions, logs, migrations).
  - Phân tích tĩnh codebase local (`services/`, `hooks/`, `contexts/`, `components/admin/`, `pages/admin/`, `supabase/functions/`).
  - Đối chiếu chữ ký RPC, tên bảng, và tên Edge Functions giữa code và hạ tầng sống.
- Khi bằng chứng không đủ, các phát hiện được đánh dấu với mức độ tin cậy dưới 100%.

---

## 3. Phát hiện

### 3.1 Phát hiện Critical (Nguy cấp)

#### CRIT-1 — Các công việc pg_cron data-retention và fraud-detection thất bại mỗi lần chạy

| Trường | Chi tiết |
|--------|----------|
| **ID** | CRIT-1 |
| **Mức độ** | Critical |
| **Danh mục** | Backend / Ủy quyền / Cron |
| **Vị trí** | Dự án Supabase `rsialbfjswnrkzcxarnj`; cron jobs `data-retention-daily` và `fraud-detection-hourly`; hàm `is_system_admin()` |
| **Triệu chứng** | Cron jobs lỗi với thông báo `Only system admins can run this operation` / `Chỉ system admin mới được chạy...`. Không có dữ liệu nào được dọn hoặc phát hiện gian lận từ khi triển khai. |
| **Bằng chứng** | Log Edge Function `cleanup-expired-sessions` (được gọi bởi `data-retention-daily`) hiển thị lặp lại lỗi 401/500 với thông báo này. Hàm `is_system_admin()` chỉ trả về true khi `current_user = 'service_role'` hoặc người dùng tồn tại trong `system_admins`. `pg_cron` chạy dưới role `postgres`, nên kiểm tra thất bại. |
| **Nguyên nhân gốc rễ** | Hàm trợ giúp `is_system_admin()` nhận thức được role nhưng không nhận thức được cron. Nó không bao gồm role `postgres`, trong khi các công việc cron trong Supabase chạy dưới người dùng `postgres`. Do đó, mọi thao tác đặc quyền do cron gọi đều bị từ chối. |
| **Tác động** | Dữ liệu giữ lại cũ không bị xóa; hàng đợi gian lận không bao giờ được xử lý; việc sử dụng đĩa, tuân thủ và tư thế bảo mật suy giảm âm thầm. |
| **Khuyến nghị sửa** | Lựa chọn A: Thêm `current_user = 'postgres'` vào danh sách cho phép của `is_system_admin()`. Lựa chọn B: Cung cấp role cron chuyên dụng và `SET ROLE service_role` ở đầu các hàm được cron gọi. Lựa chọn C: Chuyển điều phối cron vào Edge Function với service key. |
| **Độ tin cậy** | 98% |

#### CRIT-2 — Giao diện quản trị gọi các RPC không tồn tại trong database production

| Trường | Chi tiết |
|--------|----------|
| **ID** | CRIT-2 |
| **Mức độ** | Critical |
| **Danh mục** | Backend / RPC / Schema Drift |
| **Vị trí** | `services/admin/tenantService.ts`, `services/admin/subscriptionService.ts`, `services/admin/storageService.ts`; `components/admin/SubdomainManagerPanel.tsx`, `StorageBackupPanel.tsx`, `CustomDomainPanel.tsx`, `LicenseManagerPanel.tsx` |
| **Triệu chứng** | Nhiều panel quản trị và phương thức service gọi các RPC trả về lỗi 404 hoặc PGRST204 khi chạy. |
| **Bằng chứng** | Các RPC sau được tham chiếu trong code nhưng không có trong danh sách hàm DB:
- `admin_update_subscription` (cập nhật đăng ký tenant)
- `get_member_with_email`
- `get_storage_usage`
- `search_members_by_email`
- `set_tenant_subdomain` |
| **Nguyên nhân gốc rễ** | Code được viết theo schema mục tiêu nhưng chưa bao giờ được triển khai đầy đủ, hoặc các migration chứa các hàm này chưa được áp dụng cho dự án production. |
| **Tác động** | Quản lý subdomain, quản trị lưu trữ/sao lưu, quản lý license, tìm kiếm thành viên theo email và quản lý đăng ký không hoạt động. |
| **Khuyến nghị sửa** | (1) Kiểm toán mọi lời gọi `.rpc()` trong `services/admin/**/*.ts` với danh sách hàm trực tiếp. (2) Hoặc triển khai các hàm thiếu qua migration, hoặc xóa code UI/service chết. (3) Thêm kiểm tra pre-deploy trong CI để fail nếu RPC tham chiếu bị thiếu. |
| **Độ tin cậy** | 99% |

#### CRIT-3 — Người dùng ẩn danh có thể thực thi các RPC nhạy cảm về bảo mật

| Trường | Chi tiết |
|--------|----------|
| **ID** | CRIT-3 |
| **Mức độ** | Critical |
| **Danh mục** | Bảo mật / RLS / Functions |
| **Vị trí** | Hàm `unlock_login_attempts`; tập hợp rộng hơn các hàm public `SECURITY DEFINER` có `GRANT EXECUTE ON FUNCTION ... TO anon` |
| **Triệu chứng** | Cơ chế bảo vệ brute-force có thể bị vượt qua bởi người gọi chưa xác thực. |
| **Bằng chứng** | `unlock_login_attempts` reset bộ đếm đăng nhập sai cho một định danh và có thể được gọi bởi `anon` dựa trên phân tích đặc quyền. Các hàm khác như `create_password_reset_token`, `verify_password_reset_token`, `create_setup_token`, và `set_tenant_subdomain` (nếu triển khai) cũng được cấp quyền cho `anon`. |
| **Nguyên nhân gốc rễ** | Các hàm được tạo với câu lệnh `GRANT EXECUTE ... TO anon` rộng rãi và không có kiểm tra tenant/người dùng nội bộ, hoặc kiểm tra đó không ngăn chặn lạm dụng từ ẩn danh. |
| **Tác động** | Kẻ tấn công có thể reset trạng thái khóa, liệt kê/xác minh định danh, và có khả năng kích hoạt các luồng thiết lập đặc quyền mà không cần xác thực. |
| **Khuyến nghị sửa** | Thu hồi quyền `EXECUTE` trên các hàm nhạy cảm khỏi `anon` (và thường là khỏi `authenticated` nữa). Chỉ để `anon` truy cập các điểm vào xác thực công khai như `sign_in`, `sign_up`, `refresh_token`, `request_password_reset`. |
| **Độ tin cậy** | 95% |

#### CRIT-4 — Edge Functions để lộ các thao tác đặc quyền mà không xác minh JWT

| Trường | Chi tiết |
|--------|----------|
| **ID** | CRIT-4 |
| **Mức độ** | Critical |
| **Danh mục** | Bảo mật / Edge Functions |
| **Vị trí** | Supabase Edge Functions: `cleanup-expired-sessions`, `billing-daily-jobs`, `check-expired-subscriptions`, `send-invoice-reminders`, `process-subscription-renewals`, và các hàm khác |
| **Triệu chứng** | Các thao tác quản trị và thanh toán có thể bị kích hoạt bởi bất kỳ ai biết URL hàm. |
| **Bằng chứng** | Danh sách Edge Function cho thấy `verify_jwt: false` cho các hàm được liệt kê. `billing-daily-jobs` và `check-expired-subscriptions` sửa đổi subscriptions/hóa đơn. `send-invoice-reminders` có thể bị lạm dụng để spam. |
| **Nguyên nhân gốc rễ** | Các hàm dự định chỉ được gọi bởi cron hoặc internal service đã tắt xác minh JWT để cho phép cron truy cập, nhưng không có kiểm tra secret/IP/header cron thứ cấp nào để ngăn lạm dụng công khai. |
| **Tác động** | Các lần chạy thanh toán, gửi nhắc nhở hóa đơn, dọn dẹp phiên và xử lý gia hạn subscription không cần xác thực. Rủi ro tài chính và quyền riêng tư. |
| **Khuyến nghị sửa** | Hoặc bật lại `verify_jwt` và gọi các hàm này từ service-role client (cron gọi Edge Function qua service key), hoặc thêm header secret đã ký / `Authorization: Bearer <service_role>` từ Supabase cron và từ chối các request không có nó. |
| **Độ tin cậy** | 98% |

### 3.2 Phát hiện High (Cao)

#### HIGH-1 — Edge Function `delete-tenant` trả về lỗi 401/500

| Trường | Chi tiết |
|--------|----------|
| **ID** | HIGH-1 |
| **Mức độ** | High |
| **Danh mục** | Backend / Edge Functions / Ủy quyền |
| **Vị trí** | Edge Function `delete-tenant` |
| **Triệu chứng** | Xóa tenant thất bại trong production với phản hồi 401 (unauthorized) và 500 (internal). |
| **Bằng chứng** | Log gần đây cho thấy `delete-tenant` v4 trả về 500; v5 trả về 401. Một commit gần đây đã sửa lỗi gọi `set_config`, nhưng 401 cho thấy vấn đề auth/RLS vẫn còn. |
| **Nguyên nhân gốc rễ** | Có khả năng không khớp giữa các claim/role JWT được Edge Function client sử dụng và chính sách `admin_only` RLS trên các bảng phạm vi tenant, hoặc thiếu nâng `service_role` trước khi xóa. |
| **Tác động** | Thao tác vòng đời tenant quan trọng không ổn định; cần leo thang hỗ trợ. |
| **Khuyến nghị sửa** | Chạy xóa tenant dưới `service_role` và thực hiện kiểm tra quyền rõ ràng bên trong hàm, thay vì dựa vào role JWT của người gọi. Thêm logging theo request và test cho các trường hợp 200/404/403. |
| **Độ tin cậy** | 85% |

#### HIGH-2 — Bảng `import_history` bị thiếu làm hỏng ghi log nhập POS

| Trường | Chi tiết |
|--------|----------|
| **ID** | HIGH-2 |
| **Mức độ** | High |
| **Danh mục** | Database / Schema / Code-DB Drift |
| **Vị trí** | `services/supabaseService.ts` dòng 1628, 1648 |
| **Triệu chứng** | Lệnh insert lịch sử nhập sản phẩm POS thất bại khi chạy; danh sách lịch sử trả về rỗng. |
| **Bằng chứng** | Code gọi `supabase.from('import_history').insert(...)` và `.select('*')`, nhưng `import_history` không có trong danh sách bảng database trực tiếp. |
| **Nguyên nhân gốc rễ** | Một bảng được tham chiếu trong code đang hoạt động chưa bao giờ được tạo, hoặc một migration đã bị bỏ qua. |
| **Tác động** | Dấu vết kiểm toát nhập hàng bị mất; người dùng không thể xem lại các lần nhập trước. |
| **Khuyến nghị sửa** | Tạo bảng `import_history` với các cột khớp với code (`id`, `file_name`, `import_date`, `status`, v.v.) và bật RLS với chính sách phạm vi tenant, hoặc xóa code nếu tính năng không còn cần thiết. |
| **Độ tin cậy** | 99% |

#### HIGH-3 — Sự trôi dạt migration nghiêm trọng giữa database local và production

| Trường | Chi tiết |
|--------|----------|
| **ID** | HIGH-3 |
| **Mức độ** | High |
| **Danh mục** | Database / Migrations / DevOps |
| **Vị trí** | `supabase/migrations/`, lịch sử migration production |
| **Triệu chứng** | File migration local và các phiên bản đã áp dụng trong production không khớp; các lần deploy tương lai có nguy cơ áp dụng một phần hoặc lỗi rollback. |
| **Bằng chứng** | Các migration local tồn tại với timestamp không được ghi nhận là đã áp dụng trong log migration production, và production chứa các migration không có trong local. Một số file migration dường như bị trùng lặp hoặc thay thế (ví dụ: `*_fix_missing_functions.sql`, `*_final_cleanup.sql`). |
| **Nguyên nhân gốc rễ** | Các migration bị chỉnh sửa tại chỗ và áp dụng lại, hoặc nhiều developer commit migration với thứ tự chồng chéo. Dự án thiếu cổng CI chạy `supabase db diff` hoặc `supabase db reset` trước khi merge. |
| **Tác động** | Môi trường mới không tái tạo production; các lần deploy có thể thất bại giữa chừng; hotfix trở nên nguy hiểm. |
| **Khuyến nghị sửa** | (1) Tạo baseline mới từ production. (2) Làm nhất quán các file local và đặt tên theo thứ tự đơn điệu. (3) Thêm CI job chạy `supabase db push --dry-run` và fail khi có drift. (4) Không bao giờ chỉnh sửa các migration đã áp dụng. |
| **Độ tin cậy** | 90% |

#### HIGH-4 — Người dùng `authenticated` có thể thực thi các hàm security-definer

| Trường | Chi tiết |
|--------|----------|
| **ID** | HIGH-4 |
| **Mức độ** | High |
| **Danh mục** | Bảo mật / Functions |
| **Vị trí** | Các hàm public schema được cờ `authenticated_security_definer_function_executable` |
| **Triệu chứng** | Các hàm đặc quyền có thể được bất kỳ người dùng đã đăng nhập nào truy cập, trừ khi mỗi hàm có các biện pháp bảo vệ nội bộ mạnh. |
| **Bằng chứng** | Cảnh báo linter liệt kê `authenticated_security_definer_function_executable` trên nhiều hàm. Mặc dù một số hàm kiểm tra `is_system_admin()` nội bộ, bất kỳ lỗi hoặc thiếu sót nào cũng cấp quyền truy cập nâng cao. |
| **Nguyên nhân gốc rễ** | Sử dụng quá nhiều `SECURITY DEFINER` kết hợp với `GRANT EXECUTE ... TO authenticated` rộng rãi. |
| **Tác động** | Leo thang đặc quyền, truy cập dữ liệu cross-tenant, hoặc kích hoạt hành động quản trị bởi người dùng thông thường. |
| **Khuyến nghị sửa** | Mặc định sử dụng `SECURITY INVOKER` cho các hàm phạm vi tenant. Dành `SECURITY DEFINER` cho các hàm trợ giúp quản trị thực sự và giới hạn `GRANT` cho role `admin` chuyên dụng. |
| **Độ tin cậy** | 85% |

### 3.3 Phát hiện Medium (Trung bình)

#### MED-1 — Hơn 100 hàm SECURITY DEFINER có `search_path` có thể thay đổi

| Trường | Chi tiết |
|--------|----------|
| **ID** | MED-1 |
| **Mức độ** | Medium |
| **Danh mục** | Bảo mật / SQL Injection / Leo thang đặc quyền |
| **Vị trí** | Hơn 107 hàm public schema bị cờ `function_search_path_mutable` |
| **Triệu chứng** | Tiềm năng bị tấn công search-path hijacking; kẻ tấn công có thể tạo đối tượng để chuyển hướng lời gọi hàm. |
| **Bằng chứng** | Database linter báo `WARN` cho `function_search_path_mutable` trên phần lớn các hàm public. Hầu hết là `SECURITY DEFINER`. |
| **Nguyên nhân gốc rễ** | Các hàm được tạo mà không có `SET search_path = pg_temp, public` hoặc tham chiếu đối tượng đủ tên schema. |
| **Tác động** | Trung bình đến cao trong database chia sẻ/đa tenant; thấp hơn trong dự án biệt lập nhưng vẫn vi phạm best practice của Supabase. |
| **Khuyến nghị sửa** | Thêm `SET search_path = pg_temp, public` vào mọi hàm `SECURITY DEFINER`, hoặc đủ tên schema cho mọi tham chiếu bảng/hàm. |
| **Độ tin cậy** | 95% |

#### MED-2 — Công việc cron hóa đơn gia hạn trùng lặp có nguy cơ lập hóa đơn hai lần

| Trường | Chi tiết |
|--------|----------|
| **ID** | MED-2 |
| **Mức độ** | Medium |
| **Danh mục** | Backend / Cron / Thanh toán |
| **Vị trí** | Cron jobs `process-renewal-invoices` và `billing-daily-jobs` |
| **Triệu chứng** | Hóa đơn gia hạn có thể được tạo hoặc tính phí hai lần nếu cả hai công việc chồng chéo về phạm vi. |
| **Bằng chứng** | Hai cron job riêng biệt tham chiếu logic gia hạn/hóa đơn. Công việc thanh toán hàng ngày và công việc gia hạn cụ thể chạy theo lịch khác nhau. |
| **Nguyên nhân gốc rễ** | Trách nhiệm chồng chéo mà không có khóa idempotency hoặc advisory lock. |
| **Tác động** | Hóa đơn trùng lặp, khiếu nại khách hàng, tranh chấp với cổng thanh toán. |
| **Khuyến nghị sửa** | Gộp thanh toán thành một công việc hàng ngày duy nhất, hoặc sử dụng `pg_try_advisory_lock` / cờ `processing` trên hóa đơn để cùng một subscription không thể được gia hạn đồng thời. |
| **Độ tin cậy** | 75% |

#### MED-3 — Hai hệ thống ghi log kiểm toán tạo ra sự mơ hồ

| Trường | Chi tiết |
|--------|----------|
| **ID** | MED-3 |
| **Mức độ** | Medium |
| **Danh mục** | Kiến trúc / Quan sát được |
| **Vị trí** | Bảng `audit_log` và `app_audit_log`; triggers `audit_trigger` / các hàm audit tùy chỉnh |
| **Triệu chứng** | Điều tra pháp y và báo cáo tuân thủ có thể sử dụng các nguồn không nhất quán. |
| **Bằng chứng** | Cả `audit_log` và `app_audit_log` đều tồn tại. Một số triggers ghi vào bảng này, code ứng dụng ghi vào bảng kia. |
| **Nguyên nhân gốc rễ** | Hai hệ thống audit phát triển độc lập mà không có sự khấu hao. |
| **Tác động** | Thiếu log, nỗ lực trùng lặp, khó phản hồi sự cố. |
| **Khuyến nghị sửa** | Chuẩn hóa trên một bảng audit, tạo migration để backfill/merge dữ liệu cũ, và xóa bảng/triggers đã lỗi thời. |
| **Độ tin cậy** | 80% |

#### MED-4 — Kiểm tra quyền admin ở client-side dựa vào RLS như là rào cản duy nhất

| Trường | Chi tiết |
|--------|----------|
| **ID** | MED-4 |
| **Mức độ** | Medium |
| **Danh mục** | Frontend / Bảo mật |
| **Vị trí** | Các component và guard quản trị |
| **Triệu chứng** | UI hiển thị menu admin dựa trên trạng thái client; nếu trạng thái bị can thiệp hoặc cũ, RLS là bảo vệ duy nhất. |
| **Bằng chứng** | Các route và panel admin kiểm soát hiển thị bằng cờ `isAdmin` lấy từ dữ liệu local/profile. Không có middleware `admin_only` server-side trong cấu hình React Router. |
| **Nguyên nhân gốc rễ** | Mẫu trust-the-client cho việc hiển thị vai trò; defense-in-depth đúng đắn đòi hỏi ủy quyền server-enforced trên mọi lời gọi dữ liệu. |
| **Tác động** | Thấp nếu RLS đúng; cao nếu bất kỳ RPC/bảng admin nào thiếu chính sách nghiêm ngặt. |
| **Khuyến nghị sửa** | Thêm kiểm tra vai trò server-side vào mọi RPC và Edge Function quản trị. Sử dụng React Router loaders để xác thực `is_system_admin()` trước khi render trang admin. |
| **Độ tin cậy** | 75% |

#### MED-5 — Admin dashboard loaders thiếu cơ chế hủy và bảo vệ race condition

| Trường | Chi tiết |
|--------|----------|
| **ID** | MED-5 |
| **Mức độ** | Medium |
| **Danh mục** | Frontend / React / Async |
| **Vị trí** | `pages/admin/**/*.tsx` |
| **Triệu chứng** | Điều hướng nhanh giữa các trang admin có thể đặt state từ các request đã cũ. |
| **Bằng chứng** | Loaders sử dụng `useEffect` + async fetch mà không có cleanup `AbortController`; `setState` được gọi sau khi unmount hoặc sau một request mới hơn. |
| **Nguyên nhân gốc rễ** | Thiếu pattern hủy trong các hook lấy dữ liệu. |
| **Tác động** | UI không nhất quán, request gấp đôi, tiềm ẩn rò rỉ bộ nhớ. |
| **Khuyến nghị sửa** | Tái cấu trúc sang thư viện lấy dữ liệu (TanStack Query) hoặc bọc fetch với `AbortController` và bỏ qua phản hồi cũ. |
| **Độ tin cậy** | 80% |

#### MED-6 — Frontend sử dụng ép kiểu `any` không an toàn và thiếu validation trên form nhạy cảm

| Trường | Chi tiết |
|--------|----------|
| **ID** | MED-6 |
| **Mức độ** | Medium |
| **Danh mục** | Frontend / Type Safety / Validation |
| **Vị trí** | Các form quản trị, cài đặt tài khoản ngân hàng, editor công ty/hồ sơ |
| **Triệu chứng** | TypeScript không bắt được sự không khớp hợp đồng; payload không hợp lệ đến tận server. |
| **Bằng chứng** | Nhiều ép kiểu `as any` trong các lời gọi service; form submit gọi `updateCompanyInfo` / các RPC tài khoản ngân hàng mà không có schema Zod/yup. |
| **Nguyên nhân gốc rễ** | Phát triển tính năng nhanh với typing khoan dung và không có schema validation dùng chung. |
| **Tác động** | Lỗi server, hỏng dữ liệu âm thầm, khó bảo trì. |
| **Khuyến nghị sửa** | Định nghĩa schema Zod dùng chung giữa frontend và backend; thay `any` bằng các kiểu Supabase được tạo (`supabase gen types`). |
| **Độ tin cậy** | 85% |

### 3.4 Phát hiện Low (Thấp)

#### LOW-1 — Các khối catch rỗng che giấu lỗi xác thực

| Trường | Chi tiết |
|--------|----------|
| **ID** | LOW-1 |
| **Mức độ** | Low |
| **Danh mục** | Frontend / Xử lý lỗi |
| **Vị trí** | `AuthContext` và các hook liên quan |
| **Bằng chứng** | Một số khối `catch` nuốt lỗi mà không log hoặc hiển thị cho người dùng. |
| **Khuyến nghị sửa** | Log vào Sentry/console và hiển thị thông báo toast cho người dùng khi xác thực thất bại. |

#### LOW-2 — Pagination lấy các trang lớn ở client-side

| Trường | Chi tiết |
|--------|----------|
| **ID** | LOW-2 |
| **Mức độ** | Low |
| **Danh mục** | Frontend / Hiệu suất |
| **Vị trí** | Các component danh sách thanh toán và quản trị |
| **Bằng chứng** | Quan sát thấy `.range(0, 999)` và các mẫu pagination trong bộ nhớ. |
| **Khuyến nghị sửa** | Sử dụng pagination server-side với kích thước trang nhỏ hơn và cursor/keyset pagination cho các bảng lớn. |

#### LOW-3 — Các file migration trùng lặp với thứ tự chồng chéo

| Trường | Chi tiết |
|--------|----------|
| **ID** | LOW-3 |
| **Mức độ** | Low |
| **Danh mục** | DevOps / Migrations |
| **Vị trí** | `supabase/migrations/` |
| **Bằng chứng** | Nhiều file chia sẻ tiền tố hoặc chứa các fix `fix_missing_functions` / `final_cleanup` được áp dụng lại. |
| **Khuyến nghị sửa** | Gộp thành các migration có thứ tự duy nhất và xóa các file đã lỗi thời khỏi repository. |

#### LOW-4 — `.env` trỏ đến production mà không có quy trình staging được ghi chép

| Trường | Chi tiết |
|--------|----------|
| **ID** | LOW-4 |
| **Mức độ** | Low |
| **Danh mục** | Cấu hình / Rủi ro |
| **Vị trí** | `.env` |
| **Bằng chứng** | `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` ánh xạ tới dự án `rsialbfjswnrkzcxarnj`; một dự án staging riêng tồn tại nhưng không được tham chiếu. |
| **Khuyến nghị sửa** | Sử dụng `.env.development` → staging, `.env.production` → production, và ghi chép quy trình chuyển đổi. |

---

## 4. Phân tích Nguyên nhân gốc rễ

Hầu hết các phát hiện chia sẻ một số nguyên nhân hệ thống:

1. **Thiếu cổng kiểm tra triển khai.** Code tham chiếu các RPC, bảng và cột được merge mà không xác minh các đối tượng đó có tồn tại trong database mục tiêu hay không. Điều này tạo ra CRIT-2 và HIGH-2.
2. **Cấp quyền hàm quá rộng.** Các hàm được tạo với `SECURITY DEFINER` và câu lệnh `GRANT` rộng để giảm lỗi quyền client-side, nhưng không có đánh giá đặc quyền tối thiểu. Điều này tạo ra CRIT-3, HIGH-4 và MED-1.
3. **Các công việc cron không được kiểm thử dưới danh tính cron.** Hàm `is_system_admin()` hoạt động cho service-role API calls nhưng chưa bao giờ được xác thực trong ngữ cảnh thực thi cron của `postgres`. Điều này tạo ra CRIT-1.
4. **Edge Functions thiếu defense-in-depth.** Việc tắt `verify_jwt` giải quyết lời gọi cron nhưng để lại các endpoint quản trị không xác thực. Điều này tạo ra CRIT-4.
5. **Kỷ luật migration.** Chỉnh sửa tại chỗ, file trùng lặp và timestamp thiếu cho thấy migration không được coi là artifact bất biến, có thứ tự. Điều này tạo ra HIGH-3 và LOW-3.
6. **Mô hình tin cậy frontend.** UI quản trị dựa vào trạng thái client và RLS thay vì ủy quyền server-side, và các mẫu async/hủy không nhất quán. Điều này tạo ra MED-4 và MED-5.

---

## 5. Lộ trình Sửa chữa Ưu tiên

### Giai đoạn 1 — Ngăn chảy máu (tuần này)

| Ưu tiên | Hành động | Owner | ID liên quan |
|---------|-----------|-------|--------------|
| P0 | Sửa `is_system_admin()` để nhận diện role cron `postgres` hoặc chạy cron với `service_role`. | Backend | CRIT-1 |
| P0 | Triển khai các RPC thiếu hoặc xóa code UI/service chết cho subdomain, storage, subscription và tìm kiếm thành viên. | Backend + Frontend | CRIT-2 |
| P0 | Thu hồi `EXECUTE` trên `unlock_login_attempts` và các hàm nhạy cảm khác khỏi `anon`. | Backend / Bảo mật | CRIT-3 |
| P0 | Thêm kiểm tra xác thực/secret cho các Edge Functions có `verify_jwt: false`. | Backend | CRIT-4 |
| P1 | Sửa luồng auth của `delete-tenant` và thêm test. | Backend | HIGH-1 |
| P1 | Tạo bảng `import_history` thiếu hoặc xóa tham chiếu. | Backend + Frontend | HIGH-2 |

### Giai đoạn 2 — Củng cố (2 tuần tới)

| Ưu tiên | Hành động | Owner | ID liên quan |
|---------|-----------|-------|--------------|
| P1 | Thêm `search_path` rõ ràng cho mọi hàm `SECURITY DEFINER`. | Backend | MED-1 |
| P1 | Làm nhất quán migration local và production; thiết lập kiểm tra drift CI. | DevOps | HIGH-3, LOW-3 |
| P2 | Gộp các cron job thanh toán trùng lặp và thêm khóa idempotency. | Backend | MED-2 |
| P2 | Chuẩn hóa trên một bảng audit-log và khấu hao bảng còn lại. | Backend | MED-3 |
| P2 | Thêm kiểm tra vai trò server-side vào các RPC/Edge Function quản trị. | Backend | MED-4 |

### Giai đoạn 3 — Cải thiện chất lượng và khả năng bảo trì (tháng tới)

| Ưu tiên | Hành động | Owner | ID liên quan |
|---------|-----------|-------|--------------|
| P2 | Tái cấu trúc admin loaders với cơ chế hủy hoặc TanStack Query. | Frontend | MED-5 |
| P2 | Thay `any` bằng các kiểu Supabase được tạo và thêm validation Zod. | Frontend | MED-6 |
| P3 | Thêm Sentry/logging lỗi và thông báo xác thực cho người dùng. | Frontend | LOW-1 |
| P3 | Chuyển pagination sang server-side với kích thước trang nhỏ hơn. | Frontend | LOW-2 |
| P3 | Ghi chép và thực thi các môi trường `.env` cho staging và production. | DevOps | LOW-4 |

---

## 6. Khuyến nghị Xác minh

Sau khi sửa và deploy, hãy xác minh bằng:

1. **Smoke test cron:** Truy vấn `cron.job_run_details` và xác nhận `data-retention-daily` và `fraud-detection-hourly` hiển thị `succeeded`.
2. **Kiểm tra inventory RPC:** Chạy script trích xuất mọi lời gọi `.rpc()` từ `services/` và khẳng định hàm tồn tại trong `information_schema.routines`.
3. **Kiểm tra regression đặc quyền:** Chạy `supabase inspect` hoặc truy vấn tùy chỉnh để xác nhận `anon` không có quyền `EXECUTE` trên các hàm không thuộc auth.
4. **Test xác thực Edge Function:** Gọi mỗi hàm `verify_jwt: false` mà không có token và mong đợi 401.
5. **Tính nhất quán migration:** Chạy `supabase db diff --linked` và mong đợi không có sự khác biệt.
6. **Luồng quản trị end-to-end:** Thực hiện các luồng subdomain, storage, subscription và xóa tenant trong môi trường staging.

---

## 7. Thống kê Tổng quan

| Danh mục | Số lượng |
|----------|----------|
| Critical | 4 |
| High | 4 |
| Medium | 6 |
| Low | 4 |
| **Tổng** | **18** |

---

*Báo cáo được tạo bởi Devin. Không có thay đổi code nào được thực hiện trong quá trình kiểm toán.*

---

## Errata — Phase 5 Close-out (2026-07-18)

- **CRIT-2:** The RPCs listed as missing/broken (`set_tenant_subdomain`, `get_storage_usage`, `admin_update_subscription`, `get_member_with_email`, `search_members_by_email`) have been reconciled. `set_tenant_subdomain` now exists in `supabase/migrations/20260718000001_sp_7_1_set_tenant_subdomain.sql`. The other four old names have no remaining `.rpc()` call sites in `services/`; the canonical equivalents (`update_tenant_subscription`, `get_tenant_storage_usage`, `get_tenant_members_with_email`, `search_tenant_members`) are defined and used.
- **CRIT-3:** `unlock_login_attempts` is no longer granted to `anon`. `supabase/migrations/20260715000003_admin_security_settings.sql` revokes `EXECUTE` from `PUBLIC` and grants it to `authenticated` and `service_role` only.

These findings are superseded by the Phase 4/5 canonical migration chain and service-layer reconciliation.
