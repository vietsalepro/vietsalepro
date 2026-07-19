# HANDOFF — Sub-Phase 5.1: Accept/Decline Invitation Flow

## Tình trạng hiện tại

Sub-Phase 5.1 đã hoàn thành phần:

- Tạo `tenant_role` enum + `invitations` table + RLS policies.
- Tạo Edge Function `send-invitation-email`.
- Cập nhật `services/admin/memberAdminService.ts` với logic tạo/resend/revoke invitation.
- Cập nhật `lib/permissions.ts` với RBAC matrix.
- Cập nhật `types/tenant.ts` với role enum và invitation types.
- Cập nhật `components/MemberManagement/MemberInviteModal.tsx` để gọi `memberAdminService.bulkInviteMembers`.
- `npm run lint` PASS, `npm run build` PASS, `openspec validate` PASS.

**Phần còn thiếu để Task 5.1 hoàn chỉnh:** flow accept/decline — người được mời click link `/admin/invitations/accept?token=xxx`, đăng nhập (nếu chưa), và tự động được thêm vào `tenant_memberships`.

## Quyết định bảo mật đã chọn

- **Dùng Basejump pattern**: `lookup_invitation(token)` + `accept_invitation(token)` là RPC `SECURITY DEFINER`.
- **Không dùng Edge Function cho accept** — không cần service_role, không cần tạo auth user server-side.
- **Giữ email-match guard**: `auth.users.email` của người accept phải khớp `invitations.email`. Đảm bảo đúng người được mời mới accept được.
- **Token single-use + time-bound**: sau accept hoặc hết hạn thì `status` không còn `pending`.
- **Audit log**: ghi lại action `INVITATION_ACCEPTED` vào `app_audit_log`.

## Files cần tạo

1. `supabase/migrations/20260714000001_accept_invitation_rpc.sql`
   - Tạo `lookup_invitation(p_token UUID)` — STABLE, SECURITY DEFINER.
   - Tạo `accept_invitation(p_token UUID)` — SECURITY DEFINER, trả về `tenant_memberships` row.
2. `pages/admin/InvitationsAccept.tsx`
   - Route: `/admin/invitations/accept?token=xxx`.
   - Đọc token, nếu chưa login thì redirect sang `/login?redirectTo=...`.
   - Gọi `lookupInvitation` để hiển thị tenant/role.
   - Nút accept gọi `acceptInvitation`.
   - Xử lý các trạng thái: loading, invalid, expired, already accepted, success.

## Files cần sửa

1. `services/admin/memberAdminService.ts`
   - Thêm `lookupInvitation(token: string)`.
   - Thêm `acceptInvitation(token: string): Promise<TenantMembership>`.
   - (Tùy chọn) Thêm `declineInvitation(token: string)` — có thể chỉ cập nhật status thành `revoked` hoặc không implement nếu từ chối = không làm gì.
2. `services/admin/memberAdminService.ts` (nếu chưa re-export) — đảm bảo export các function mới.
3. Routing / navigation
   - Thêm route `/admin/invitations/accept` trong router của ứng dụng (cần kiểm tra file định tuyến hiện tại, ví dụ `App.tsx` hoặc `router/index.tsx`).
4. OpenSpec change `basejump-admin-dashboard-phase-5-1`
   - Mở rộng `tasks.md` thêm task accept/decline.
   - Cập nhật `specs/admin-dashboard-invitations/spec.md` thêm scenario accept.

## Chi tiết migration (chưa implement)

