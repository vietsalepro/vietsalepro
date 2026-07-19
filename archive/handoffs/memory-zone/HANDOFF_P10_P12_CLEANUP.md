# Handoff: Cleanup quyền EXECUTE P10.1/P10.2 + fix migration history & OpenSpec tracking

> Phiên trước đã audit các phase P9.2 → P12.2 của Admin Dashboard. Code hiện pass `npm run lint`, `npm run build`, `npx vitest run` (135/135 tests). Tuy nhiên còn 2 vấn đề cần xử lý trong phiên tiếp theo.

---

## 1. Vấn đề cần fix

### A. P10.1 + P10.2 — Thiếu cleanup quyền EXECUTE trên RPC

Các migration P10.1 và P10.2 tạo hàm RPC nhưng **không có `REVOKE ... FROM PUBLIC` / `GRANT EXECUTE ... TO authenticated, service_role`**, trong khi mọi migration RPC khác (P9.1, P9.2, P12.1, P12.2) đều làm đầy đủ.

Các hàm bị ảnh hưởng:

- P10.1: `public.get_promo_code_usage_counts(UUID)`, `public.validate_promo_code(TEXT, UUID, NUMERIC)`
- P10.2: `public.promotion_rule_matches(UUID, UUID, TEXT)`, `public.apply_voucher_to_invoice(UUID, TEXT)`

Hệ quả:
- Hiện tại PostgreSQL mặc định grant `EXECUTE` cho `PUBLIC` nên code vẫn chạy, nhưng vi phạm quy ước dự án và để lại quyền truy cập công khai.
- `apply_voucher_to_invoice` là `SECURITY INVOKER` và bên trong gọi `validate_promo_code` + `promotion_rule_matches` (cũng `SECURITY INVOKER`). Nếu sau này DB bị lockdown, 3 hàm đều có thể bị từ chối hoặc chỉ 1 trong 3 bị thiếu quyền thì cả luồng áp voucher sẽ fail.

Frontend đang gọi đúng các RPC này qua `services/promotionService.ts` → `components/InvoiceManager.tsx`, `components/VoucherManager.tsx`.

### B. Migration history mismatch

Handoff P10.1 ghi nhận phải deploy bằng `supabase db query` vì `supabase db push` báo lịch sử migration không khớp. Cần kiểm tra/đồng bộ lại trước khi push thêm migration.

### C. OpenSpec tracking thiếu / lệch

- `OPENSPEC_USAGE_ADMIN.md` mới cập nhật tới P9.2; chưa phản ánh P10.1–P12.2 đã hoàn thành.
- Các change P10.1, P10.2, P10.3, P11.1, P11.2, P12.1 chỉ có `tasks.md` (hoặc thiếu `.openspec.yaml`), nên `npx openspec validate --changes` không cover.
- P12.2 `handoff.md` để các ô verification chưa tick dù `tasks.md` đã tick và tests pass.

---

## 2. Task list cho phiên tiếp theo

### 2.1. Backup
- Tạo backup project trước khi sửa: `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_<YYYYMMDD_HHMMSS>`
- Baseline: chạy `npm run lint && npm run build && npx vitest run` để xác nhận vẫn pass.

### 2.2. Sửa migration P10.1 — thêm GRANT/REVOKE
File: `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql`

Sau khi định nghĩa 2 hàm, thêm:

```sql
REVOKE ALL ON FUNCTION public.get_promo_code_usage_counts(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_promo_code_usage_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_promo_code_usage_counts(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.validate_promo_code(TEXT, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(TEXT, UUID, NUMERIC) TO service_role;
```

### 2.3. Sửa migration P10.2 — thêm GRANT/REVOKE
File: `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql`

Sau khi định nghĩa 2 hàm, thêm:

```sql
REVOKE ALL ON FUNCTION public.promotion_rule_matches(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promotion_rule_matches(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promotion_rule_matches(UUID, UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.apply_voucher_to_invoice(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_voucher_to_invoice(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_voucher_to_invoice(UUID, TEXT) TO service_role;
```

Lưu ý: vì `apply_voucher_to_invoice` gọi `validate_promo_code` và `promotion_rule_matches` bên trong, cả 3 hàm đều phải có `EXECUTE` cho `authenticated`. Nếu muốn giảm phụ thuộc, có thể chuyển `promotion_rule_matches` sang `SECURITY DEFINER` thay vì grant.

### 2.4. Fix migration history & deploy
- `supabase migration list` để xem local/remote có khớp không.
- Nếu mismatch vẫn còn: dùng `supabase migration repair ...` hoặc đồng bộ lại history theo quy trình dự án (KHÔNG xóa tay migration_history trừ khi đã hiểu rõ).
- Deploy 2 migration đã sửa. Nếu dự án quy định không edit migration cũ đã deploy, thì tạo delta migration mới thay thế.
- Kiểm tra trên remote: gọi thử `validate_promo_code` và `apply_voucher_to_invoice` với user authenticated system admin.

### 2.5. Cập nhật OpenSpec tracking
- Cập nhật `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC/OPENSPEC_USAGE_ADMIN.md` — thêm P10.1–P12.2 vào bảng tiến độ.
- Đảm bảo các change P10.1–P12.2 có `.openspec.yaml` đầy đủ trong `OPENSPEC/openspec/changes/` (hoặc archive đúng cách nếu đã xong).
- Tick verification trong `handoff.md` và `review.md` của P12.2.
- Chạy `npx openspec validate --changes --store admin-dashboard` và đảm bảo P10–P12 xuất hiện + pass.

### 2.6. Verification
- `npm run lint`
- `npm run build`
- `npx vitest run`
- Smoke test voucher/promotion trên remote nếu có credentials.

---

## 3. Files liên quan

- `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql`
- `supabase/migrations/20250707000004_phase_p10_2_voucher_invoice_apply.sql`
- `services/promotionService.ts`
- `components/InvoiceManager.tsx`
- `components/VoucherManager.tsx`
- `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC/OPENSPEC_USAGE_ADMIN.md`
- `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC/openspec/changes/admin-dashboard-p10-1-voucher-promotion-schema/handoff.md`
- `memory-zone/KE_HOACH/Admin_dashboard/OPENSPEC/openspec/changes/archive/2026-07-07-admin-dashboard-p12-2-email-templates/handoff.md`

---

## 4. Rollback trigger

- Build/test fail sau khi sửa migration.
- Remote deploy fail hoặc RPC vẫn bị permission denied.
- Migration history bị hỏng thêm.
- Dữ liệu production bị ảnh hưởng.
