# CURRENT_TASK-031 RPC Cross-Check Report

**Program:** VietSalePro v7 — System Recovery Program  
**Phase:** Phase 5 — Documentation & Derived Artifact Reconciliation  
**Milestone:** M5.2 — Regenerated RPC Contract Documentation  
**CURRENT_TASK:** 031  
**Date:** 2026-07-17  
**Canonical Source:** supabase/migrations/*.sql  
**Code Scope:** services/**/*.ts, lib/**/*.ts, utils/**/*.ts

---

## 1. Summary

| Item | Value |
|---|---|
| Migration files read | 138 |
| Total CREATE FUNCTION declarations | 516 |
| Unique canonical function names | 300 |
| Final canonical overloads | 316 |
| Service code files scanned | 65 |
| Total RPC call sites | 193 |
| Unique RPCs invoked by code | 183 |
| RPCs missing from migrations | 0 |
| Signature mismatches | 0 |

---

## 2. Migration RPCs vs Code RPCs

- **Migration RPC names:** 300
- **Code RPC names:** 183
- **Missing from migrations:** None

---

## 3. Mismatch Register

| RPC | Service Call Site | Call Params | Issue | Canonical Signature(s) | Severity | Disposition |
|---|---|---|---|---|---|---|
| — | — | — | No mismatch detected | — | — | — |

---

## 4. Severity Legend

- **Critical:** Invoked RPC name does not exist in the canonical migration chain, or a missing required grant would cause runtime failure.
- **High:** Canonical signature differs from the service call (parameter name, type, count, order, or return type).
- **Medium:** Documentation drift that does not break runtime behavior.
- **Low:** Cosmetic or ordering differences.

---

## 5. Repository Impact

Only the following files are modified/created by this task:

- D-P3-01_Reconciled_RPC_Contract.md
- docs/admin-dashboard/RPC_CONTRACTS.md
- CURRENT_TASK-031_RPC_CROSSCHECK_REPORT.md
- CURRENT_TASK-031_RECONCILIATION_NOTE.md

No source code, migration, database, test, or RPC implementation file was changed.

*End of CURRENT_TASK-031 RPC Cross-Check Report*
