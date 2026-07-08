# PLAN: Tạo System Admin từ Email/Password trên Admin Dashboard

## Mục tiêu
Cho phép tạo system admin trực tiếp từ giao diện admin dashboard bằng cách nhập email và password, thay vì phải tạo user thủ công trong Supabase và nhập UUID.

## Phân tích hiện tại
- **Current flow**: Vào Supabase → tạo user trong `auth.users` → copy UUID → vào admin dashboard → nhập UUID → thêm system admin
- **Desired flow**: Vào admin dashboard → nhập email/password → bấm "Thêm" → hệ thống tự tạo user và thêm vào system admin

## Cơ sở hạ tầng sẵn có
✅ Supabase Auth API: `supabase.auth.admin.createUser()`  
✅ RPC `add_system_admin()` đã có  
✅ Pattern tương tự trong `invite-member` và `create-tenant` edge functions  
✅ Rate limiting và security checks đã có  
✅ Frontend UI đã có trong `SystemAdminDashboard.tsx`

## Implementation Plan

### Phase 1: Backend - Tạo Edge Function
**File**: `supabase/functions/create-system-admin/index.ts`

**Logic**:
1. Rate limiting: 10 requests/phút/IP (dùng `rate_limit_logs`)
2. Authentication: Kiểm tra caller là system admin (qua `system_admins`)
3. Validate input:
   - Email: định dạng hợp lệ, không trống
   - Password: tối thiểu 6 ký tự
4. Tạo user trong `auth.users`:
   - `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
5. Thêm user vào `system_admins`:
   - Gọi RPC `add_system_admin(p_user_id)`
6. Ghi audit log
7. Trả về: `{ success: true, userId, email }`

**Security**:
- Chỉ system admin mới được gọi
- Rate limiting để tránh abuse
- Validate input kỹ lưỡng
- Error handling chi tiết

### Phase 2: Frontend - Cập nhật UI
**File**: `pages/SystemAdminDashboard.tsx`

**Thay đổi**:
1. Thay input từ UUID sang Email + Password:
   ```tsx
   // Old: Input UUID
   <input value={newAdminUserId} onChange={...} />
   
   // New: Input Email + Password
   <input type="email" value={newAdminEmail} onChange={...} />
   <input type="password" value={newAdminPassword} onChange={...} />
   ```

2. Thay đổi handler `handleAddSystemAdmin`:
   - Gọi edge function mới thay vì RPC `add_system_admin`
   - Validate input trước khi gọi
   - Hiển thị thông báo thành công với email/UUID

3. Cập nhật service:
   - Thêm function `createSystemAdmin(email, password)` trong `services/systemAdminService.ts`
   - Hoặc gọi edge function trực tiếp từ component

### Phase 3: Testing
**File**: `tests/smoke/admin-dashboard-create-system-admin.test.ts`

**Test cases**:
1. Tạo system admin thành công với email/password hợp lệ
2. Validate email không hợp lệ
3. Validate password quá ngắn
4. Non-system admin không được tạo
5. Rate limiting hoạt động
6. Email đã tồn tại → error

### Phase 4: Deployment
1. Deploy edge function mới lên Supabase
2. Build và deploy frontend
3. Test trên staging environment
4. Monitor logs và errors

## File Changes Summary

### New Files
- `supabase/functions/create-system-admin/index.ts` - Edge function mới
- `tests/smoke/admin-dashboard-create-system-admin.test.ts` - Test file

### Modified Files
- `pages/SystemAdminDashboard.tsx` - Cập nhật UI và logic
- `services/systemAdminService.ts` - Thêm function mới (optional)

## Estimated Effort
- **Backend**: 2-3 hours
- **Frontend**: 1-2 hours  
- **Testing**: 1-2 hours
- **Total**: 4-7 hours

## Risks & Mitigations
1. **Security**: Password được truyền qua API → Mitigation: Dùng HTTPS, validate input, rate limiting
2. **Abuse**: Spam tạo user → Mitigation: Rate limiting, chỉ system admin được gọi
3. **Error handling**: User creation失败 → Mitigation: Rollback system admin addition, clear error messages

## Rollback Plan
Nếu có vấn đề:
1. Disable edge function `create-system-admin`
2. Revert frontend changes về input UUID
3. Users vẫn có thể thêm system admin theo cách cũ (manual UUID)

## Success Criteria
- [ ] System admin có thể tạo được user mới từ email/password trên UI
- [ ] User được tạo trong `auth.users` với email/password đúng
- [ ] User được tự động thêm vào `system_admins`
- [ ] UI hiển thị thông tin user mới sau khi tạo
- [ ] Security checks hoạt động (chỉ system admin, rate limiting)
- [ ] Test cases pass
- [ ] Không có regression trong các chức năng hiện tại