```sql
-- lookup_invitation
CREATE OR REPLACE FUNCTION public.lookup_invitation(p_token UUID)
RETURNS TABLE(
  tenant_id UUID,
  tenant_name TEXT,
  role TEXT,
  email TEXT,
  active BOOLEAN,
  expired BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.tenant_id,
    t.name,
    i.role,
    i.email,
    (i.status = 'pending' AND i.expires_at > now()) AS active,
    (i.expires_at <= now()) AS expired
  FROM public.invitations i
  JOIN public.tenants t ON t.id = i.tenant_id
  WHERE i.token = p_token;
END;
$$;

-- accept_invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token UUID)
RETURNS public.tenant_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.invitations;
  v_user_id UUID := auth.uid();
  v_user_email TEXT;
  v_membership public.tenant_memberships;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lời mời không tồn tại' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Lời mời đã được sử dụng hoặc đã bị thu hồi' USING ERRCODE = 'check_violation';
  END IF;

  IF v_invitation.expires_at <= now() THEN
    RAISE EXCEPTION 'Lời mời đã hết hạn' USING ERRCODE = 'check_violation';
  END IF;

  IF lower(v_user_email) <> lower(v_invitation.email) THEN
    RAISE EXCEPTION 'Email đăng nhập không khớp với email được mời' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = v_invitation.tenant_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Bạn đã là thành viên của tenant này' USING ERRCODE = 'unique_violation';
  END IF;

  INSERT INTO public.tenant_memberships (
    tenant_id, user_id, role, status, is_active, invited_by
  ) VALUES (
    v_invitation.tenant_id,
    v_user_id,
    v_invitation.role,
    'active',
    true,
    v_invitation.created_by
  )
  RETURNING * INTO v_membership;

  UPDATE public.invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = v_invitation.id;

  INSERT INTO public.app_audit_log (
    tenant_id, user_id, table_name, record_id, action, new_data
  ) VALUES (
    v_invitation.tenant_id,
    v_user_id,
    'tenant_memberships',
    v_membership.id,
    'INVITATION_ACCEPTED',
    jsonb_build_object('invitation_id', v_invitation.id, 'role', v_invitation.role)
  );

  RETURN v_membership;
END;
$$;
```

## Gợi ý implementation frontend (chưa implement)

```ts
// pages/admin/InvitationsAccept.tsx (outline)
export default function InvitationsAccept() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth(); // hoặc supabase.auth.getUser()

  useEffect(() => {
    if (!user) {
      // redirect to login, sau đó quay lại đây
      window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.href)}`;
      return;
    }
    lookupInvitation(token).then(setInfo).catch(setError);
  }, [user, token]);

  const handleAccept = async () => {
    await acceptInvitation(token);
    // redirect to admin dashboard của tenant
  };
}
```

## Gợi ý service wrapper (chưa implement)

```ts
// services/admin/memberAdminService.ts
export async function lookupInvitation(token: string): Promise<{ tenantId: string; tenantName: string; role: string; email: string; active: boolean; expired: boolean } | null> {
  const { data, error } = await supabase.rpc('lookup_invitation', { p_token: token });
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const row = data[0];
  return {
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    role: row.role,
    email: row.email,
    active: row.active,
    expired: row.expired,
  };
}

export async function acceptInvitation(token: string): Promise<TenantMembership> {
  const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error) throw error;
  return mapMembershipFromDB(data);
}
```

## Tiêu chí chấp nhận

- [ ] Migration `accept_invitation_rpc.sql` tồn tại và chạy thành công.
- [ ] `lookup_invitation` trả đúng thông tin tenant/role/active/expired.
- [ ] `accept_invitation` chỉ cho phép user đã đăng nhập, email khớp, token còn `pending` và chưa hết hạn.
- [ ] Sau accept, `tenant_memberships` có row mới với role đúng, `invitations.status = 'accepted'`.
- [ ] Audit log `INVITATION_ACCEPTED` được ghi.
- [ ] Trang `InvitationsAccept.tsx` render được và xử lý đúng các trạng thái.
- [ ] Route `/admin/invitations/accept?token=xxx` hoạt động.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.
- [ ] OpenSpec validate PASS.

## Verify commands

```bash
npm run lint
npm run build
openspec validate basejump-admin-dashboard-phase-5-1 --store admin-dashboard --json
```

## Next sau khi hoàn thành

Sub-Phase 5.2: Audit log & Security hardening.
