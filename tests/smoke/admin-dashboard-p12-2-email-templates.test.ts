import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockData, setCurrentUserId, setSystemAdmin } from '../mocks/supabase';

vi.mock('../../lib/supabase', async () => {
  const { mockSupabase } = await import('../mocks/supabase');
  return { supabase: mockSupabase };
});

import {
  getEmailTemplates,
  getEmailBrand,
  updateEmailBrand,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  sendTemplateEmail,
} from '../../services/emailTemplateService';

// ponytail: smoke test P12.2 — email template CRUD + brand config + test send.

describe('smoke: admin dashboard P12.2 email templates', () => {
  beforeEach(() => {
    resetMockData();
    setCurrentUserId('sys-admin');
    setSystemAdmin(true);
  });

  it('brand config mặc định và cập nhật được', async () => {
    const brand = await getEmailBrand();
    expect(brand.fromName).toBe('VietSales Pro');
    expect(brand.brandColor).toBe('#2563eb');

    const updated = await updateEmailBrand({
      logoUrl: 'https://example.com/logo.png',
      brandColor: '#059669',
      signatureHtml: 'Regards,<br/>VietSales Pro',
      fromName: 'VietSales Pro Team',
    });
    expect(updated.fromName).toBe('VietSales Pro Team');
    expect(updated.brandColor).toBe('#059669');

    const reloaded = await getEmailBrand();
    expect(reloaded.logoUrl).toBe('https://example.com/logo.png');
    expect(reloaded.fromName).toBe('VietSales Pro Team');
  });

  it('tạo, lấy, cập nhật và xóa template', async () => {
    const t = await createEmailTemplate({
      key: 'custom_welcome',
      name: 'Chào mừng custom',
      subject: 'Chào mừng {{tenant_name}}',
      bodyHtml: '<p>Xin chào {{tenant_name}}</p>',
      variables: ['tenant_name'],
    });
    expect(t.key).toBe('custom_welcome');
    expect(t.isActive).toBe(true);
    expect(t.variables).toContain('tenant_name');

    let list = await getEmailTemplates();
    expect(list.some(x => x.key === 'custom_welcome')).toBe(true);

    const updated = await updateEmailTemplate(t.id, {
      name: 'Chào mừng custom (đã sửa)',
      isActive: false,
    });
    expect(updated.name).toBe('Chào mừng custom (đã sửa)');
    expect(updated.isActive).toBe(false);

    await deleteEmailTemplate(t.id);
    list = await getEmailTemplates();
    expect(list.some(x => x.key === 'custom_welcome')).toBe(false);
  });

  it('gửi thử template trả về thành công', async () => {
    const t = await createEmailTemplate({
      key: 'test_send',
      name: 'Test send',
      subject: 'Test {{brand_name}}',
      bodyHtml: '<p>Hello</p>',
      variables: ['brand_name'],
    });

    const result = await sendTemplateEmail({
      templateKey: t.key,
      to: 'test@example.com',
      variables: { brand_name: 'VietSales' },
      test: true,
    });
    expect(result.success).toBe(true);
    expect(result.to).toContain('test@example.com');
    expect(result.test).toBe(true);
  });

  it('gửi template không tồn tại báo lỗi', async () => {
    await expect(
      sendTemplateEmail({ templateKey: 'missing', to: 'a@b.com' })
    ).rejects.toThrow("Không tìm thấy template 'missing'");
  });

  it('non-system admin không được tạo template', async () => {
    setSystemAdmin(false);
    await expect(
      createEmailTemplate({
        key: 'should_fail',
        name: 'Fail',
        subject: 'Sub',
        bodyHtml: '<p>Body</p>',
      })
    ).rejects.toThrow('row-level security');
  });
});
