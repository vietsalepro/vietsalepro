# Handoff — Xử lý các file Phase 5 còn untracked

> File này dành cho chat tiếp theo. Nhiệm vụ: quyết định cách xử lý các file Phase 5 chưa được `git add`, sau đó thực hiện commit/triển khai theo phương án user chọn.
> Đã áp dụng: `systematic-debugging`, `test-driven-development`, `requesting-code-review`, `writing-plans`.

---

## 1. Tóm tắt tình trạng hiện tại

- Phase 5 (long-term hardening) đã được triển khai phần lớn qua nhiều commit trước đó.
- Một số file hỗ trợ vẫn đang ở trạng thái **untracked** — chưa được `git add`, chưa commit.
- Các file này đã được đọc, kiểm tra security, và chạy qua toàn bộ pipeline xác minh. **Không phát hiện lỗi build, test, hoặc rủi ro bảo mật rõ ràng.**
- Phần thủ công / quyết định business vẫn còn trong `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`.

---

## 2. Các file Phase 5 còn untracked

| File | Loại | Mục đích | Đánh giá nhanh |
|------|------|----------|----------------|
| `scripts/audit-rpc-contracts.ts` | TypeScript / Dev tool | Quét code trong `services/` và `lib/`, so sánh với `docs/admin-dashboard/RPC_CONTRACTS.md`, báo cáo RPC nào thiếu/thừa. | Đã chạy PASS. Không có secret, eval, hay SQL injection. |
| `scripts/audit-grants.sql` | SQL / Dev tool | Query danh sách public function + ai được `GRANT EXECUTE` để audit permission. | Chỉ SELECT, an toàn. |
| `hooks/useAdminFeatureFlags.ts` | React hook | Đọc admin feature flags (`adminGdprEnabled`, `adminAuditRealtimeEnabled`, …) từ `tenants.settings->features`. | Error handling đầy đủ, fallback về default. Chưa được UI sử dụng. |
| `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql` | Migration | Backfill default `false` cho 5 admin feature flags trên mọi tenant hiện có. | Idempotent (`COALESCE` + `jsonb_set`). Không ghi đè giá trị đã bật. |
| `docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md` | Spec / Plan | Mô tả toàn bộ Phase 5: RPC audit, grants, defensive mapping, feature flags, health check, deployment workflow. | Documentation only. |
| `docs/admin-dashboard/HANDOFF_PHASE_5_LONG_TERM_MANUAL.md` | Handoff | Các việc cần user quyết định (monitoring, owner contact, deploy window, grants trên production). | Documentation only. |

### File đã commit trước đó nhưng liên quan

- `supabase/migrations/20250711000001_phase_5_long_term_explicit_grants.sql` — đã tracked, backfill REVOKE/GRANT cho public functions.
- `supabase/functions/admin-health-check/index.ts` — đã tracked, edge function health check.
- `utils/service.ts` — defensive mapping helpers.
- `package.json` — đã thêm script `"audit:rpc"` và `"pre-commit"`.

---

## 3. Kết quả kiểm tra (feedback loop)

Đã chạy các lệnh sau trên working tree hiện tại:

```bash
npm run audit:rpc      # PASS — Contract RPCs : 125, Code RPCs : 125
npm run lint           # PASS — tsc --noEmit
npm run build          # PASS — Vite production build
npx vitest run         # PASS — 50 files, 290 tests
```

> **Nhận xét:** Các file untracked không làm hỏng build/test hiện tại vì chúng chưa được import vào production path (trừ `package.json` đã tham chiếu `audit:rpc`).

---

## 4. Security scan (theo requesting-code-review)

| Rủi ro | Kết quả |
|--------|---------|
| Hardcoded secrets / API keys | Không phát hiện |
| `eval()` / `exec()` / `Function()` | Không phát hiện |
| SQL injection trong script | `audit-grants.sql` chỉ SELECT; `audit-rpc-contracts.ts` không query DB |
| Shell injection / `os.system` | Không phát hiện |
| Path traversal | Không — đọc file trong repo bằng relative path |
| `innerHTML` / XSS | Không liên quan (dev script + hook không render HTML trực tiếp) |
| Unsafe deserialization | Không phát hiện |

> **Kết luận:** Không có vấn đề bảo mật blocker để commit các file này.

---

## 5. Root cause tại sao còn untracked

Phase 5 được thực hiện dần qua nhiều sub-phase / commit:
- Một phần code đã commit sớm (grants migration, health-check edge function, defensive mapping).
- Một phần file hỗ trợ và documentation được tạo ra nhưng chưa được `git add` + commit — có thể do chờ review hoặc do phân chia giữa phần tự động và phần thủ công.
- Kết quả: working tree còn 6 file untracked thuộc Phase 5.

