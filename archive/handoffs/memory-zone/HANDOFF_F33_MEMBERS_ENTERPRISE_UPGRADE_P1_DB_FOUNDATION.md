# HANDOFF F33 — P1: DB Foundation

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Chỉ làm schema cho `tenant_memberships`. Không đụng UI/edge/service.

## Files tạo mới

- `supabase/migration_f33_members_foundation.sql`

## Nội dung migration

1. Thêm cột:
   - `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','inactive'))`
   - `is_active BOOLEAN NOT NULL DEFAULT true`
   - `invited_at TIMESTAMPTZ DEFAULT now()`
   - `accepted_at TIMESTAMPTZ`
2. Backfill:
   - `status = 'active'` nếu `auth.users.last_sign_in_at` IS NOT NULL, ngược lại `pending`.
   - `invited_at = created_at` cho dữ liệu cũ.
   - `accepted_at = last_sign_in_at` cho các row active.
3. Indexes:
   - `tenant_memberships(tenant_id, status)`
   - `tenant_memberships(tenant_id, role)`
   - `tenant_memberships(tenant_id, is_active)`

## Files tham khảo

- `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` (để xem `is_tenant_admin` đã tồn tại, dùng sau cho RPC).

## Tiêu chí chấp nhận

- [ ] Migration chạy thành công trên local/production.
- [ ] `tenant_memberships` có đủ 4 cột mới.
- [ ] Dữ liệu cũ được backfill đúng active/pending.
- [ ] 3 indexes tồn tại.

## Verify

```bash
npm run lint
npm run build
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P2_SEARCH_RPC.md`
