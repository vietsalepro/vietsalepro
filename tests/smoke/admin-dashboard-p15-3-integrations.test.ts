import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
} from '../../services/integrationService';

// ponytail: runnable self-check for P15.3 service wiring + mapper logic.
// Does not hit the real database; it verifies RPC calls and field mapping.

const rpcMock = vi.fn() as Mock<(...args: any[]) => any>;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => rpcMock(...args),
  },
}));

const partnerRow = {
  id: 'p1',
  name: 'Acme',
  slug: 'acme',
  description: 'Partner desc',
  website: 'https://acme.test',
  contact_email: 'a@acme.test',
  logo_url: 'https://acme.test/logo.png',
  status: 'active',
  created_by: 'u1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const integrationRow = {
  id: 'i1',
  partner_id: 'p1',
  name: 'Acme Sync',
  slug: 'acme-sync',
  description: 'Sync integration',
  category: 'Kế toán',
  status: 'active',
  documentation_url: 'https://docs.acme.test',
  partner_name: 'Acme',
  created_by: 'u1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('smoke: admin dashboard P15.3 integrations/partners', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('lấy danh sách partner qua RPC list_partners và map đúng trường', async () => {
    rpcMock.mockResolvedValueOnce({ data: [partnerRow], error: null });
    const list = await getPartners();
    expect(rpcMock).toHaveBeenCalledWith('list_partners');
    expect(list).toHaveLength(1);
    expect(list[0].contactEmail).toBe('a@acme.test');
    expect(list[0].logoUrl).toBe('https://acme.test/logo.png');
  });

  it('tạo partner qua RPC create_partner với đủ tham số', async () => {
    rpcMock.mockResolvedValueOnce({ data: partnerRow, error: null });
    const p = await createPartner({
      name: 'Acme',
      slug: 'acme',
      description: 'Partner desc',
      website: 'https://acme.test',
      contactEmail: 'a@acme.test',
      logoUrl: 'https://acme.test/logo.png',
    });
    expect(rpcMock).toHaveBeenCalledWith('create_partner', {
      p_name: 'Acme',
      p_slug: 'acme',
      p_description: 'Partner desc',
      p_website: 'https://acme.test',
      p_contact_email: 'a@acme.test',
      p_logo_url: 'https://acme.test/logo.png',
    });
    expect(p.name).toBe('Acme');
  });

  it('cập nhật partner qua RPC update_partner', async () => {
    rpcMock.mockResolvedValueOnce({ data: { ...partnerRow, name: 'Acme Corp' }, error: null });
    const p = await updatePartner('p1', { name: 'Acme Corp', status: 'inactive' });
    expect(rpcMock).toHaveBeenCalledWith('update_partner', {
      p_partner_id: 'p1',
      p_name: 'Acme Corp',
      p_slug: null,
      p_description: null,
      p_website: null,
      p_contact_email: null,
      p_logo_url: null,
      p_status: 'inactive',
    });
    expect(p.name).toBe('Acme Corp');
  });

  it('xóa partner qua RPC delete_partner', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await deletePartner('p1');
    expect(rpcMock).toHaveBeenCalledWith('delete_partner', { p_partner_id: 'p1' });
  });

  it('lấy danh sách integration qua RPC list_integrations và map partnerName', async () => {
    rpcMock.mockResolvedValueOnce({ data: [integrationRow], error: null });
    const list = await getIntegrations();
    expect(rpcMock).toHaveBeenCalledWith('list_integrations');
    expect(list).toHaveLength(1);
    expect(list[0].partnerName).toBe('Acme');
    expect(list[0].documentationUrl).toBe('https://docs.acme.test');
  });

  it('tạo integration qua RPC create_integration', async () => {
    rpcMock.mockResolvedValueOnce({ data: integrationRow, error: null });
    const i = await createIntegration({
      partnerId: 'p1',
      name: 'Acme Sync',
      slug: 'acme-sync',
      description: 'Sync integration',
      category: 'Kế toán',
      status: 'active',
      documentationUrl: 'https://docs.acme.test',
    });
    expect(rpcMock).toHaveBeenCalledWith('create_integration', {
      p_partner_id: 'p1',
      p_name: 'Acme Sync',
      p_slug: 'acme-sync',
      p_description: 'Sync integration',
      p_category: 'Kế toán',
      p_status: 'active',
      p_documentation_url: 'https://docs.acme.test',
    });
    expect(i.name).toBe('Acme Sync');
  });

  it('cập nhật integration qua RPC update_integration', async () => {
    rpcMock.mockResolvedValueOnce({ data: { ...integrationRow, name: 'Acme Sync Pro' }, error: null });
    const i = await updateIntegration('i1', { name: 'Acme Sync Pro', status: 'inactive' });
    expect(rpcMock).toHaveBeenCalledWith('update_integration', {
      p_integration_id: 'i1',
      p_partner_id: null,
      p_name: 'Acme Sync Pro',
      p_slug: null,
      p_description: null,
      p_category: null,
      p_status: 'inactive',
      p_documentation_url: null,
    });
    expect(i.name).toBe('Acme Sync Pro');
  });

  it('xóa integration qua RPC delete_integration', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await deleteIntegration('i1');
    expect(rpcMock).toHaveBeenCalledWith('delete_integration', { p_integration_id: 'i1' });
  });
});
