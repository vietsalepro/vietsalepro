## What Was Done

- Created `promo_codes`, `promotion_rules`, `promo_code_usages` tables with RLS.
- Added `get_promo_code_usage_counts` and `validate_promo_code` RPC helpers.
- Implemented `services/promotionService.ts` with full CRUD for voucher/promotion + usage tracking.
- Added P10.1 types to `types/billing.ts`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Manual acceptance criteria tested

## Next Phase

- P10.2 — RPC apply voucher/promotion vào hóa đơn (KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md).

## Blockers / Decisions

- Migration `supabase/migrations/20250707000003_phase_p10_1_voucher_promotion_schema.sql` was created locally but not deployed via CLI because the local migration history does not match the remote project (`rsialbfjswnrkzcxarnj`). Deploy by running the SQL in Supabase SQL Editor (the pattern used in previous phases).

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p10-1-voucher-promotion-schema_20260707_111251`
