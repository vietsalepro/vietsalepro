# Handoff — Phase 5 Long-term Hardening (phần thủ công)

> File này dành cho chat tiếp theo. **Không được tự ý chạy lệnh destructive** (deploy production, xóa dữ liệu, sửa grants hàng loạt) cho đến khi user chọn option.
> Chat tiếp theo phải **giải thích dân dã** từng lựa chọn, không dùng từ ngữ kỹ thuật quá cao siêu.

---

## 1. Bối cảnh đã làm được gì

Phase 5 gồm 2 phần:

- **Phần code** đã xong: contract RPC, audit script, defensive mapping, feature flags, health-check edge function, grants migration, runbook update.
- **Phần thủ công / quyết định** còn lại trong file này.

Các file code quan trọng đã tạo/sửa:

| File | Mục đích |
|------|----------|
| `scripts/audit-rpc-contracts.ts` | Kiểm tra RPC trong code và trong tài liệu có khớp nhau không |
| `scripts/audit-grants.sql` | Query xem function nào trong DB đang được grants cho ai |
| `supabase/migrations/20250711000001_phase_5_long_term_explicit_grants.sql` | Migration backfill REVOKE/GRANT cho toàn bộ public functions |
| `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql` | Gán default feature flags admin dashboard cho các tenant hiện có |
| `supabase/functions/admin-health-check/index.ts` | Endpoint kiểm tra sức khỏe các RPC chính |
| `docs/admin-dashboard/MIGRATION_RUNBOOK.md` | Runbook có ownership table, deployment workflow, checklist |
| `hooks/useAdminFeatureFlags.ts` | Hook đọc feature flags GDPR / analytics / impersonation / read-replica |

---

## 2. Các việc còn lại cần user quyết định

### 2.1 Kiểm tra & áp dụng grants trên production

**Vấn đề là gì? (dân dã)**

Database có nhiều hàm (function) dạng `get_xxx`, `search_xxx`, `create_xxx`. Hiện tại có thể một số hàm đang mở quyền cho PUBLIC (tức là ai cũng gọi được), một số khác lại thiếu quyền cho tài khoản `authenticated` hoặc `service_role`. Nếu không sửa, hacker hoặc lỗi cấu hình có thể gọi những hàm không mong muốn, hoặc ứng dụng của bạn bị lỗi vì thiếu quyền.

**Các lựa chọn**

| Option | Ý nghĩa | Ưu nhược điểm | Khuyến nghị |
|--------|---------|---------------|-------------|
| **A. Chạy migration backfill toàn bộ** | Chạy file `20250711000001_phase_5_long_term_explicit_grants.sql` trên production | Nhanh, đảm bảo tất cả function đều có grants đúng. Rủi ro thấp vì chỉ sửa quyền, không xóa dữ liệu. | **Khuyến nghị chọn** |
| **B. Audit trước, chỉ sửa function thiếu** | Chạy `scripts/audit-grants.sql`, sau đó tạo migration riêng cho từng function còn thiếu | An toàn hơn nhưng tốn thời gian, dễ sót | Nếu bạn muốn kiểm soát từng bước |
| **C. Bỏ qua** | Không làm gì | Nhanh nhất nhưng để lại lỗ hổng / lỗi permission tiềm ẩn | Không khuyến khích |

**Trạng thái:** ✅ Đã hoàn thành.

- Migration `20250711000001_phase_5_long_term_explicit_grants.sql` đã được áp dụng lên staging và production qua Supabase MCP (`apply_migration`) vào 2026-07-12.
- Tất cả public functions hiện có grants đúng (`REVOKE PUBLIC`, `GRANT authenticated`, `GRANT service_role`).

---

### 2.2 Cấu hình monitoring / alerting cho health-check endpoint

**Vấn đề là gì? (dân dã)**

Đã có endpoint `admin-health-check` để kiểm tra hệ thống còn sống không. Nhưng endpoint vô dụng nếu không có ai gọi định kỳ và báo động khi nó bị lỗi. Cần một dịch vụ bên ngoài ping endpoint 5 phút/lần và gửi cảnh báo.

**Các lựa chọn**

