# PLAN: Tạo System Admin từ Email/Password trên Admin Dashboard
## Sub-Phases Chi Tiết

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

---

## SUB-PHASE 1: Backend - Edge Function Core Logic
**File**: `supabase/functions/create-system-admin/index.ts`
**Estimated**: 1.5-2 hours

### Tasks:
1. **Setup edge function structure**
   - Tạo file `supabase/functions/create-system-admin/index.ts`
   - Import dependencies: `@supabase/supabase-js`, `serve` from Deno
   - Setup CORS headers
   - Setup constants: RATE_LIMIT_MAX = 10, RATE_LIMIT_WINDOW_MS = 60000

2. **Implement helper functions**
   - `getClientIp(req)`: Extract IP from x-forwarded-for or x-real-ip
   - `isValidIp(ip)`: Validate IP format
   - `jsonResponse(data, status)`: Standardized JSON response

3. **Implement rate limiting**
   - Check `rate_limit_logs` table for action='create_system_admin'
   - Count requests trong window_start (60s)
   - Return 429 nếu >= 10 requests
   - Log request vào `rate_limit_logs`

4. **Implement authentication**
   - Extract Authorization header
   - Validate token với `supabaseAdmin.auth.getUser(token)`
   - Return 401 nếu token invalid

5. **Implement system admin check**
   - Query `system_admins` table với user_id
   - Return 403 nếu không phải system admin

### Acceptance Criteria:
- [ ] Edge function structure được tạo đúng
- [ ] Helper functions hoạt động đúng
- [ ] Rate limiting chặn >10 requests/phút
- [ ] Authentication reject invalid tokens
- [ ] System admin check reject non-admin users

---

## SUB-PHASE 2: Backend - Input Validation & User Creation
**File**: `supabase/functions/create-system-admin/index.ts` (tiếp tục)
**Estimated**: 1-1.5 hours

### Tasks:
1. **Implement input validation**
   - Parse request body: `{ email, password }`
   - Validate email: không null, định dạng hợp lệ (contains '@')
   - Validate password: không null, tối thiểu 6 ký tự
   - Normalize email: trim().toLowerCase()
   - Return 400 với error message chi tiết nếu invalid

2. **Implement user creation**
   - Gọi `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`
   - Handle error: email đã tồn tại → return 409
   - Handle error: invalid email/password → return 400
   - Extract user ID từ response
   - Return 500 nếu creation thất bại

3. **Implement system admin assignment**
   - Gọi RPC `add_system_admin(p_user_id)` với user ID vừa tạo
   - Handle error: return 500 với message chi tiết
   - Nếu user creation thành công nhưng admin assignment thất bại → rollback user creation

4. **Implement audit logging**
   - Insert vào `app_audit_log` (nếu có trigger tự động thì bỏ qua)
   - Log: action='create_system_admin', target_user_id, email, creator_id

5. **Implement success response**
   - Return 200 với `{ success: true, userId, email }`

### Acceptance Criteria:
- [ ] Input validation reject email/password không hợp lệ
- [ ] User creation thành công với email/password đúng
- [ ] Email đã tồn tại → return 409
- [ ] User được thêm vào `system_admins` sau khi tạo
- [ ] Audit log được ghi
- [ ] Success response trả về đúng format

---

## SUB-PHASE 3: Backend - Error Handling & Security
**File**: `supabase/functions/create-system-admin/index.ts` (tiếp tục)
**Estimated**: 0.5-1 hour

### Tasks:
1. **Implement comprehensive error handling**
   - Wrap toàn bộ logic trong try-catch
   - Handle specific errors: auth errors, database errors, validation errors
   - Return appropriate HTTP status codes: 400, 401, 403, 409, 429, 500
   - Log errors chi tiết cho debugging

2. **Implement security best practices**
   - Không log password trong bất kỳ đâu
   - Không return password trong response
   - Validate input trước khi xử lý
   - Use parameterized queries (không SQL injection)

3. **Implement OPTIONS handler**
   - Return CORS preflight response
   - Allow necessary headers

4. **Testing edge function locally**
   - Test với valid input
   - Test với invalid input
   - Test rate limiting
   - Test authentication/authorization

### Acceptance Criteria:
- [ ] Tất cả error cases được handle đúng
- [ ] HTTP status codes phù hợp với từng error type
- [ ] Password không được log hay return
- [ ] CORS preflight hoạt động đúng
- [ ] Local testing pass

---

## SUB-PHASE 4: Frontend - Service Layer
**File**: `services/systemAdminService.ts`
**Estimated**: 0.5-1 hour

### Tasks:
1. **Add new function interface**
   - Define `createSystemAdmin(email: string, password: string): Promise<SystemAdmin>`
   - Update `SystemAdmin` interface nếu cần

2. **Implement createSystemAdmin function**
   - Gọi edge function `create-system-admin` với `supabase.functions.invoke()`
   - Pass email và password trong body
   - Handle response: extract userId, email
   - Handle errors: throw với message chi tiết
   - Return SystemAdmin object

3. **Add TypeScript types**
   - Define request/response types nếu cần
   - Ensure type safety

### Acceptance Criteria:
- [ ] Function `createSystemAdmin` được implement
- [ ] Function gọi edge function đúng
- [ ] Error handling hoạt động đúng
- [ ] TypeScript types được định nghĩa

---

## SUB-PHASE 5: Frontend - UI Updates
**File**: `pages/SystemAdminDashboard.tsx`
**Estimated**: 1-1.5 hours

### Tasks:
1. **Update state variables**
   - Thay `newAdminUserId` → `newAdminEmail`, `newAdminPassword`
   - Update type annotations

