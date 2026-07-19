# Monitoring & Alerting Runbook — Admin Dashboard

## Goal

Phát hiện sớm sự cố, đo đạc SLO, và cung cấp dữ liệu cho incident response.

## Owner

- Primary: VietSale Pro Engineering
- On-call: project owner (hiện tại)

## Current State

- Health-check edge function: `https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/admin-health-check`
- Uptime Robot ping mỗi 5 phút.
- Alert channel: email `vietsalepro86@gmail.com`.
- Deployment validation gate (`D-034-01_Deployment_Validation_Gate_Definition.md`) is the source of truth for promotion health.
- Reference artifact checksums are tracked in `D-035-01_Deployment_Readiness_Evidence.md` §6.1.

## SLIs / SLOs

| SLI | SLO | Alert threshold |
|-----|-----|-----------------|
| D-034-01 deployment validation gate | 100% of required checks PASS | Any gate check FAIL |
| Admin dashboard uptime | 99.9% / tháng | < 99.9% over 5m |
| Health-check response time | p95 < 2s | p95 > 3s over 5m |
| API error rate | < 1% | > 5% over 5m |
| DB connection usage | < 80% capacity | > 75% |
| Storage usage | < 80% quota | > 75% |
| Failed login attempts | baseline | > 100 failed/min |

## Metrics to Collect

### Application

- Health-check `ok` boolean.
- Dashboard first paint / LCP (web vitals).
- Build/lint/test pass/fail (CI).

### API / Database

- RPC latency: `is_system_admin`, `get_top_tenants`, `get_tenants_admin` (canonical RPC inventory: `D-P3-01_Reconciled_RPC_Contract.md`).
- Error rate per RPC.
- Row count growth: `tenants`, `tenant_memberships`, `app_audit_log`.
- RLS violation attempts.

### Infrastructure

- Supabase CPU / memory / disk (Supabase dashboard reports).
- Storage bucket usage.
- Edge function invocations & errors.
- Vercel function errors & latency.

### Business

- New tenant sign-ups / hour.
- Failed payments / hour.
- Support tickets created / hour.
- Churn signals (downgrades, deletions).

## Alerting Rules

| Condition | Severity | Action |
|-----------|----------|--------|
| Health-check `ok: false` | P1 | Page/SMS/email; start incident response |
| Health-check timeout > 10s | P1 | Page/SMS/email |
| Error rate > 5% | P1 | Page/SMS/email |
| DB connection > 75% | P2 | Email; investigate slow queries |
| Storage > 75% | P2 | Email; plan cleanup/upgrade |
| Failed logins > 100/min | P2 | Email; review IP allowlist/rate limit |
| Build/lint/test fail on main | P2 | Email; block deploy |
| New tenant sign-ups drop to 0 | P3 | Email; check onboarding flow |

## Synthetic Tests

Chạy định kỳ (hàng ngày hoặc mỗi giờ) bằng Playwright hoặc curl:

1. System admin login.
2. Open admin dashboard overview.
3. List tenants.
4. View tenant detail.
5. List audit logs.
6. Create & delete a test tenant (trong staging).

## Dashboards

- **Supabase Dashboard:** Database metrics, auth logs, edge function logs.
- **Vercel Dashboard:** Frontend errors, Web Vitals, function latency.
- **Custom:** Google Data Studio / Grafana nếu tích hợp Supabase read replica hoặc logs export.

## Log Retention

- Supabase logs: theo gói Supabase (thường 7 ngày).
- Audit log (`app_audit_log`): 7 năm.
- Login history (`admin_login_history`): 2 năm.

## Runbooks Link

- Incident Response: `INCIDENT_RESPONSE_RUNBOOK.md`
- Disaster Recovery: `DISASTER_RECOVERY_RUNBOOK.md`
- Rollback: `ROLLBACK_RUNBOOK.md`
- Key Rotation: `KEY_ROTATION_RUNBOOK.md`

## Verification

- Health-check endpoint trả về `ok: true`.
- Alert channel nhận được test alert.
- Synthetic test PASS trong 24h qua.
- Reference artifact checksums in `D-035-01_Deployment_Readiness_Evidence.md` §6.1 remain unchanged.
- `D-034-01` deployment validation gate checks PASS.
