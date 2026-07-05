## What Was Done

- Dropped 10 backup tables on production Supabase project `rsialbfjswnrkzcxarnj` via `apply_migration`.
- Removed 23 dead-code files (tsx + css): NotificationSystem, Picker, FormTextarea, Tabs, BatchSelectionModal, FormField, MobileSuppliers, Sidebar, InvoiceTabs, OrderNote, OrderSummary, TopNavigation, PaymentModal, LotExpiryPopover.
- Removed stray `login.png` from project root.
- Replaced remaining `console.error` fallback handlers with explicit no-op comments in MobileCustomers, Products, InventoryCount.
- Normalized error handling to `AppError` in: subscriptionService, lib/supabase, auditService, App.tsx, ImportGoods, orderExporter, orderImporter; removed redundant `catch { throw error; }` blocks in supabaseService.

## What Was Verified

- `npm run lint` passes.
- `npm run build` passes.
- No remaining untracked files or stray imports from deleted components.

## Next Phase

- Phase 15: Test trên staging.

## Blockers / Decisions

- None.

## Backup Location

- `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_phase_14_20260705_182952`
