import React, { useState } from 'react';
import {
  Building2,
  Archive,
  Trash2,
  RotateCcw,
  Store,
  CreditCard,
  Flag,
  Database,
  RefreshCw,
  FileDown,
  Upload,
  X,
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
  TenantSubscription,
  UpdateSubscriptionInput,
  TenantFeatureFlags,
  DEFAULT_TENANT_FEATURE_FLAGS,
} from '../../types/tenant';
import {
  listAccounts,
  createTenantWithCredentials,
  softDeleteTenant,
  hardDeleteTenant,
  restoreTenantStatus,
  getTenantFeatureFlags,
  updateTenantFeatureFlags,
} from '../../services/admin/tenantAdminService';
import {
  checkSubdomain,
  startImpersonation,
  downloadTenantBackup,
  restoreTenantBackup,
  previewBackupTables,
  validateBackup,
  resetDemoData,
} from '../../services/admin/systemAdminService';
import { getTenantSubscription, updateTenantSubscription } from '../../services/admin/billingAdminService';

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

  // ponytail: advanced tenant actions moved from AdminDashboardInner (Phase B).
  const [subTenant, setSubTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionSubmitting, setSubscriptionSubmitting] = useState(false);
  const [subForm, setSubForm] = useState<Partial<UpdateSubscriptionInput>>({});

  const [featureTenant, setFeatureTenant] = useState<Tenant | null>(null);
  const [featureFlags, setFeatureFlags] = useState<TenantFeatureFlags | null>(null);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureSubmitting, setFeatureSubmitting] = useState(false);

  const [backingUpTenantId, setBackingUpTenantId] = useState<string | null>(null);
  const [restoreTenant, setRestoreTenant] = useState<Tenant | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{ name: string; rows: number }[] | null>(null);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);

  const [resettingTenantId, setResettingTenantId] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

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

  // --- Edit subscription (Task B.1) ---
  const handleEditSubscription = async (tenant: Tenant) => {
    setSubTenant(tenant);
    setSubscriptionLoading(true);
    setSubscription(null);
    setSubForm({});
    try {
      const sub = await getTenantSubscription(tenant.id);
      setSubscription(sub);
      setSubForm({
        plan: sub?.plan ?? tenant.plan,
        billingStatus: (sub?.billingStatus as UpdateSubscriptionInput['billingStatus']) ?? 'ok',
        expiresAt: sub?.expiresAt ?? null,
        maxUsers: sub?.maxUsers,
        maxProducts: sub?.maxProducts,
        maxOrdersPerMonth: sub?.maxOrdersPerMonth,
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Không thể tải subscription.' });
      setSubTenant(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTenant) return;
    setSubscriptionSubmitting(true);
    try {
      await updateTenantSubscription(subTenant.id, subForm);
      refresh();
      addToast({ type: 'success', message: 'Cập nhật subscription thành công.' });
      setSubTenant(null);
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Cập nhật subscription thất bại.' });
    } finally {
      setSubscriptionSubmitting(false);
    }
  };

  // --- Feature flags (Task B.2) ---
  const handleOpenFeatureFlags = async (tenant: Tenant) => {
    setFeatureTenant(tenant);
    setFeatureLoading(true);
    setFeatureFlags(null);
    try {
      const flags = await getTenantFeatureFlags(tenant.id);
      setFeatureFlags(flags);
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Không thể tải feature flags.' });
      setFeatureTenant(null);
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleToggleFeatureFlag = async (key: keyof TenantFeatureFlags) => {
    if (!featureTenant || !featureFlags) return;
    const next = { ...featureFlags, [key]: !featureFlags[key] };
    setFeatureFlags(next);
    setFeatureSubmitting(true);
    try {
      await updateTenantFeatureFlags(featureTenant.id, { [key]: next[key] });
      addToast({ type: 'success', message: 'Cập nhật feature flag thành công.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Cập nhật feature flag thất bại.' });
      setFeatureFlags(featureFlags);
    } finally {
      setFeatureSubmitting(false);
    }
  };

  // --- Backup / restore (Task B.3) ---
  const handleBackupTenant = async (tenant: Tenant) => {
    setBackingUpTenantId(tenant.id);
    try {
      await downloadTenantBackup(tenant.id);
      addToast({ type: 'success', message: `Backup ${tenant.name} đã được tải xuống.` });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Backup thất bại.' });
    } finally {
      setBackingUpTenantId(null);
    }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setRestoreFile(file);
    if (!file) {
      setRestorePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result as string);
        validateBackup(backup);
        setRestorePreview(previewBackupTables(backup));
      } catch (err: any) {
        addToast({ type: 'error', message: err?.message || 'File backup không hợp lệ.' });
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreTenant || !restoreFile) return;
    setRestoreSubmitting(true);
    try {
      const result = await restoreTenantBackup(restoreTenant.id, restoreFile);
      addToast({ type: 'success', message: `Restore thành công: ${result.result.total_rows} dòng.` });
      setRestoreTenant(null);
      setRestoreFile(null);
      setRestorePreview(null);
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Restore thất bại.' });
    } finally {
      setRestoreSubmitting(false);
    }
  };

  // --- Reset demo data (Task B.4) ---
  const handleResetDemo = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Reset dữ liệu demo',
      message: `Xóa toàn bộ dữ liệu demo của cửa hàng "${tenant.name}"?`,
      variant: 'danger',
      onConfirm: async () => {
        setResettingTenantId(tenant.id);
        try {
          const result = await resetDemoData(tenant.id);
          addToast({ type: 'success', message: `Đã xóa ${result.totalRows} dòng dữ liệu demo.` });
        } catch (err: any) {
          addToast({ type: 'error', message: err?.message || 'Reset demo thất bại.' });
        } finally {
          setResettingTenantId(null);
        }
      },
    });
  };

  // --- Export CSV (Task B.5) ---
  const handleExportCsv = () => {
    setExportingCsv(true);
    try {
      const headers = ['ID', 'Tên', 'Subdomain', 'Gói', 'Trạng thái', 'Isolation', 'Ngày tạo'];
      const rows = tenants.map((t) => [t.id, t.name, t.subdomain, t.plan, t.status, t.isolationMode || 'shared', t.createdAt || '']);
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenants-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Export CSV thành công.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Export CSV thất bại.' });
    } finally {
      setExportingCsv(false);
    }
  };

  const isDemoTenant = (tenant: Tenant) =>
    tenant.name.toLowerCase().includes('demo') || tenant.subdomain.toLowerCase().includes('demo');

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
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={exportingCsv || tenants.length === 0}
              title="Export CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              {exportingCsv ? 'Đang export...' : 'Export CSV'}
            </button>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size} / trang</option>)}
            </select>
          </div>
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
                        <button
                          onClick={() => handleEditSubscription(t)}
                          title="Chỉnh sửa subscription"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenFeatureFlags(t)}
                          title="Feature flags"
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBackupTenant(t)}
                          disabled={backingUpTenantId === t.id}
                          title="Backup"
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg disabled:opacity-50"
                        >
                          <Database className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRestoreTenant(t)}
                          title="Restore"
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        {isDemoTenant(t) && (
                          <button
                            onClick={() => handleResetDemo(t)}
                            disabled={resettingTenantId === t.id}
                            title="Reset demo"
                            className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg disabled:opacity-50"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
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

      {/* Subscription modal */}
      {subTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Subscription: {subTenant.name}</h3>
              <button onClick={() => setSubTenant(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {subscriptionLoading ? (
              <div className="p-8 text-center text-gray-600">Đang tải...</div>
            ) : (
              <form onSubmit={handleSaveSubscription} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gói</label>
                  <select
                    value={subForm.plan || 'free'}
                    onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing status</label>
                  <select
                    value={subForm.billingStatus || 'ok'}
                    onChange={(e) => setSubForm({ ...subForm, billingStatus: e.target.value as UpdateSubscriptionInput['billingStatus'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ok">OK</option>
                    <option value="past_due">Quá hạn</option>
                    <option value="suspended">Tạm dừng</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn</label>
                  <input
                    type="date"
                    value={subForm.expiresAt ? subForm.expiresAt.slice(0, 10) : ''}
                    onChange={(e) => setSubForm({ ...subForm, expiresAt: e.target.value ? `${e.target.value}T00:00:00Z` : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max users</label>
                    <input
                      type="number"
                      value={subForm.maxUsers ?? ''}
                      onChange={(e) => setSubForm({ ...subForm, maxUsers: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max products</label>
                    <input
                      type="number"
                      value={subForm.maxProducts ?? ''}
                      onChange={(e) => setSubForm({ ...subForm, maxProducts: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max orders/tháng</label>
                    <input
                      type="number"
                      value={subForm.maxOrdersPerMonth ?? ''}
                      onChange={(e) => setSubForm({ ...subForm, maxOrdersPerMonth: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setSubTenant(null)} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Hủy</button>
                  <button type="submit" disabled={subscriptionSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                    {subscriptionSubmitting ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Feature flags modal */}
      {featureTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Feature flags: {featureTenant.name}</h3>
              <button onClick={() => setFeatureTenant(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {featureLoading ? (
              <div className="p-8 text-center text-gray-600">Đang tải...</div>
            ) : (
              <div className="p-6 space-y-3">
                {featureFlags && Object.keys(DEFAULT_TENANT_FEATURE_FLAGS).map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">{key}</span>
                    <button
                      onClick={() => handleToggleFeatureFlag(key as keyof TenantFeatureFlags)}
                      disabled={featureSubmitting}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${featureFlags[key as keyof TenantFeatureFlags] ? 'bg-blue-600' : 'bg-gray-200'} disabled:opacity-50`}
                      aria-pressed={featureFlags[key as keyof TenantFeatureFlags]}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${featureFlags[key as keyof TenantFeatureFlags] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button onClick={() => setFeatureTenant(null)} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Đóng</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Restore modal */}
      {restoreTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Restore backup: {restoreTenant.name}</h3>
              <button
                onClick={() => { setRestoreTenant(null); setRestoreFile(null); setRestorePreview(null); }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRestoreBackup} className="p-6 space-y-4">
              <input type="file" accept=".json,application/json" onChange={handleRestoreFileChange} className="w-full text-sm" />
              {restorePreview && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr><th className="px-3 py-2 text-left">Bảng</th><th className="px-3 py-2 text-right">Dòng</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {restorePreview.map((p) => (
                        <tr key={p.name}><td className="px-3 py-2">{p.name}</td><td className="px-3 py-2 text-right">{p.rows}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setRestoreTenant(null); setRestoreFile(null); setRestorePreview(null); }}
                  className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button type="submit" disabled={restoreSubmitting || !restoreFile} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60">
                  {restoreSubmitting ? 'Đang restore...' : 'Restore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
