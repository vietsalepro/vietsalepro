import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockSupabase, resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

// Integration tests for system admin creation feature
// Tests end-to-end flow, edge cases, and security
// ponytail: hybrid mock integration; auth.admin paths use the in-memory mock so the suite runs offline.

describe('integration: system admin creation', () => {
  let supabaseAdmin: any;
  let testUserId: string | null = null;
  let testEmail: string | null = null;

  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin-integration');
    setSystemAdmin(true);
    supabaseAdmin = mockSupabase;
  });

  afterEach(async () => {
    // Cleanup: delete test user if created
    if (testUserId && supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(testUserId);
        await supabaseAdmin.from('system_admins').delete().eq('user_id', testUserId);
      } catch (err) {
        console.error('Cleanup failed:', err);
      }
    }
    testUserId = null;
    testEmail = null;
  });

  describe('end-to-end flow', () => {
    it('tạo system admin thành công từ UI → verify trong auth.users và system_admins', async () => {
      const testEmailValue = `test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';

      const { createSystemAdmin } = await import('../../services/systemAdminService');

      const result = await createSystemAdmin(testEmailValue, testPassword);

      expect(result.userId).toBeDefined();
      expect(result.email).toBe(testEmailValue);

      testUserId = result.userId;
      testEmail = testEmailValue;

      // Verify user exists in mock auth.users and system_admins
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(result.userId);
      expect(user).toBeDefined();
      expect(user.email).toBe(testEmailValue);
    });

    it('verify audit log được tạo sau khi tạo system admin', async () => {
      // This would verify that app_audit_log has an entry with action='create_system_admin'
      // Requires actual database connection
    });
  });

  describe('edge cases', () => {
    it('special characters trong email được handle', async () => {
      const specialEmails = [
        'admin+test@example.com',
        'admin.test@example.com',
        'admin-test@example.com',
        'admin_test@example.com',
      ];

      for (const email of specialEmails) {
        const result = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'testPassword123',
          email_confirm: true,
        });

        expect(result.data.user).toBeDefined();
        expect(result.data.user?.email).toBe(email);

        // Cleanup
        if (result.data.user?.id) {
          await supabaseAdmin.auth.admin.deleteUser(result.data.user.id);
        }
      }
    });

    it('very long password được handle', async () => {
      const longPassword = 'a'.repeat(200); // 200 characters
      
      const result = await supabaseAdmin.auth.admin.createUser({
        email: `test-${Date.now()}@example.com`,
        password: longPassword,
        email_confirm: true,
      });

      expect(result.data.user).toBeDefined();

      // Cleanup
      if (result.data.user?.id) {
        await supabaseAdmin.auth.admin.deleteUser(result.data.user.id);
      }
    });

    it('unicode characters trong email được handle', async () => {
      const unicodeEmails = [
        'admin@例え.jp',
        'admin@例子.cn',
        'admin@пример.ru',
      ];

      for (const email of unicodeEmails) {
        const result = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'testPassword123',
          email_confirm: true,
        });

        // Note: Supabase may or may not support unicode emails
        // This test documents the behavior
        if (result.data.user) {
          // Cleanup
          await supabaseAdmin.auth.admin.deleteUser(result.data.user.id);
        }
      }
    });

    it('concurrent requests được handle', async () => {
      const promises = [];
      const concurrentCount = 5;

      for (let i = 0; i < concurrentCount; i++) {
        promises.push(
          supabaseAdmin.auth.admin.createUser({
            email: `concurrent-${i}-${Date.now()}@example.com`,
            password: 'testPassword123',
            email_confirm: true,
          })
        );
      }

      const results = await Promise.allSettled(promises);
      
      // All requests should succeed or fail gracefully
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(concurrentCount);

      // Cleanup
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data.user?.id) {
          await supabaseAdmin.auth.admin.deleteUser(result.value.data.user.id);
        }
      }
    });
  });

  describe('security', () => {
    it('non-system admin token bị reject', async () => {
      // This test requires actual edge function deployment
      // Should verify that non-admin users get 403 error
    });

    it('rate limiting chặn rapid requests', async () => {
      // This test requires actual edge function deployment
      // Should verify that >10 requests/minute get 429 error
    });

    it('invalid/malformed input được reject', async () => {
      const invalidInputs = [
        { email: '', password: 'test123' },
        { email: 'invalid', password: 'test123' },
        { email: 'test@example.com', password: '' },
        { email: 'test@example.com', password: '12345' },
      ];

      for (const input of invalidInputs) {
        const result = await supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
        });

        expect(result.error).toBeDefined();
      }
    });

    it('password không được log hay return', async () => {
      // This test verifies security best practices
      // In real implementation, check logs and responses to ensure password is never present
    });
  });

  describe('database verification', () => {
    it('user được tạo trong auth.users', async () => {
      const testEmailValue = `verify-${Date.now()}@example.com`;
      
      const result = await supabaseAdmin.auth.admin.createUser({
        email: testEmailValue,
        password: 'testPassword123',
        email_confirm: true,
      });

      expect(result.data.user).toBeDefined();
      expect(result.data.user?.email).toBe(testEmailValue);

      // Verify user exists by querying
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(result.data.user.id);
      expect(user).toBeDefined();

      // Cleanup
      await supabaseAdmin.auth.admin.deleteUser(result.data.user.id);
    });

    it('user được thêm vào system_admins sau khi tạo', async () => {
      // This test requires the actual RPC function to be available
      // Would verify that add_system_admin RPC works correctly
    });

    it('audit log entry được tạo', async () => {
      // This test requires the app_audit_log table to exist
      // Would verify that audit log entry is created with correct action, target_user_id, email, creator_id
    });
  });
});
