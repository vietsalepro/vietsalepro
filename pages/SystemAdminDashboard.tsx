import React, { useEffect, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Tenant,
  TenantPlan,
  TenantStatus,
  UsageSummary,
  UpdateSubscriptionInput,
  BillingStatus,
} from '../types/tenant';
import {
  createTenantWithAdmin,
  searchTenants,
  SearchTenantsResult,
  updateTenant,
  softDeleteTenant,
  restoreTenant,
  getTenantUsageSummary,
  updateTenantSubscription,
  resetMonthlyOrderCounter,
} from '../services/tenantService';

const PLANS: TenantPlan[] = ['free', 'vip'];
const STATUSES: TenantStatus[] = ['active', 'suspended', 'trial', 'pending', 'archived'];

const statusClass = (status: TenantStatus) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'suspended': return 'bg-red-100 text-red-700';
    case 'trial': return 'bg-blue-100 text-blue-700';
    case 'archived': return 'bg-gray-200 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const statusLabel = (status: TenantStatus) => {
  switch (status) {
    case 'active': return 'Hoạt động';
    case 'suspended': return 'Tạm dừng';
    case 'trial': return 'Dùng thử';
    case 'pending': return 'Chờ duyệt';
    case 'archived': return 'Đã lưu trữ';
    default: return status;
  }
};

const planLabel = (plan: TenantPlan) => plan === 'free' ? 'Free' : 'VIP';

const BILLING_STATUSES: BillingStatus[] = ['ok', 'past_due', 'suspended', 'cancelled'];

