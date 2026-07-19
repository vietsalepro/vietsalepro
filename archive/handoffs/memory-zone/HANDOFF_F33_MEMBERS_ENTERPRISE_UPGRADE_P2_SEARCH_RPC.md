# HANDOFF F33 — P2: search_tenant_members RPC

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Tạo RPC phân trang/tìm kiếm/lọc/sắp xếp. Thay thế `get_tenant_members_with_email`.

## Files tạo mới

- `supabase/migration_f33_members_search_rpc.sql`

## Input/Output

- Input: `p_tenant_id uuid`, `p_search text`, `p_role text`, `p_status text`, `p_is_active boolean`, `p_sort_by text`, `p_sort_dir text`, `p_page int`, `p_page_size int`.
- Output: `{ items: [...], total_count: int }`.

## Yêu cầu

- Authorization: `public.is_system_admin()` HOẶC `public.is_tenant_admin(p_tenant_id)`.
- Filter: search `ILIKE` email, role, status, is_active.
- Sort: `email`, `role`, `status`, `created_at`, `last_sign_in_at`.
- Return columns: `email`, `invited_by_email`, `status`, `is_active`, `invited_at`, `accepted_at`, `last_sign_in_at`, `confirmed_at`, `created_at`, `updated_at`.
- Offset = `(p_page - 1) * p_page_size`.

## Files tham khảo

- `supabase/migrations/20250703000000_baseline_pre_tenant_schema.sql` dòng 9280-9314: `get_tenant_members_with_email`.
- `supabase/migrations/20250704000000_phase2_tenant_foundation.sql` dòng 70-78: `is_tenant_admin`.

## Tiêu chí chấp nhận

- [ ] RPC tồn tại.
- [ ] Trả về phân trang đúng.
- [ ] System admin và tenant admin đều gọi được.
- [ ] Filter/sort đúng.

## Verify

```bash
npm run lint
npm run build
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P3_GUARDRAILS.md`
