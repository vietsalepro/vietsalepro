-- =========================================================
-- Phase 6 — Stock Ledger Hardening & Monitoring
-- File:    migration_phase6_stock_ledger_hardening.sql
-- Purpose: Guarantee that every future stock_movements row has
--            qty_after_transaction computed correctly per
--            (product_id, lot_id), and provide drift monitoring.
-- Option:  C — Patch RPCs (A) + BEFORE INSERT trigger (B) + reconcile job
-- Project: QLBH (rsialbfjswnrkzcxarnj)
-- Date:    2026-07-01
-- WARNING: This migration modifies live business functions.
--          A backup of stock_movements is created at the top.
-- =========================================================

-- =========================================================
-- 0. Backup stock_movements before any changes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.stock_movements_backup_phase6 AS
SELECT * FROM public.stock_movements;

-- =========================================================
-- 1. Helper: compute running balance per (product_id, lot_id)
-- =========================================================
CREATE OR REPLACE FUNCTION public.calc_qty_after_transaction(
  p_product_id TEXT,
  p_lot_id TEXT,
  p_actual_qty NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT COALESCE(SUM(actual_qty), 0) INTO v_balance
  FROM public.stock_movements
  WHERE product_id = p_product_id
    AND lot_id IS NOT DISTINCT FROM p_lot_id
    AND is_cancelled = FALSE;
  RETURN v_balance + p_actual_qty;
END;
$$;

-- =========================================================
-- 2. Index to make the helper + trigger fast
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_lot_cancelled
  ON public.stock_movements (product_id, lot_id, is_cancelled, posting_date DESC);