| Option | Ý nghĩa | Ưu nhược điểm | Khuyến nghị |
|--------|---------|---------------|-------------|
| **A. Uptime Robot** (free) | Dịch vụ miễn phí, cấu hình URL + interval 5 phút + email/Slack alert | Miễn phí, đơn giản. Gói free giới hạn số monitor. | **Khuyến nghị chọn nếu muốn free & đơn giản** |
| **B. Better Stack** | Dịch vụ trả phí, mạnh hơn (incident, on-call, dashboard) | Nhiều tính năng nhưng tốn phí. | Nếu bạn cần on-call hoặc nhiều monitor |
| **C. Cron tự viết** | Viết edge function / cron job riêng gọi health-check rồi gửi email/Slack | Kiểm soát cao nhưng phải tự bảo trì. | Nếu bạn có team DevOps và muốn tự làm |

**Thông tin cần user cung cấp**

- Chọn A, B hay C?
- URL công khai của edge function `admin-health-check` (sau khi deploy).
- Kênh nhận cảnh báo: email nào? Slack webhook nào?

**Trạng thái:** ✅ User chọn **Option A — Uptime Robot (free)**.

**Cấu hình cần làm:**

1. ✅ Deploy edge function `admin-health-check` lên staging và production.
2. ✅ Kiểm tra endpoint hoạt động:
   - Staging: `https://shbmzvfcenbybvyzclem.supabase.co/functions/v1/admin-health-check` → `ok: true`
   - Production: `https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/admin-health-check` → `ok: true`
3. Đăng nhập Uptime Robot dashboard → tạo monitor mới:
   - **URL:** `https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/admin-health-check`
   - **Interval:** 5 phút
   - **Alert contact:** `vietsalepro86@gmail.com`
   - **Keyword check (optional):** `"ok":true` để đảm bảo response không chỉ HTTP 200 mà còn có `ok: true`

> Edge function này dùng `service_role` để tự kiểm tra RPC, không trả về dữ liệu nhạy cảm. Đảm bảo bạn đã deploy trước khi thêm vào Uptime Robot.

---

### 2.3 Điền owner / contact cho từng component

**Vấn đề là gì? (dân dã)**

Khi hệ thống lỗi, cần biết ai là người phụ trách từng phần để gọi đúng người. Đã có bảng trong runbook nhưng chưa có tên + liên hệ thật.

**Quyết định cần user làm**

Cung cấp tên và contact (email / Slack) cho các ông chủ sau:

| Component | Vai trò | Cần điền |
|-----------|---------|----------|
| Admin Dashboard UI | Frontend Team | Tên + contact |
| RPC Functions | Backend/DBA | Tên + contact |
| Edge Functions | Platform Team | Tên + contact |
| Supabase Project | DevOps | Tên + contact |
| Feature Flags | Product/Frontend | Tên + contact |
| Audit & Compliance | Security Lead | Tên + contact |

**Trạng thái:** ✅ Đã cập nhật.

User chọn dùng chung một contact cho tất cả component:

| Component | Owner | Contact |
|-----------|-------|---------|
| Tất cả | VietSale Pro | vietsalepro86@gmail.com |

Đã cập nhật trong `docs/admin-dashboard/MIGRATION_RUNBOOK.md`.

---

### 2.4 Multi-environment deployment workflow

**Vấn đề là gì? (dân dã)**

Hiện tại có thể code đang đẩy thẳng lên production. Nếu có lỗi, khách hàng sẽ gặp ngay. Cần có môi trường staging để thử trước.

**Các lựa chọn**

| Option | Ý nghĩa | Ưu nhược điểm | Khuyến nghị |
|--------|---------|---------------|-------------|
| **A. Supabase CLI với staging project** | Local → `supabase db push --linked-staging` → test → `supabase db push` production | Chuẩn, dễ audit, dễ rollback. Cần 2 Supabase project (staging + prod). | **Khuyến nghị chọn** |
| **B. Supabase Branching / Preview** | Dùng tính năng preview branch của Supabase | Tự động hóa cao nhưng có thể tốn phí và phức tạp. | Nếu bạn dùng Supabase Pro/Team |
| **C. Deploy thủ công theo mô tả trong file** | Chỉ ghi quy trình ra giấy, thực hiện bằng tay | Không tốn tiền nhưng dễ quên bước, khó kiểm tra. | Chỉ nếu team rất nhỏ |

**Quyết định cần user làm**

- Chọn A, B hay C?
- Cung cấp tên / ref của staging project (nếu chọn A).

