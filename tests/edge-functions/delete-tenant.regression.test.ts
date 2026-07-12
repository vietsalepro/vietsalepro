import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const EDGE_FUNCTION_PATH = resolve(
  __dirname,
  '../../supabase/functions/delete-tenant/index.ts'
);

const ALLOWED_AUDIT_ACTIONS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
];

describe('delete-tenant Edge Function regression', () => {
  const source = readFileSync(EDGE_FUNCTION_PATH, 'utf8');

  it('does not use custom TENANT_* audit actions rejected by app_audit_log CHECK constraint', () => {
    expect(source).not.toContain('TENANT_SOFT_DELETE');
    expect(source).not.toContain('TENANT_HARD_DELETE');
  });

  it('only uses standard CRUD actions for app_audit_log inserts', () => {
    const appAuditLogBlocks = source.match(
      /from\('app_audit_log'\)\.insert\([\s\S]*?\)/g
    );
    expect(appAuditLogBlocks).toBeTruthy();

    for (const block of appAuditLogBlocks ?? []) {
      const actionMatch = block.match(/action:\s*'([^']+)'/);
      expect(actionMatch).toBeTruthy();
      const action = actionMatch?.[1] ?? '';
      expect(ALLOWED_AUDIT_ACTIONS).toContain(action);
    }
  });

  it('does not throw on rate_limit_logs insert failure', () => {
    expect(source).not.toContain('if (logError) throw logError;');
  });
});
