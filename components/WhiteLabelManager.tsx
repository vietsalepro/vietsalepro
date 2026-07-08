import React, { useEffect, useState } from 'react';
import { Palette, RefreshCw, Save, Globe } from 'lucide-react';
import { Tenant, TenantWhiteLabel } from '../types/tenant';
import { getAllTenants, updateTenant } from '../services/tenantService';

const DEFAULT_WHITE_LABEL: TenantWhiteLabel = {
  brandName: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#2563eb',
};

const isValidDomain = (value: string): boolean => {
  if (!value.trim()) return true;
  return /^[a-z0-9][-a-z0-9]*(\.[-a-z0-9]+)+$/i.test(value.trim());
};

export default function WhiteLabelManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string>('');

  const [customDomain, setCustomDomain] = useState('');
  const [whiteLabel, setWhiteLabel] = useState<TenantWhiteLabel>(DEFAULT_WHITE_LABEL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTenants = async () => {
    setTenantsLoading(true);
    setError(null);
    try {
      const data = await getAllTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách cửa hàng.');
    } finally {
      setTenantsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setCustomDomain(tenant.customDomain || '');
      setWhiteLabel({
        ...DEFAULT_WHITE_LABEL,
        ...tenant.whiteLabel,
      });
    } else {
      setCustomDomain('');
      setWhiteLabel(DEFAULT_WHITE_LABEL);
    }
    setError(null);
    setSuccess(null);
  }, [tenantId, tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError('Vui lòng chọn cửa hàng.');
      return;
    }
    if (!isValidDomain(customDomain)) {
      setError('Tên miền không hợp lệ (ví dụ: brand.example.com).');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await updateTenant(tenantId, {
        customDomain: customDomain.trim() || undefined,
        whiteLabel: {
          brandName: whiteLabel.brandName?.trim() || undefined,
          logoUrl: whiteLabel.logoUrl?.trim() || undefined,
          faviconUrl: whiteLabel.faviconUrl?.trim() || undefined,
          primaryColor: whiteLabel.primaryColor?.trim() || undefined,
        },
      });
      setSuccess('Đã lưu cấu hình white-label.');
      await loadTenants();
    } catch (err: any) {
      setError(err?.message || 'Lưu cấu hình thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTenant = tenants.find((t) => t.id === tenantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          White-label / Custom domain
        </h2>
        <button
          onClick={loadTenants}
          disabled={tenantsLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${tenantsLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100">
          {success}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <label className="block text-sm font-medium text-gray-700">Chọn cửa hàng (VIP)</label>
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          disabled={tenantsLoading}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Chọn cửa hàng --</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.subdomain}) {t.plan === 'vip' ? '[VIP]' : ''}
            </option>
          ))}
        </select>
        {selectedTenant && selectedTenant.plan !== 'vip' && (
          <p className="text-xs text-amber-600">Custom domain chỉ khả dụng cho tenant VIP.</p>
        )}
      </div>

      {tenantId && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Cấu hình custom domain
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom domain</label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="brand.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                User truy cập domain này sẽ được ánh xạ tới tenant. Yêu cầu gói VIP.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên thương hiệu</label>
              <input
                type="text"
                value={whiteLabel.brandName || ''}
                onChange={(e) => setWhiteLabel((prev) => ({ ...prev, brandName: e.target.value }))}
                placeholder="Tên hiển thị trên trang đăng nhập"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={whiteLabel.logoUrl || ''}
                onChange={(e) => setWhiteLabel((prev) => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
              <input
                type="url"
                value={whiteLabel.faviconUrl || ''}
                onChange={(e) => setWhiteLabel((prev) => ({ ...prev, faviconUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Màu chủ đạo</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={whiteLabel.primaryColor || '#2563eb'}
                  onChange={(e) => setWhiteLabel((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="h-10 w-16 p-1 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={whiteLabel.primaryColor || '#2563eb'}
                  onChange={(e) => setWhiteLabel((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#2563eb"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || selectedTenant?.plan !== 'vip'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
