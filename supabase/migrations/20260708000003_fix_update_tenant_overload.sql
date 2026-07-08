-- Fix update_tenant function overload issue
-- Drop old versions of update_tenant and keep only the latest (P18.3)

-- Drop old versions (PostgreSQL allows dropping by parameter types)
DROP FUNCTION IF EXISTS public.update_tenant(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_tenant(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_tenant(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);

-- The latest version (11 parameters) from P18.3 will remain
-- This version includes: p_tenant_id, p_name, p_plan, p_status, p_isolation_mode, 
-- p_isolation_schema, p_isolation_project_ref, p_custom_domain, p_white_label, 
-- p_read_replica_url, p_connection_pool_config
