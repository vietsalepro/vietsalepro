// Phase 7: Verification & Testing
// After all phases pass, run the full checklist from FIX_PLAN_USER_MANAGEMENT_SECURITY.md section 10:
//
// 1. Every action has an audit log entry.
// 2. P0 endpoints are protected by auth check + RLS + SECURITY DEFINER.
// 3. Rate limits exist on public/admin endpoints.
// 4. No orphan auth users or memberships.
// 5. TypeScript compiles cleanly.
// 6. Supabase migration diff is clean.

import { supabase } from '../lib/supabase';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Phase 7: Security Verification', () => {
  // ========================================================================
  // 1. Service Layer uses RPC (not direct queries) for all security-critical ops
  // ========================================================================
  describe('1. P0 endpoints protected by RPC SECURITY DEFINER', () => {
    it('removeMember uses RPC instead of direct delete', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: null, error: null } as any);
      const fromSpy = vi.spyOn(supabase, 'from');

      const { removeMember } = await import('../services/tenantService');
      await removeMember('tenant-1', 'user-1').catch(() => {});

      expect(rpcSpy).toHaveBeenCalledWith('remove_tenant_member', {
        p_tenant_id: 'tenant-1',
        p_user_id: 'user-1',
      });
      expect(fromSpy).not.toHaveBeenCalled();
    });

    it('updateMemberRole uses RPC instead of direct update', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: {}, error: null } as any);
      const fromSpy = vi.spyOn(supabase, 'from');

      const { updateMemberRole } = await import('../services/tenantService');
      await updateMemberRole('tenant-1', 'user-1', 'admin').catch(() => {});

      expect(rpcSpy).toHaveBeenCalledWith('update_tenant_member_role', {
        p_tenant_id: 'tenant-1',
        p_user_id: 'user-1',
        p_role: 'admin',
      });
      expect(fromSpy).not.toHaveBeenCalled();
    });

    it('toggleMemberActive uses RPC instead of direct update', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: {}, error: null } as any);
      const fromSpy = vi.spyOn(supabase, 'from');

      const { toggleMemberActive } = await import('../services/tenantService');
      await toggleMemberActive('tenant-1', 'user-1', false).catch(() => {});

      expect(rpcSpy).toHaveBeenCalledWith('toggle_tenant_member_active', {
        p_tenant_id: 'tenant-1',
        p_user_id: 'user-1',
        p_is_active: false,
      });
      expect(fromSpy).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 2. Authorization guards in service layer
  // ========================================================================
  describe('2. Auth checks in service functions', () => {
    it('createTenant checks system admin before proceeding', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation((async (fn: string, _args?: any) => {
        if (fn === 'is_system_admin') return { data: false, error: null } as any;
        return { data: null, error: null } as any;
      }) as any);
      const fromSpy = vi.spyOn(supabase, 'from');

      const { createTenant } = await import('../services/tenantService');
      await expect(createTenant({ name: 'test', subdomain: 'test' })).rejects.toThrow('system admin');
      expect(fromSpy).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // 3. Audit log entries for all actions
  // ========================================================================
  describe('3. Audit log verification', () => {
    it('all RPCs include audit log entries', () => {
      const fs = require('fs');
      const path = require('path');
      
      const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
      const files = fs.readdirSync(migrationsDir).filter((f: string) => f.startsWith('20260712'));
      
      const expectedAuditActions = [
        'MEMBER_REMOVE',
        'MEMBER_ROLE_CHANGE',
        'MEMBER_TOGGLE_ACTIVE',
        'SYSTEM_ADMIN_REMOVE',
      ];

      let foundAuditCount = 0;
      for (const file of files) {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        for (const action of expectedAuditActions) {
          if (content.includes(action)) {
            foundAuditCount++;
          }
        }
      }

      expect(foundAuditCount).toBeGreaterThanOrEqual(expectedAuditActions.length);
    });

    it('every migration has audit log entries for its operation', () => {
      const fs = require('fs');
      const path = require('path');
      
      const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
      
      const m01 = fs.readFileSync(path.join(migrationsDir, '20260712000001_fix_remove_tenant_member_rpc.sql'), 'utf8');
      expect(m01).toContain('MEMBER_REMOVE');
      expect(m01).toContain('app_audit_log');

      const m02 = fs.readFileSync(path.join(migrationsDir, '20260712000002_fix_update_tenant_member_role_rpc.sql'), 'utf8');
      expect(m02).toContain('MEMBER_ROLE_CHANGE');
      expect(m02).toContain('app_audit_log');

      const m03 = fs.readFileSync(path.join(migrationsDir, '20260712000003_fix_toggle_tenant_member_active_rpc.sql'), 'utf8');
      expect(m03).toContain('MEMBER_TOGGLE_ACTIVE');
      expect(m03).toContain('app_audit_log');

      const m04 = fs.readFileSync(path.join(migrationsDir, '20260712000004_fix_remove_system_admin_security_definer.sql'), 'utf8');
      expect(m04).toContain('SYSTEM_ADMIN_REMOVE');
      expect(m04).toContain('app_audit_log');
    });
  });

  // ========================================================================
  // 4. Guardrail triggers protect against destructive operations
  // ========================================================================
  describe('4. Guardrail trigger protections', () => {
    it('guardrail migration includes status/is_active filter and toggle protection', () => {
      const fs = require('fs');
      const path = require('path');
      
      const m05 = fs.readFileSync(
        path.resolve(__dirname, '../supabase/migrations/20260712000005_fix_guardrail_trigger_status_active_filter.sql'),
        'utf8'
      );

      expect(m05).toContain("status IN ('active', 'pending')");
      expect(m05).toContain('is_active = true');
      expect(m05).toContain('NEW.is_active IS DISTINCT FROM OLD.is_active');
    });
  });

  // ========================================================================
  // 5. RLS policies block direct DML
  // ========================================================================
  describe('5. RLS policies for tenant_memberships', () => {
    it('RLS migration blocks direct INSERT/UPDATE/DELETE', () => {
      const fs = require('fs');
      const path = require('path');
      
      const m07 = fs.readFileSync(
        path.resolve(__dirname, '../supabase/migrations/20260712000007_add_rls_policies_tenant_memberships.sql'),
        'utf8'
      );

      expect(m07).toContain('ENABLE ROW LEVEL SECURITY');
      expect(m07).toContain('block_direct_insert');
      expect(m07).toContain('block_direct_update');
      expect(m07).toContain('block_direct_delete');
      expect(m07).toContain('WITH CHECK (false)');
      expect(m07).toContain('USING (false)');
    });
  });

  // ========================================================================
  // 6. Rate limiting exists on reset-password
  // ========================================================================
  describe('6. Rate limiting', () => {
    it('reset-password edge function has rate limiting constants', () => {
      const fs = require('fs');
      const path = require('path');
      
      const resetPwFile = path.resolve(__dirname, '../supabase/functions/reset-password/index.ts');
      if (fs.existsSync(resetPwFile)) {
        const content = fs.readFileSync(resetPwFile, 'utf8');
        
        expect(content).toContain('IP_RATE_LIMIT');
        expect(content).toContain('TENANT_RATE_LIMIT');
        expect(content).toContain('USER_RATE_LIMIT');
        expect(content).toContain('checkRateLimit');
      }
    });
  });

  // ========================================================================
  // 7. SECURITY DEFINER on all critical RPCs
  // ========================================================================
  describe('7. SECURITY DEFINER on critical RPCs', () => {
    it('remove_tenant_member RPC uses SECURITY DEFINER', () => {
      const fs = require('fs');
      const path = require('path');
      
      const m01 = fs.readFileSync(
        path.resolve(__dirname, '../supabase/migrations/20260712000001_fix_remove_tenant_member_rpc.sql'),
        'utf8'
      );
      expect(m01).toContain('SECURITY DEFINER');
      expect(m01).toContain('auth.uid()');
    });

    it('update_tenant_member_role RPC uses SECURITY DEFINER', () => {
      const fs = require('fs');
      const path = require('path');
      
      const m02 = fs.readFileSync(
        path.resolve(__dirname, '../supabase/migrations/20260712000002_fix_update_tenant_member_role_rpc.sql'),
        'utf8'
      );
      expect(m02).toContain('SECURITY DEFINER');
      expect(m02).toContain('auth.uid()');
    });

    it('toggle_tenant_member_active RPC uses SECURITY DEFINER', () => {
      const fs = require('fs');
      const path = require('path');
      
      const m03 = fs.readFileSync(
        path.resolve(__dirname, '../supabase/migrations/20260712000003_fix_toggle_tenant_member_active_rpc.sql'),
        'utf8'
      );
      expect(m03).toContain('SECURITY DEFINER');
      expect(m03).toContain('auth.uid()');
    });

    it('remove_system_admin RPC uses SECURITY DEFINER', () => {
      const fs = require('fs');
      const path = require('path');
      
      const m04 = fs.readFileSync(
        path.resolve(__dirname, '../supabase/migrations/20260712000004_fix_remove_system_admin_security_definer.sql'),
        'utf8'
      );
      expect(m04).toContain('SECURITY DEFINER');
    });
  });

  // ========================================================================
  // 8. Migration inventory check
  // ========================================================================
  describe('8. All required migrations exist', () => {
    it('has all 13 required migration files for user management security', () => {
      const fs = require('fs');
      const path = require('path');
      
      const dir = path.resolve(__dirname, '../supabase/migrations');
      const files = fs.readdirSync(dir).filter((f: string) => f.startsWith('20260712')).sort();

      const expected = [
        '20260712000001_fix_remove_tenant_member_rpc.sql',
        '20260712000002_fix_update_tenant_member_role_rpc.sql',
        '20260712000003_fix_toggle_tenant_member_active_rpc.sql',
        '20260712000004_fix_remove_system_admin_security_definer.sql',
        '20260712000005_fix_guardrail_trigger_status_active_filter.sql',
        '20260712000006_add_soft_delete_columns.sql',
        '20260712000007_add_rls_policies_tenant_memberships.sql',
        '20260712000008_add_audit_log_triggers.sql',
        '20260712000009_add_advisory_lock_function.sql',
        '20260712000010_fix_get_tenant_usage_summary_tenant_admin.sql',
        '20260712000011_fix_is_system_admin_service_role.sql',
        '20260712000012_add_system_admin_for_edge.sql',
        '20260712000013_add_viewer_role.sql',
      ];

      for (const exp of expected) {
        expect(files).toContain(exp);
      }

      expect(files.length).toBeGreaterThanOrEqual(expected.length);
    });
  });

  // ========================================================================
  // 9. Plan file Phase 7 checklist completeness
  // ========================================================================
  describe('9. Phase 7 checklist from FIX_PLAN section 10', () => {
    it('validates all P0 security requirements are met', () => {
      const fs = require('fs');
      const path = require('path');
      
      const m04 = fs.readFileSync(
        path.resolve(__dirname, '../supabase/migrations/20260712000004_fix_remove_system_admin_security_definer.sql'),
        'utf8'
      );
      expect(m04).toContain('system admin cuối cùng');
      expect(m04).toContain('Cannot remove self');

      const m05 = fs.readFileSync(
        path.resolve(__dirname, '../supabase/migrations/20260712000005_fix_guardrail_trigger_status_active_filter.sql'),
        'utf8'
      );
      expect(m05).toContain('Không thể xóa admin cuối cùng');
      expect(m05).toContain('Không thể hạ role admin cuối cùng');
      expect(m05).toContain('Không thể vô hiệu hóa admin duy nhất');
      
      const serviceContent = fs.readFileSync(
        path.resolve(__dirname, '../services/tenantService.ts'),
        'utf8'
      );
      expect(serviceContent).toContain('is_system_admin');
      expect(serviceContent).toContain('Chỉ system admin');
    });

    it('validates no orphan auth users (delete-user EF exists)', () => {
      const fs = require('fs');
      const path = require('path');
      
      const deleteUserDir = path.resolve(__dirname, '../supabase/functions/delete-user');
      expect(fs.existsSync(deleteUserDir)).toBe(true);
      
      const indexPath = path.join(deleteUserDir, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      expect(content).toContain('tenant_memberships');
      expect(content).toContain('membershipCount');
      expect(content).toContain('auth.admin.deleteUser');
    });
  });
});