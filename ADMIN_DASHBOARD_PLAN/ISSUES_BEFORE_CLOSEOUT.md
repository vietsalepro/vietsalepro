# Các vấn đề cần xử lý trước Wave-03 Closeout

**Ngày:** 2026-07-21
**Chương trình:** Admin Dashboard System Remediation Program
**Mục đích:** Tài liệu này mô tả 2 vấn đề còn tồn đọng cần được xem xét và xử lý trước khi chính thức đóng Wave-03. Đây là các vấn đề non-blocking (không ảnh hưởng đến chức năng production), nhưng nên được giải quyết để có trạng thái repository sạch sẽ trước Program Certification.

---

## 1. Dead Artifacts — 3 file không còn được sử dụng

### 1.1. `services/admin/permissions.ts` — RESOLVED

**Status:** RESOLVED  
**Decision:** REMOVED  
**Reason:** Legacy wrapper removed after repository verification.

**Verified:**
- Codebase Memory `search_graph` for `services/admin/permissions.ts` returns no source Module node after re-index.
- Source-code search for imports of `services/admin/permissions.ts` returns 0 matches in `ts`, `tsx`, `js`, and `jsx` files.
- `lib/permissions.ts` remains the canonical permissions source.
- `services/admin/permissions.ts` has been deleted from the working tree.

---

### 1.2. `supabase/functions/admin-health-check/`

**Vị trí:** `c:\PROJECT\vietsalepro\supabase\functions\admin-health-check\`

#### Current Status

RESOLVED

#### Classification

Production Infrastructure Artifact

#### Decision

KEEP

#### Reason

Active production monitoring endpoint.

#### Evidence

- Verified by Supabase MCP.
- Production deployment confirmed.
- Active `HEAD` requests approximately every 5 minutes.
- External monitoring dependency confirmed.

#### Future Rule

This Edge Function must never be classified as a Dead Artifact solely by repository search.
Any future cleanup program must perform Production verification before considering removal.

---

### 1.3. `supabase/functions/deliver-webhook/` — RESOLVED

**Status:** RESOLVED  
**Decision:** REMOVED  
**Reason:** Dead Artifact removed after production verification and cleanup.

**Executed by:** Cleanup Execution  
**Verified:**
- Production Edge Function `deliver-webhook` undeployed and no longer listed.
- Repository directory `supabase/functions/deliver-webhook/` deleted.
- `webhook-delivery` remains deployed and ACTIVE as the hardened replacement.
- Source-code search (`ts,tsx,js,jsx,json,toml,sql`) returns 0 references.

---

## 2. Pre-existing Lint Error

### 2.1. Mô tả lỗi

**Lỗi:** Khi chạy `npm run lint` (thực chất là `tsc --noEmit` — TypeScript compiler kiểm tra kiểu), xuất hiện lỗi:

```
TS2307: Cannot find module '../../utils/stringHelper'
```

Tại file:

```
archive/temporary/memory-zone/scripts/migrate_capitalize_product_names.ts:2:39
```

### 2.2. Nguồn gốc

- File `migrate_capitalize_product_names.ts` nằm trong thư mục `archive/temporary/memory-zone/scripts/`. Đây là một script tạm thời được tạo ra để thực hiện migration dữ liệu (viết hoa tên sản phẩm) trong quá khứ.
- File này import module `../../utils/stringHelper`, nhưng module đó **không tồn tại** trong cây thư mục. Có thể module đã bị xóa, đổi tên, hoặc chưa bao giờ được tạo.
- Thư mục `archive/temporary/memory-zone/` chứa các script một lần (one-off scripts), không phải source code chính thức của ứng dụng.
- Lỗi này đã tồn tại **trước khi chương trình Admin Dashboard System Remediation Program bắt đầu** (từ Phase A). Nó không phải do bất kỳ thay đổi nào trong Wave-01, Wave-02, hay Wave-03 gây ra.
- Lỗi này được tái phát hiện trong mỗi package của Wave-03 khi chạy `npm run lint` để kiểm tra chất lượng code. Các file source code được sửa trong các wave đều type-clean (không có lỗi TypeScript riêng).

### 2.3. Tác động

| Khía cạnh | Ảnh hưởng |
|-----------|------------|
| **Production build** (`npm run build`) | ✅ **KHÔNG ảnh hưởng.** Build vẫn PASS. Lý do: Vite (công cụ build) không kiểm tra TypeScript nghiêm ngặt như `tsc`. |
| **Admin Dashboard chức năng** | ✅ **KHÔNG ảnh hưởng.** File trong `archive/` không được import vào bất kỳ module chính thức nào. |
| **Kiểm tra chất lượng** | ❌ **Gây nhiễu.** Mỗi lần chạy `npm run lint`, lỗi này xuất hiện và làm che khuất các lỗi thật (nếu có). |
| **CI/CD** | Có thể gây FAIL nếu pipeline yêu cầu `npm run lint` phải PASS 100%. |

### 2.4. Hướng xử lý đề xuất

Có nhiều phương án, tùy vào mức độ sạch sẽ mong muốn:

| Phương án | Mô tả | Ưu điểm | Nhược điểm |
|-----------|-------|---------|------------|
| **A — Xóa toàn bộ thư mục** | Xóa `archive/temporary/memory-zone/` | Dứt điểm, sạch sẽ | Mất dữ liệu script cũ (có thể không cần thiết) |
| **B — Xóa file lỗi** | Chỉ xóa `migrate_capitalize_product_names.ts` | Giữ lại các script khác trong thư mục | Vẫn còn file rác trong repo |
| **C — Sửa import** | Tạo lại module `utils/stringHelper` hoặc sửa import | Giữ nguyên script hoạt động được | Tốn công vô ích vì script không ai dùng |
| **D — Thêm `// @ts-nocheck`** | Thêm comment ở đầu file để tắt TypeScript check | Dễ nhất, không mất file | Chỉ che giấu lỗi, không giải quyết gốc |

**Khuyến nghị:** **Phương án A hoặc B** — xóa file hoặc thư mục. Đây là script tạm thời, không còn giá trị sử dụng.

---

## Tổng kết

| # | Vấn đề | Mức độ ưu tiên | Effort xử lý | Nên xử lý |
|---|--------|---------------|-------------|-----------|
| 1a | Xóa `services/admin/permissions.ts` | Thấp | 1 phút | ✅ Trước Closeout |
| 1b | `admin-health-check` Edge Function — Reviewed | — | — | KEEP — Production Monitoring Endpoint |
| 1c | `deliver-webhook` Edge Function removed | Trung bình | 5 phút | ✅ RESOLVED — REMOVED |
| 2 | Xóa/sửa lint error trong `archive/` | Thấp | 1-2 phút | ✅ Trước Closeout |