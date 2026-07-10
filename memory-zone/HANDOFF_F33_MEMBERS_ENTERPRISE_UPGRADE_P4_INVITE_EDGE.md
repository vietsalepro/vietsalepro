# HANDOFF F33 — P4: invite-member edge function fixes

Master: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE.md`  
Index: `memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_INDEX.md`

## Scope

Sửa `supabase/functions/invite-member/index.ts` để scale đúng và xử lý trạng thái.

## Files sửa

- `supabase/functions/invite-member/index.ts`
- Tạo migration `supabase/migration_f33_invite_rate_limit_tenant.sql` (thêm `tenant_id` vào `rate_limit_logs` nếu chưa có).

## Yêu cầu

1. Thay `auth.admin.listUsers({ perPage: 1000 })` bằng query trực tiếp `auth.users`:
   ```ts
   const { data: userRow } = await supabaseAdmin
     .schema('auth')
     .from('users')
     .select('id,email,last_sign_in_at,confirmed_at')
     .eq('email', normalizedEmail)
     .maybeSingle();
   ```
2. Validate email bằng regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
3. Xử lý trạng thái:
   - Email đã là member của tenant → return `{ error: 'already_member' }` HTTP 409.
   - Email chưa có user → tạo user tạm → `generateLink` recovery về `https://${tenant.subdomain}.vietsalepro.com/set-password`.
   - Nếu `generateLink` lỗi → vẫn tạo user, return success kèm `emailProviderConfigured: false` để frontend biết phải set password thủ công.
4. Kiểm tra `max_users` với `status IN ('pending','active')`.
5. Thêm rate limit theo tenant (50 invite/hour/tenant) bên cạnh IP rate limit.
   - Thêm cột `tenant_id uuid` vào `rate_limit_logs` nếu chưa có.
   - Insert kèm `tenant_id`.
   - Count theo `tenant_id`.
6. Giữ lại audit log hiện có.

## Tiêu chí chấp nhận

- [ ] Không dùng `listUsers(perPage:1000)`.
- [ ] Email sai định dạng bị từ chối.
- [ ] Member đã tồn tại trả về `already_member`.
- [ ] User mới được tạo và có link (hoặc cờ email provider chưa cấu hình).
- [ ] Quá max_users bị từ chối.
- [ ] Rate limit theo tenant hoạt động.

## Verify

```bash
npm run lint
npm run build
npx vitest run tests/smoke/admin-dashboard-p3-member-management.test.ts
```

## Next

`memory-zone/HANDOFF_F33_MEMBERS_ENTERPRISE_UPGRADE_P5_RESET_AND_STATUS.md`
