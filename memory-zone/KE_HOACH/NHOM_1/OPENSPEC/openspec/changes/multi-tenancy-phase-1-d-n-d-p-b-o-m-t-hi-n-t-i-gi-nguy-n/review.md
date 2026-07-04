## Plan Coverage

- [ ] Sub-phase 1: Dọn dẹp bảo mật hiện tại (giữ nguyên) is fully represented in tasks.md

## File List

- See proposal.md What Changes section.

## Guardrails

- [ ] Only files and tables listed in this sub-phase are touched.
- [ ] `tenant_id` is injected by the service layer, not from user input.
- [ ] No public/anonymous policies remain after security-related phases.

## Acceptance Criteria

- [ ] User đã đăng nhập vẫn thấy dữ liệu
- [ ] User chưa đăng nhập bị chặn
- [ ] `supabase.auth.signUp` bị từ chối

## Verification Steps

- [ ] Run `npm run lint` after code changes
- [ ] Run `npm run build` if code is touched
- [ ] Manual test acceptance criteria