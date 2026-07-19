# SP-6.1: Email Service Integration

## Thời gian
2026-07-13 07:54:19

## Branch làm việc
`feat/SP-5.6-db-maintenance` (hiện tại). SP-6.1 chưa tách branch riêng; code được thêm vào working tree hiện tại.

## Mục tiêu
Tích hợp dịch vụ email gửi qua Resend/SendGrid edge function với template variables.

## Files đã thay đổi

### Code chính
- `supabase/functions/send-email/index.ts` — Edge Function nhận `template_key`, `to`, `variables`, render template, gọi Resend API.
- `supabase/functions/_shared/email.ts` — Shared helpers `escapeHtml`, `renderTemplate`, `wrapWithBrand` (chạy được cả Deno và Node test).
- `services/emailTemplateService.ts` — Thêm `sendEmail()` invoke `send-email` edge function.
- `components/EmailTemplateManager.tsx` — Cập nhật gửi thử template dùng `sendEmail` thay vì `sendTemplateEmail`.

### Tests
- `tests/edge-functions/send-email.test.ts` — Unit test helpers render + brand wrapper.
- `tests/smoke/admin-dashboard-p12-2-email-templates.test.ts` — Thêm test `sendEmail` success/error.
- `tests/mocks/supabase.ts` — Mock `send-email` tương tự `send-template-email`.

### Edge Function artifact
- `Plan/EdgeFunction/send-email.ts` — Bản sao của `supabase/functions/send-email/index.ts`.

## Migrations sinh ra
Không có migration mới trong phase này. SP-6.1 dùng lại:
- Bảng `email_templates` và RPC `get_email_template_by_key`, `get_email_brand` từ migration `20250707000008_phase_p12_2_email_templates.sql`.

## Edge Functions sinh ra
- `supabase/functions/send-email/index.ts`
- `supabase/functions/_shared/email.ts`

## Kiểm thử đã chạy
- `npm run lint` — PASS (`tsc --noEmit`).
- `npx vitest run tests/edge-functions/send-email.test.ts tests/smoke/admin-dashboard-p12-2-email-templates.test.ts` — PASS (18 tests).
- `npx vitest run` — PASS (541 tests, no regressions).
- `npm run build` — PASS.

## Code review tự kiểm
- Không hardcode API key/secret; `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` lấy từ `Deno.env`.
- Validate input `template_key`, `to` trước khi xử lý.
- Không có SQL injection (dùng RPC/parametrized, không nối chuỗi query).
- Escape HTML giá trị biến trước khi render để giảm XSS.
- Xử lý lỗi network từ Resend API.

## Trạng thái commit/push
- Phase SP-6.1 **chưa commit** riêng.
- Phase SP-6.1 **chưa push**.
- Working tree hiện tại còn chứa các thay đổi chưa commit của các phase trước (SP-4.4 webhook, SP-5.7 storage, v.v.).

## Lưu ý
- `send-template-email` edge function vẫn tồn tại và hoạt động để đảm bảo backward compatibility.
- `send-email` là entry point mới theo yêu cầu SP-6.1; UI `EmailTemplateManager` đã chuyển sang dùng nó.
