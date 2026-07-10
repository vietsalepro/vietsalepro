-- Remove plaintext password storage from tenant_credentials.
-- ponytail: admin no longer receives the initial password; instead the user gets a reset/setup email.

ALTER TABLE public.tenant_credentials
  DROP COLUMN IF EXISTS admin_initial_password;

-- Remove the old credential email template that exposed the admin password.
DELETE FROM public.email_templates WHERE key = 'tenant_credentials';
