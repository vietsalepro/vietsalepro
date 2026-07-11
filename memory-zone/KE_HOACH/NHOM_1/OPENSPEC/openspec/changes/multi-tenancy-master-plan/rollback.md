## Backup Command

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_master_<timestamp>" -Recurse -Force
```

Also create a database dump before running any migration:

```powershell
supabase db dump -f "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_multi_tenancy_master_<timestamp>.sql"
```

## Files to Restore

- Entire project folder from the backup if the migration corrupts the codebase.
- Specific files: `types.ts`, `services/supabaseService.ts`, `lib/supabase.ts`, `App.tsx`, `contexts/TenantContext.tsx`, `hooks/usePermissions.ts`, any modified page.
- Database schema and data from the SQL dump.

## Rollback Steps

1. Stop the build/deploy process.
2. Restore the project folder from the latest backup.
3. Restore the database from the pre-migration SQL dump.
4. If only partial rollback is needed, drop the added objects in reverse order:
   - Drop triggers added in Phases 7, 11.
   - Drop policies added in Phases 5, 10.
   - Remove `NOT NULL` constraints and `tenant_id` columns added in Phase 3.
   - Drop foundation tables `tenants`, `tenant_memberships`, `tenant_subscriptions`, `system_admins` if no tenant data is needed.
   - Remove Edge Functions from Supabase.
   - Revert Supabase Auth settings (enable new users, restore social providers if desired).
5. Run `npm run lint` and `npm run build` to confirm the rollback state is healthy.
6. Verify existing data is accessible without tenant errors.

## When to Rollback

- `npm run lint` or `npm run build` fails and cannot be resolved within the session.
- Manual test shows cross-tenant data leakage.
- Database migration fails or leaves tables in inconsistent state.
- RLS policies block legitimate operations for the initial tenant.
- Any data loss risk is identified.

## Post-Rollback Verification

- [ ] Existing users can log in.
- [ ] Existing data (products, orders, customers, suppliers) is visible.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] No `tenant_id` columns or multi-tenancy policies remain if full rollback was intended.
