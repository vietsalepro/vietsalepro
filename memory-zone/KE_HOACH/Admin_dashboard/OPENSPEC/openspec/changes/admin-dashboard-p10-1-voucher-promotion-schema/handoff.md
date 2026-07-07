## What Was Done

- Created `promo_codes`, `promotion_rules`, `promo_code_usages` tables with RLS.
- Added `get_promo_code_usage_counts` and `validate_promo_code` RPC helpers.
- Implemented `services/promotionService.ts` with full CRUD for voucher/promotion + usage tracking.
- Added P10.1 types to `types/billing.ts`.

## What Was Verified

- [x] `npm run lint` pass
- [x] `npm run build` pass
- [x] Migration deployed to Supabase project `rsialbfjswnrkzcxarnj`
- [x] Confirmed tables `promo_codes`, `promotion_rules`, `promo_code_usages` exist on remote
- [x] Confirmed RLS policies and RPCs `get_promo_code_usage_counts`, `validate_promo_code` exist on remote
- [x] CRUD smoke test on remote: create/update/delete promo code `TEST_P10_1_CRUD` (cleaned up)

## Next Phase

- P10.2 — RPC apply voucher/promotion vào hóa đơn (KE_HOACH_ADMIN_DASHBOARD_SUB_PHASE.md).

## Blockers / Decisions

- Migration deployed to Supabase project `rsialbfjswnrkzcxarnj` via `supabase db query --linked --file <migration>` because `supabase db push` reports a migration-history mismatch.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_admin_dashboard_admin-dashboard-p10-1-voucher-promotion-schema_20260707_111251`
