# PHASE4 Integration & Coverage Inventory

**Program:** VietSalePro v7 — System Recovery Program
**Phase:** Phase 4 — Derived Validation Layer Realignment
**Document Type:** Independent Integration & Coverage Inventory (read-only)
**Date:** 2026-07-16
**Subject file:** `tests/mocks/supabase.ts`
**Authority / Constraints observed:** No file modified (except the creation of this report), no commit, no merge, no cherry-pick, no rebase, no stash pop, no branch checkout, no reset. No `CURRENT_TASK` authorized, no phase transition, no corrective action, no recovery plan. This is a **statistical inventory only**, not an implementation.

---

## 0. Method

- **Git binary:** `git version 2.55.0.windows.3` (`C:\Program Files\Git\cmd\git.exe`).
- **Handler detection:** every `name === "…"` / `name === '…'` comparison in `tests/mocks/supabase.ts`, matched by regex `name === ["']([a-zA-Z0-9_-]+)["']`. This counts every registration branch (the file uses a flat `if (name === …)` chain; no `switch`, `Map`, factory, or delegated dispatcher exists).
- **Code RPC detection:** every `.rpc('…')` / `.rpc("…")` call under `services/`, `lib/`, `utils/` (recursive), unique names.
- **Sources scanned:** working tree, `HEAD`, all 37 non-`master` local branches, all remote branches, all 3 stashes, all 42 dangling commits (`git fsck --full --no-reflogs`).
- All git commands were read-only (`show`, `cat-file -e`, `for-each-ref`, `stash list`, `fsck`, `status`, `log`). Extraction ran on in-memory content; scratch scripts were kept **outside** the repository working tree.

**Git state at time of inventory:**

```text
Branch: master
HEAD:   afdef607a8890ce4b4e033bfd276e86049807e7f
        phatnt056  Tue Jul 14 15:22:09 2026 +0700
        "docs: add CURRENT_TASK-009 implementation report (G5)"
git status --short:
  M scripts/audit-rpc-contracts.ts
  M tests/mocks/supabase.ts
  (all PHASE4_* / CURRENT_TASK-01x/02x_* governance docs are untracked "??")
```

`tests/mocks/supabase.ts` is **modified but uncommitted**. No Phase 4 work is committed anywhere.

---

## STEP 1 — Working Tree Inventory

`tests/mocks/supabase.ts` (working tree, uncommitted):

| Metric | Value |
|---|---|
| Raw handlers (`name === …` branches) | **117** |
| Unique handlers | **116** |
| Duplicate handlers | **1** — `get_tenant_members_with_email` (lines 730 and 2233) |

Domain attribution (against the Phase 4 Coverage Roadmap): the 116 unique handlers = 69 pre-Phase-4 baseline RPC handlers + 16 hyphenated Edge-Function handlers + 1 orphan (`update_tenant_status`) + 31 Phase-4 handlers added by CURRENT_TASK-025…029 (Domains D, E, C, F, G). Handlers for CURRENT_TASK-014…024 (Domains A, B, H1–H9) are **not present**.

Full working-tree handler list (117 branches, line numbers):

