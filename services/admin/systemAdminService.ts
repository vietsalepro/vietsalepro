// ponytail: thin admin wrapper around system-level operations.
// Phase 2.1 centralizes system-admin calls used by the admin dashboard.

export type {
  CreateSystemAdminRequest,
  CreateSystemAdminResponse,
  RateLimitLog,
  SecuritySettings,
  LoginAttempt,
  LockedEmail,
  SystemAdmin,
} from '../systemAdminService';

export {
  getRateLimitLogs,
  getSystemAdmins,
  addSystemAdmin,
  removeSystemAdmin,
  createSystemAdmin,
  getTenantSecuritySettings,
  updateTenantIpAllowlist,
  updateTenantSessionTimeout,
  recordLoginAttempt,
  getLoginAttempts,
  getLockedEmails,
  unlockLoginAttempts,
} from '../systemAdminService';

export {
  checkSubdomain,
  getDataRetentionStatus,
  getDefaultPlanLimits,
  getMaintenanceMode,
  setDefaultPlanLimits,
  setMaintenanceMode,
} from '../operationsService';

export {
  downloadTenantBackup,
} from '../tenantBackupService';

export {
  previewBackupTables,
  restoreTenantBackup,
  validateBackup,
} from '../tenantRestoreService';

export {
  migrateTenantData,
  resetDemoData,
} from '../tenantMigrationService';

export {
  getSystemOverview,
  getTopTenants,
  getTenantGrowth,
  startImpersonation,
  endImpersonation,
} from '../tenantService';
