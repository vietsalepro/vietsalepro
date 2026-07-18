# PROGRAM_RECOVERY_AUTHORIZATION_ERRATA

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 4 — Derived Validation Layer Realignment  
**Document Type:** Errata — Root Cause Analysis of Domain B Mapping Error  
**Date:** 2026-07-16  
**Authority:** Root Cause Analysis per governance priority chain  
**Status:** STOP — Recovery Domain B cannot proceed until this Errata is resolved

---

## 1. Mandate

Phát hiện mâu thuẫn giữa các tài liệu governance về định nghĩa **Domain B — Tenant Administration & Licensing (6 RPCs)**.

Theo hướng dẫn: *"Nếu phát hiện mâu thuẫn giữa: Recovery Authorization → Architecture → Canonical Migration — Phải dừng. Không tự quyết định."*

Tài liệu này thực hiện Root Cause Analysis theo thứ tự ưu tiên:

1. Canonical migration(s) trong `supabase/migrations/`
2. `PHASE4_COVERAGE_ROADMAP.md`
3. `CURRENT_TASK-015_PROGRAM_AUTHORIZATION.md` (không tồn tại)
4. `CURRENT_TASK-015_ARCHITECTURE_DECISION.md`
5. `CURRENT_TASK-015_ENGINEERING_KICKOFF.md` (không tồn tại)
6. `PROGRAM_RECOVERY_AUTHORIZATION.md`

---

## 2. Evidence Collection

### 2.1 Canonical Migrations — Tất cả RPC có `CREATE FUNCTION public.*`

Từ scan toàn bộ `supabase/migrations/*.sql`:

| RPC | Migration File | Line |
|---|---|---|
| `generate_tenant_license` | `20260720000001_sp_7_3_licenses.sql` | 37 |
| `validate_tenant_license` | `20260720000001_sp_7_3_licenses.sql` | 106 |
| `lookup_invitation` | `20260714000001_accept_invitation_rpc.sql` | 17 |
| `accept_invitation` | `20260714000001_accept_invitation_rpc.sql` | 53 |
| `get_revenue_metrics` | `20250708000010_phase_p16_1_revenue_metrics.sql` | 4 |
| `get_churn_cohort_metrics` | `20250708000011_phase_p16_2_churn_cohort.sql` | 5 |
| `set_tenant_subdomain` | `20260718000001_sp_7_1_set_tenant_subdomain.sql` | 4 |
| `get_tenant_by_subdomain` | `20250704000000_phase2_tenant_foundation.sql` | 90 |
| `get_tenant_members_with_email` | `20250706000002_phase_p3_member_management.sql` | 10 |
| `update_tenant_member_role` | `20260712000002_fix_update_tenant_member_role_rpc.sql` | 5 |
| `toggle_tenant_member_active` | `20260712000003_fix_toggle_tenant_member_active_rpc.sql` | 5 |
| `get_tenant_security_settings` | `20260715000003_admin_security_settings.sql` | 131 |

**Cả 12 RPC đều có canonical migration.** Không RPC nào là "không tồn tại" trong migrations.

### 2.2 PHASE4_COVERAGE_ROADMAP.md — Domain Classification (Approved)

Roadmap §2 định nghĩa Domain B gồm 6 RPCs:

| Sub-group | RPCs | Source Files |
|---|---|---|
| Licensing | `generate_tenant_license`, `validate_tenant_license` | `services/admin/licenseService.ts` |
| Member Invitations | `accept_invitation`, `lookup_invitation` | `services/admin/memberAdminService.ts` |
| Program Analytics | `get_churn_cohort_metrics`, `get_revenue_metrics` | `services/admin/analyticsAdminService.ts`, `services/billingAutomationService.ts` |

Roadmap §2 Domain A định nghĩa các RPC sau thuộc Domain A:

| Sub-group | RPCs |
|---|---|
| Permissions & Roles | `can_use_feature`, `has_tenant_role`, `is_system_admin`, `is_tenant_owner` |
| Tenant Context | **`get_tenant_by_subdomain`** |
| Two-Factor Auth | `delete_2fa_backup_codes`, `generate_2fa_backup_codes`, `is_2fa_enabled`, `list_2fa_backup_codes`, `verify_2fa_backup_code` |
| System-Admin Security | `get_locked_emails`, `get_login_attempts`, **`get_tenant_security_settings`**, `record_login_attempt`, `unlock_login_attempts`, `update_tenant_ip_allowlist`, `update_tenant_session_timeout` |
| Login History | `get_admin_login_alerts`, `get_admin_login_history`, `record_admin_login` |

### 2.3 CURRENT_TASK-015_ARCHITECTURE_DECISION.md

§3.1 Authorized Scope — Domain B gồm 6 RPCs:

| Sub-group | RPCs |
|---|---|
| Licensing | `generate_tenant_license`, `validate_tenant_license` |
| Member Invitations | `accept_invitation`, `lookup_invitation` |
| Program Analytics | `get_churn_cohort_metrics`, `get_revenue_metrics` |

