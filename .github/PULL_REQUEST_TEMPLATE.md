## Summary

<!-- What does this PR do? Why is it needed? -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation
- [ ] Database migration

## Checklist

- [ ] I have run `npm run lint`, `npm run build`, and `npx vitest run` locally.
- [ ] I have run `npm run audit:rpc` and it passes.
- [ ] I have added or updated tests for new behavior (TDD).
- [ ] If I added/removed an admin RPC, I updated `docs/admin-dashboard/RPC_CONTRACTS.md`.
- [ ] If I created or altered a public PostgreSQL function, I added `REVOKE ALL ... FROM PUBLIC;` and `GRANT EXECUTE ... TO authenticated, service_role;` in the same migration.
- [ ] If I changed tenant-level admin features, I updated `hooks/useAdminFeatureFlags.ts` and the feature-flag migration defaults if needed.
- [ ] If I changed admin RPCs or edge functions, I confirmed the `admin-health-check` endpoint still returns `ok: true`.
- [ ] I applied the migration to staging and confirmed it passes before considering production.
- [ ] I reviewed the diff for hardcoded secrets, SQL injection, or exposed credentials.

## Additional Notes

<!-- Anything else reviewers should know? -->
