# MIGRATION VERSION ALIASES

**Program:** VietSalePro v7 — Production Deployment Program  
**Date:** 2026-07-19  
**Purpose:** Permanent alias record for migrations whose canonical `version` string changed during the Repository Re-baseline and the C1 replay remediation.

---

## 1. Original 9 Divergent Migrations (Re-baseline)

These aliases document the 9 re-timestamped migrations mandated by `REPOSITORY_REBASELINE_PLAN.md` Section 4.

| Original version | Canonical version | Canonical filename | Original author | Reason for rename | Implementation reference | Repository evidence |
|---|---|---|---|---|---|---|
| 20260718000002 | 20260713053550 | 20260713053550_sp1_6_expand_audit_log_event_types.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |
| 20260719000000 | 20260713053608 | 20260713053608_sp2_4_announcement_audience_active_range.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |
| 20260719000001 | 20260713053615 | 20260713053615_sp_7_2_custom_domain_verification.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |
| 20260720000000 | 20260713053622 | 20260713053622_sp2_6_global_config_rpc.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |
| 20260720000001 | 20260713053644 | 20260713053644_sp_7_3_licenses.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |
| 20260721000000 | 20260713053657 | 20260713053657_sp2_7_user_management_rpc.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |
| 20260722000000 | 20260713053746 | 20260713053746_sp2_8_role_management_rpc.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |
| 20260723000000 | 20260713053807 | 20260713053807_sp3_1_plans_crud_features.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |
| 20260728000000 | 20260713053828 | 20260713053828_sp5_6_db_maintenance.sql | suacauba@gmail.com / phatnt056 | Adopt production-applied version string per `REPOSITORY_REBASELINE_PLAN.md` Section 4 | `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1 | R100 content-identical rename; per-file SHA-256 recorded in `REPOSITORY_REBASELINE_IMPLEMENTATION_RESUME.md` Section 3.1; verified `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` Section 3.2 |

## 2. C1 Remediation Re-timestamp

This alias documents the additional rename performed to resolve the replay defect identified in `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` C1.

| Original version | Canonical version | Canonical filename | Original author | Reason for rename | Implementation reference | Repository evidence |
|---|---|---|---|---|---|---|
| 20260715000001 | 20260713000012 | 20260713000012_create_audit_log_table.sql | N/A (remediation re-timestamp) | Replay-correct dependency ordering: `public.audit_log` must exist before `20260713053550_sp1_6_expand_audit_log_event_types.sql` (`ALTER TABLE public.audit_log`) and `20260713053644_sp_7_3_licenses.sql` (`INSERT INTO public.audit_log`), which are lexicographically earlier. | `REPOSITORY_REBASELINE_REMEDIATION_IMPLEMENTATION.md` Section 2 | `REPOSITORY_REBASELINE_VERIFICATION_REPORT.md` C1 records `npx supabase db diff --local` `ERROR: relation "public.audit_log" does not exist`; `REPOSITORY_REBASELINE_REMEDIATION_AUTHORIZATION.md` Section 4 authorizes re-timestamping `create_audit_log_table.sql`; file content SHA-256 `9085CD5282DD6C927099CB88E7F8966EBD9F883943549B06766BE3CFCB416C55` is unchanged. |