---

## 6. Phương án đề xuất

### Option A — Commit toàn bộ file untracked (Khuyến nghị)

Thêm tất cả 6 file vào git và commit riêng một commit Phase 5 completion.

**Ưu điểm:**
- Hoàn thiện Phase 5 trên repo.
- `audit:rpc` sẽ chính thức là một bước CI hợp lệ vì script đã tracked.
- Migration feature flags sẵn sàng để deploy.

**Nhược điểm:**
- Commit documentation chưa có owner contact thật (nhưng đã điền placeholder `admin / vietsalepro86@gmail.com` trong `MIGRATION_RUNBOOK.md`).

**Các lệnh cần chạy:**

```bash
git add scripts/audit-rpc-contracts.ts scripts/audit-grants.sql hooks/useAdminFeatureFlags.ts supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql docs/admin-dashboard/ADMIN_DASHBOARD_PHASE_5_LONG_TERM.md docs/admin-dashboard/HANDOFF_PHASE_5_LONG_TERM_MANUAL.md
git commit -m "feat(phase-5): track long-term hardening artifacts

- Add RPC contract audit script
- Add grants audit SQL
- Add admin feature flags hook and migration
- Document Phase 5 plan and manual handoff

Generated with Devin
Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>"
```

### Option B — Chỉ commit code, giữ lại handoff/docs

Commit các file code (`scripts/`, `hooks/`, `supabase/migrations/`) nhưng để các file markdown untracked hoặc chỉnh sửa thêm trước khi commit.

**Ưu điểm:** Giữ docs/handoff ở trạng thái draft để chat sau bổ sung thông tin owner/contact.

**Nhược điểm:** Repo chưa hoàn chỉnh; `audit:rpc` vẫn chạy được vì script được commit.

### Option C — Không commit, để chat sau xử lý

Giữ nguyên trạng thái untracked. Chat sau sẽ quyết định.

**Ưu điểm:** Không thay đổi git.

**Nhược điểm:** Các file dễ bị mất khi chuyển workspace; Phase 5 chưa được đóng.

---

## 7. Các bước cụ thể cho chat sau

### Nếu user chọn Option A

1. Chạy lại verification một lần nữa để đảm bảo không có thay đổi mới:
   ```bash
   npm run lint && npm run build && npx vitest run && npm run audit:rpc
   ```
2. `git add` 6 file untracked.
3. Viết commit message theo format đã có trong repo (xem `git log -1`).
4. Commit.
5. **Không push** trừ khi user yêu cầu.
6. **Không deploy migration** trừ khi user chọn trong `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md`.

### Nếu user chọn Option B

1. Commit 3 file code: `scripts/audit-rpc-contracts.ts`, `scripts/audit-grants.sql`, `hooks/useAdminFeatureFlags.ts`, `supabase/migrations/20250711000002_phase_5_long_term_admin_feature_flags.sql`.
2. Để 2 file docs untracked; chat sau tiếp tục hoàn thiện.

### Nếu user chọn Option C

1. Ghi nhận lý do không commit.
2. Cập nhật handoff này nếu cần.

---

## 8. Câu hỏi cần user quyết định

Chat tiếp theo cần hỏi user (bằng tiếng Việt dễ hiểu):

1. **“Có muốn commit toàn bộ 6 file Phase 5 không?”** Giải thích: đây là các file hỗ trợ + tài liệu đã kiểm tra, không ảnh hưởng app hiện tại.
2. **Nếu commit xong có muốn deploy migration `20250711000002_phase_5_long_term_admin_feature_flags.sql` lên staging/production không?** Nhắc nhở: migration này chỉ thêm default feature flags, không xóa dữ liệu.
3. **Có muốn tiếp tục xử lý phần thủ công trong `HANDOFF_PHASE_5_LONG_TERM_MANUAL.md` không?** (grants production, monitoring URL, owner contact, deploy window).

---

## 9. Notes kỹ thuật

- `hooks/useAdminFeatureFlags.ts` chưa được import bởi bất kỳ component nào. Sau này khi gắn feature flag vào UI (GDPR, audit realtime, analytics, impersonation, read-replica queue), mới cần integration test.
- `scripts/audit-rpc-contracts.ts` quét `services/` và `lib/`. Nếu sau này có RPC được gọi từ `pages/` hoặc `components/`, cần mở rộng `CODE_DIRS`.
- Migration feature flags sử dụng `tenants.settings->features` JSONB — phù hợp với design P8.2 hiện có.

---

*Handoff được tạo bởi Devin vào 2026-07-12. Mọi thay đổi cần được user xác nhận trước khi commit/deploy.*
