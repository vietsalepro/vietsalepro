## Context

This change implements sub-phase 17: Thiết lập vận hành dài hạn from the multi-tenancy migration plan.

## Goals / Non-Goals

**Goals:**
- Backup, retention, monitoring, cron, tài liệu vận hành.


**Non-Goals:**
- Other sub-phases.

## Decisions

- Follow the exact SQL and code examples from `KE_HOACH_CHI_TIET_MULTI_TENANCY_SUB_PHASE.md`.
- Run `npm run lint` after code changes.

- SQL migration:
  ```sql
  CREATE TABLE public.orders_archive (LIKE public.orders INCLUDING ALL);
  -- Chỉ cần các cột cần thiết, bỏ FK để tránh dependency.
  ```
  ```sql
  CREATE TABLE public.app_audit_log_partitioned (
    LIKE public.app_audit_log INCLUDING ALL
  ) PARTITION BY RANGE (created_at);
  -- ponytail: chuyển partition cần migration nhỏ; làm khi audit log đạt ~10M rows.
  ```
  ```sql
  SELECT cron.schedule('data-retention-daily', '0 3 * * *', $$
    CALL public.run_data_retention();
  $$);
  ```

## Risks / Trade-offs

- [Medium] Mistakes in SQL migrations can block data access. Mitigation: run on staging first and keep backup.

## Migration / Rollback

- Forward: apply the SQL/code changes in tasks.md.
- Rollback: restore files and revert SQL changes from backup.

## Open Questions

- None specific to this sub-phase.