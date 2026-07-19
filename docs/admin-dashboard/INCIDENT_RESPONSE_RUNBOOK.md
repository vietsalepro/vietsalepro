# Incident Response Runbook — Admin Dashboard

## Scope

Áp dụng cho sự cố ảnh hưởng đến admin dashboard, multi-tenant data, billing, auth, hoặc Supabase project.

## Owner

- Primary: VietSale Pro Engineering (`vietsalepro86@gmail.com`)
- Escalation: Project owner Phát Nguyễn Tấn

## Severity Levels

| Level | Mô tả | Ví dụ | Response time |
|-------|-------|-------|---------------|
| SEV-1 | Hệ thống không truy cập được hoặc data leak | Admin dashboard down, RLS bypass | 15 phút |
| SEV-2 | Tính năng core bị lỗi ảnh hưởng nhiều tenant | Payment failed, login fail | 1 giờ |
| SEV-3 | Lỗi không ảnh hưởng nhiều | UI bug, report delay | 4 giờ |
| SEV-4 | Cảnh báo tiềm năng | High error rate spike | 1 ngày làm việc |

## Steps

### 1. Triage (5 phút)

- Xác nhận sự cố qua Uptime Robot, health-check edge function, hoặc báo cáo user.
- Ping `https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/admin-health-check`.
- Xác định SEV level.
- Confirm the affected environment matches the canonical baseline recorded in `D-035-01_Deployment_Readiness_Evidence.md` and, for Staging, `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`.
- Check `D-034-01_Deployment_Validation_Gate_Definition.md` for any gate exception that must be declared before the incident is closed.

### 2. Communicate (5 phút)

- Gửi thông báo nội bộ: status page / Slack / email tùy kênh hiện có.
- Nội dung tối thiểu: thời gian, symptom, scope, next update time.

### 3. Contain (15 phút)

- Nếu nghi ngờ security incident: rotate affected API keys, disable impersonation/feature flags.
- Nếu lỗi deploy: xem `ROLLBACK_RUNBOOK.md`; treat as `D-034-01` gate abort and capture evidence in `D-034-02_Deployment_Validation_Evidence_Checklist.md`.
- Nếu DB issue: xem `DISASTER_RECOVERY_RUNBOOK.md`; canonical restore source is `supabase/migrations/*.sql`.

### 4. Investigate

- Thu thập logs: Supabase logs, Vercel function logs, browser console.
- Kiểm tra recent commits/deploys.
- Tìm root cause theo `/systematic-debugging` skill.

### 5. Resolve & Verify

- Apply fix trên staging trước.
- Chạy: `npm run lint && npm run build && npx vitest run && npm run audit:rpc` (audit validates against `D-P3-01_Reconciled_RPC_Contract.md`).
- Verify reference artifact checksums against `D-035-01_Deployment_Readiness_Evidence.md` §6.1.
- Confirm `D-034-01` post-deployment gate PASS before production promotion.
- Deploy production, re-run health-check.

### 6. Post-Incident

- Viết incident report vào `Plan/Log/INCIDENT-<timestamp>.md`.
- Cập nhật runbook nếu cần; align references with `D-035-01_Deployment_Readiness_Evidence.md`, `docs/system-recovery/D-P6-03_STAGING_CANONICALIZATION_REPORT.md`, and `D-P3-01_Reconciled_RPC_Contract.md`.
- Record that A9 (`20260724000000_sp4_4_webhook_delivery_hardening.sql`) remains deferred per `PHASE6_OPENING_AUTHORIZATION.md` §6.
- Schedule follow-up action items.

## Verification

- Health-check trả về `ok: true`.
- Synthetic smoke tests PASS.
- Error rate trở lại baseline.

## Communication Template

```
[INCIDENT] Admin Dashboard - <SEV-X>
Time: <UTC>
Symptom: <...>
Affected: <tenants/users>
Status: Investigating / Identified / Monitoring / Resolved
Next update: <time>
```
