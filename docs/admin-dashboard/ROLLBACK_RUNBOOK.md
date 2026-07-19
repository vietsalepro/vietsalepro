# Rollback Runbook — Admin Dashboard

## Scope

Rollback code, migration, hoặc config khi deploy gây lỗi production.

## Trigger

- Health-check FAIL sau deploy.
- Error rate tăng > 5% so với baseline.
- User report hàng loạt.
- RLS/function grant audit FAIL.
- `D-034-01_Deployment_Validation_Gate_Definition.md` gate fail/abort during promotion.

## Owner

- Primary: VietSale Pro Engineering
- Approval: Project owner (nếu SEV-1)

## Steps

### 1. Stop the bleeding

1. Bật maintenance mode nếu cần (`set_maintenance_mode` RPC).
2. Thông báo nội bộ/status page.

### 2. Rollback code

#### Vercel frontend rollback

1. Vào Vercel dashboard -> project -> Deployments.
2. Chọn deployment trước đó đang chạy ổn định.
3. Click "Promote to Production".
4. Verify production URL hoạt động.

#### Git rollback

```bash
# Find last good commit
git log --oneline -10

# Revert PR/commit
git revert --no-commit <bad-commit-hash>
git commit -m "rollback: revert <bad-commit-hash>"
git push origin main
```

### 3. Rollback database migration

> Lưu ý: Supabase migrations không hỗ trợ rollback tự động. Phải viết migration ngược dưới dạng file mới trong `supabase/migrations/` (ascending lexicographic sort) hoặc restore PITR. The canonical migration source is `supabase/migrations/*.sql`.

Option A: Reverse migration
1. Tạo migration mới trong `supabase/migrations/` undo thay đổi (ví dụ drop column, revoke grant).
2. Apply: `supabase migration up`.
3. Verify against `D-034-01_Deployment_Validation_Gate_Definition.md` and `D-P3-01_Reconciled_RPC_Contract.md`.

Option B: PITR restore
1. Dùng Supabase dashboard restore về thời điểm trước migration.
2. Xem `DISASTER_RECOVERY_RUNBOOK.md`.

### 4. Verify rollback

- `npm run lint && npm run build && npx vitest run && npm run audit:rpc` (audit validates against `D-P3-01_Reconciled_RPC_Contract.md`).
- Health-check `ok: true`.
- Smoke tests PASS.
- Reference artifact checksums match `D-035-01_Deployment_Readiness_Evidence.md` §6.1 (`supabase/schema.sql`, `supabase/generated/database.types.ts`).

### 5. Post-rollback

1. Tắt maintenance mode.
2. Viết incident report.
3. Lập kế hoạch fix root cause trước khi redeploy.

## Verification Checklist

- [ ] Production deployment ổn định.
- [ ] Error rate trở lại baseline.
- [ ] No new failed migrations.
- [ ] Stakeholders notified.
- [ ] `D-034-01` deployment validation gate PASS
- [ ] `D-035-01` reference artifact checksums verified (`supabase/schema.sql`, `supabase/generated/database.types.ts`)

## Template: Reverse Migration

```sql
-- Example: undo a column addition safely
ALTER TABLE public.tenants DROP COLUMN IF EXISTS <column_name>;
```

Always wrap destructive changes in `IF EXISTS`.
