STATUS

CLOSED

Program Status

ALL PRE-CLOSEOUT ISSUES RESOLVED

Program

Admin Dashboard System Remediation Program

Wave

Wave-03

Close Date

2026-07-21

Purpose

Historical Governance Record

---

# Các vấn đề cần xử lý trước Wave-03 Closeout — Closed Historical Record

**Ngày:** 2026-07-21
**Chương trình:** Admin Dashboard System Remediation Program
**Mục đích:** Tài liệu này nguyên bản theo dõi các vấn đề cần xem xét trước khi chính thức đóng Wave-03. Tất cả các vấn đề đã được xác định đều đã được giải quyết hoặc đã nhận được quyết định quản trị cuối cùng. Tài liệu này được giữ lại chỉ nhằm mục đích kiểm toán, truy xuất nguồn gốc quản trị và tham khảo lịch sử.

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

## 2. Pre-existing Lint Error — RESOLVED

**Status:** RESOLVED  
**Decision:** REMOVED  
**Reason:** Obsolete archive migration script removed after repository verification.

**Verified:**
- File `archive/temporary/memory-zone/scripts/migrate_capitalize_product_names.ts` deleted from the working tree.
- Source-code search (`ts,tsx,js,jsx,json,toml,sql,md`) returns no references except historical governance documents.
- `npm run lint` (`tsc --noEmit`) exits with code `0`; `TS2307 Cannot find module '../../utils/stringHelper'` no longer appears.

---

## Tổng kết

| # | Vấn đề | Mức độ ưu tiên | Effort xử lý | Nên xử lý |
|---|--------|---------------|-------------|-----------|
| 1a | Xóa `services/admin/permissions.ts` | Thấp | 1 phút | ✅ Trước Closeout |
| 1b | `admin-health-check` Edge Function — Reviewed | — | — | KEEP — Production Monitoring Endpoint |
| 1c | `deliver-webhook` Edge Function removed | Trung bình | 5 phút | ✅ RESOLVED — REMOVED |
| 2 | Xóa lint error trong `archive/` | Thấp | 1-2 phút | ✅ RESOLVED — REMOVED |

---

## FINAL GOVERNANCE SUMMARY

Repository Hygiene

COMPLETED

Remaining Open Issues

NONE

Blocking Issues

NONE

Repository Status

READY FOR WAVE-03 CLOSEOUT

Governance Status

CLOSED

Recommendation

Proceed to Wave-03 Closeout Readiness Review