**Trạng thái:** ✅ Đã ghi nhận.

Workflow trong `docs/admin-dashboard/MIGRATION_RUNBOOK.md` đã chuẩn hóa:

```
local dev → staging (shbmzvfcenbybvyzclem) → production (rsialbfjswnrkzcxarnj)
```

User quyết định thời điểm deploy production theo sự chủ động của mình, không cố định khung giờ.

---

### 2.5 Khung giờ deploy production

**Vấn đề là gì? (dân dã)**

Deploy có thể gây gián đoạn vài phút. Nên chọn lúc ít người dùng nhất.

**Quyết định cần user làm**

- Múi giờ chính của người dùng là gì? (ví dụ: GMT+7)
- Khung giờ thấp điểm mong muốn? (ví dụ: 02:00–05:00 sáng)

**Trạng thái:** ✅ Đã ghi nhận.

User quyết định deploy production theo sự chủ động của mình, không cố định khung giờ thấp điểm. Runbook đã được cập nhật để phản ánh điều này.

---

### 2.6 Đào tạo team về contract-first migrations

**Vấn đề là gì? (dân dã)**

Luật mới: mỗi khi thêm RPC phải cập nhật `RPC_CONTRACTS.md`, mỗi migration tạo function phải kèm REVOKE/GRANT. Cả team cần biết để không tái phạm lỗi cũ.

**Quyết định cần user làm**

- Chọn hình thức: **meeting ngắn 30 phút**, **viết tài liệu nội bộ**, hay **thêm checklist vào PR template**.

**Trạng thái:** ✅ User chọn **thêm checklist vào PR template**.

`docs/admin-dashboard/MIGRATION_RUNBOOK.md` và `.github/PULL_REQUEST_TEMPLATE.md` đã có sẵn các mục bắt buộc:

- Nếu thêm/đổi admin RPC → cập nhật `docs/admin-dashboard/RPC_CONTRACTS.md`.
- Nếu tạo/đổi PostgreSQL function → thêm `REVOKE ALL ... FROM PUBLIC;` và `GRANT EXECUTE ... TO authenticated, service_role;`.
- Nếu đổi feature flags → cập nhật `hooks/useAdminFeatureFlags.ts` và migration defaults.
- Nếu đổi admin RPCs hoặc edge functions → xác nhận `admin-health-check` vẫn trả về `ok: true`.
- Applied migration lên staging trước khi nghĩ đến production.

---

## 3. Checklist tuyệt đối bắt buộc cho chat sau

Trước khi làm bất kỳ việc nào ở mục 2, chat sau phải:

1. **Giải thích dân dã** tại sao cần làm và 3 option là gì.
2. **Chờ user chọn option rõ ràng** — không được tự động chọn A vì nó là khuyến nghị.
3. **Xác nhận lại** với user: "Bạn chọn option X, tôi sẽ làm Y, có đúng không?"
4. Nếu có bước ảnh hưởng production (deploy, grants hàng loạt), **phải nói rõ rủi ro và thời điểm thực hiện**.
5. Sau khi làm xong, **chạy lại `npm run lint`, `npx vitest run`, `npm run build`, `npm run audit:rpc`** để đảm bảo không phá gì.

---

## 4. Quyết định mặc định nếu user không chọn

Nếu user chỉ nói "làm đi" mà không chọn option, chat sau nên **ưu tiên option A** cho các mục có A:

- 2.1: Option A — chạy migration backfill grants.
- 2.2: Option A — Uptime Robot miễn phí.
- 2.4: Option A — Supabase CLI staging → production.
- 2.6: Option B/C — PR template + tài liệu ngắn (ít tốn thời gian nhất).

Vẫn phải **thông báo trước** với user: "Nếu bạn không chọn, tôi sẽ đi theo option A vì lý do Z. Bạn có đồng ý không?"

---

## 5. Liên kết nhanh

- File gốc kế hoạch: `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md`
- Runbook: `docs/admin-dashboard/MIGRATION_RUNBOOK.md`
- RPC contracts: `docs/admin-dashboard/RPC_CONTRACTS.md`
- Grants migration: `supabase/migrations/20250711000001_phase_5_long_term_explicit_grants.sql`
- Feature flags migration: `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql`
- Health-check edge function: `supabase/functions/admin-health-check/index.ts`
