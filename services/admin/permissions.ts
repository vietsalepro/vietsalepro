// ponytail: thin re-export wrapper so admin dashboard imports stay stable.
// Canonical permission logic lives in lib/permissions.ts and is shared with the rest of the app.

export type { AppRole } from '../../lib/permissions';

export {
  ROLES,
  MEMBER_ROLES,
  ADMIN_ROLES,
  isSystemAdmin,
  requireSystemAdmin,
  hasTenantRole,
  isTenantOwner,
  isTenantAdmin,
  isMemberRole,
  isAdminRole,
  isOwnerRole,
  canManageTenant,
  canInviteMember,
  canUpdateMember,
  canDeleteMember,
  canDeleteTenant,
  canUpdateTenant,
  canManageSubscription,
  canCurrentUserManageTenant,
  canCurrentUserInviteMember,
  canCurrentUserDeleteTenant,
  canCurrentUserDeleteMember,
  getCurrentUserTenantRole,
  canUseFeature,
} from '../../lib/permissions';