2. **Update input fields**
   - Thay input UUID → input email (type="email")
   - Thêm input password (type="password")
   - Add placeholder và labels
   - Add validation messages

3. **Update handler function**
   - Rename `handleAddSystemAdmin` hoặc giữ nguyên
   - Validate input trước khi gọi (email format, password length)
   - Gọi `createSystemAdmin(email, password)` thay vì `addSystemAdmin(userId)`
   - Clear form sau khi thành công
   - Display success message với email
   - Handle errors với user-friendly messages

4. **Update UI text**
   - Change label từ "UUID" → "Email"
   - Add label cho "Password"
   - Update helper text nếu có

5. **Test UI changes**
   - Test với valid input
   - Test với invalid input
   - Test error states
   - Test loading states

### Acceptance Criteria:
- [ ] Input fields hiển thị đúng (email + password)
- [ ] Validation hoạt động trên UI
- [ ] Handler gọi service function đúng
- [ ] Success/error messages hiển thị đúng
- [ ] Form clears sau khi thành công

---

## SUB-PHASE 6: Testing - Unit Tests
**File**: `tests/smoke/admin-dashboard-create-system-admin.test.ts`
**Estimated**: 1-1.5 hours

### Tasks:
1. **Setup test infrastructure**
   - Import dependencies
   - Mock supabase client
   - Setup test data

2. **Write test cases**
   - Test tạo system admin thành công với valid input
   - Test validate email không hợp lệ
   - Test validate password quá ngắn
   - Test email đã tồn tại → error
   - Test non-system admin không được tạo
   - Test rate limiting hoạt động
   - Test network errors được handle

3. **Run tests**
   - Execute test suite
   - Fix any failures
   - Ensure all tests pass

### Acceptance Criteria:
- [ ] Test file được tạo
- [ ] Tất cả test cases được implement
- [ ] Tất cả tests pass
- [ ] Code coverage acceptable

---

## SUB-PHASE 7: Integration Testing
**Estimated**: 0.5-1 hour

### Tasks:
1. **Test end-to-end flow**
   - Deploy edge function đến staging
   - Test từ UI: nhập email/password → submit → verify user created
   - Verify user trong `auth.users`
   - Verify user trong `system_admins`
   - Verify audit log

2. **Test edge cases**
   - Test với special characters trong email
   - Test với very long password
   - Test với unicode characters
   - Test concurrent requests

3. **Test security**
   - Test với non-admin token
   - Test rate limiting với rapid requests
   - Test với invalid/malformed input

### Acceptance Criteria:
- [ ] End-to-end flow hoạt động đúng
- [ ] Edge cases được handle
- [ ] Security checks hoạt động
- [ ] No errors trong staging logs

---

## SUB-PHASE 8: Deployment & Monitoring
**Estimated**: 0.5-1 hour

### Tasks:
1. **Deploy to production**
   - Deploy edge function `create-system-admin` lên Supabase production
   - Build và deploy frontend changes
   - Verify deployment success

2. **Monitor initial usage**
   - Monitor Supabase logs cho edge function
   - Monitor error rates
   - Monitor rate limiting effectiveness
   - Check audit logs

3. **Document changes**
   - Update API documentation nếu có
   - Update user guide nếu cần
   - Document rollback procedure

4. **Prepare rollback plan**
   - Document steps để disable edge function
   - Document steps để revert frontend changes
   - Test rollback procedure (optional)

### Acceptance Criteria:
- [ ] Edge function deployed thành công
- [ ] Frontend deployed thành công
- [ ] No errors trong production logs
- [ ] Documentation updated
- [ ] Rollback plan documented

---

## File Changes Summary

### New Files
- `supabase/functions/create-system-admin/index.ts` - Edge function mới
- `tests/smoke/admin-dashboard-create-system-admin.test.ts` - Test file

### Modified Files
- `services/systemAdminService.ts` - Thêm function `createSystemAdmin`
- `pages/SystemAdminDashboard.tsx` - Cập nhật UI và logic

## Total Estimated Effort
- **Sub-Phase 1**: 1.5-2 hours
- **Sub-Phase 2**: 1-1.5 hours
- **Sub-Phase 3**: 0.5-1 hour
- **Sub-Phase 4**: 0.5-1 hour
- **Sub-Phase 5**: 1-1.5 hours
- **Sub-Phase 6**: 1-1.5 hours
- **Sub-Phase 7**: 0.5-1 hour
- **Sub-Phase 8**: 0.5-1 hour
- **Total**: 7-10 hours

## Risks & Mitigations
1. **Security**: Password được truyền qua API → Mitigation: Dùng HTTPS, validate input, rate limiting, không log password
2. **Abuse**: Spam tạo user → Mitigation: Rate limiting, chỉ system admin được gọi
3. **Error handling**: User creation thất bại → Mitigation: Rollback system admin addition, clear error messages
4. **Deployment downtime**: Mitigation: Deploy edge function trước, test staging, gradual rollout

## Rollback Plan
Nếu có vấn đề:
1. Disable edge function `create-system-admin` trong Supabase dashboard
2. Revert frontend changes về input UUID
3. Revert service changes về chỉ dùng `addSystemAdmin(userId)`
4. Users vẫn có thể thêm system admin theo cách cũ (manual UUID)

## Success Criteria
- [ ] System admin có thể tạo được user mới từ email/password trên UI
- [ ] User được tạo trong `auth.users` với email/password đúng
- [ ] User được tự động thêm vào `system_admins`
- [ ] UI hiển thị thông tin user mới sau khi tạo
- [ ] Security checks hoạt động (chỉ system admin, rate limiting)
- [ ] Tất cả test cases pass
- [ ] Không có regression trong các chức năng hiện tại
- [ ] Production deployment thành công
- [ ] No critical errors trong logs
