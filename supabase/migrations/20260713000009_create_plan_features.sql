-- Sub-Phase 4.2: Feature gating schema
-- Basejump reference: Section 3.7 (can_use_feature, plan_features table)
-- ponytail: migration idempotent; defaults to allowing features when no gating row exists.

-- ============================================================
-- 1. plan_features table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL REFERENCES public.plans(key) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  limit_value INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS plan_features_plan_id_idx ON public.plan_features(plan_id);
CREATE INDEX IF NOT EXISTS plan_features_feature_key_idx ON public.plan_features(feature_key);

-- ============================================================
-- 2. can_use_feature function
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_use_feature(
  p_tenant_id UUID,
  p_feature_key TEXT,
  p_current_usage INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id TEXT;
  v_feature public.plan_features%ROWTYPE;
BEGIN
  -- Find the tenant's current plan from the subscription record.
  SELECT plan_id INTO v_plan_id
  FROM public.tenant_subscriptions
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  -- If no plan is found, default to allowing the feature (graceful degradation).
  IF v_plan_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT * INTO v_feature
  FROM public.plan_features
  WHERE plan_id = v_plan_id
    AND feature_key = p_feature_key;

  -- If no gating row exists for this feature, default to allowing it.
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Feature explicitly disabled.
  IF NOT v_feature.enabled THEN
    RETURN false;
  END IF;

  -- Feature limit exceeded (inclusive).
  IF v_feature.limit_value IS NOT NULL AND p_current_usage >= v_feature.limit_value THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- ============================================================
-- 3. Trigger to keep updated_at in sync
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_plan_features_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS plan_features_updated_at ON public.plan_features;
CREATE TRIGGER plan_features_updated_at
  BEFORE UPDATE ON public.plan_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_plan_features_updated_at();
