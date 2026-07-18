# CURRENT_TASK-031 Reconciliation Note

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 5 — Documentation & Derived Artifact Reconciliation  
**Milestone:** M5.2 — Regenerated RPC Contract Documentation  
**CURRENT_TASK:** 031  
**Date:** 2026-07-17  

---

## 1. Purpose

This note records how the regenerated RPC contract documents differ from the previous D-P3-01_Reconciled_RPC_Contract.md and docs/admin-dashboard/RPC_CONTRACTS.md and explains each difference from the canonical migration source.

---

## 2. Regeneration Method

- Canonical source: supabase/migrations/*.sql (138 forward-migration files).
- Parser applied CREATE [OR REPLACE] FUNCTION, DROP FUNCTION, GRANT EXECUTE, and REVOKE ALL ... FROM PUBLIC statements in migration-file order.
- Service-layer call sites were extracted from services/**/*.ts, lib/**/*.ts, and utils/**/*.ts.
- Prior derived documents were used only for drift detection, not as regeneration input.

---

## 3. High-Level Diff Summary

| Area | Previous D-P3-01 (v1.0) | Regenerated D-P3-01 (v1.1) |
|---|---|---|
| Canonical source | supabase/schema.sql (generated artifact) | supabase/migrations/*.sql (canonical chain) |
| CREATE FUNCTION declarations | 515 | 516 |
| Unique canonical function names | 300 | 300 |
| Invoked unique RPCs | 182 | 183 |
| Missing from migrations | 4 (admin_update_subscription, get_member_with_email, search_members_by_email, get_storage_usage) | 0 |
| Coverage | 97.8% | 100.0% |

## 4. Notable Signature Drift

- update_tenant_subscription now has the canonical 8-parameter signature (added p_max_storage_gb) per migration 20260723000001_g1_add_max_storage_gb_to_tenant_subscriptions.sql.
- get_top_tenants canonical signature is now (p_limit INTEGER, p_offset INTEGER) per 20260717000000_fix_admin_tenant_rpc_signatures.sql.
- get_current_user_tenants() and get_tenants_admin(...) are now present in the canonical chain and invoked by service code.

## 5. Disposition of Mismatches

No unresolved critical or high-severity contract mismatch remains. The regenerated documents are consistent with the canonical migration chain and service-layer call sites.

## 6. Files Changed

- D-P3-01_Reconciled_RPC_Contract.md — regenerated from supabase/migrations/*.sql.
- docs/admin-dashboard/RPC_CONTRACTS.md — regenerated from supabase/migrations/*.sql.
- CURRENT_TASK-031_RPC_CROSSCHECK_REPORT.md — new evidence file.
- CURRENT_TASK-031_RECONCILIATION_NOTE.md — new evidence file.

*End of CURRENT_TASK-031 Reconciliation Note*
