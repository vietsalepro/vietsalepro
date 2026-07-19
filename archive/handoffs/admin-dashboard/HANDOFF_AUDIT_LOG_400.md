# Handoff — Xử lý audit-log 400

> File này dành cho chat tiếp theo. Nhiệm vụ: khóa bằng regression test và xác nhận deploy cho vấn đề `audit-log` trả về `400` trên admin dashboard.
> Đã áp dụng: `systematic-debugging`, `test-driven-development`, `requesting-code-review`.

---

## 1. Tóm tắt tình trạng hiện tại

- **Crash `toLocaleString` đã được fix** trong commit `ba00166f` (file `pages/admin/AdminDashboardInner.tsx` dòng 496, thêm `?? 0`), kèm regression test `tests/admin-dashboard/AdminDashboardInner.test.tsx`.
- **Audit-log 400 đã được trace** đến root cause: `services/auditService.ts` gọi Edge Function `audit-log` khi `tenantId` là `null` (trên admin subdomain không có tenant).
- **Fix source đã có sẵn** trong commit `ba00166f`: guard `if (!tenantId || !tableName || !action || !VALID_AUDIT_ACTIONS.has(action))` đã được thêm vào `writeAuditLog`.
- Vấn đề còn lại: **chưa có regression test riêng cho guard** và **cần đảm bảo production đã chạy đúng build**.

---

## 2. Root cause chi tiết

### Call stack

1. `contexts/AuthContext.tsx` gọi `writeAuditLog('LOGIN' | 'LOGOUT', 'auth', ...)` khi user sign in / sign out.  
   - `LOGIN`: `AuthContext.tsx:80-83`
   - `LOGOUT`: `AuthContext.tsx:103-106`

2. `services/auditService.ts::writeAuditLog` lấy `tenantId = getCurrentTenantId()`.  
   Trên admin subdomain, `TenantContext.tsx` set `currentTenantId = null` vì `subdomain === 'admin'`.

3. Trước commit `ba00166f`, `writeAuditLog` không guard `tenantId` null → gửi body `{ ..., tenant_id: null, ... }` đến Edge Function `audit-log`.

4. Edge Function `supabase/functions/audit-log/index.ts:57-67` validate:  
   ```ts
   if (!tenant_id || typeof tenant_id !== 'string') {
     return jsonResponse({ error: 'tenant_id is required' }, 400);
   }
   ```
   → trả về `400`.

### Fix đã có trong HEAD

```ts
// services/auditService.ts:47-62
const VALID_AUDIT_ACTIONS = new Set<string>([
  'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPERSONATE', 'IMPERSONATE_END'
]);

export async function writeAuditLog(...) {
  const tenantId = getCurrentTenantId();
  // ...
  if (!tenantId || !tableName || !action || !VALID_AUDIT_ACTIONS.has(action)) {
    console.warn('audit-log skipped: missing required fields', { tenantId, tableName, action });
    return;
  }
  // ...
}
```

> **Kết luận:** Source hiện tại đúng. Nếu production vẫn thấy 400, deploy đang chạy build cũ (pre-`ba00166f`).

---

## 3. 2 bước kế tiếp cho chat sau

### Bước 1 — Viết regression test cho `writeAuditLog` guard (RED → GREEN)

Mục tiêu: đảm bảo `writeAuditLog` không bao giờ gọi `supabase.functions.invoke('audit-log')` khi `getCurrentTenantId()` trả về `null`.

**File test đề xuất:** `tests/services/auditService.test.ts` (tạo mới) hoặc mở rộng `tests/smoke/admin-dashboard-p5-audit-security.test.ts`.

**Nội dung test (dạng Vitest + mock):**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeAuditLog } from '../../services/auditService';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase, getCurrentTenantId: () => null };
});

describe('auditService guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not invoke audit-log edge function when tenantId is null', async () => {
    await writeAuditLog('LOGIN', 'auth', { recordId: 'u1' });
    // mockSupabase.functions.invoke được gọi với bất kỳ function nào?
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });
});
```

> Nếu test cần import `mockSupabase`, hãy đảm bảo `vi.mock` trả về đúng object để test có thể assert.

**Lệnh chạy:**

```bash
npx vitest run tests/services/auditService.test.ts
```

**Expected:** pass ngay lập tức vì guard đã tồn tại.

### Bước 2 — Xác nhận / redeploy production

- Kiểm tra build production đang chạy có commit `ba00166f` không (so sánh hash hoặc xác nhận với team deploy).
- Nếu build cũ: redeploy từ `master`/`main` hiện tại.
- Sau deploy, quan sát lại console network trên admin dashboard khi login/logout — 400 phải biến mất.

---

## 4. Kết quả kiểm tra hiện tại (feedback loop)

Đã chạy trên HEAD `ba00166f`:

```bash
npm run lint            # PASS — tsc --noEmit
npx vitest run          # PASS — 51 files, 291 tests
npm run build           # PASS — Vite production build
```

---

## 5. Security / risk scan

| Rủi ro | Kết quả |
|--------|---------|
| Guard làm mất audit log hệ thống? | Không — chỉ skip khi thiếu `tenantId`; LOGIN/LOGOUT trên tenant subdomain vẫn ghi bình thường. |
| Hardcoded secrets | Không |
| `eval()` / `exec()` | Không |
| SQL injection | Không — guard chỉ kiểm tra local variables |

---

## 6. Câu hỏi cần user quyết định

Chat tiếp theo hỏi user:

1. **“Có muốn tôi viết regression test cho `writeAuditLog` guard ngay bây giờ không?”** (khuyến nghị: có)
2. **“Production hiện tại đã deploy đúng commit `ba00166f` chưa?”** Nếu chưa, cần redeploy.
3. **“Có muốn tôi thêm log rõ hơn (sentry / console.error) khi audit-log bị skip không?”** — có thể giúp debug nhưng không bắt buộc.

---

## 7. Notes kỹ thuật

- Edge Function `audit-log` còn xử lý `rate_limit` và `cleanup`. Nếu sau này muốn gọi từ cron, hãy đảm bảo body đúng `type`.
- Nếu production vẫn 400 **sau khi đã deploy đúng commit**, cần trace sâu hơn:
  - Kiểm tra có caller khác gọi `audit-log` không (hiện tại chỉ `services/auditService.ts`).
  - Kiểm tra Edge Function logs trên Supabase Dashboard để xem body thực tế.
  - Kiểm tra `verify_jwt` config của Edge Function.

---

## 8. Files tham chiếu

- `services/auditService.ts` — guard và caller.
- `contexts/AuthContext.tsx` — call site LOGIN/LOGOUT.
- `contexts/TenantContext.tsx` — set `currentTenantId = null` trên admin subdomain.
- `supabase/functions/audit-log/index.ts` — Edge Function validation.
- `tests/admin-dashboard/AdminDashboardInner.test.tsx` — ví dụ mock pattern.
