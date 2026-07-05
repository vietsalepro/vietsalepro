## Context

This change implements sub-phase 9.6: `audit-log-writer` + rate limiting from the multi-tenancy migration plan.

Output files: `supabase/functions/audit-log/index.ts`, Bảng `rate_limit_logs`

## Goals / Non-Goals

**Goals:**
- Ghi audit log và thiết lập rate limiting.


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE TABLE public.rate_limit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('login','create_tenant','check_subdomain','invite_member')),
    attempt_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
  );
  
  CREATE INDEX idx_rate_limit_logs_ip_action_window
    ON public.rate_limit_logs(ip_address, action, window_start);
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.