# Key Rotation Runbook — Admin Dashboard

## Scope

Rotate các secret/key quan trọng: Supabase service role key, anon key, JWT secret, API keys (Stripe/VNPay/Momo), 2FA/TOTP seeds.

## Frequency

- Supabase service role / anon keys: 90 ngày hoặc khi nghi ngờ leak.
- Payment provider API keys: 90 ngày hoặc theo yêu cầu provider.
- 2FA/TOTP seeds: khi user report compromised device.

## Owner

- Primary: VietSale Pro Engineering
- Approval: Project owner

## Prerequisites

- Access Supabase dashboard (Project Settings -> API).
- Access Vercel dashboard (Environment Variables).
- Access payment provider dashboards (Stripe, VNPay, Momo).

## Steps

### 1. Supabase JWT Secret / API Keys

> Cảnh báo: rotating JWT secret sẽ log out tất cả users.

1. Thông báo downtime/maintenance window.
2. Vào Supabase dashboard -> Project Settings -> API -> Regenerate keys.
3. Cập nhật `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` trong Vercel env.
4. Redeploy production.
5. Verify health-check và smoke tests.
6. Notify users to re-login.

### 2. Payment Provider Keys

1. Tạo key mới trong dashboard provider.
2. Cập nhật env vars: `STRIPE_SECRET_KEY`, `VNPAY_HASH_SECRET`, `MOMO_SECRET_KEY`.
3. Chạy một payment smoke test (dry-run hoặc $0 transaction).
4. Xóa key cũ sau khi xác nhận ổn định 24h.

### 3. Webhook Signing Secrets

1. Tạo secret mới trong provider dashboard.
2. Cập nhật `STRIPE_WEBHOOK_SECRET`, `VNPAY_WEBHOOK_SECRET`, v.v.
3. Gửi test event để verify signature.

### 4. 2FA / TOTP Backup Codes

1. User hoặc admin yêu cầu reset 2FA.
2. Verify identity qua email/SMS/support process.
3. Gọi RPC `delete_2fa_backup_codes(p_user_id)`.
4. User setup TOTP mới và generate backup codes.

## Verification

- `admin-health-check` edge function trả về `ok: true` (exercises RPCs defined in `D-P3-01_Reconciled_RPC_Contract.md`).
- Re-run `D-034-01` deployment validation gate checks PASS.
- Login flow hoạt động.
- Payment webhook test PASS.
- RPC parity with `D-P3-01_Reconciled_RPC_Contract.md` PASS (`npm run audit:rpc`).
- Không còn secret cũ trong env.

## Post-Rotation

- Ghi log vào `Plan/Log/KEY_ROTATION-<timestamp>.md`.
- Cập nhật bảng theo dõi rotation.
- Re-confirm `D-034-01` deployment validation gate PASS and RPC parity with `D-P3-01_Reconciled_RPC_Contract.md`.
- Review audit log để phát hiện hoạt động bất thường.

## Key Inventory

| Key | Location | Rotation cadence | Last rotated |
|-----|----------|------------------|--------------|
| SUPABASE_SERVICE_ROLE_KEY | Vercel env + Supabase | 90 days | TBD |
| SUPABASE_ANON_KEY | Vercel env + Supabase | 90 days | TBD |
| JWT Secret | Supabase | 90 days | TBD |
| STRIPE_SECRET_KEY | Vercel env | 90 days | TBD |
| VNPAY_HASH_SECRET | Vercel env / edge secrets | 90 days | TBD |
| MOMO_SECRET_KEY | Vercel env / edge secrets | 90 days | TBD |
| Webhook secrets | Vercel env | 90 days | TBD |
