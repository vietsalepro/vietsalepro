-- F33 P4: invite-member rate limit by tenant
-- Scope: add tenant_id to rate_limit_logs so the invite edge function can enforce 50 invites/hour/tenant.
-- ponytail: idempotent DDL; nullable column so existing rows remain valid and the IP-only rate limit path is unaffected.

ALTER TABLE public.rate_limit_logs
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Index for the tenant rate-limit query: tenant_id + action + window_start.
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_tenant_action_window
  ON public.rate_limit_logs(tenant_id, action, window_start);