```text
425  create_tenant_with_admin          1554 get_tenant_storage_usage      2477 retry_webhook_delivery
483  update_tenant_status              1575 bulk_update_tenants           2495 revoke_tenant_api_key
492  search_tenants                    1605 get_maintenance_windows       2509 trigger_webhook_event
522  update_tenant                     1621 create_maintenance_window     2557 update_tenant_webhook
598  set_tenant_subdomain              1643 update_maintenance_window     2585 record_terms_acceptance
623  get_tenant_by_domain              1658 delete_maintenance_window     2623 get_terms_acceptances
629  delete_tenant_safe                1668 list_partners                 2651 export_tenant_data
641  get_tenant_usage_summary          1691 create_partner                2706 create_gdpr_request
669  update_tenant_subscription        1731 update_partner                2737 get_gdpr_requests
695  reset_monthly_order_counter       1763 delete_partner                2768 gdpr_export_user_data
707  get_tenant_feature_flags          1774 list_integrations             2870 gdpr_delete_user_data
716  update_tenant_feature_flags       1801 create_integration            2934 send_in_app_message
730  get_tenant_members_with_email     1844 update_integration            2959 get_in_app_messages_for_tenant
750  search_tenant_members             1876 delete_integration            2973 mark_in_app_message_read
798  get_system_overview               1887 reset_demo_data               2993 validate_promo_code
874  get_top_tenants                   1920 migrate_tenant_data           3056 get_promo_code_usage_counts
901  get_tenants_admin                 1969 get_fraud_detection_config    3065 apply_voucher_to_invoice
941  get_tenant_growth                 1986 set_fraud_detection_config    3204 invite-member
961  get_rate_limit_logs               2014 run_fraud_detection           3242 impersonate-tenant
972  get_system_admins                 2019 get_fraud_queue               3303 end-impersonation
983  add_system_admin                  2043 get_fraud_stats               3334 reset-password
996  remove_system_admin               2054 update_fraud_queue_status     3343 send-billing-email
1009 get_data_retention_status         2064 get_data_retention_config     3358 delete-tenant
1026 get_default_plan_limits           2080 set_data_retention_config     3385 check-subdomain
1039 set_default_plan_limits           2110 run_data_retention            3401 system-health
1059 get_maintenance_mode              2126 get_connection_pool_stats     3416 send-template-email
1066 set_maintenance_mode              2140 get_read_replica_status       3444 send-sms
1075 get_plans                         2152 enqueue_heavy_op_job          3464 send-ticket-email
1098 get_plan_by_key                   2176 get_heavy_op_jobs             3477 error-performance
1122 create_plan                       2186 claim_heavy_op_job            3515 system-backup
1152 update_plan                       2198 complete_heavy_op_job         3531 tenant-backup
1179 delete_plan                       2211 retry_heavy_op_job            3545 tenant-restore
1196 create_invoice                    2226 get_current_user_tenants      3564 create-system-admin
1284 confirm_payment                   2233 get_tenant_members_with_email (DUPLICATE)
1335 get_billing_reminder_config       2248 update_tenant_member_role
1349 set_billing_reminder_config       2266 remove_tenant_member
1369 get_pending_billing_reminders     2282 toggle_tenant_member_active
1394 send_billing_reminders            2297 create_tenant_api_key
1441 get_billing_automation_status     2343 create_tenant_webhook
1512 get_billing_job_logs              2389 delete_tenant_webhook
1535 get_current_announcements...      2400 list_tenant_api_keys
                                        2424 list_tenant_webhooks
                                        2445 list_webhook_deliveries
```

---

## STEP 2 — HEAD Inventory

`HEAD:tests/mocks/supabase.ts` (commit `afdef607`, Phase-3 era, pre-Phase-4):

| Metric | Value |
|---|---|
| Raw handlers | **86** |
| Unique handlers | **85** |
| Duplicate handlers | **1** — `get_tenant_members_with_email` |

