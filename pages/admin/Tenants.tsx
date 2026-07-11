import React, { useState } from 'react';
import {
  Building2,
  Archive,
  Trash2,
  RotateCcw,
  Store,
} from 'lucide-react';
import { useAdminList } from '../../hooks/useAdminList';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../components/ToastContainer';
import { planLabel } from './adminUtils';
import { getTenantUrl } from '../../lib/tenant';
import {
  Tenant,
  TenantStatus,
  TenantPlan,
} from '../../types/tenant';
import {
  listAccounts,
  createTenantWithCredentials,
  softDeleteTenant,
  hardDeleteTenant,
  restoreTenantStatus,
} from '../../services/admin/tenantAdminService';
import { checkSubdomain, startImpersonation } from '../../services/admin/systemAdminService';

const PLANS: TenantPlan[] = ['free', 'vip'];
const STATUSES: TenantStatus[] = ['active', 'suspended', 'trial', 'pending', 'archived', 'read_only'];

const isValidSubdomain = (s: string): boolean =>
  /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(s) && s.length >= 3 && s.length <= 63;

const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);

const statusClass = (status: TenantStatus) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'suspended': return 'bg-red-100 text-red-700';
    case 'trial': return 'bg-blue-100 text-blue-700';
    case 'archived': return 'bg-gray-200 text-gray-600';
    case 'read_only': return 'bg-amber-100 text-amber-700';
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
    case 'read_only': return 'Hết hạn (chỉ đọc)';
    default: return status;
  }
};

interface TenantFilters {
  status: TenantStatus | '';
  plan: TenantPlan | '';
  [key: string]: unknown;
}

function KpiCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'gray' | 'purple' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
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

