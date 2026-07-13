import React, { useState, useEffect, useCallback } from 'react';
import { Key, Check, AlertCircle, Loader2, Copy, ShieldX, Plus } from 'lucide-react';
import { Tenant } from '../../types/tenant';
import {
  License,
  LicenseStatus,
  generateLicense,
  validateLicense,
  listTenantLicenses,
  revokeLicense,
} from '../../services/admin/licenseService';

interface LicenseManagerPanelProps {
  tenant: Tenant;
}

interface StatusMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

export default function LicenseManagerPanel({ tenant }: LicenseManagerPanelProps) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [plan, setPlan] = useState(tenant.plan || 'vip');
  const [maxUsers, setMaxUsers] = useState('');
  const [maxProducts, setMaxProducts] = useState('');
  const [maxOrders, setMaxOrders] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [generating, setGenerating] = useState(false);

  const [validateKey, setValidateKey] = useState('');
  const [validating, setValidating] = useState(false);

  const loadLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTenantLicenses(tenant.id);
      setLicenses(data);
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Không thể tải danh sách license.' });
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  const handleGenerate = async () => {
    setGenerating(true);
    setStatus(null);
    try {
      const license = await generateLicense({
        tenantId: tenant.id,
        plan,
        maxUsers: maxUsers ? Number(maxUsers) : undefined,
        maxProducts: maxProducts ? Number(maxProducts) : undefined,
        maxOrdersPerMonth: maxOrders ? Number(maxOrders) : undefined,
        expiresAt: expiresAt || undefined,
      });
      setStatus({ type: 'success', text: `Đã tạo license: ${license.key}` });
      setShowForm(false);
      await loadLicenses();
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Tạo license thất bại.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!validateKey.trim()) return;
    setValidating(true);
    setStatus(null);
    try {
      const result = await validateLicense(validateKey.trim());
      if (result.valid) {
        setStatus({ type: 'success', text: `License hợp lệ: ${result.license?.plan || ''}` });
      } else {
        setStatus({ type: 'error', text: `License không hợp lệ: ${result.reason || 'unknown'}` });
      }
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Kiểm tra license thất bại.' });
    } finally {
      setValidating(false);
    }
  };

  const handleRevoke = async (license: License) => {
    if (!window.confirm(`Thu hồi license ${license.key}?`)) return;
    try {
      await revokeLicense(license.id);
      setStatus({ type: 'info', text: 'Đã thu hồi license.' });
      await loadLicenses();
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Thu hồi license thất bại.' });
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus({ type: 'info', text: 'Đã sao chép license key.' });
    } catch {
      setStatus({ type: 'info', text: 'Không thể sao chép tự động.' });
    }
  };

  const statusColor =
    status?.type === 'success'
      ? 'text-green-600'
      : status?.type === 'error'
      ? 'text-red-600'
      : 'text-blue-600';

  const statusBadge = (license: License) => {
    if (license.status === LicenseStatus.ACTIVE) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          <Check className="w-3 h-3" />
          Hoạt động
        </span>
      );
    }
    if (license.status === LicenseStatus.EXPIRED) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
          <AlertCircle className="w-3 h-3" />
          Hết hạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
        <ShieldX className="w-3 h-3" />
        Thu hồi
      </span>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Quản lý license
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo license mới
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="license-plan" className="block text-sm font-medium text-gray-700 mb-1">
                Gói
              </label>
              <input
                id="license-plan"
                type="text"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="license-expires" className="block text-sm font-medium text-gray-700 mb-1">
                Hết hạn
              </label>
              <input
                id="license-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="license-max-users" className="block text-sm font-medium text-gray-700 mb-1">
                Max users
              </label>
              <input
                id="license-max-users"
                type="number"
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="license-max-products" className="block text-sm font-medium text-gray-700 mb-1">
                Max products
              </label>
              <input
                id="license-max-products"
                type="number"
                value={maxProducts}
                onChange={(e) => setMaxProducts(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="license-max-orders" className="block text-sm font-medium text-gray-700 mb-1">
                Max orders/tháng
              </label>
              <input
                id="license-max-orders"
                type="number"
                value={maxOrders}
                onChange={(e) => setMaxOrders(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !plan.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Tạo license
          </button>
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="validate-key" className="block text-sm font-medium text-gray-700">
          Kiểm tra license key
        </label>
        <div className="flex items-center gap-2">
          <input
            id="validate-key"
            type="text"
            value={validateKey}
            onChange={(e) => setValidateKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleValidate();
              }
            }}
            placeholder="Nhập license key"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating || !validateKey.trim()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Kiểm tra
          </button>
        </div>
      </div>

      {status && (
        <div className={`flex items-center gap-2 text-sm ${statusColor}`}>
          {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.text}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">License đã tạo</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải...
          </div>
        ) : licenses.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có license nào cho tenant này.</p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {licenses.map((license) => (
              <li key={license.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium text-gray-900 break-all">{license.key}</code>
                    {statusBadge(license)}
                  </div>
                  <p className="text-xs text-gray-500">
                    Gói: {license.plan} · Users: {license.maxUsers} · Products: {license.maxProducts} · Orders/tháng:{' '}
                    {license.maxOrdersPerMonth}
                    {license.expiresAt ? ` · Hết hạn: ${new Date(license.expiresAt).toLocaleDateString('vi-VN')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(license.key)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Sao chép license key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {license.status === LicenseStatus.ACTIVE && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(license)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label="Thu hồi license"
                    >
                      <ShieldX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