const billingStatusLabel = (status: BillingStatus) => {
  switch (status) {
    case 'ok': return 'Bình thường';
    case 'past_due': return 'Quá hạn';
    case 'suspended': return 'Tạm dừng';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
};

function ProgressBar({ current, max, percent }: { current: number; max: number; percent: number }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  const color = safePercent >= 90 ? 'bg-red-500' : safePercent >= 80 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 text-gray-600">
        <span>{current.toLocaleString()} / {max.toLocaleString()}</span>
        <span>{safePercent}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${safePercent}%` }} />
      </div>
    </div>
  );
}

function WarningBadge({ value, threshold = 80 }: { value: number; threshold?: number }) {
  if (value < threshold) return null;
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${value >= 90 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
      {value >= 90 ? 'Gần hết' : '>80%'}
    </span>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'amber' | 'purple' | 'gray' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
  };
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <p className="text-sm text-gray-600">Trang {page} / {totalPages} · {total} kết quả</p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Trước
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

export default function SystemAdminDashboard() {
  const [result, setResult] = useState<SearchTenantsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subdomain: '', plan: 'free' as TenantPlan });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '' as TenantStatus | '',
    plan: '' as TenantPlan | '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    plan: 'free' as TenantPlan,
    status: 'active' as TenantStatus,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
  const [usageMap, setUsageMap] = useState<Record<string, UsageSummary>>({});
  const [usageLoading, setUsageLoading] = useState(false);

  const [subTenant, setSubTenant] = useState<Tenant | null>(null);
  const [subForm, setSubForm] = useState<UpdateSubscriptionInput & { plan: TenantPlan }>({
    plan: 'free',
    maxUsers: 1,
    maxProducts: 50,
    maxOrdersPerMonth: 300,
    billingStatus: 'ok',
    expiresAt: null,
  });
  const [subSubmitting, setSubSubmitting] = useState(false);

  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const load = async (p: number, ps: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchTenants({
        searchTerm: debouncedSearchTerm.trim(),
        status: filters.status || null,
        plan: filters.plan || null,
        page: p,
        pageSize: ps,
      });
      setResult(res);
    } catch (err: any) {
      setResult(null);
      setError(err?.message || 'Không thể tải danh sách cửa hàng.');
    } finally {
      setLoading(false);
    }
  };

  // Reset về trang 1 khi filter/thanh tìm kiếm thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filters.status, filters.plan]);

  // Tải dữ liệu khi page/pageSize/filter thay đổi
  useEffect(() => {
    load(page, pageSize);
    // ponytail: eslint exhaustive-deps không được bật trong tsc-only lint; danh sách deps giữ ở mức tối thiểu.
  }, [page, pageSize, debouncedSearchTerm, filters.status, filters.plan]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createTenantWithAdmin({
        name: form.name.trim(),
        subdomain: form.subdomain.trim().toLowerCase(),
        plan: form.plan,
      });
      setForm({ name: '', subdomain: '', plan: 'free' });
      setPage(1);
      await load(1, pageSize);
    } catch (err: any) {
      setError(err?.message || 'Tạo cửa hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (tenant: Tenant) => {
    setEditTenant(tenant);
    setEditForm({ name: tenant.name, plan: tenant.plan, status: tenant.status });
    setError(null);
  };

  const closeEdit = () => {
    setEditTenant(null);
    setEditSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTenant) return;
    setEditSubmitting(true);
    setError(null);
    try {
      await updateTenant(editTenant.id, {
        name: editForm.name.trim(),
        plan: editForm.plan,
        status: editForm.status,
      });
      closeEdit();
      await load(page, pageSize);
    } catch (err: any) {
      setError(err?.message || 'Cập nhật cửa hàng thất bại.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleArchive = async (tenant: Tenant) => {
    if (!window.confirm(`Lưu trữ cửa hàng "${tenant.name}"?`)) return;
    setError(null);
    try {
      await softDeleteTenant(tenant.id);
      await load(page, pageSize);
    } catch (err: any) {
      setError(err?.message || 'Lưu trữ cửa hàng thất bại.');
    }
  };

  const handleRestore = async (tenant: Tenant) => {
    if (!window.confirm(`Khôi phục cửa hàng "${tenant.name}"?`)) return;
    setError(null);
    try {
      await restoreTenant(tenant.id);
      await load(page, pageSize);
    } catch (err: any) {
      setError(err?.message || 'Khôi phục cửa hàng thất bại.');
    }
  };

  const toggleUsage = async (tenant: Tenant) => {
    if (expandedTenantId === tenant.id) {
      setExpandedTenantId(null);
      return;
    }
    setExpandedTenantId(tenant.id);
    if (usageMap[tenant.id]) return;
    setUsageLoading(true);
    try {
      const summary = await getTenantUsageSummary(tenant.id);
      setUsageMap(prev => ({ ...prev, [tenant.id]: summary }));
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin sử dụng.');
    } finally {
      setUsageLoading(false);
    }
  };

  const openSubscriptionEdit = (tenant: Tenant) => {
    const usage = usageMap[tenant.id];
    setSubTenant(tenant);
    setSubForm({
      plan: tenant.plan,
      maxUsers: usage?.users.max ?? (tenant.plan === 'free' ? 1 : 999999),
      maxProducts: usage?.products.max ?? (tenant.plan === 'free' ? 50 : 999999),
      maxOrdersPerMonth: usage?.orders.max ?? (tenant.plan === 'free' ? 300 : 999999),
      billingStatus: (usage?.billingStatus as BillingStatus) ?? 'ok',
      expiresAt: usage?.expiresAt ?? null,
    });
    setError(null);
  };

  const closeSubscriptionEdit = () => {
    setSubTenant(null);
    setSubSubmitting(false);
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTenant) return;
    setSubSubmitting(true);
    setError(null);
    try {
      await updateTenantSubscription(subTenant.id, subForm);
      closeSubscriptionEdit();
      await load(page, pageSize);
    } catch (err: any) {
      setError(err?.message || 'Cập nhật gói thất bại.');
    } finally {
      setSubSubmitting(false);
    }
  };

  const handleResetCounter = async (tenant: Tenant) => {
    if (!window.confirm(`Reset counter đơn hàng tháng cho "${tenant.name}"?`)) return;
    setError(null);
    try {
      await resetMonthlyOrderCounter(tenant.id);
      setUsageMap(prev => {
        const next = { ...prev };
        delete next[tenant.id];
        return next;
      });
      await toggleUsage(tenant);
    } catch (err: any) {
      setError(err?.message || 'Reset counter thất bại.');
    }
  };

  const tenants = result?.tenants ?? [];
  const counts = result?.counts;

  if (loading && !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản trị hệ thống</h1>
          <p className="text-gray-600">Tạo và quản lý các cửa hàng (tenant) trên hệ thống.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Tổng cửa hàng" value={result?.totalCount ?? 0} color="blue" />
          <KpiCard label="Hoạt động" value={counts?.active ?? 0} color="green" />
          <KpiCard label="Đã lưu trữ" value={counts?.archived ?? 0} color="gray" />
          <KpiCard label="Gói VIP" value={counts?.vip ?? 0} color="purple" />
        </div>

        {/* Create form */}
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
                {PLANS.map(p => <option key={p} value={p}>{planLabel(p)}</option>)}
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

        {/* Search & filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                placeholder="Tên hoặc subdomain"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as TenantStatus | '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gói</label>
              <select
                value={filters.plan}
                onChange={(e) => setFilters({ ...filters, plan: e.target.value as TenantPlan | '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {PLANS.map(p => <option key={p} value={p}>{planLabel(p)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tenant table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Danh sách cửa hàng</h2>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 20, 50].map(size => <option key={size} value={size}>{size} / trang</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Tên</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Subdomain</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Gói</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Trạng thái</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.map(t => {
                  const usage = usageMap[t.id];
                  const anyWarning = usage && (
                    usage.users.percent >= 80 ||
                    usage.products.percent >= 80 ||
                    usage.orders.percent >= 80
                  );
                  const isExpanded = expandedTenantId === t.id;
                  return (
                    <React.Fragment key={t.id}>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">{t.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{t.subdomain}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="uppercase">{planLabel(t.plan)}</span>
                            {anyWarning && <WarningBadge value={Math.max(
                              usage?.users.percent ?? 0,
                              usage?.products.percent ?? 0,
                              usage?.orders.percent ?? 0
                            )} />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClass(t.status)}`}>
                            {statusLabel(t.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleUsage(t)}
                              className="px-3 py-1.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg"
                            >
                              {isExpanded ? 'Ẩn usage' : 'Usage'}
                            </button>
                            <button
                              onClick={() => openEdit(t)}
                              className="px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => openSubscriptionEdit(t)}
                              className="px-3 py-1.5 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                            >
                              Gói
                            </button>
                            {t.status === 'archived' ? (
                              <button
                                onClick={() => handleRestore(t)}
                                className="px-3 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg"
                              >
                                Khôi phục
                              </button>
                            ) : (
                              <button
                                onClick={() => handleArchive(t)}
                                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                              >
                                Lưu trữ
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-gray-50">
                            {usageLoading && !usage ? (
                              <p className="text-sm text-gray-600">Đang tải usage...</p>
                            ) : usage ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">Gói:</span> {planLabel(usage.plan as TenantPlan)} ·
                                    <span className="font-medium ml-2">Thanh toán:</span> {billingStatusLabel((usage.billingStatus as BillingStatus) ?? 'ok')} ·
                                    <span className="font-medium ml-2">Hết hạn:</span> {usage.expiresAt ? new Date(usage.expiresAt).toLocaleDateString('vi-VN') : 'Không'}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openSubscriptionEdit(t)}
                                      className="px-3 py-1.5 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                                    >
                                      Nâng/hạ gói
                                    </button>
                                    <button
                                      onClick={() => handleResetCounter(t)}
                                      className="px-3 py-1.5 text-sm text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg"
                                    >
                                      Reset counter
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                                    <p className="text-sm font-medium text-gray-700 mb-2">User</p>
                                    <ProgressBar current={usage.users.current} max={usage.users.max} percent={usage.users.percent} />
                                  </div>
                                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm</p>
                                    <ProgressBar current={usage.products.current} max={usage.products.max} percent={usage.products.percent} />
                                  </div>
                                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Đơn/tháng {usage.orders.monthStart ? `(${usage.orders.monthStart.slice(0,7)})` : ''}</p>
                                    <ProgressBar current={usage.orders.current} max={usage.orders.max} percent={usage.orders.percent} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Không có dữ liệu usage.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Không tìm thấy cửa hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={result?.totalCount ?? 0}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Edit modal */}
      {editTenant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.currentTarget === e.target && !editSubmitting) closeEdit();
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sửa cửa hàng</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gói</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as TenantPlan })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PLANS.map(p => <option key={p} value={p}>{planLabel(p)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TenantStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={editSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {editSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription edit modal */}
      {subTenant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.currentTarget === e.target && !subSubmitting) closeSubscriptionEdit();
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nâng/hạ gói — {subTenant.name}</h3>
            <form onSubmit={handleSubscriptionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gói</label>
                <select
                  value={subForm.plan}
                  onChange={(e) => setSubForm({ ...subForm, plan: e.target.value as TenantPlan })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PLANS.map(p => <option key={p} value={p}>{planLabel(p)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max users</label>
                  <input
                    type="number"
                    min={1}
                    value={subForm.maxUsers}
                    onChange={(e) => setSubForm({ ...subForm, maxUsers: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max products</label>
                  <input
                    type="number"
                    min={1}
                    value={subForm.maxProducts}
                    onChange={(e) => setSubForm({ ...subForm, maxProducts: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max đơn/tháng</label>
                  <input
                    type="number"
                    min={1}
                    value={subForm.maxOrdersPerMonth}
                    onChange={(e) => setSubForm({ ...subForm, maxOrdersPerMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái thanh toán</label>
                  <select
                    value={subForm.billingStatus}
                    onChange={(e) => setSubForm({ ...subForm, billingStatus: e.target.value as BillingStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BILLING_STATUSES.map(s => <option key={s} value={s}>{billingStatusLabel(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn</label>
                  <input
                    type="datetime-local"
                    value={subForm.expiresAt ? subForm.expiresAt.slice(0, 16) : ''}
                    onChange={(e) => setSubForm({ ...subForm, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeSubscriptionEdit}
                  disabled={subSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={subSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                >
                  {subSubmitting ? 'Đang lưu...' : 'Lưu gói'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