The 85 unique = 69 underscore-named RPC handlers + 16 hyphenated Edge-Function handlers. (This reconciles the Git Forensic report's "69 unique RPC names / 86 case blocks": it counted only the 69 underscore RPC names.) Working tree adds exactly **31** handlers over HEAD (116 − 85), all uncommitted, corresponding to CURRENT_TASK-025…029.

---

## STEP 3 — Branch Inventory

**37 non-`master` local branches + 2 remote branches** carry `tests/mocks/supabase.ts`. Merge status vs `master`: SP-6.x / SP-7.x / integrate / recover / multi-tenant are merged; **all `feat/SP-1.x`…`feat/SP-5.x` are NOT merged** (`git branch --no-merged master`).

| Branch | Handlers (raw) | Unique |
|---|---|---|
| `feat/SP-5.7-storage-management` | 98 | **97** ← richest branch |
| `feat/SP-5.6-db-maintenance` | 98 | **97** ← richest branch |
| `feat/SP-5.4-backup-automation` | 93 | 92 |
| `feat/SP-5.5-restore-workflow` | 93 | 92 |
| `feat/SP-3.2` … `feat/SP-5.3` (10 branches) | 91 | 90 |
| `feat/SP-2.4`, `2.7`, `2.8`, `2.9`, `SP-3.1` | 87 | 86 |
| `feat/SP-7.1`…`7.4`, `integrate/admin-dashboard-features`, `recover-sp-7.5`, `recover-sp-c.3` | 87 | 86 |
| `origin/master` | 87 | 86 |
| `feat/SP-6.2-sms-service`, `feat/SP-6.3-support-tickets` | 86 | 85 |
| `docs/SP-1.1`, `docs/SP-1.3`, `feat/SP-1.0`, `1.2`, `1.4`, `2.1`, `2.2`, `test/SP-1.5` | 85 | 84 |
| `multi-tenant`, `origin/multi-tenant` | 2 | 2 |

Special check of the four branches named in the mandate:

| Branch | Unique | Note |
|---|---|---|
| `feat/SP-5.4-backup-automation` | 92 | not merged |
| `feat/SP-5.5-restore-workflow` | 92 | not merged |
| `feat/SP-5.6-db-maintenance` | 97 | not merged — richest branch |
| `feat/SP-5.7-storage-management` | 97 | not merged — richest branch |

**No branch exceeds the working tree (116 unique).** The richest branch (97) is missing all 31 Phase-4 CURRENT_TASK-025…029 handlers that the working tree has, and adds handlers (subscription/db-maintenance/global-config/storage/backup) that the working tree does not have.

---

## STEP 4 — Stash Inventory

`git stash list` → 3 stashes:

| Stash | Commit | Handlers (raw) | Unique | Contains file? |
|---|---|---|---|---|
| `stash@{0}` — *On feat/SP-5.7: !!GitHub_Desktop* | `a52fd2d5` | 98 | 97 | yes |
| `stash@{1}` — *On feat/SP-5.7: WIP SP-5.7/SP-6.1 before SP-6.2* | `22dd4596` | 99 | **98** ← richest stash | yes |
| `stash@{2}` — *On main: !!GitHub_Desktop* | `920d2110` | — | — | **no** (mock file not in stash) |

`git rev-parse stash@{1}` = `22dd4596…` — i.e. the richest stash and the richest dangling commit (below) are the **same object**.

---

## STEP 5 — Dangling Commit Inventory

`git fsck --full --no-reflogs`: **42 dangling commits total; 38 contain `tests/mocks/supabase.ts`.**

| Dangling commit | Handlers (raw) | Unique |
|---|---|---|
| `22dd4596` (= `stash@{1}`) | 99 | **98** ← richest dangling |
| `56483b2e`, `8cca31d8` | 93 | 92 |
| `18ee0b71`, `2abeadea`, `31cd65fb`, `331d74f3`, `3a16557e`, `3d4f7617`, `3d6c0239`, `474b1941`, `ae449f34`, `eb69a52b`, `ed8bd697`, `fad1da87` | 87 | 86 |
| `b4019bcc`, `bd54df61` | 86 | 85 |
| `0265b996`, `2cf187b0`, `64c2804f`, `6636db2e`, `73fba0d4`, `76b6db32`, `77edb8ba`, `d17a2fc8`, `dff095b2` | 85 | 84 |
| `b9a133e6` | 84 | 83 |
| `201b3bd5` | 78 | 78 |
| `258cc48b`, `61cb2169`, `638630b7`, `ea1983c0`, `f11f0d0a`, `fe5044a7` | 76 | 76 |
| `e641107c` | 75 | 75 |
| `727bd4b0` | 68 | 68 |
| `98a6fa00` | 48 | 48 |
| `644be0fc` | 26 | 26 |

**No dangling commit exceeds 98 unique; none exceeds the working tree's 116.**

---

## STEP 6 — Global Union

`UNION_OF_ALL_HANDLERS = WorkingTree ∪ HEAD ∪ Branches ∪ Stashes ∪ Dangling` (statistical only; no merge performed):

| Set | Unique handlers |
|---|---|
| Working Tree | 116 |
| HEAD | 85 |
| All git sources excl. working tree (branches ∪ stashes ∪ dangling) | 103 |
| **UNION_OF_ALL_HANDLERS** | **134** |

The union (134) exceeds the working tree (116) by **18 handlers** that exist only in git sources and are **absent from the working tree** (enumerated in STEP 8.C).

---

## STEP 7 — Source Matrix

Presence of each of the 134 union handlers across sources (Branch/Stash/Dangling = "present in at least one"). `CodeRPC` = called by `services/`/`lib/`/`utils/`.

Three distinct presence patterns emerge; the full 134-row matrix collapses into these groups:

### Group 1 — Present in ALL committed sources (WT, HEAD, Branch, Stash, Dangling) — 68 handlers, all CodeRPC=Y

Baseline commerce/admin/billing/system handlers, e.g. `add_system_admin`, `bulk_update_tenants`, `confirm_payment`, `create_invoice`, `create_plan`, `get_system_overview`, `get_tenants_admin`, `run_fraud_detection`, `update_tenant`, `update_tenant_subscription`, … (all 68 pre-Phase-4 covered code RPCs).

### Group 2 — Edge-Function / orphan handlers present in committed sources but CodeRPC=N — 17 handlers

`check-subdomain`, `create-system-admin`, `delete-tenant`, `end-impersonation`, `error-performance`, `impersonate-tenant`, `invite-member`, `reset-password`, `send-billing-email`, `send-sms`, `send-template-email`, `send-ticket-email`, `system-backup`, `system-health`, `tenant-backup`, `tenant-restore`, `update_tenant_status` (orphan). Not called by code.

### Group 3 — Working-Tree ONLY (WT=Y, HEAD/Branch/Stash/Dangling=N) — 31 handlers, all CodeRPC=Y

The CURRENT_TASK-025…029 Phase-4 handlers. Committed **nowhere**; lost by any `reset`/`checkout`.

| Handler | WT | HEAD | Branch | Stash | Dangling | CodeRPC |
|---|---|---|---|---|---|---|
| apply_voucher_to_invoice | Y | - | - | - | - | Y |
| create_gdpr_request | Y | - | - | - | - | Y |
| create_integration | Y | - | - | - | - | Y |
| create_partner | Y | - | - | - | - | Y |
| create_tenant_api_key | Y | - | - | - | - | Y |
| create_tenant_webhook | Y | - | - | - | - | Y |
| delete_integration | Y | - | - | - | - | Y |
| delete_partner | Y | - | - | - | - | Y |
| delete_tenant_webhook | Y | - | - | - | - | Y |
| export_tenant_data | Y | - | - | - | - | Y |
| gdpr_delete_user_data | Y | - | - | - | - | Y |
| gdpr_export_user_data | Y | - | - | - | - | Y |
| get_gdpr_requests | Y | - | - | - | - | Y |
| get_in_app_messages_for_tenant | Y | - | - | - | - | Y |
| get_promo_code_usage_counts | Y | - | - | - | - | Y |
| get_terms_acceptances | Y | - | - | - | - | Y |
| list_integrations | Y | - | - | - | - | Y |
| list_partners | Y | - | - | - | - | Y |
| list_tenant_api_keys | Y | - | - | - | - | Y |
| list_tenant_webhooks | Y | - | - | - | - | Y |
| list_webhook_deliveries | Y | - | - | - | - | Y |
| mark_in_app_message_read | Y | - | - | - | - | Y |
| record_terms_acceptance | Y | - | - | - | - | Y |
| retry_webhook_delivery | Y | - | - | - | - | Y |
| revoke_tenant_api_key | Y | - | - | - | - | Y |
| send_in_app_message | Y | - | - | - | - | Y |
| trigger_webhook_event | Y | - | - | - | - | Y |
| update_integration | Y | - | - | - | - | Y |
| update_partner | Y | - | - | - | - | Y |
| update_tenant_webhook | Y | - | - | - | - | Y |
| validate_promo_code | Y | - | - | - | - | Y |

### Group 4 — GIT ONLY (WT=N; present in Branch/Stash/Dangling) — 18 handlers, all CodeRPC=N

| Handler | WT | HEAD | Branch | Stash | Dangling | CodeRPC |
|---|---|---|---|---|---|---|
| cancel_subscription | - | - | Y | Y | Y | - |
| create_subscription | - | - | Y | Y | Y | - |
| downgrade_subscription | - | - | Y | Y | Y | - |
| upgrade_subscription | - | - | Y | Y | Y | - |
| get_global_config | - | - | Y | Y | Y | - |
| set_global_config | - | - | Y | Y | Y | - |
| get_storage_usage | - | - | Y | Y | Y | - |
| get_db_index_stats | - | - | Y | Y | Y | - |
| get_db_table_stats | - | - | Y | Y | Y | - |
| list_db_maintenance_jobs | - | - | Y | Y | Y | - |
| run_db_maintenance_job | - | - | Y | Y | Y | - |
| list_automated_backup_snapshots | - | - | Y | Y | Y | - |
| trigger_automated_backup | - | - | Y | Y | Y | - |
| get_email_brand | - | - | - | - | Y | - |
| get_email_template_by_key | - | - | - | - | Y | - |
| audit-log | - | - | - | - | Y | - |
| db-maintenance | - | - | - | - | Y | - |
| send-email | - | - | - | Y | Y | - |

**All 18 git-only handlers have `CodeRPC = N`** — none is called by current `services/`/`lib/`/`utils/` code. They are feature-branch (`feat/SP-5.x`) subscription-lifecycle / DB-maintenance / global-config / storage / backup / email experiments that were never merged and are not part of the current contract surface.

---

## STEP 8 — Code Match

`UNION_OF_ALL_HANDLERS (134)` reconciled against `CODE RPC INVENTORY`.

**CODE RPC inventory:** **184 unique** RPC names called by `services/`/`lib/`/`utils/` (independently reproduced; matches `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md`. The canonical script `scripts/audit-rpc-contracts.ts` reports 183 because its single-line regex misses `complete_disposal` at `services/supabaseService.ts:3519–3520`.)

| Category | Count | Definition |
|---|---|---|
| **A. Already Covered** (in working tree) | **99** | Code RPC with a handler in the working-tree mock file |
| **B. Recoverable from Git** (in a branch/stash/dangling but NOT in working tree) | **0** | — |
| **C. Working Tree Only** (in WT, in NO git source; lost on reset) | **31** | All 31 are Code RPCs (STEP 7 Group 3) |
| **D. Still Missing** (in NO source anywhere) | **85** | Code RPC absent from WT, HEAD, every branch, every stash, every dangling commit |

Cross-checks: `99 + 85 = 184` (all code RPCs accounted for). Working-tree coverage `99` = HEAD baseline `68` + working-tree-only `31`. Union coverage = `99` (git sources add **0** code-RPC coverage; the 18 git-only handlers are all non-code).

### B. Recoverable from Git — **0 code RPCs**

There is **no** code RPC that is missing from the working tree yet present in any branch, stash, or dangling commit. Git dispersion cannot restore any missing coverage.

### D. Still Missing — **85 code RPCs** (exist in no source)

```text
accept_invitation, adjust_customer_debt, adjust_supplier_debt, can_use_feature,
cancel_inventory_count_rpc, cancel_order, cancel_return_order_v2, cancel_supplier_exchange,
check_product_barcode_exists, check_product_code_exists, check_stock_ledger_drift,
complete_disposal, complete_inventory_count, count_point_products, create_exchange_transaction,
create_return_order, create_supplier_exchange, delete_2fa_backup_codes, delete_disposal_with_restore,
delete_import_v2, delete_inventory_count_rpc, delete_order, filter_customers_rpc, filter_disposals_rpc,
filter_import_receipts_rpc, filter_products_rpc, filter_return_orders_rpc, filter_suppliers_rpc,
generate_2fa_backup_codes, generate_tenant_license, get_admin_login_alerts, get_admin_login_history,
get_brand_product_counts, get_category_product_counts, get_churn_cohort_metrics, get_customer_debt_ledger,
get_customer_report, get_customer_stats, get_dashboard_summary, get_disposal_auto_code,
get_import_receipt_count_by_date, get_import_receipts_by_product_and_lot, get_import_receipts_by_supplier_id,
get_import_stats, get_inventory_report, get_locked_emails, get_login_attempts, get_order_auto_code,
get_product_by_barcode, get_product_stats, get_profit_report, get_return_order_auto_code,
get_revenue_metrics, get_sales_report, get_stock_ledger, get_supplier_debt_ledger, get_supplier_report,
get_supplier_stats, get_tenant_by_subdomain, get_tenant_security_settings, get_unsynced_brands,
get_unsynced_categories, has_tenant_role, increment_product_quantity, is_2fa_enabled, is_system_admin,
is_tenant_owner, list_2fa_backup_codes, lookup_invitation, pay_order_debt, pay_supplier_debt,
process_checkout, process_import_v2, record_admin_login, record_login_attempt, search_customers_rpc,
search_orders_rpc, search_products_rpc, search_suppliers_rpc, unlock_login_attempts, update_import_v2,
update_tenant_ip_allowlist, update_tenant_session_timeout, validate_tenant_license, verify_2fa_backup_code
```

These 85 correspond exactly to the domains CURRENT_TASK-014…024 (A, B, H1–H9) claimed to complete, plus the independently-discovered `complete_disposal`.

---

## STEP 9 — Domain Matrix

Coverage per Phase-4 Coverage Roadmap domain. Columns: total target RPCs, present in Working Tree, recoverable from Git, actually missing.

| Domain | RPC total | In Working Tree | Recoverable from Git | Actually Missing |
|---|---|---|---|---|
| A — Auth, Identity & Security | 20 | 0 | 0 | 20 |
| B — Tenant Admin & Licensing | 6 | 0 | 0 | 6 |
| C — Compliance & GDPR | 7 | 7 | 0 | 0 |
| D — Integrations & Partners | 8 | 8 | 0 | 0 |
| E — Webhooks & API Keys | 10 | 10 | 0 | 0 |
| F — Notifications | 3 | 3 | 0 | 0 |
| G — Promotions | 3 | 3 | 0 | 0 |
| H1 — Products & Catalog | 11 | 0 | 0 | 11 |
| H2 — Inventory & Stock | 7 | 0 | 0 | 7 |
| H3 — Orders & Sales | 7 | 0 | 0 | 7 |
| H4 — Returns & Exchanges | 7 | 0 | 0 | 7 |
| H5 — Customers | 6 | 0 | 0 | 6 |
| H6 — Suppliers | 7 | 0 | 0 | 7 |
| H7 — Imports | 8 | 0 | 0 | 8 |
| H8 — Disposals (incl. `complete_disposal`) | 4 | 0 | 0 | 4 |
| H9 — Reports & Dashboard | 2 | 0 | 0 | 2 |
| **Phase-4 target subtotal** | **116** | **31** | **0** | **85** |
| Baseline / Other (pre-Phase-4: system-admin, billing, plans, maintenance, fraud, tenant-members, heavy-ops, retention, tenant CRUD) | 68 | 68 | 0 | 0 |
| **TOTAL (Code RPC)** | **184** | **99** | **0** | **85** |

Every domain is binary: it is either fully present in the working tree (C, D, E, F, G, and the pre-Phase-4 baseline) or fully absent from every source (A, B, H1–H9). No domain is partially recoverable from git.

---

## STEP 10 — Final Inventory (numbers only)

| # | Measure | Value |
|---|---|---|
| 1 | **Working Tree Coverage** | **99 / 184** (53.8%) — `99 / 183` (54.1%) against the program denominator |
| 2 | **HEAD Coverage** | **68 / 184** (37.0%) — `68 / 183` = 37.2% baseline |
| 3 | **Recoverable Coverage** (added by any branch/stash/dangling) | **+0** (0 additional code RPCs) |
| 4 | **Union Coverage** | **99 / 184** (identical to working tree) |
| 5 | **Irrecoverable Missing Coverage** | **85 / 184** code RPCs exist in no source |

### Maximum Theoretical Coverage

If every branch + every stash + every dangling commit + the working tree were logically unioned (no merge performed):

- **RPCs that would be covered: 99 / 184** (99 / 183 against the program denominator).
- **RPCs that would still be missing: 85.**

The maximum theoretical coverage **equals the current working-tree coverage (99)**. Unioning all git sources adds only 18 handlers, and all 18 are non-code (uncalled feature-branch experiments). Git dispersion contributes **zero** additional code-RPC coverage.

*(This is an inventory arithmetic only; it is not an implementation and authorizes no merge.)*

---

## FINAL DECISION

> ### C. There remain RPCs that were never implemented anywhere.

**85 of the 184 code RPCs have no mock handler in any source** — not in the working tree, not in `HEAD`, not in any of the 37 non-`master` local branches or 2 remote branches, not in any of the 3 stashes, and not in any of the 42 dangling commits. Because *Recoverable from Git = 0*, no git operation can restore them; they were never written into `tests/mocks/supabase.ts` in any recorded or working state.

### Evidence

- **CODE RPC = 184** unique (independently reproduced; audit script's 183 omits `complete_disposal`, itself one of the 85 missing).
- **UNION_OF_ALL_HANDLERS = 134** unique across all sources; intersection with code = **99**. Therefore **85** code RPCs are outside the union entirely (STEP 8.D).
- **Recoverable from Git = 0** (STEP 8.B): every handler the working tree lacks but git holds (18) is non-code (STEP 7 Group 4).
- The 85 missing map exactly to Domains A, B, H1–H9 = CURRENT_TASK-014…024 (STEP 9), the tasks whose handlers `PHASE4_COVERAGE_RECONCILIATION_AUDIT.md` §6 and `PHASE4_FORENSIC_INVESTIGATION_REPORT.md` §6 found absent.

### Qualifications (evidence-bound, not the operative decision)

- **Conclusion A (working tree fully reflects project state) is refuted.** The working tree is uncommitted, and 18 handlers exist in git sources that the working tree does not contain (STEP 7 Group 4); the working tree is neither committed nor a superset of git.
- **Conclusion B (implementation dispersed across git) is literally observed but immaterial to coverage.** Dispersed committed implementation does exist — the richest states are `feat/SP-5.6`/`feat/SP-5.7` (97 unique) and `stash@{1}` = dangling `22dd4596` (98 unique). However, that dispersion carries only the 18 uncalled `feat/SP-5.x` handlers (subscription/DB-maintenance/global-config/storage/backup/email). It does **not** contain any of the 85 missing Phase-4 code RPCs. Dispersion is real but adds **0** to code-RPC coverage.

The operative, coverage-decisive conclusion is therefore **C**.

---

*End of inventory. No recovery plan, corrective action, CURRENT_TASK-030, Phase 5, exit review, or closeout is produced or implied by this document.*
