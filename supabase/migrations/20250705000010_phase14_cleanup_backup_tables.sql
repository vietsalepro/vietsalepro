-- ponytail: chỉ chạy sau khi smoke test production pass và đã backup.
-- Phase 14: Dọn dẹp codebase — xóa các backup tables đã deploy.
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
