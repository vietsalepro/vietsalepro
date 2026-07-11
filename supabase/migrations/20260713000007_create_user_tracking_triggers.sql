-- Sub-Phase 3.3: User tracking triggers for tenant-scoped business tables.
-- Tables: products, orders, customers, suppliers, categories, brands.
-- Reference: Basejump Section 3.5 — set_tenant_record_user_tracking().
-- ponytail: additive columns + trigger wiring only; function already created in Sub-Phase 3.1.

-- ============================================================
-- 1. Add created_by / updated_by columns to tenant-scoped tables
-- ============================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- 2. Wire up set_tenant_record_user_tracking() triggers
-- ============================================================

DROP TRIGGER IF EXISTS set_tenant_record_user_tracking ON public.products;
CREATE TRIGGER set_tenant_record_user_tracking
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_record_user_tracking();

DROP TRIGGER IF EXISTS set_tenant_record_user_tracking ON public.orders;
CREATE TRIGGER set_tenant_record_user_tracking
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_record_user_tracking();

DROP TRIGGER IF EXISTS set_tenant_record_user_tracking ON public.customers;
CREATE TRIGGER set_tenant_record_user_tracking
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_record_user_tracking();

DROP TRIGGER IF EXISTS set_tenant_record_user_tracking ON public.suppliers;
CREATE TRIGGER set_tenant_record_user_tracking
  BEFORE INSERT OR UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_record_user_tracking();

DROP TRIGGER IF EXISTS set_tenant_record_user_tracking ON public.categories;
CREATE TRIGGER set_tenant_record_user_tracking
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_record_user_tracking();

DROP TRIGGER IF EXISTS set_tenant_record_user_tracking ON public.brands;
CREATE TRIGGER set_tenant_record_user_tracking
  BEFORE INSERT OR UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_record_user_tracking();
