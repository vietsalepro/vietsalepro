# HANDOFF F33 — P3: Guardrails owner & last admin

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Tạo trigger DB để bảo vệ owner và admin cuối cùng.

## Files tạo mới

- `supabase/migration_f33_members_guardrails.sql`

## Logic

- `BEFORE DELETE ON tenant_memberships`:
  - Không xóa row nào có `user_id = tenants.owner_id`.
  - Nếu row có `role = 'admin'` và không còn admin khác trong tenant, raise exception.
- `BEFORE UPDATE ON tenant_memberships`:
  - Không đổi role của owner.
  - Nếu đổi role từ `'admin'` sang non-admin và không còn admin khác, raise exception.

## Tiêu chí chấp nhận

- [ ] Trigger tồn tại.
- [ ] Xóa owner bị lỗi.
- [ ] Xóa admin cuối cùng bị lỗi.
- [ ] Đổi role admin cuối cùng sang non-admin bị lỗi.

## Verify

```bash
npm run lint
npm run build
# Test trên SQL:
# SELECT * FROM tenant_memberships WHERE ...; DELETE ...; -- expect error
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P4_INVITE_EDGE.md`
