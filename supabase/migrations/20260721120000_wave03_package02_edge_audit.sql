-- Wave-03 Package-02: Edge Function audit-logging and access-control alignment.
-- Resolves EDG-004/EDG-005 (audit logging) and documents EDG-002/EDG-003 access models.
-- No new RPCs are introduced; existing service_role privileges are made explicit for audit writes.

-- Ensure the Edge Function service_role account can write audit and rate-limit rows.
GRANT INSERT, SELECT ON TABLE public.app_audit_log TO service_role;
GRANT INSERT, SELECT ON TABLE public.rate_limit_logs TO service_role;

-- Keep authenticated path available for tenant-scoped audit writes.
GRANT INSERT, SELECT ON TABLE public.app_audit_log TO authenticated;

-- Document the access-control model for the in-scope Edge Functions.
COMMENT ON TABLE public.app_audit_log IS 'Audit target for Edge Functions (check-subdomain, billing-webhooks) and tenant-scoped operations.';
COMMENT ON TABLE public.rate_limit_logs IS 'Rate-limiting bucket for public Edge Functions: check-subdomain, create-tenant, invite-member, login.';
