# Kế hoạch dọn dẹp sau Audit — Post-Implementation Cleanup Plan

> **Mục tiêu:** Dọn dẹp dead code, chuyển các actions còn thiếu, và cấu hình deployment dựa trên kết quả audit PLAN_BASEJUMP_ADMIN_DASHBOARD_ENTERPRISE_UPGRADE.md
>
> **Build hiện tại:** ✅ Xanh (3386 modules, 12.99s)
> **File chính cần xử lý:** `pages/admin/AdminDashboardInner.tsx` (120 KB, 2,676 dòng)

---

## Mục lục

1. [Phase A — Dọn dẹp dead code trong AdminDashboardInner.tsx](#phase-a--dọn-dẹp-dead-code-trong-admindashboardinnertsx)
2. [Phase B — Chuyển tenant actions còn thiếu sang Tenants.tsx / TenantDetail.tsx](#phase-b--chuyển-tenant-actions-còn-thiếu-sang-tenantstxs--tenantdetailtsx)
3. [Phase C — Cấu hình Cron & Deployment](#phase-c--cấu-hình-cron--deployment)
4. [Phase D — Tối ưu chunk size](#phase-d--tối-ưu-chunk-size)
5. [Dependency Graph](#dependency-graph)
6. [Rủi ro & Mitigation](#rủi-ro--mitigation)

---

## Phase A — Dọn dẹp dead code trong AdminDashboardInner.tsx

**Mô tả:** Xóa ~500+ dòng dead code của các tab tenants/members/audit/billing đã được tách ra page riêng. Giảm chunk JS từ 312 kB xuống ~150-200 kB.

**Dependencies:** None

### Task A.1: Phân tích imports chỉ dùng cho dead code

**Mô tả:** Xác định imports nào trong AdminDashboardInner.tsx chỉ được dùng bởi các tab đã tách (tenants, members, audit, billing). Các imports này bao gồm:
- `AuditLog` từ `../AuditLog`
- `BillingConfig` từ `../../components/BillingConfig`
- `VoucherManager`, `TicketInbox`, `EmailTemplateManager`, `NotificationManager`
- `resetMemberPassword` từ `memberAdminService`
- `updateTenantSubscription`, `resetMonthlyOrderCounter` từ `billingAdminService`
- `RateLimitLog`, `AdminLoginHistoryEntry`, `AdminLoginAlert`, `getRateLimitLogs`, `getAdminLoginHistory`, `getAdminLoginAlerts` từ `auditAdminService`
- `getSystemAdmins`, `addSystemAdmin`, `removeSystemAdmin`, `createSystemAdmin`, `downloadTenantBackup`, `restoreTenantBackup`, `previewBackupTables`, `resetDemoData`, `getDataRetentionStatus`, `getDefaultPlanLimits`, `setDefaultPlanLimits`, `getMaintenanceMode`, `setMaintenanceMode` từ `systemAdminService`
- `getTenantUsageSummary`, `getAllTenants`, `getTenantCredentials`, `getTopTenants`, `getTenantGrowth`, `getTenantFeatureFlags`, `updateTenantFeatureFlags` từ `tenantAdminService`

**Acceptance criteria:**
- [ ] Danh sách imports cần giữ lại (dùng bởi Overview, Settings, Security, Health tabs)
- [ ] Danh sách imports cần xóa (chỉ dùng bởi dead tabs)
- [ ] Build xanh sau khi xóa imports

**Files touched:**
- `pages/admin/AdminDashboardInner.tsx`

**Estimated scope:** Small

### Task A.2: Xóa state variables của dead tabs

**Mô tả:** Xóa ~30 state variables chỉ dùng cho dead tabs:

**State của Tenants tab (cần xóa):**
- `result`, `loading`, `createResult`, `filters`, `page`, `pageSize`
- `editForm`, `editModalTab`, `expandedTenantId`, `usageMap`, `usageLoading`
- `backingUpTenantId`, `restoreTenant`, `restoreFile`, `restorePreview`, `restoreSubmitting`
- `resettingTenantId`, `deletingTenantId`, `subTenant`, `subForm`, `subSubmitting`
- `featureTenant`, `featureFlags`, `featureLoading`, `featureSubmitting`
- `exportingCsv`, `impersonatingTenantId`

**State của Members tab (cần xóa):**
- `memberTenantId`, `memberTenantName`, `memberSearch`, `memberPage`, `memberTotal`
- `memberList`, `memberLoading`, `memberInviteOpen`, `memberInviteEmail`, `memberInviteRole`
- `memberInviteSubmitting`, `memberRemoveId`, `memberRemoveSubmitting`

**State của Audit tab (cần xóa):**
- `allTenants`

**Acceptance criteria:**
- [ ] Tất cả state variables của dead tabs được xóa
- [ ] Không còn reference đến các state này trong component
- [ ] Build xanh

**Files touched:**
- `pages/admin/AdminDashboardInner.tsx`

**Estimated scope:** Medium

### Task A.3: Xóa inline render code của dead tabs

**Mô tả:** Xóa các khối JSX render của dead tabs trong `AdminDashboardInner.tsx`:

| Tab | Dòng cần xóa | Nội dung |
|-----|-------------|----------|
| **tenants** | ~1312–1645 | `activeTab === 'tenants'` block |
| **members** | ~1647–1753 | `activeTab === 'members'` block |
| **audit** | ~1755–1757 | `activeTab === 'audit'` block |
| **billing** | ~1806 | `activeTab === 'billing'` block |

**Acceptance criteria:**
- [ ] Không còn JSX render cho tenants/members/audit/billing tabs
- [ ] Các tab còn lại (overview, settings, security, health) vẫn hoạt động
- [ ] Build xanh

**Files touched:**
- `pages/admin/AdminDashboardInner.tsx`

**Estimated scope:** Medium

### Task A.4: Xóa useEffect / helper functions của dead tabs

**Mô tả:** Xóa các useEffect và helper functions chỉ dùng cho dead tabs:
- `useEffect` fetch tenants list
- `useEffect` fetch members list
- `useEffect` fetch audit logs
- `useEffect` fetch billing data
- Các handler functions: `handleEditTenant`, `handleDeleteTenant`, `handleRestoreTenant`, `handleBackupTenant`, `handleRestoreBackup`, `handleResetDemo`, `handleExportCsv`, `handleImpersonate`, `handleInviteMember`, `handleRemoveMember`, v.v.

**Acceptance criteria:**
- [ ] Không còn useEffect/handler functions của dead tabs
- [ ] Build xanh

**Files touched:**
- `pages/admin/AdminDashboardInner.tsx`

**Estimated scope:** Medium

### Checkpoint Phase A

- [ ] Build xanh
- [ ] AdminDashboardInner.tsx giảm từ 2,676 dòng xuống ~1,500 dòng
- [ ] Chunk JS AdminDashboardInner giảm từ 312 kB xuống ~180 kB
- [ ] Các tab còn lại (overview, settings, security, health) hoạt động bình thường
- [ ] **Review với human trước khi sang Phase B**

---

## Phase B — Chuyển tenant actions còn thiếu sang Tenants.tsx / TenantDetail.tsx

**Mô tả:** Chuyển 5 actions nâng cao của tenant từ AdminDashboardInner.tsx sang Tenants.tsx hoặc TenantDetail.tsx.

**Dependencies:** Phase A

### Task B.1: Chuyển Edit Subscription action

**Mô tả:** Thêm modal/form để edit subscription của tenant vào Tenants.tsx. Gọi `updateTenantSubscription` từ `billingAdminService`.

**Acceptance criteria:**
- [ ] Tenants.tsx có nút "Edit Subscription" trên mỗi dòng tenant
- [ ] Modal hiển thị subscription hiện tại (plan, status, dates)
- [ ] Cho phép thay đổi plan, status
- [ ] Gọi service function đúng cách

**Files touched:**
- `pages/admin/Tenants.tsx`
- `services/admin/billingAdminService.ts` (kiểm tra nếu cần)

**Estimated scope:** Medium

### Task B.2: Chuyển Feature Flags management

**Mô tả:** Thêm modal để quản lý feature flags của tenant. Gọi `getTenantFeatureFlags` / `updateTenantFeatureFlags` từ `tenantAdminService`.

**Acceptance criteria:**
- [ ] Tenants.tsx có nút "Feature Flags" trên mỗi dòng tenant
- [ ] Modal hiển thị danh sách feature flags với toggle on/off
- [ ] Gọi service function đúng cách

**Files touched:**
- `pages/admin/Tenants.tsx`
- `services/admin/tenantAdminService.ts` (kiểm tra nếu cần)

**Estimated scope:** Medium

### Task B.3: Chuyển Backup / Restore actions

**Mô tả:** Thêm nút backup và restore cho tenant. Gọi `downloadTenantBackup`, `restoreTenantBackup`, `previewBackupTables` từ `systemAdminService`.

**Acceptance criteria:**
- [ ] Tenants.tsx có nút "Backup" trên mỗi dòng tenant
- [ ] Click Backup → tải file backup xuống
- [ ] Nút "Restore" với file upload + preview tables
- [ ] Gọi service function đúng cách

**Files touched:**
- `pages/admin/Tenants.tsx`
- `services/admin/systemAdminService.ts` (kiểm tra nếu cần)

**Estimated scope:** Medium

### Task B.4: Chuyển Reset Demo Data action

**Mô tả:** Thêm nút reset demo data cho tenant. Gọi `resetDemoData` từ `systemAdminService`.

**Acceptance criteria:**
- [ ] Tenants.tsx có nút "Reset Demo" (chỉ hiển thị cho tenant demo)
- [ ] Confirm dialog trước khi reset
- [ ] Gọi service function đúng cách

**Files touched:**
- `pages/admin/Tenants.tsx`
- `services/admin/systemAdminService.ts` (kiểm tra nếu cần)

**Estimated scope:** Small

### Task B.5: Chuyển Export CSV action

**Mô tả:** Thêm nút export CSV cho tenant data. Gọi service function tương ứng.

**Acceptance criteria:**
- [ ] Tenants.tsx có nút "Export CSV"
- [ ] Export danh sách tenants ra file CSV
- [ ] Gọi service function đúng cách

**Files touched:**
- `pages/admin/Tenants.tsx`

**Estimated scope:** Small

### Checkpoint Phase B

- [ ] Build xanh
- [ ] Tất cả 5 actions hoạt động trên Tenants.tsx
- [ ] AdminDashboardInner.tsx không còn các actions này
- [ ] **Review với human trước khi sang Phase C**

---

## Phase C — Cấu hình Cron & Deployment

**Mô tả:** Cấu hình thủ công các bước deployment cần thiết cho cron jobs.

**Dependencies:** None (có thể làm song song với Phase A, B)

### Task C.1: Cấu hình admin_cron_config trong system_settings

**Mô tả:** Thêm dòng `admin_cron_config` vào bảng `system_settings` trên Supabase dashboard với:
- `function_url`: URL của edge function `cron-admin-tasks`
- `cron_secret`: secret key để xác thực cron

**Acceptance criteria:**
- [ ] `system_settings` có row `admin_cron_config` với đầy đủ fields
- [ ] Edge function có thể xác thực được cron request

**Files touched:**
- Không (thao tác trên Supabase dashboard)

**Estimated scope:** Small

### Task C.2: Đặt CRON_ADMIN_TASKS_SECRET trong Supabase secrets

**Mô tả:** Thêm secret `CRON_ADMIN_TASKS_SECRET` vào Supabase project settings (Settings > API > Project Secrets).

**Acceptance criteria:**
- [ ] Secret tồn tại trong Supabase project
- [ ] Edge function `cron-admin-tasks` có thể đọc được secret

**Files touched:**
- Không (thao tác trên Supabase dashboard)

**Estimated scope:** Small

### Task C.3: Kiểm tra edge function cron-admin-tasks

**Mô tả:** Deploy và test edge function `cron-admin-tasks`:
- `billing_reminders`: gửi reminder cho tenant sắp hết hạn
- `audit_cleanup`: dọn audit log cũ

**Acceptance criteria:**
- [ ] `supabase functions deploy cron-admin-tasks` thành công
- [ ] Test invoke với đúng secret → response OK
- [ ] Test invoke với sai secret → response 401

**Files touched:**
- `supabase/functions/cron-admin-tasks/index.ts` (nếu cần sửa)

**Estimated scope:** Small

### Checkpoint Phase C

- [ ] admin_cron_config configured
- [ ] CRON_ADMIN_TASKS_SECRET set
- [ ] Edge function deployed và hoạt động
- [ ] **Review với human**

---

## Phase D — Tối ưu chunk size

**Mô tả:** Sau khi dọn dẹp dead code, kiểm tra lại chunk size và tối ưu thêm nếu cần.

**Dependencies:** Phase A

### Task D.1: Kiểm tra chunk size sau cleanup

**Mô tả:** Chạy build và kiểm tra chunk size của AdminDashboardInner.

**Acceptance criteria:**
- [ ] Chunk AdminDashboardInner giảm từ 312 kB xuống ≤ 200 kB
- [ ] Nếu vẫn > 200 kB, xem xét React.lazy() cho các sub-components

**Files touched:**
- Không (chỉ kiểm tra)

**Estimated scope:** Small

### Task D.2: Áp dụng React.lazy() cho components nặng

**Mô tả:** Nếu chunk vẫn lớn, áp dụng React.lazy() cho các components nặng trong AdminDashboardInner:
- `SystemHealthPanel`
- `ErrorPerformancePanel`
- `StorageBackupPanel`
- `BulkMaintenancePanel`
- `ApiKeyManager`
- `WebhookManager`
- `IntegrationMarketplace`
- `WhiteLabelManager`

**Acceptance criteria:**
- [ ] Các components nặng được lazy-load
- [ ] Loading state hiển thị đúng
- [ ] Build xanh

**Files touched:**
- `pages/admin/AdminDashboardInner.tsx`

**Estimated scope:** Medium

### Checkpoint Phase D

- [ ] Chunk AdminDashboardInner ≤ 200 kB
- [ ] Build xanh
- [ ] **Review với human**

---

## Dependency Graph

```
Phase A (Dọn dead code) ──────────────────────────────────────────┐
    │                                                              │
    ├── Task A.1: Xóa imports                                      │
    ├── Task A.2: Xóa state variables                              │
    ├── Task A.3: Xóa inline render code                           │
    └── Task A.4: Xóa useEffect / helpers                          │
         │                                                         │
         ▼                                                         │
Phase B (Chuyển actions) ──────────────┐     Phase C (Cron) ──────┤
    │                                   │         │               │
    ├── Task B.1: Edit Subscription     │     Task C.1: Config    │
    ├── Task B.2: Feature Flags         │     Task C.2: Secrets   │
    ├── Task B.3: Backup / Restore      │     Task C.3: Deploy    │
    ├── Task B.4: Reset Demo            │         │               │
    └── Task B.5: Export CSV            │         │               │
         │                              │         │               │
         └──────────┬───────────────────┘         │               │
                    ▼                             ▼               ▼
            Phase D (Tối ưu chunk) ◄──────────────────────────────┘
                │
                ├── Task D.1: Kiểm tra chunk size
                └── Task D.2: React.lazy() nếu cần
```

---

## Tổng quan Tasks

| Phase | Task | Mô tả | Size | Dependencies |
|-------|------|-------|------|-------------|
| **A** | A.1 | Xóa imports dead code | S | None |
| **A** | A.2 | Xóa state variables | M | A.1 |
| **A** | A.3 | Xóa inline render code | M | A.2 |
| **A** | A.4 | Xóa useEffect / helpers | M | A.3 |
| **B** | B.1 | Edit Subscription | M | A |
| **B** | B.2 | Feature Flags | M | A |
| **B** | B.3 | Backup / Restore | M | A |
| **B** | B.4 | Reset Demo | S | A |
| **B** | B.5 | Export CSV | S | A |
| **C** | C.1 | Config admin_cron_config | S | None |
| **C** | C.2 | Set CRON_ADMIN_TASKS_SECRET | S | None |
| **C** | C.3 | Deploy & test edge function | S | C.1, C.2 |
| **D** | D.1 | Kiểm tra chunk size | S | A |
| **D** | D.2 | React.lazy() nếu cần | M | D.1 |

---

## Rủi ro & Mitigation

| Rủi ro | Impact | Mitigation |
|--------|--------|------------|
| Xóa nhầm code còn dùng (Phase A) | Cao — UI broken | Commit từng task riêng, kiểm tra build sau mỗi task, manual test các tab còn lại |
| Tenants.tsx phình to do thêm actions (Phase B) | Trung bình | Cân nhắc tách actions vào components riêng (VD: `TenantSubscriptionModal.tsx`, `TenantFeatureFlagsModal.tsx`) |
| Cron edge function không deploy được (Phase C) | Thấp — không ảnh hưởng UI | Kiểm tra Supabase CLI version, config.toml |
| Chunk vẫn lớn sau cleanup (Phase D) | Thấp | Áp dụng React.lazy() cho components nặng |

---

## Lưu ý đặc biệt

1. **Commit strategy:** Mỗi task là một commit riêng. Phase A có thể gộp A.1→A.4 vào 1-2 commit nếu context cho phép.
2. **Kiểm tra build:** `npm run build` sau mỗi task. Không chuyển task tiếp theo nếu build đỏ.
3. **Manual test:** Sau Phase A, kiểm tra các tab Overview, Settings, Security, Health vẫn hoạt động.
4. **Không vượt scope:** Chỉ làm đúng các task trong plan này. Các tính năng mới (VD: thêm provider mới) không thuộc scope.
5. **Phase C có thể làm song song** với Phase A và B vì không phụ thuộc code.