export default function Tenants() {
  const {
    data: tenants,
    totalCount,
    isLoading,
    error,
    page,
    pageSize,
    searchTerm,
    filters,
    setPage,
    setPageSize,
    setSearchTerm,
    setFilters,
    refresh,
  } = useAdminList<Tenant, TenantFilters>(
    async (params) => {
      const result = await listAccounts({
        search: params.search,
        status: params.status || null,
        plan: params.plan || null,
        page: params.page,
        pageSize: params.pageSize,
      });
      return { items: result.accounts, totalCount: result.totalCount };
    },
    {
      initialFilters: { status: '', plan: '' },
      initialPageSize: 10,
      debounceMs: 300,
    },
  );

  const [form, setForm] = useState({ name: '', subdomain: '', plan: 'free' as TenantPlan, adminEmail: '' });
  const [submitting, setSubmitting] = useState(false);
  const [subdomainCheck, setSubdomainCheck] = useState<{ checking: boolean; available?: boolean; message?: string } | null>(null);
  const [createResult, setCreateResult] = useState<{ tenant: Tenant; adminUser: { email: string; id: string } } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { openConfirmDialog, confirmDialog } = useConfirmDialog();
  const { addToast } = useToast();

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNameChange = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, name: value };
      if (!prev.subdomain.trim()) {
        next.subdomain = slugify(value);
      }
      return next;
    });
  };

  const handleCheckSubdomain = async () => {
    const subdomain = form.subdomain.trim();
    if (!isValidSubdomain(subdomain)) {
      setSubdomainCheck({ checking: false, available: false, message: 'Subdomain không hợp lệ.' });
      return;
    }
    setSubdomainCheck({ checking: true });
    try {
      const res = await checkSubdomain(subdomain);
      setSubdomainCheck({ checking: false, available: res.available, message: res.available ? 'Subdomain khả dụng.' : (res.error || 'Subdomain đã được sử dụng.') });
    } catch (err: any) {
      setSubdomainCheck({ checking: false, available: false, message: err?.message || 'Không thể kiểm tra subdomain.' });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const subdomain = form.subdomain.trim().toLowerCase();
    if (!form.name.trim()) {
      addToast({ type: 'error', message: 'Vui lòng nhập tên cửa hàng.' });
      return;
    }
    if (!isValidSubdomain(subdomain)) {
      addToast({ type: 'error', message: 'Subdomain không hợp lệ.' });
      return;
    }
    if (subdomainCheck?.available !== true) {
      addToast({ type: 'error', message: 'Vui lòng kiểm tra subdomain.' });
      return;
    }
    if (!isValidEmail(form.adminEmail)) {
      addToast({ type: 'error', message: 'Email admin không hợp lệ.' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await createTenantWithCredentials({
        name: form.name.trim(),
        subdomain,
        plan: form.plan,
        adminEmail: form.adminEmail.trim(),
      });
      setCreateResult(result);
      setForm({ name: '', subdomain: '', plan: 'free', adminEmail: '' });
      setSubdomainCheck(null);
      refresh();
      addToast({ type: 'success', message: 'Tạo cửa hàng thành công.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Tạo cửa hàng thất bại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Lưu trữ cửa hàng',
      message: `Lưu trữ cửa hàng "${tenant.name}"?`,
      onConfirm: async () => {
        setBusyId(tenant.id);
        try {
          await softDeleteTenant(tenant.id);
          refresh();
          addToast({ type: 'success', message: `Đã lưu trữ ${tenant.name}.` });
        } catch (err: any) {
          addToast({ type: 'error', message: err?.message || 'Lưu trữ thất bại.' });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleRestore = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Khôi phục cửa hàng',
      message: `Khôi phục cửa hàng "${tenant.name}"?`,
      onConfirm: async () => {
        setBusyId(tenant.id);
        try {
          await restoreTenantStatus(tenant.id);
          refresh();
          addToast({ type: 'success', message: `Đã khôi phục ${tenant.name}.` });
        } catch (err: any) {
          addToast({ type: 'error', message: err?.message || 'Khôi phục thất bại.' });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleDelete = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Xóa cửa hàng vĩnh viễn',
      message: `Xóa vĩnh viễn cửa hàng "${tenant.name}"? Toàn bộ dữ liệu sẽ bị xóa.`,
      confirmLabel: 'Xóa vĩnh viễn',
      cancelLabel: 'Hủy',
      variant: 'danger',
      onConfirm: async () => {
        setBusyId(tenant.id);
        try {
          await hardDeleteTenant(tenant.id);
          refresh();
          addToast({ type: 'success', message: `Đã xóa ${tenant.name}.` });
        } catch (err: any) {
          addToast({ type: 'error', message: err?.message || 'Xóa thất bại.' });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleLoginAs = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Đăng nhập với tư cách admin',
      message: `Đăng nhập với tư cách admin của cửa hàng "${tenant.name}"?`,
      variant: 'warning',
      onConfirm: async () => {
        try {
          const res = await startImpersonation(tenant.id);
          window.location.href = getTenantUrl(res.tenant.subdomain, res.tenant.customDomain);
        } catch (err: any) {
          addToast({ type: 'error', message: err?.message || 'Impersonate thất bại.' });
        }
      },
    });
  };

  const activeCount = tenants.filter((t) => t.status === 'active').length;
  const archivedCount = tenants.filter((t) => t.status === 'archived').length;
  const vipCount = tenants.filter((t) => t.plan === 'vip').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-blue-600" />
          Quản lý cửa hàng
        </h1>
        <p className="text-sm text-gray-600 mt-1">Tạo, tìm kiếm và quản lý các cửa hàng trên hệ thống.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Tổng cửa hàng" value={totalCount} color="blue" />
        <KpiCard label="Hoạt động" value={activeCount} color="green" />
        <KpiCard label="Đã lưu trữ" value={archivedCount} color="gray" />
        <KpiCard label="Gói VIP" value={vipCount} color="purple" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tạo cửa hàng mới</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Cửa hàng Sữa Cậu Ba"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.subdomain}
                onChange={(e) => {
                  setForm({ ...form, subdomain: e.target.value.toLowerCase() });
                  setSubdomainCheck(null);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="cuahang"
                required
              />
              <button
                type="button"
                onClick={handleCheckSubdomain}
                disabled={subdomainCheck?.checking}
                className="px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-60 whitespace-nowrap"
              >
                {subdomainCheck?.checking ? 'Đang kiểm tra...' : 'Kiểm tra'}
              </button>
            </div>
            {subdomainCheck && !subdomainCheck.checking && (
              <p className={`text-xs mt-1 ${subdomainCheck.available ? 'text-green-600' : 'text-red-600'}`}>
                {subdomainCheck.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gói</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value as TenantPlan })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email admin shop</label>
            <input
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@cuahang.com"
              required
            />
          </div>
          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={
                submitting
                || !form.name.trim()
                || !isValidSubdomain(form.subdomain.trim())
                || subdomainCheck?.available !== true
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Đang tạo...' : 'Tạo cửa hàng'}
            </button>
          </div>
        </form>

        {createResult && (
          <div className="mt-6 bg-green-50 border border-green-200 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Tạo cửa hàng thành công</h3>
            <p className="text-sm text-gray-800">
              Link đăng nhập:{' '}
              <a
                href={getTenantUrl(createResult.tenant.subdomain)}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {getTenantUrl(createResult.tenant.subdomain)}
              </a>
            </p>
            <p className="text-sm text-gray-800">Email admin: <strong>{createResult.adminUser.email}</strong></p>
            <button
              type="button"
              onClick={() => setCreateResult(null)}
              className="mt-4 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
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
              {PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Danh sách cửa hàng</h2>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / trang</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Tên</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Subdomain</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Gói</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Cô lập</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Trạng thái</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">Đang tải...</td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">Không có cửa hàng nào.</td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.subdomain}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 uppercase">{planLabel(t.plan)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${t.isolationMode && t.isolationMode !== 'shared' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {(t.isolationMode || 'shared').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClass(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoginAs(t)}
                          title="Đăng nhập với tư cách admin"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                        {t.status === 'archived' ? (
                          <button
                            onClick={() => handleRestore(t)}
                            disabled={busyId === t.id}
                            title="Khôi phục"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(t)}
                            disabled={busyId === t.id}
                            title="Lưu trữ"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={busyId === t.id}
                          title="Xóa vĩnh viễn"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={totalCount} onPageChange={setPage} />
      </div>

      {confirmDialog}
    </div>
  );
}
