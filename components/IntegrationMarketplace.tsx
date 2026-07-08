import React, { useEffect, useState } from 'react';
import {
  Puzzle, Building2, Plus, RefreshCw, Trash2, Edit2,
} from 'lucide-react';
import { Integration, Partner } from '../types/tenant';
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
} from '../services/integrationService';

const statusLabel = (status: 'active' | 'inactive') => {
  switch (status) {
    case 'active': return 'Đang hoạt động';
    case 'inactive': return 'Tạm dừng';
    default: return status;
  }
};

const statusClass = (status: 'active' | 'inactive') => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'inactive': return 'bg-gray-200 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
};

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('vi-VN');
}

type InnerTab = 'marketplace' | 'partners';

export default function IntegrationMarketplace() {
  const [innerTab, setInnerTab] = useState<InnerTab>('marketplace');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  const [partnerForm, setPartnerForm] = useState<Partial<Partner>>({ status: 'active' });
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  const [integrationForm, setIntegrationForm] = useState<Partial<Integration>>({ status: 'active' });
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);

  const loadPartners = async () => {
    try {
      const data = await getPartners();
      setPartners(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách partner.');
    }
  };

  const loadIntegrations = async () => {
    try {
      const data = await getIntegrations();
      setIntegrations(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách integration.');
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadPartners(), loadIntegrations()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetPartnerForm = () => {
    setPartnerForm({ status: 'active' });
    setEditingPartnerId(null);
  };

  const startEditPartner = (p: Partner) => {
    setEditingPartnerId(p.id);
    setPartnerForm({
      name: p.name,
      slug: p.slug,
      description: p.description,
      website: p.website,
      contactEmail: p.contactEmail,
      logoUrl: p.logoUrl,
      status: p.status,
    });
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name?.trim()) {
      setError('Tên partner không được để trống.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: partnerForm.name.trim(),
        slug: partnerForm.slug,
        description: partnerForm.description,
        website: partnerForm.website,
        contactEmail: partnerForm.contactEmail,
        logoUrl: partnerForm.logoUrl,
        status: partnerForm.status,
      };
      if (editingPartnerId) {
        await updatePartner(editingPartnerId, payload);
      } else {
        await createPartner(payload);
      }
      resetPartnerForm();
      await loadPartners();
    } catch (err: any) {
      setError(err?.message || 'Lưu partner thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!window.confirm('Xóa partner này? Các integration liên kết sẽ bị bỏ liên kết.')) return;
    setError(null);
    try {
      await deletePartner(id);
      await Promise.all([loadPartners(), loadIntegrations()]);
      if (editingPartnerId === id) resetPartnerForm();
    } catch (err: any) {
      setError(err?.message || 'Xóa partner thất bại.');
    }
  };

  const resetIntegrationForm = () => {
    setIntegrationForm({ status: 'active' });
    setEditingIntegrationId(null);
  };

  const startEditIntegration = (i: Integration) => {
    setEditingIntegrationId(i.id);
    setIntegrationForm({
      partnerId: i.partnerId,
      name: i.name,
      slug: i.slug,
      description: i.description,
      category: i.category,
      status: i.status,
      documentationUrl: i.documentationUrl,
    });
  };

  const handleIntegrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!integrationForm.name?.trim()) {
      setError('Tên integration không được để trống.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        partnerId: integrationForm.partnerId,
        name: integrationForm.name.trim(),
        slug: integrationForm.slug,
        description: integrationForm.description,
        category: integrationForm.category,
        status: integrationForm.status,
        documentationUrl: integrationForm.documentationUrl,
      };
      if (editingIntegrationId) {
        await updateIntegration(editingIntegrationId, payload);
      } else {
        await createIntegration(payload);
      }
      resetIntegrationForm();
      await loadIntegrations();
    } catch (err: any) {
      setError(err?.message || 'Lưu integration thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!window.confirm('Xóa integration này?')) return;
    setError(null);
    try {
      await deleteIntegration(id);
      await loadIntegrations();
      if (editingIntegrationId === id) resetIntegrationForm();
    } catch (err: any) {
      setError(err?.message || 'Xóa integration thất bại.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Integration marketplace</h2>
        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2">
        <button
          onClick={() => setInnerTab('marketplace')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${innerTab === 'marketplace' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Puzzle className="w-4 h-4" />
          Marketplace
        </button>
        <button
          onClick={() => setInnerTab('partners')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${innerTab === 'partners' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Building2 className="w-4 h-4" />
          Partner portal
        </button>
      </div>

      {innerTab === 'partners' && (
        <div className="space-y-6">
          <form onSubmit={handlePartnerSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {editingPartnerId ? 'Cập nhật partner' : 'Tạo partner mới'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên</label>
                <input
                  type="text"
                  value={partnerForm.name || ''}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  placeholder="Tên partner"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                <input
                  type="text"
                  value={partnerForm.slug || ''}
                  onChange={(e) => setPartnerForm({ ...partnerForm, slug: e.target.value })}
                  placeholder="partner-slug"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                <input
                  type="text"
                  value={partnerForm.website || ''}
                  onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email liên hệ</label>
                <input
                  type="text"
                  value={partnerForm.contactEmail || ''}
                  onChange={(e) => setPartnerForm({ ...partnerForm, contactEmail: e.target.value })}
                  placeholder="contact@partner.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={partnerForm.logoUrl || ''}
                  onChange={(e) => setPartnerForm({ ...partnerForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
                <select
                  value={partnerForm.status || 'active'}
                  onChange={(e) => setPartnerForm({ ...partnerForm, status: e.target.value as Partner['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                <textarea
                  value={partnerForm.description || ''}
                  onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
                  placeholder="Mô tả partner"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Đang lưu...' : (editingPartnerId ? 'Cập nhật' : 'Tạo partner')}
              </button>
              {editingPartnerId && (
                <button
                  type="button"
                  onClick={resetPartnerForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Danh sách partner</h3>
            {partners.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có partner nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Tên</th>
                      <th className="pb-2 font-medium">Slug</th>
                      <th className="pb-2 font-medium">Website</th>
                      <th className="pb-2 font-medium">Trạng thái</th>
                      <th className="pb-2 font-medium">Ngày tạo</th>
                      <th className="pb-2 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 font-medium text-gray-700">{p.name}</td>
                        <td className="py-3 text-gray-600">{p.slug || '-'}</td>
                        <td className="py-3 text-gray-600">{p.website ? <a href={p.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{p.website}</a> : '-'}</td>
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusClass(p.status)}`}>
                            {statusLabel(p.status)}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{formatDateTime(p.createdAt)}</td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => startEditPartner(p)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePartner(p.id)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {innerTab === 'marketplace' && (
        <div className="space-y-6">
          <form onSubmit={handleIntegrationSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {editingIntegrationId ? 'Cập nhật integration' : 'Thêm integration mới'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên</label>
                <input
                  type="text"
                  value={integrationForm.name || ''}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, name: e.target.value })}
                  placeholder="Tên integration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Partner</label>
                <select
                  value={integrationForm.partnerId || ''}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, partnerId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Không có partner --</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                <input
                  type="text"
                  value={integrationForm.slug || ''}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, slug: e.target.value })}
                  placeholder="integration-slug"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Danh mục</label>
                <input
                  type="text"
                  value={integrationForm.category || ''}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, category: e.target.value })}
                  placeholder="ví dụ: Kế toán, Vận chuyển"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tài liệu URL</label>
                <input
                  type="text"
                  value={integrationForm.documentationUrl || ''}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, documentationUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
                <select
                  value={integrationForm.status || 'active'}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, status: e.target.value as Integration['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                <textarea
                  value={integrationForm.description || ''}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, description: e.target.value })}
                  placeholder="Mô tả integration"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Đang lưu...' : (editingIntegrationId ? 'Cập nhật' : 'Thêm integration')}
              </button>
              {editingIntegrationId && (
                <button
                  type="button"
                  onClick={resetIntegrationForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Danh sách integration</h3>
            {integrations.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có integration nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Tên</th>
                      <th className="pb-2 font-medium">Partner</th>
                      <th className="pb-2 font-medium">Danh mục</th>
                      <th className="pb-2 font-medium">Trạng thái</th>
                      <th className="pb-2 font-medium">Ngày tạo</th>
                      <th className="pb-2 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrations.map((i) => (
                      <tr key={i.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 font-medium text-gray-700">{i.name}</td>
                        <td className="py-3 text-gray-600">{i.partnerName || '-'}</td>
                        <td className="py-3 text-gray-600">{i.category || '-'}</td>
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusClass(i.status)}`}>
                            {statusLabel(i.status)}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{formatDateTime(i.createdAt)}</td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => startEditIntegration(i)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteIntegration(i.id)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
