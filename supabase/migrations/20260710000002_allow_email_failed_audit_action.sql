-- F28: Cho phép action 'EMAIL_FAILED' trong app_audit_log để F29 ghi log khi gửi email lỗi.
-- CHECK constraint hiện tại chỉ cho phép INSERT/UPDATE/DELETE/LOGIN/LOGOUT/EXPORT.

ALTER TABLE public.app_audit_log
DROP CONSTRAINT IF EXISTS app_audit_log_action_check,
ADD CONSTRAINT app_audit_log_action_check
CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','EMAIL_FAILED'));
