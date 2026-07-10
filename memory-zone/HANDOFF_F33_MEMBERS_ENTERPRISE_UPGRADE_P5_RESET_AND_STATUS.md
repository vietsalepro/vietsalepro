# HANDOFF F33 — P5: reset-password & status activation

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

1. Kiểm tra/đảm bảo `reset-password` vẫn hoạt động với user chưa sign in (type = `invite`, path = `set-password`).
2. Tạo cơ chế tự động chuyển `status` từ `pending` → `active` khi user đăng nhập lần đầu.

## Files tạo mới

- `supabase/migration_f33_members_status_activation.sql`

## Files sửa

- `supabase/functions/reset-password/index.ts` (nếu cần; hiện tại đã đúng type/pending).
- `contexts/AuthContext.tsx`

## Nội dung migration

Tạo function:

```sql
CREATE OR REPLACE FUNCTION public.activate_pending_memberships(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tenant_memberships
  SET status = 'active', accepted_at = COALESCE(accepted_at, now())
  WHERE user_id = p_user_id AND status = 'pending';
END;
$$;
```

## Sửa AuthContext

Trong `onAuthStateChange`, khi `event === 'SIGNED_IN'` và `newSession?.user`, gọi:

```ts
supabase
  .rpc('activate_pending_memberships', { p_user_id: newSession.user.id })
  .catch(() => {});
```

## Tiêu chí chấp nhận

- [ ] `reset-password` trả về `action: 'invite'` và `redirectTo` chứa `set-password` cho user chưa sign in.
- [ ] Function `activate_pending_memberships` tồn tại.
- [ ] Sau khi user đăng nhập, membership `pending` chuyển `active`.

## Verify

```bash
npm run lint
npm run build
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P6_TYPES_SERVICE.md`
