-- Sub-Phase 1.6: Expand admin audit_log action types.
-- ponytail: event types are logged manually via logAudit; trigger actions remain INSERT/UPDATE/DELETE.

ALTER TABLE public.audit_log
DROP CONSTRAINT IF EXISTS audit_log_action_check;

ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_action_check
CHECK (
  action IN (
    'INSERT',
    'UPDATE',
    'DELETE',
    'login',
    'logout',
    'impersonation_start',
    'impersonation_stop',
    'role_changed',
    'password_changed',
    'tenant_created',
    'tenant_deleted',
    'subscription_created',
    'subscription_cancelled'
  )
);