**Khớp hoàn toàn với PHASE4_COVERAGE_ROADMAP.md.**

### 2.4 PROGRAM_RECOVERY_AUTHORIZATION.md — Phát hiện sai lệch

§5.1 "Domain B — Tenant Administration & Licensing (6 RPCs)" định nghĩa:

```
get_tenant_by_subdomain
set_tenant_subdomain
get_tenant_members_with_email (duplicate)
update_tenant_member_role
toggle_tenant_member_active
get_tenant_security_settings
```

**Đây là 6 RPCs KHÁC với định nghĩa Domain B từ Canonical Migration + Roadmap + Architecture Decision.**

### 2.5 Trạng thái mock hiện tại

| RPC | Có handler? | Line | Ghi chú |
|---|---|---|---|
| `get_tenant_by_subdomain` | ✅ Có | 3231 | Thuộc Domain A, đã được thêm bởi Recovery Package-01 |
| `set_tenant_subdomain` | ✅ Có | 601 | Pre-Phase-4 handler |
| `get_tenant_members_with_email` | ✅ Có (x2) | 733, 2236 | Pre-Phase-4, duplicate pre-existing |
| `update_tenant_member_role` | ✅ Có | 2251 | Pre-Phase-4 handler |
| `toggle_tenant_member_active` | ✅ Có | 2285 | Pre-Phase-4 handler |
| `get_tenant_security_settings` | ✅ Có | 3370 | Thuộc Domain A, đã được thêm bởi Recovery Package-01 |

**Cả 6 RPCs đều đã có handler. Không cần implement.**

| RPC (Domain B đúng) | Có handler? | Ghi chú |
|---|---|---|
| `generate_tenant_license` | ❌ Chưa | Cần implement |
| `validate_tenant_license` | ❌ Chưa | Cần implement |
| `accept_invitation` | ❌ Chưa | Cần implement |
| `lookup_invitation` | ❌ Chưa | Cần implement |
| `get_churn_cohort_metrics` | ❌ Chưa | Cần implement |
| `get_revenue_metrics` | ❌ Chưa | Cần implement |

---

## 3. Root Cause

### 3.1 Nguyên nhân trực tiếp

**PROGRAM_RECOVERY_AUTHORIZATION.md §5.1 đã mapping sai 6 RPCs vào Domain B.**

Các RPC `get_tenant_by_subdomain`, `get_tenant_security_settings` thực tế thuộc **Domain A (Auth, Identity & Security)** — đã được implement bởi Recovery Package-01.

Các RPC `set_tenant_subdomain`, `get_tenant_members_with_email`, `update_tenant_member_role`, `toggle_tenant_member_active` là các RPC quản lý tenant đã có handler từ pre-Phase-4, không nằm trong danh sách 115 RPCs chưa được mock của Roadmap.

### 3.2 Nguyên nhân gốc

`PROGRAM_RECOVERY_AUTHORIZATION.md` được viết dựa trên forensic evidence từ `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` và `PHASE4_INTEGRATION_AND_COVERAGE_INVENTORY.md`. Các tài liệu này đã thống kê RPCs theo domain mapping của chúng — nhưng domain mapping trong các tài liệu đó **không đồng bộ** với domain classification đã được approve trong `PHASE4_COVERAGE_ROADMAP.md`.

