## Context

This change implements sub-phase 14: Dọn dẹp codebase from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Xóa file rác, backup tables không cần thiết, chuẩn hóa error handling.

- Code changes:
  - Xóa `components/MobilePOS.backup.tsx` (nếu còn).
  - Xóa `memory-zone/.temp/phase*/fixed_*.sql` đã deploy.
  - Xóa thư mục `OLD` nếu không cần nữa.
  - Xóa các file test tạm, console.log, dead code.
  - Chuẩn hóa error handling với `AppError` class.

**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  -- ponytail: chỉ chạy sau khi smoke test production pass và đã backup.
  DROP TABLE IF EXISTS public.backup_products_pre_phase2;
  DROP TABLE IF EXISTS public.backup_product_lots_pre_phase2;
  DROP TABLE IF EXISTS public.backup_stock_movements_pre_phase2;
  DROP TABLE IF EXISTS public.backup_stock_ledger_meta;
  DROP TABLE IF EXISTS public.stock_movements_backup_phase6;
  DROP TABLE IF EXISTS public.import_items_backup_phase3a;
  DROP TABLE IF EXISTS public.import_receipts_backup_phase3a;
  DROP TABLE IF EXISTS public.products_backup_phase3a;
  DROP TABLE IF EXISTS public.product_lots_backup_phase3a;
  DROP TABLE IF EXISTS public.orphan_records_backup;
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.