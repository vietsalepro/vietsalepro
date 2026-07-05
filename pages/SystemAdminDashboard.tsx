import React, { useEffect, useState } from 'react';
import {
  Tenant,
  TenantPlan,
  TenantStatus,
} from '../types/tenant';
import {
  getAllTenants,
  createTenantWithAdmin,
  updateTenantStatus,
} from '../services/tenantService';

const PLANS: TenantPlan[] = ['free', 'vip'];
const STATUSES: TenantStatus[] = ['active', 'suspended', 'trial', 'pending'];

const statusClass = (status: TenantStatus) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'suspended': return 'bg-red-100 text-red-700';
    case 'trial': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const statusLabel = (status: TenantStatus) => {
  switch (status) {
    case 'active': return 'Hoạt động';
    case 'suspended': return 'Tạm dừng';
    case 'trial': return 'Dùng thử';
    case 'pending': return 'Chờ duyệt';
    default: return status;
  }
};

export default function SystemAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subdomain: '', plan: 'free' as TenantPlan });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAllTenants();
      setTenants(list);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách cửa hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createTenantWithAdmin({
        name: form.name.trim(),
        subdomain: form.subdomain.trim().toLowerCase(),
        plan: form.plan,
      });
      setTenants(prev => [created, ...prev]);
      setForm({ name: '', subdomain: '', plan: 'free' });
    } catch (err: any) {
      setError(err?.message || 'Tạo cửa hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (tenant: Tenant, status: TenantStatus) => {
    setError(null);
    try {
      const updated = await updateTenantStatus(tenant.id, status);
      setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (err: any) {
      setError(err?.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản trị hệ thống</h1>
          <p className="text-gray-600">Tạo và quản lý các cửa hàng (tenant) trên hệ thống.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tạo cửa hàng mới</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ví dụ: Cửa hàng Sữa Cậu Ba"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
              <input
                type="text"
                value={form.subdomain}
                onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="cuahang"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gói</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value as TenantPlan })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLANS.map(p => <option key={p} value={p}>{p === 'free' ? 'Free' : 'VIP'}</option>)}
              </select>
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Đang tạo...' : 'Tạo cửa hàng'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 p-6 border-b border-gray-100">Danh sách cửa hàng</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Tên</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Subdomain</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Gói</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Trạng thái</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.map(t => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.subdomain}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 uppercase">{t.plan}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClass(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t, e.target.value as TenantStatus)}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chưa có cửa hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