Cụ thể:
- `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §5.B gán `get_tenant_by_subdomain`, `set_tenant_subdomain`, `get_tenant_members_with_email`, `update_tenant_member_role`, `toggle_tenant_member_active`, `get_tenant_security_settings` vào Domain B.
- `PHASE4_COVERAGE_ROADMAP.md` §2 gán `get_tenant_by_subdomain` và `get_tenant_security_settings` vào Domain A, và các RPC member management không nằm trong uncovered list.

**Sự không đồng bộ này là lỗi mapping trong quá trình tổng hợp forensic evidence, không phải lỗi trong canonical migration hay architecture decision.**

### 3.3 Tác động

| Tác động | Mô tả |
|---|---|
| **Domain B sai** | 6 RPCs được liệt kê trong Recovery Authorization đã có handler, không cần implement |
| **Domain B đúng bị bỏ sót** | 6 RPCs từ CURRENT_TASK-015 (`generate_tenant_license`, `validate_tenant_license`, `accept_invitation`, `lookup_invitation`, `get_churn_cohort_metrics`, `get_revenue_metrics`) chưa được đề cập trong Recovery Authorization |
| **Coverage gap không thay đổi** | 64 RPCs còn thiếu (theo RECOVERY_PACKAGE_01_VERIFICATION_REPORT) vẫn bao gồm 6 RPCs Domain B đúng |

---

## 4. Mapping Đúng

### 4.1 Domain B — Tenant Administration & Licensing (6 RPCs)

Theo canonical migration + PHASE4_COVERAGE_ROADMAP + CURRENT_TASK-015_ARCHITECTURE_DECISION:

| # | RPC | Sub-group | Migration File | Trạng thái |
|---|---|---|---|---|
| 1 | `generate_tenant_license` | Licensing | `20260720000001_sp_7_3_licenses.sql:37` | ❌ Chưa có handler |
| 2 | `validate_tenant_license` | Licensing | `20260720000001_sp_7_3_licenses.sql:106` | ❌ Chưa có handler |
| 3 | `lookup_invitation` | Member Invitations | `20260714000001_accept_invitation_rpc.sql:17` | ❌ Chưa có handler |
| 4 | `accept_invitation` | Member Invitations | `20260714000001_accept_invitation_rpc.sql:53` | ❌ Chưa có handler |
| 5 | `get_revenue_metrics` | Program Analytics | `20250708000010_phase_p16_1_revenue_metrics.sql:4` | ❌ Chưa có handler |
| 6 | `get_churn_cohort_metrics` | Program Analytics | `20250708000011_phase_p16_2_churn_cohort.sql:5` | ❌ Chưa có handler |

### 4.2 Các RPC bị mapping sai trong PROGRAM_RECOVERY_AUTHORIZATION.md

| RPC (trong Recovery Auth) | Domain đúng | Lý do | Trạng thái |
|---|---|---|---|
| `get_tenant_by_subdomain` | **Domain A** — Tenant Context (Roadmap §2) | Được phân loại trong Roadmap là Auth & Security | ✅ Đã có handler (Recovery Package-01) |
| `set_tenant_subdomain` | **Tenant Management** (pre-Phase-4) | Không nằm trong 115 uncovered RPCs | ✅ Đã có handler (pre-Phase-4) |
| `get_tenant_members_with_email` | **Member Management** (pre-Phase-4) | Không nằm trong 115 uncovered RPCs | ✅ Đã có handler (pre-Phase-4, duplicate) |
| `update_tenant_member_role` | **Member Management** (pre-Phase-4) | Không nằm trong 115 uncovered RPCs | ✅ Đã có handler (pre-Phase-4) |
| `toggle_tenant_member_active` | **Member Management** (pre-Phase-4) | Không nằm trong 115 uncovered RPCs | ✅ Đã có handler (pre-Phase-4) |
| `get_tenant_security_settings` | **Domain A** — System-Admin Security (Roadmap §2) | Được phân loại trong Roadmap là Auth & Security | ✅ Đã có handler (Recovery Package-01) |

---

## 5. Kết luận

### 5.1 Tài liệu sai

**`PROGRAM_RECOVERY_AUTHORIZATION.md` §5.1** — Domain B mapping sai.

### 5.2 Nguyên nhân

Không đồng bộ giữa domain classification trong `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` (nguồn dữ liệu cho Recovery Authorization) và `PHASE4_COVERAGE_ROADMAP.md` (domain classification đã được Program Manager approve).

### 5.3 Mapping đúng

Domain B gồm 6 RPCs từ **CURRENT_TASK-015_ARCHITECTURE_DECISION.md**:
`generate_tenant_license`, `validate_tenant_license`, `accept_invitation`, `lookup_invitation`, `get_churn_cohort_metrics`, `get_revenue_metrics`

### 5.4 Trạng thái Recovery

- **6 RPCs Domain B đúng**: Chưa có handler nào. Cần implement.
- **6 RPCs bị mapping sai**: Đã có handler. Không cần implement.

---

## 6. STOP

**Recovery Domain B không thể tiếp tục cho đến khi Errata này được xử lý.**

Hành động cần thiết:

1. **Xác nhận Errata** — Program Manager xác nhận mapping đúng.
2. **Sửa PROGRAM_RECOVERY_AUTHORIZATION.md** — Cập nhật §5.1 Domain B với 6 RPCs đúng.
3. **Tiếp tục Recovery** — Sau khi Errata được xác nhận, Recovery Domain B có thể implement 6 RPCs:
   - `generate_tenant_license`
   - `validate_tenant_license`
   - `accept_invitation`
   - `lookup_invitation`
   - `get_churn_cohort_metrics`
   - `get_revenue_metrics`

---

*Tài liệu này chỉ ghi nhận Errata. Không implement code. Không tự quyết định Domain. Không tiếp tục Recovery.*

---

## Errata — Phase 5 Close-out (2026-07-18)

Service handlers now exist for the six Domain B RPCs (`generate_tenant_license`, `validate_tenant_license`, `accept_invitation`, `lookup_invitation`, `get_revenue_metrics`, `get_churn_cohort_metrics`) in `services/admin/licenseService.ts`, `services/admin/memberAdminService.ts`, `services/admin/analyticsAdminService.ts`, and `services/billingAutomationService.ts`. The original mapping contradiction is acknowledged; the STOP condition is lifted for governance purposes and any remaining implementation gaps are routed to Phase 6 / product backlog.