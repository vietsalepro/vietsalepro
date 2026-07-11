import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Store, Users, Package, ShoppingBag, AlertTriangle, Clock, TrendingUp, CreditCard,
  Building2, Receipt, TicketPercent, MessageSquare, Megaphone, Mail, ShieldCheck, Settings, Home,
  Pencil, Activity, MoreHorizontal, Database, Download, Upload, RotateCcw, Archive, Trash2,
} from 'lucide-react';
import AdminKpiCards from '../../components/AdminKpiCards';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../components/ToastContainer';
import { getTenantUrl } from '../../lib/tenant';
import { AuditLog } from '../AuditLog';
import BillingConfig from '../../components/BillingConfig';
import VoucherManager from '../../components/VoucherManager';
import TicketInbox from '../../components/TicketInbox';
import EmailTemplateManager from '../../components/EmailTemplateManager';
import NotificationManager from '../../components/NotificationManager';
import SystemHealthPanel from '../../components/SystemHealthPanel';
import ErrorPerformancePanel from '../../components/ErrorPerformancePanel';
import StorageBackupPanel from '../../components/StorageBackupPanel';
import BulkMaintenancePanel from '../../components/BulkMaintenancePanel';
import ApiKeyManager from '../../components/ApiKeyManager';
import WebhookManager from '../../components/WebhookManager';
import IntegrationMarketplace from '../../components/IntegrationMarketplace';
import TwoFactorManager from '../../components/TwoFactorManager';
import ComplianceManager from '../../components/ComplianceManager';
import WhiteLabelManager from '../../components/WhiteLabelManager';
import ReadReplicaQueueManager from '../../components/ReadReplicaQueueManager';
import { MemberManagement } from '../../components/MemberManagement';
import '../Dashboard.css';
import {
  Tenant,
  TenantPlan,
  TenantStatus,
  TenantIsolationMode,
  UsageSummary,
  UpdateSubscriptionInput,
  BillingStatus,
  SystemOverview,
  TopTenant,
  TenantGrowthPoint,
  PlanLimits,
  DefaultPlanLimits,
  MaintenanceMode,
  DataRetentionStatus,
  TenantFeatureFlags,
  DEFAULT_TENANT_FEATURE_FLAGS,
  CreateTenantResult,
} from '../../types/tenant';
import {
  createTenantWithCredentials,
  searchTenants,
  SearchTenantsResult,
  updateTenant,
  softDeleteTenant,
  hardDeleteTenant,
  restoreTenantStatus,
  getTenantUsageSummary,
  getAllTenants,
  getTenantCredentials,
  TenantCredentials,
  getTopTenants,
  getTenantGrowth,
  getTenantFeatureFlags,
  updateTenantFeatureFlags,
} from '../../services/admin/tenantAdminService';
import { resetMemberPassword } from '../../services/admin/memberAdminService';
import {
  updateTenantSubscription,
  resetMonthlyOrderCounter,
} from '../../services/admin/billingAdminService';
import {
  RateLimitLog,
  AdminLoginHistoryEntry,
  AdminLoginAlert,
  getRateLimitLogs,
  getAdminLoginHistory,
  getAdminLoginAlerts,
} from '../../services/admin/auditAdminService';
import {
  SystemAdmin,
  getSystemAdmins,
  addSystemAdmin,
  removeSystemAdmin,
  createSystemAdmin,
  getSystemOverview,
  startImpersonation,
  downloadTenantBackup,
  restoreTenantBackup,
  previewBackupTables,
  resetDemoData,
  getDataRetentionStatus,
  getDefaultPlanLimits,
  setDefaultPlanLimits,
  getMaintenanceMode,
  setMaintenanceMode,
  checkSubdomain,
} from '../../services/admin/systemAdminService';

const PLANS: TenantPlan[] = ['free', 'vip'];
const STATUSES: TenantStatus[] = ['active', 'suspended', 'trial', 'pending', 'archived', 'read_only'];
const ISOLATION_MODES: TenantIsolationMode[] = ['shared', 'schema', 'project'];

const isolationLabel = (mode: TenantIsolationMode) => {
  switch (mode) {
    case 'shared': return 'Shared';
    case 'schema': return 'Schema';
    case 'project': return 'Project';
    default: return mode;
  }
};

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

import { planLabel, calculateProration } from './adminUtils';

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

const TENANT_FEATURE_FLAG_LIST: {
  key: keyof TenantFeatureFlags;
  label: string;
  description: string;
}[] = [
  { key: 'pos', label: 'POS - Bán hàng', description: 'Màn hình bán hàng và thanh toán.' },
  { key: 'inventory', label: 'Kho & sản phẩm', description: 'Quản lý sản phẩm, nhập hàng, tồn kho.' },
  { key: 'reports', label: 'Báo cáo', description: 'Báo cáo doanh thu, lợi nhuận, tồn kho.' },
  { key: 'debt', label: 'Công nợ', description: 'Theo dõi nợ khách hàng và nhà cung cấp.' },
  { key: 'loyalty', label: 'Tích điểm', description: 'Chương trình khách hàng thân thiết.' },
  { key: 'promotions', label: 'Khuyến mãi', description: 'Giảm giá, voucher, khuyến mãi.' },
  { key: 'invoicing', label: 'Hóa đơn thu phí', description: 'Tạo hóa đơn và ghi nhận thanh toán cho tenant.' },
  { key: 'lotTracking', label: 'Quản lý lô', description: 'Theo dõi lô hàng, HSD, FIFO.' },
];

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

export type AdminTab = 'overview' | 'tenants' | 'members' | 'audit' | 'rateLimit' | 'systemAdmins' | 'loginHistory' | 'operations' | 'billing' | 'vouchers' | 'tickets' | 'emails' | 'notifications' | 'health' | 'errors' | 'storage' | 'bulkMaintenance' | 'apiKeys' | 'webhooks' | 'integrations' | 'twoFactor' | 'compliance' | 'whiteLabel' | 'readReplicaQueue' | 'security' | 'settings';

export interface AdminDashboardInnerProps {
  activeTab: AdminTab;
}

export default function AdminDashboardInner({ activeTab }: AdminDashboardInnerProps) {
  const [result, setResult] = useState<SearchTenantsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    plan: 'free',
    adminEmail: '',
  });
  const [createResult, setCreateResult] = useState<CreateTenantResult | null>(null);
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
    plan: 'free',
    status: 'active' as TenantStatus,
    isolationMode: 'shared' as TenantIsolationMode,
    isolationSchema: '',
    isolationProjectRef: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'info' | 'subscription' | 'features'>('info');

  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
  const [usageMap, setUsageMap] = useState<Record<string, UsageSummary>>({});
  const [usageLoading, setUsageLoading] = useState(false);
  const [backingUpTenantId, setBackingUpTenantId] = useState<string | null>(null);

  const [restoreTenant, setRestoreTenant] = useState<Tenant | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{ name: string; rows: number }[] | null>(null);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);
  const [resettingTenantId, setResettingTenantId] = useState<string | null>(null);
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);

  const [subTenant, setSubTenant] = useState<Tenant | null>(null);
  const [subForm, setSubForm] = useState<UpdateSubscriptionInput & { plan: string }>({
    plan: 'free',
    maxUsers: 1,
    maxProducts: 50,
    maxOrdersPerMonth: 300,
    billingStatus: 'ok',
    expiresAt: null,
  });
  const [subSubmitting, setSubSubmitting] = useState(false);

  const [featureTenant, setFeatureTenant] = useState<Tenant | null>(null);
  const [featureFlags, setFeatureFlags] = useState<TenantFeatureFlags>(DEFAULT_TENANT_FEATURE_FLAGS);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureSubmitting, setFeatureSubmitting] = useState(false);

  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [memberTenantId, setMemberTenantId] = useState<string>('');
  const [memberTenantSearch, setMemberTenantSearch] = useState('');
  const [memberTenantOptions, setMemberTenantOptions] = useState<Tenant[]>([]);
  const [memberTenantSearchLoading, setMemberTenantSearchLoading] = useState(false);
  const [memberTenantSearchError, setMemberTenantSearchError] = useState<string | null>(null);
  const [memberTenantPage, setMemberTenantPage] = useState(1);
  const [memberTenantTotal, setMemberTenantTotal] = useState(0);
  const [memberTenantRefetch, setMemberTenantRefetch] = useState(0);
  const MEMBER_TENANT_PAGE_SIZE = 20;
  const debouncedMemberTenantSearch = useDebounce(memberTenantSearch, 300);

  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [growth, setGrowth] = useState<TenantGrowthPoint[]>([]);
  const [topTenants, setTopTenants] = useState<TopTenant[]>([]);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const [rateLimitLogs, setRateLimitLogs] = useState<RateLimitLog[]>([]);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [rateLimitPage, setRateLimitPage] = useState(1);
  const [rateLimitLoading, setRateLimitLoading] = useState(false);
  const [systemAdmins, setSystemAdmins] = useState<SystemAdmin[]>([]);
  const [systemAdminsLoading, setSystemAdminsLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [systemAdminSubmitting, setSystemAdminSubmitting] = useState(false);

  const [loginHistory, setLoginHistory] = useState<AdminLoginHistoryEntry[]>([]);
  const [loginHistoryCount, setLoginHistoryCount] = useState(0);
  const [loginHistoryPage, setLoginHistoryPage] = useState(1);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [loginHistoryStatus, setLoginHistoryStatus] = useState<'success' | 'failed' | ''>('');
  const [loginAlerts, setLoginAlerts] = useState<AdminLoginAlert[]>([]);
  const [loginAlertsLoading, setLoginAlertsLoading] = useState(false);

  const [retentionStatus, setRetentionStatus] = useState<DataRetentionStatus | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [defaultLimits, setDefaultLimits] = useState<DefaultPlanLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [limitsSubmitting, setLimitsSubmitting] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceMode>({ enabled: false, message: '' });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [subdomainCheck, setSubdomainCheck] = useState<{ checking: boolean; available?: boolean; message?: string } | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [impersonatingTenantId, setImpersonatingTenantId] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();
  const { addToast } = useToast();

  const load = useCallback(async (p: number, ps: number) => {
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
      const credentialMap = await getTenantCredentials(res.tenants.map((t) => t.id));
      setResult({
        ...res,
        tenants: res.tenants.map((t) => ({
          ...t,
          adminEmail: credentialMap[t.id]?.adminEmail,
        })),
      });
    } catch (err: any) {
      setResult(null);
      setError(err?.message || 'Không thể tải danh sách cửa hàng.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters.status, filters.plan]);

  // Reset về trang 1 khi filter/thanh tìm kiếm thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filters.status, filters.plan]);

  // Tải dữ liệu khi page/pageSize/filter thay đổi
  useEffect(() => {
    load(page, pageSize);
  }, [load, page, pageSize]);

  const handleNameChange = (value: string) => {
    setForm(prev => {
      const next = { ...prev, name: value };
      if (!prev.subdomain.trim()) {
        next.subdomain = slugify(value);
      }
      return next;
    });
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreateResult(null);
    const subdomain = form.subdomain.trim().toLowerCase();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên cửa hàng.');
      return;
    }
    if (!isValidSubdomain(subdomain)) {
      setError('Subdomain phải dài 3–63 ký tự, chỉ gồm chữ thường, số và dấu gạch ngang, không bắt đầu/kết thúc bằng dấu gạch.');
      return;
    }
    if (subdomainCheck?.available !== true) {
      setError('Vui lòng kiểm tra subdomain và đảm bảo khả dụng.');
      return;
    }
    if (!isValidEmail(form.adminEmail)) {
      setError('Vui lòng nhập email admin hợp lệ.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createTenantWithCredentials({
        name: form.name.trim(),
        subdomain,
        plan: form.plan as TenantPlan,
        adminEmail: form.adminEmail.trim(),
      });
      setCreateResult(result);
      setForm({ name: '', subdomain: '', plan: 'free', adminEmail: '' });
      setSubdomainCheck(null);
      await load(1, pageSize);
    } catch (err: any) {
      setError(err?.message || 'Tạo cửa hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (tenant: Tenant) => {
    setEditTenant(tenant);
    setEditModalTab('info');
    setEditForm({
      name: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      isolationMode: tenant.isolationMode || 'shared',
      isolationSchema: tenant.isolationSchema || '',
      isolationProjectRef: tenant.isolationProjectRef || '',
    });
    setError(null);
  };

  const closeEditModal = () => {
    setEditTenant(null);
    setSubTenant(null);
    setFeatureTenant(null);
    setEditSubmitting(false);
    setSubSubmitting(false);
    setFeatureSubmitting(false);
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
        isolationMode: editForm.isolationMode,
        isolationSchema: editForm.isolationSchema.trim() || undefined,
        isolationProjectRef: editForm.isolationProjectRef.trim() || undefined,
      });
      closeEditModal();
      await load(page, pageSize);
    } catch (err: any) {
      setError(err?.message || 'Cập nhật cửa hàng thất bại.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleArchive = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Lưu trữ cửa hàng',
      message: `Lưu trữ cửa hàng "${tenant.name}"?`,
      onConfirm: async () => {
        setError(null);
        try {
          await softDeleteTenant(tenant.id);
          await load(page, pageSize);
        } catch (err: any) {
          setError(err?.message || 'Lưu trữ cửa hàng thất bại.');
        }
      },
    });
  };

  const handleRestore = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Khôi phục cửa hàng',
      message: `Khôi phục cửa hàng "${tenant.name}"?`,
      onConfirm: async () => {
        setError(null);
        try {
          await restoreTenantStatus(tenant.id);
          await load(page, pageSize);
        } catch (err: any) {
          setError(err?.message || 'Khôi phục cửa hàng thất bại.');
        }
      },
    });
  };

  const handleDelete = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Xóa cửa hàng vĩnh viễn',
      message: `Xóa vĩnh viễn cửa hàng "${tenant.name}" (subdomain: ${tenant.subdomain})? Toàn bộ dữ liệu DB, file storage và tài khoản admin thuộc về shop sẽ bị xóa. Subdomain sẽ được giải phóng để tái sử dụng. Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa vĩnh viễn',
      cancelLabel: 'Hủy',
      variant: 'danger',
      onConfirm: async () => {
        setDeletingTenantId(tenant.id);
        setError(null);
        try {
          await hardDeleteTenant(tenant.id);
          addToast({ type: 'success', message: `Đã xóa cửa hàng "${tenant.name}".` });
          await load(page, pageSize);
        } catch (err: any) {
          setError(err?.message || 'Xóa cửa hàng thất bại.');
        } finally {
          setDeletingTenantId(null);
        }
      },
    });
  };

  const handleLoginAs = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Đăng nhập với tư cách admin',
      message: `Đăng nhập với tư cách admin của cửa hàng "${tenant.name}"?\n\nBạn sẽ rời khỏi trang admin dashboard.`,
      variant: 'warning',
      onConfirm: async () => {
        setImpersonatingTenantId(tenant.id);
        setError(null);
        try {
          const res = await startImpersonation(tenant.id);
          window.location.href = getTenantUrl(res.tenant.subdomain, res.tenant.customDomain);
        } catch (err: any) {
          setImpersonatingTenantId(null);
          setError(err?.message || 'Impersonate thất bại.');
        }
      },
    });
  };

  const handleBackup = async (tenant: Tenant) => {
    setBackingUpTenantId(tenant.id);
    setError(null);
    try {
      await downloadTenantBackup(tenant.id);
    } catch (err: any) {
      setError(err?.message || 'Backup tenant thất bại.');
    } finally {
      setBackingUpTenantId(null);
    }
  };

  const openRestore = (tenant: Tenant) => {
    setRestoreTenant(tenant);
    setRestoreFile(null);
    setRestorePreview(null);
    setError(null);
  };

  const closeRestore = () => {
    setRestoreTenant(null);
    setRestoreFile(null);
    setRestorePreview(null);
    setRestoreSubmitting(false);
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setRestoreFile(null);
      setRestorePreview(null);
      return;
    }
    setError(null);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.tables || typeof backup.tables !== 'object') {
        throw new Error('File backup thiếu phần tables');
      }
      setRestoreFile(file);
      setRestorePreview(previewBackupTables({ tables: backup.tables }));
    } catch (err: any) {
      setError(err?.message || 'Không thể đọc file backup.');
      setRestoreFile(null);
      setRestorePreview(null);
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreTenant || !restoreFile) return;
    setRestoreSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await restoreTenantBackup(restoreTenant.id, restoreFile);
      const restoredTables = res.result?.restored?.map((r) => `${r.table} (${r.rows})`).join(', ');
      closeRestore();
      setSuccess(`Restore thành công: ${res.result?.total_rows ?? 0} dòng trong ${res.result?.restored?.length ?? 0} bảng (${restoredTables}).`);
    } catch (err: any) {
      setSuccess(null);
      setError(err?.message || 'Restore tenant thất bại.');
    } finally {
      setRestoreSubmitting(false);
    }
  };

  const handleResetDemo = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Reset dữ liệu demo',
      message: `Reset dữ liệu demo cho "${tenant.name}"? Dữ liệu business sẽ bị xóa nhưng tài khoản tenant và thành viên được giữ lại.`,
      onConfirm: async () => {
        setResettingTenantId(tenant.id);
        setSuccess(null);
        setError(null);
        try {
          const res = await resetDemoData(tenant.id);
          const clearedTables = res.cleared.map((c) => `${c.table} (${c.rows})`).join(', ');
          setSuccess(`Reset demo thành công: ${res.totalRows} dòng đã xóa (${clearedTables}).`);
        } catch (err: any) {
          setSuccess(null);
          setError(err?.message || 'Reset demo thất bại.');
        } finally {
          setResettingTenantId(null);
        }
      },
    });
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
    setEditModalTab('subscription');
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

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTenant) return;
    setSubSubmitting(true);
    setError(null);
    try {
      await updateTenantSubscription(subTenant.id, subForm);
      closeEditModal();
      await load(page, pageSize);
    } catch (err: any) {
      setError(err?.message || 'Cập nhật gói thất bại.');
    } finally {
      setSubSubmitting(false);
    }
  };

  const openFeatureFlags = async (tenant: Tenant) => {
    setFeatureTenant(tenant);
    setEditModalTab('features');
    setFeatureFlags(DEFAULT_TENANT_FEATURE_FLAGS);
    setFeatureLoading(true);
    setError(null);
    try {
      const flags = await getTenantFeatureFlags(tenant.id);
      setFeatureFlags({ ...DEFAULT_TENANT_FEATURE_FLAGS, ...flags });
    } catch (err: any) {
      setError(err?.message || 'Không thể tải feature flags.');
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleFeatureToggle = (key: keyof TenantFeatureFlags, value: boolean) => {
    setFeatureFlags(prev => ({ ...prev, [key]: value }));
  };

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTenant) return;
    setFeatureSubmitting(true);
    setError(null);
    try {
      await updateTenantFeatureFlags(featureTenant.id, featureFlags);
      closeEditModal();
    } catch (err: any) {
      setError(err?.message || 'Cập nhật feature flags thất bại.');
    } finally {
      setFeatureSubmitting(false);
    }
  };

  const handleResetCounter = (tenant: Tenant) => {
    openConfirmDialog({
      title: 'Reset counter đơn hàng tháng',
      message: `Reset counter đơn hàng tháng cho "${tenant.name}"?`,
      onConfirm: async () => {
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
      },
    });
  };

  // --- Overview tab ---

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setAnalyticsError(null);
    try {
      const [overviewData, topData, growthData] = await Promise.all([
        getSystemOverview(),
        getTopTenants({ limit: 10 }),
        getTenantGrowth({ months: 6 }),
      ]);
      setOverview(overviewData);
      setTopTenants(topData.data);
      setGrowth(growthData);
    } catch (err: any) {
      setAnalyticsError(err?.message || 'Không thể tải dữ liệu tổng quan.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview();
    }
  }, [activeTab, loadOverview]);

  // --- Audit & security tabs ---

  const loadRateLimitLogs = useCallback(async (p: number) => {
    setRateLimitLoading(true);
    setError(null);
    try {
      const res = await getRateLimitLogs({ limit: 50, offset: (p - 1) * 50 });
      setRateLimitLogs(res.data);
      setRateLimitCount(res.count);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải rate limit logs.');
    } finally {
      setRateLimitLoading(false);
    }
  }, []);

  const loadSystemAdmins = useCallback(async () => {
    setSystemAdminsLoading(true);
    setError(null);
    try {
      const list = await getSystemAdmins();
      setSystemAdmins(list);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách system admin.');
    } finally {
      setSystemAdminsLoading(false);
    }
  }, []);

  const loadLoginHistory = useCallback(async (p: number, status: 'success' | 'failed' | '') => {
    setLoginHistoryLoading(true);
    setError(null);
    try {
      const res = await getAdminLoginHistory({
        limit: 50,
        offset: (p - 1) * 50,
        status: status || null,
      });
      setLoginHistory(res.data);
      setLoginHistoryCount(res.count);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải login history.');
    } finally {
      setLoginHistoryLoading(false);
    }
  }, []);

  const loadLoginAlerts = useCallback(async () => {
    setLoginAlertsLoading(true);
    try {
      const list = await getAdminLoginAlerts(24);
      setLoginAlerts(list);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải login alerts.');
    } finally {
      setLoginAlertsLoading(false);
    }
  }, []);

  // --- Operations tab ---

  const loadOperations = useCallback(async () => {
    setRetentionLoading(true);
    setLimitsLoading(true);
    setMaintenanceLoading(true);
    setError(null);
    try {
      const [retention, limits, mode] = await Promise.all([
        getDataRetentionStatus(),
        getDefaultPlanLimits(),
        getMaintenanceMode(),
      ]);
      setRetentionStatus(retention);
      setDefaultLimits(limits);
      setMaintenance(mode);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải cấu hình vận hành.');
    } finally {
      setRetentionLoading(false);
      setLimitsLoading(false);
      setMaintenanceLoading(false);
    }
  }, []);

  const handleSaveDefaultLimits = async (plan: 'free' | 'vip', limits: PlanLimits) => {
    setLimitsSubmitting(true);
    setError(null);
    try {
      await setDefaultPlanLimits(plan, limits);
      setDefaultLimits(prev => (prev ? { ...prev, [plan]: limits } : prev));
    } catch (err: any) {
      setError(err?.message || 'Lưu giới hạn mặc định thất bại.');
    } finally {
      setLimitsSubmitting(false);
    }
  };

  const handleSaveMaintenance = async (enabled: boolean, message: string) => {
    setMaintenanceSubmitting(true);
    setError(null);
    try {
      const mode = await setMaintenanceMode(enabled, message);
      setMaintenance(mode);
    } catch (err: any) {
      setError(err?.message || 'Lưu maintenance mode thất bại.');
    } finally {
      setMaintenanceSubmitting(false);
    }
  };

  const handleCheckSubdomain = async () => {
    const s = form.subdomain.trim().toLowerCase();
    if (!s) {
      setSubdomainCheck({ checking: false, available: false, message: 'Vui lòng nhập subdomain.' });
      return;
    }
    if (!isValidSubdomain(s)) {
      setSubdomainCheck({ checking: false, available: false, message: 'Subdomain phải dài 3–63 ký tự, chỉ gồm chữ thường, số và dấu gạch ngang, không bắt đầu/kết thúc bằng dấu gạch.' });
      return;
    }
    setSubdomainCheck({ checking: true });
    try {
      const res = await checkSubdomain(s);
      setSubdomainCheck({
        checking: false,
        available: res.available,
        message: res.error || (res.available ? 'Subdomain khả dụng.' : 'Subdomain đã được sử dụng.'),
      });
    } catch (err: any) {
      setSubdomainCheck({
        checking: false,
        available: false,
        message: err?.message || 'Không thể kiểm tra subdomain.',
      });
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    setError(null);
    try {
      const list = await getAllTenants();
      const credentialMap = await getTenantCredentials(list.map((t) => t.id));
      const headers = ['ID', 'Tên', 'Subdomain', 'Gói', 'Trạng thái', 'Owner ID', 'Email admin', 'Ngày tạo', 'Ngày cập nhật'];
      const rows = list.map(t => {
        const creds = credentialMap[t.id];
        return [
          t.id,
          t.name,
          t.subdomain,
          t.plan,
          t.status,
          t.ownerId ?? '',
          creds?.adminEmail ?? '',
          t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '',
          t.updatedAt ? new Date(t.updatedAt).toLocaleString('vi-VN') : '',
        ];
      });
      const csv = [headers, ...rows]
        .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenants_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Xuất CSV thất bại.');
    } finally {
      setExportingCsv(false);
    }
  };

  const [addExistingUserId, setAddExistingUserId] = useState('');
  const [addExistingSubmitting, setAddExistingSubmitting] = useState(false);

  // FIX [6.7]: Add UI flow for addSystemAdmin(userId) - thêm system admin từ user đã tồn tại
  const handleAddExistingSystemAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = addExistingUserId.trim();
    if (!userId) {
      setError('Vui lòng nhập User ID.');
      return;
    }
    setAddExistingSubmitting(true);
    setError(null);
    try {
      await addSystemAdmin(userId);
      setAddExistingUserId('');
      await loadSystemAdmins();
      addToast({ type: 'success', message: 'Đã thêm system admin từ user có sẵn.' });
    } catch (err: any) {
      setError(err?.message || 'Thêm system admin thất bại.');
    } finally {
      setAddExistingSubmitting(false);
    }
  };

  const handleAddSystemAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Email không hợp lệ.');
      return;
    }
    
    // Validate password length
    const password = newAdminPassword.trim();
    if (!password || password.length < 6) {
      setError('Password phải có ít nhất 6 ký tự.');
      return;
    }
    
    setSystemAdminSubmitting(true);
    setError(null);
    try {
      await createSystemAdmin(email, password);
      setNewAdminEmail('');
      setNewAdminPassword('');
      await loadSystemAdmins();
    } catch (err: any) {
      setError(err?.message || 'Thêm system admin thất bại.');
    } finally {
      setSystemAdminSubmitting(false);
    }
  };

  const handleRemoveSystemAdmin = (userId: string) => {
    openConfirmDialog({
      title: 'Xóa quyền system admin',
      message: 'Xóa quyền system admin của user này?',
      onConfirm: async () => {
        setError(null);
        try {
          await removeSystemAdmin(userId);
          await loadSystemAdmins();
        } catch (err: any) {
          setError(err?.message || 'Xóa system admin thất bại.');
        }
      },
    });
  };

  useEffect(() => {
    if (activeTab === 'rateLimit') {
      loadRateLimitLogs(rateLimitPage);
    }
  }, [activeTab, rateLimitPage, loadRateLimitLogs]);

  useEffect(() => {
    if (activeTab === 'systemAdmins') {
      loadSystemAdmins();
    }
  }, [activeTab, loadSystemAdmins]);

  useEffect(() => {
    if (activeTab === 'loginHistory') {
      loadLoginHistory(loginHistoryPage, loginHistoryStatus);
      loadLoginAlerts();
    }
  }, [activeTab, loginHistoryPage, loginHistoryStatus, loadLoginHistory, loadLoginAlerts]);

  useEffect(() => {
    if (activeTab === 'operations') {
      loadOperations();
    }
  }, [activeTab, loadOperations]);

  const loadAllTenantsForSelector = useCallback(async () => {
    try {
      const list = await getAllTenants();
      setAllTenants(list);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách cửa hàng.');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAllTenantsForSelector();
    }
  }, [activeTab, loadAllTenantsForSelector]);

  useEffect(() => {
    setMemberTenantPage(1);
  }, [debouncedMemberTenantSearch]);

  useEffect(() => {
    if (activeTab !== 'members') return;
    let cancelled = false;
    setMemberTenantSearchLoading(true);
    setMemberTenantSearchError(null);
    searchTenants({
      searchTerm: debouncedMemberTenantSearch.trim(),
      page: memberTenantPage,
      pageSize: MEMBER_TENANT_PAGE_SIZE,
    })
      .then(async (res) => {
        if (cancelled) return;
        const credentialMap = await getTenantCredentials(res.tenants.map((t) => t.id)).catch(() => ({} as Record<string, TenantCredentials>));
        setMemberTenantOptions(res.tenants.map((t) => ({
          ...t,
          adminEmail: credentialMap[t.id]?.adminEmail,
        })));
        setMemberTenantTotal(res.totalCount);
      })
      .catch(err => {
        if (!cancelled) setMemberTenantSearchError(err?.message || 'Tải danh sách cửa hàng thất bại.');
      })
      .finally(() => {
        if (!cancelled) setMemberTenantSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTab, debouncedMemberTenantSearch, memberTenantPage, memberTenantRefetch]);

  const tenants = result?.tenants ?? [];
  const counts = result?.counts;

  const kpiCards = useMemo(() => [
    { label: 'Tổng cửa hàng', value: overview?.totalTenants ?? 0, icon: Store, color: 'var(--color-primary-500)' },
    { label: 'Hoạt động', value: overview?.activeTenants ?? 0, icon: TrendingUp, color: 'var(--color-success-500)' },
    { label: 'Gói VIP', value: overview?.vipTenants ?? 0, icon: Users, color: 'var(--color-warning-500)' },
    { label: 'Sắp hết hạn', value: overview?.expiringSoon ?? 0, icon: Clock, color: 'var(--color-danger-500)' },
    { label: 'Gần giới hạn', value: overview?.nearLimit ?? 0, icon: AlertTriangle, color: 'var(--color-warning-500)' },
    { label: 'Mới tháng này', value: overview?.newThisMonth ?? 0, icon: ShoppingBag, color: 'var(--color-success-500)' },
  ], [overview]);

  const selectMemberTenant = useCallback((t: Tenant) => {
    setMemberTenantId(t.id);
    setMemberTenantSearchError(null);
  }, []);

  if (loading && !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <>
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

      {/* Tab content — sidebar handles navigation, no horizontal tab bar */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {analyticsError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
                {analyticsError}
              </div>
            )}

            {/* KPI cards */}
            <AdminKpiCards cards={kpiCards} />

            {/* Chart tenant mới */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Tăng trưởng tenant mới</h2>
              {overviewLoading ? (
                <p className="text-gray-600">Đang tải...</p>
              ) : growth.length === 0 ? (
                <p className="text-gray-500">Chưa có dữ liệu tăng trưởng.</p>
              ) : (
                <div className="dashboard-v2__chart dashboard-v2__chart--md">
                  <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                    <BarChart data={growth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc', radius: 8 }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
                      />
                      <Bar name="Tenant mới" dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top tenants */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">Top cửa hàng</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-sm font-medium text-gray-600">Cửa hàng</th>
                        <th className="px-6 py-3 text-sm font-medium text-gray-600">Gói</th>
                        <th className="px-6 py-3 text-sm font-medium text-gray-600">Đơn/tháng</th>
                        <th className="px-6 py-3 text-sm font-medium text-gray-600">User / SP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {overviewLoading ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                      ) : topTenants.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu.</td></tr>
                      ) : topTenants.map((t, idx) => (
                        <tr key={t.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                                <p className="text-xs text-gray-500">{t.subdomain}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{planLabel(t.plan)}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-700">{t.ordersThisMonth.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{t.userCount} / {t.productCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expiring / near limit */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">Sắp hết hạn / gần giới hạn</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-sm font-medium text-gray-600">Cửa hàng</th>
                        <th className="px-6 py-3 text-sm font-medium text-gray-600">Cảnh báo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {overviewLoading ? (
                        <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                      ) : overview && (overview.expiringTenants.length + overview.nearLimitTenants.length) === 0 ? (
                        <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">Không có cảnh báo nào.</td></tr>
                      ) : (
                        <>
                          {(overview?.expiringTenants ?? []).map(t => (
                            <tr key={`exp-${t.id}`}>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-900">{t.name}</p>
                                <p className="text-xs text-gray-500">{t.subdomain}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${t.daysRemaining < 0 ? 'bg-red-100 text-red-700' : t.daysRemaining <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {t.daysRemaining < 0 ? 'Đã hết hạn' : `Còn ${t.daysRemaining} ngày`}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(overview?.nearLimitTenants ?? []).map(t => {
                            const maxPercent = Math.max(t.userPercent, t.productPercent, t.orderPercent);
                            return (
                              <tr key={`limit-${t.id}`}>
                                <td className="px-6 py-4">
                                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                                  <p className="text-xs text-gray-500">{t.subdomain}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${maxPercent >= 90 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {maxPercent >= 90 ? 'Gần hết' : '>80%'} ({maxPercent.toFixed(0)}%)
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="space-y-6">
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
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLANS.map(p => <option key={p} value={p}>{planLabel(p)}</option>)}
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
              <div className="space-y-2 text-sm text-gray-800">
                <p>Link đăng nhập: <a href={getTenantUrl(createResult.tenant.subdomain)} target="_blank" rel="noreferrer" className="text-blue-600 underline">{getTenantUrl(createResult.tenant.subdomain)}</a></p>
                <p>Email admin: <strong>{createResult.adminUser.email}</strong></p>
                {createResult.resetEmailSent ? (
                  <p>
                    Email đặt lại mật khẩu đã được gửi đến <strong>{createResult.adminUser.email}</strong>.
                    Vui lòng kiểm tra hộp thư (kể cả thư rác) để đặt mật khẩu.
                  </p>
                ) : (
                  <p className="text-amber-700">
                    Không thể gửi email đặt lại mật khẩu tự động. Bạn có thể gửi lại hoặc yêu cầu user dùng chức năng "Quên mật khẩu" trên trang đăng nhập.
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await resetMemberPassword(createResult.tenant.id, createResult.adminUser.id);
                      addToast({ type: 'success', message: 'Đã gửi lại email đặt lại mật khẩu' });
                    } catch (err: any) {
                      addToast({ type: 'error', message: err?.message || 'Gửi lại email thất bại' });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >Gửi lại email đặt lại mật khẩu</button>
                <button
                  type="button"
                  onClick={() => handleLoginAs(createResult.tenant)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >Đăng nhập với tư cách admin</button>
                <button
                  type="button"
                  onClick={() => setCreateResult(null)}
                  className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                >Đóng</button>
              </div>
            </div>
          )}
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Danh sách cửa hàng</h2>
              <button
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="px-3 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg disabled:opacity-60"
              >
                {exportingCsv ? 'Đang xuất...' : 'Export CSV'}
              </button>
            </div>
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
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Email admin</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Gói</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Cô lập</th>
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
                        <td className="px-6 py-4 text-sm text-gray-600">{t.adminEmail || '-'}</td>
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
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${t.isolationMode && t.isolationMode !== 'shared' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                            title={t.isolationSchema || t.isolationProjectRef || undefined}
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
                          <TenantRowActions
                            tenant={t}
                            isExpanded={isExpanded}
                            onUsage={() => toggleUsage(t)}
                            onEdit={() => openEdit(t)}
                            onBackup={() => handleBackup(t)}
                            onRestore={() => openRestore(t)}
                            onResetDemo={() => handleResetDemo(t)}
                            onArchive={() => handleArchive(t)}
                            onDelete={() => handleDelete(t)}
                            backingUp={backingUpTenantId === t.id}
                            restoring={restoreSubmitting && restoreTenant?.id === t.id}
                            resetting={resettingTenantId === t.id}
                            deleting={deletingTenantId === t.id}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            {usageLoading && !usage ? (
                              <p className="text-sm text-gray-600">Đang tải usage...</p>
                            ) : usage ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">Gói:</span> {planLabel(usage.plan)} ·
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
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
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
    )}

    {activeTab === 'members' && (
      <div className="space-y-6">
        {/* Tenant list with inline member management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              value={memberTenantSearch}
              onChange={(e) => setMemberTenantSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc subdomain..."
              className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Tên</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Subdomain</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Email admin</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Gói</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {memberTenantSearchLoading && memberTenantOptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : memberTenantSearchError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <p className="text-sm text-red-600">{memberTenantSearchError}</p>
                      <button
                        type="button"
                        onClick={() => setMemberTenantRefetch((n) => n + 1)}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        Thử lại
                      </button>
                    </td>
                  </tr>
                ) : memberTenantOptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Không tìm thấy cửa hàng nào.
                    </td>
                  </tr>
                ) : (
                  memberTenantOptions.map((t) => {
                    const isExpanded = memberTenantId === t.id;
                    return (
                      <React.Fragment key={t.id}>
                        <tr>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (isExpanded) {
                                  setMemberTenantId('');
                                } else {
                                  selectMemberTenant(t);
                                }
                              }}
                              className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                              aria-expanded={isExpanded}
                            >
                              <span className="text-gray-500" aria-hidden="true">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                              {t.name}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{t.subdomain}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{t.adminEmail || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 uppercase">{planLabel(t.plan)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClass(t.status)}`}>
                              {statusLabel(t.status)}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <MemberManagement tenantId={t.id} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={memberTenantPage}
            pageSize={MEMBER_TENANT_PAGE_SIZE}
            total={memberTenantTotal}
            onPageChange={setMemberTenantPage}
          />
        </div>
      </div>
    )}

    {activeTab === 'audit' && (
      <AuditLog systemAdmin tenants={allTenants} />
    )}

    {(activeTab === 'rateLimit' || activeTab === 'security') && (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Rate limit logs</h2>
          {rateLimitLoading && rateLimitLogs.length === 0 ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : rateLimitLogs.length === 0 ? (
            <p className="text-gray-500">Chưa có bản ghi rate limit nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-600">Thời gian</th>
                    <th className="px-6 py-3 font-medium text-gray-600">IP</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Hành động</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Số lần thử</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Window start</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rateLimitLogs.map(log => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 text-gray-700">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-gray-700 font-mono text-xs">{log.ipAddress}</td>
                      <td className="px-6 py-4 text-gray-700">{log.action}</td>
                      <td className="px-6 py-4 text-gray-700">{log.attemptCount}</td>
                      <td className="px-6 py-4 text-gray-700">{new Date(log.windowStart).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={rateLimitPage}
            pageSize={50}
            total={rateLimitCount}
            onPageChange={setRateLimitPage}
          />
        </div>
      </div>
    )}

    {(activeTab === 'systemAdmins' || activeTab === 'security') && (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm system admin</h2>
          
          {/* FIX [6.7]: Thêm system admin từ user đã tồn tại (bằng User ID) */}
          <div className="mb-6 p-4 rounded-lg border border-indigo-100 bg-indigo-50">
            <h3 className="text-sm font-medium text-indigo-800 mb-2">Thêm từ user có sẵn</h3>
            <form onSubmit={handleAddExistingSystemAdmin} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-indigo-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={addExistingUserId}
                  onChange={(e) => setAddExistingUserId(e.target.value)}
                  placeholder="UUID của user đã tồn tại trong hệ thống"
                  className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={addExistingSubmitting || !addExistingUserId.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 text-sm whitespace-nowrap"
              >
                {addExistingSubmitting ? 'Đang thêm...' : 'Thêm bằng User ID'}
              </button>
            </form>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Hoặc tạo mới</h3>
            <form onSubmit={handleAddSystemAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={systemAdminSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {systemAdminSubmitting ? 'Đang thêm...' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Danh sách system admins</h2>
          </div>
          {systemAdminsLoading && systemAdmins.length === 0 ? (
            <p className="p-6 text-gray-600">Đang tải...</p>
          ) : systemAdmins.length === 0 ? (
            <p className="p-6 text-gray-500">Chưa có system admin nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-600">User ID</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Email</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Ngày thêm</th>
                    <th className="px-6 py-3 font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {systemAdmins.map(admin => (
                    <tr key={admin.userId}>
                      <td className="px-6 py-4 text-gray-700 font-mono text-xs">{admin.userId}</td>
                      <td className="px-6 py-4 text-gray-700">{admin.email || '-'}</td>
                      <td className="px-6 py-4 text-gray-700">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemoveSystemAdmin(admin.userId)}
                          className="px-3 py-1.5 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                        >
                          Xóa
                        </button>
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

    {(activeTab === 'loginHistory' || activeTab === 'security') && (
      <div className="space-y-6">
        {/* Alerts panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Cảnh báo bất thường (24 giờ qua)</h2>
          {loginAlertsLoading && loginAlerts.length === 0 ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : loginAlerts.length === 0 ? (
            <p className="text-gray-500">Không phát hiện hoạt động bất thường.</p>
          ) : (
            <div className="space-y-3">
              {loginAlerts.map((alert, idx) => {
                const baseClass = 'p-4 rounded-lg border';
                if (alert.type === 'failed_burst') {
                  return (
                    <div key={idx} className={`${baseClass} border-red-200 bg-red-50`}>
                      <p className="font-medium text-red-800">Nhiều lần đăng nhập thất bại</p>
                      <p className="text-sm text-red-700">
                        {alert.email || alert.userId}: {alert.failedCount} lần thất bại từ IP {alert.ipAddress || '-'}
                        {' '}({new Date(alert.windowStart).toLocaleString('vi-VN')} - {new Date(alert.windowEnd).toLocaleString('vi-VN')})
                      </p>
                    </div>
                  );
                }
                if (alert.type === 'new_device') {
                  return (
                    <div key={idx} className={`${baseClass} border-amber-200 bg-amber-50`}>
                      <p className="font-medium text-amber-800">Thiết bị / trình duyệt mới</p>
                      <p className="text-sm text-amber-700">
                        {alert.email || alert.userId} đăng nhập từ {alert.userAgent || 'thiết bị không xác định'}
                        {' '}lúc {new Date(alert.createdAt).toLocaleString('vi-VN')}
                        {alert.ipAddress ? ` (IP: ${alert.ipAddress})` : ''}
                      </p>
                    </div>
                  );
                }
                return (
                  <div key={idx} className={`${baseClass} border-blue-200 bg-blue-50`}>
                    <p className="font-medium text-blue-800">Đăng nhập liên tục</p>
                    <p className="text-sm text-blue-700">
                      {alert.email || alert.userId}: {alert.successCount} lần thành công trong 15 phút
                      {' '}({new Date(alert.windowStart).toLocaleString('vi-VN')} - {new Date(alert.windowEnd).toLocaleString('vi-VN')})
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Login history table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Lịch sử đăng nhập admin</h2>
            <select
              value={loginHistoryStatus}
              onChange={(e) => { setLoginHistoryStatus(e.target.value as 'success' | 'failed' | ''); setLoginHistoryPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
          {loginHistoryLoading && loginHistory.length === 0 ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : loginHistory.length === 0 ? (
            <p className="text-gray-500">Chưa có bản ghi đăng nhập nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-600">Thời gian</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Email</th>
                    <th className="px-6 py-3 font-medium text-gray-600">IP</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Trình duyệt</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Trạng thái</th>
                    <th className="px-6 py-3 font-medium text-gray-600">Lý do thất bại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loginHistory.map(entry => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 text-gray-700">{new Date(entry.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 text-gray-700">{entry.email || '-'}</td>
                      <td className="px-6 py-4 text-gray-700 font-mono text-xs">{entry.ipAddress || '-'}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={entry.userAgent || undefined}>{entry.userAgent || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${entry.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {entry.status === 'success' ? 'Thành công' : 'Thất bại'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{entry.failureReason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={loginHistoryPage}
            pageSize={50}
            total={loginHistoryCount}
            onPageChange={setLoginHistoryPage}
          />
        </div>
      </div>
    )}

    {(activeTab === 'operations' || activeTab === 'settings') && (
      <div className="space-y-6">
        {/* Data retention */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Trạng thái data retention</h2>
          {retentionLoading && !retentionStatus ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">Đơn hàng đã archive</p>
                <p className="text-2xl font-bold text-gray-900">{retentionStatus?.archivedOrdersCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">Dòng sản phẩm đã archive</p>
                <p className="text-2xl font-bold text-gray-900">{retentionStatus?.archivedOrderItemsCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">Rate limit logs hiện tại</p>
                <p className="text-2xl font-bold text-gray-900">{retentionStatus?.rateLimitLogsCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 md:col-span-3">
                <p className="text-sm text-gray-600">Lịch cron</p>
                <p className="text-base font-medium text-gray-900">
                  {retentionStatus?.cronSchedule ?? '0 3 * * *'} (hàng ngày lúc 03:00)
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Lần chạy gần nhất: {retentionStatus?.lastRun?.run_at ? new Date(retentionStatus.lastRun.run_at).toLocaleString('vi-VN') : 'Chưa có'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Default limits */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Giới hạn mặc định Free / VIP</h2>
          {limitsLoading && !defaultLimits ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['free', 'vip'] as const).map(plan => {
                const limits = defaultLimits?.[plan] ?? { maxUsers: 0, maxProducts: 0, maxOrdersPerMonth: 0 };
                return (
                  <form
                    key={plan}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveDefaultLimits(plan, limits);
                    }}
                    className="space-y-4 p-4 rounded-lg border border-gray-100"
                  >
                    <h3 className="font-medium text-gray-800">{plan === 'free' ? 'Free' : 'VIP'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Max users</label>
                        <input
                          type="number"
                          min={1}
                          value={limits.maxUsers}
                          onChange={(e) => setDefaultLimits(prev => prev ? {
                            ...prev,
                            [plan]: { ...prev[plan], maxUsers: Math.max(1, Number(e.target.value)) },
                          } : prev)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Max SP</label>
                        <input
                          type="number"
                          min={1}
                          value={limits.maxProducts}
                          onChange={(e) => setDefaultLimits(prev => prev ? {
                            ...prev,
                            [plan]: { ...prev[plan], maxProducts: Math.max(1, Number(e.target.value)) },
                          } : prev)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Max đơn/tháng</label>
                        <input
                          type="number"
                          min={1}
                          value={limits.maxOrdersPerMonth}
                          onChange={(e) => setDefaultLimits(prev => prev ? {
                            ...prev,
                            [plan]: { ...prev[plan], maxOrdersPerMonth: Math.max(1, Number(e.target.value)) },
                          } : prev)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={limitsSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                      >
                        {limitsSubmitting ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                  </form>
                );
              })}
            </div>
          )}
        </div>

        {/* Maintenance mode */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Maintenance mode</h2>
          {maintenanceLoading ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveMaintenance(maintenance.enabled, maintenance.message);
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <input
                  id="maintenance-toggle"
                  type="checkbox"
                  checked={maintenance.enabled}
                  onChange={(e) => setMaintenance(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="maintenance-toggle" className="text-gray-700">
                  Bật maintenance mode
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Thông báo</label>
                <textarea
                  value={maintenance.message}
                  onChange={(e) => setMaintenance(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Hệ thống đang bảo trì. Vui lòng quay lại sau."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={maintenanceSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {maintenanceSubmitting ? 'Đang lưu...' : 'Lưu maintenance'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}

    {activeTab === 'billing' && <BillingConfig />}

    {activeTab === 'vouchers' && <VoucherManager />}

    {activeTab === 'tickets' && <TicketInbox />}

    {activeTab === 'emails' && <EmailTemplateManager />}

    {activeTab === 'notifications' && <NotificationManager />}

    {activeTab === 'health' && <SystemHealthPanel />}

    {activeTab === 'errors' && <ErrorPerformancePanel />}

    {activeTab === 'storage' && <StorageBackupPanel />}

    {activeTab === 'bulkMaintenance' && <BulkMaintenancePanel />}

    {activeTab === 'apiKeys' && <ApiKeyManager />}

    {activeTab === 'webhooks' && <WebhookManager />}

    {activeTab === 'integrations' && <IntegrationMarketplace />}

    {activeTab === 'twoFactor' && <TwoFactorManager />}

    {activeTab === 'compliance' && <ComplianceManager />}

    {activeTab === 'whiteLabel' && <WhiteLabelManager />}

    {activeTab === 'readReplicaQueue' && <ReadReplicaQueueManager />}

      {/* Edit / Subscription / Feature flags tabbed modal */}
      {(editTenant || subTenant || featureTenant) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.currentTarget === e.target && !editSubmitting && !subSubmitting && !featureSubmitting) closeEditModal();
          }}
        >
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sửa cửa hàng — {(editTenant || subTenant || featureTenant)!.name}
            </h3>
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => openEdit((editTenant || subTenant || featureTenant)!)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${editModalTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
              >
                Thông tin
              </button>
              <button
                type="button"
                onClick={() => openSubscriptionEdit((editTenant || subTenant || featureTenant)!)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${editModalTab === 'subscription' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
              >
                Gói
              </button>
              <button
                type="button"
                onClick={() => openFeatureFlags((editTenant || subTenant || featureTenant)!)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${editModalTab === 'features' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
              >
                Tính năng
              </button>
            </div>
            {editModalTab === 'info' && editTenant && (
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
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chế độ cô lập</label>
                <select
                  value={editForm.isolationMode}
                  onChange={(e) => setEditForm({ ...editForm, isolationMode: e.target.value as TenantIsolationMode })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ISOLATION_MODES.map(m => <option key={m} value={m}>{isolationLabel(m)}</option>)}
                </select>
                {editForm.plan !== 'vip' && editForm.isolationMode !== 'shared' && (
                  <p className="text-xs text-amber-600 mt-1">Cần chuyển sang gói VIP để áp dụng cô lập.</p>
                )}
              </div>
              {editForm.isolationMode === 'schema' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên schema</label>
                  <input
                    type="text"
                    value={editForm.isolationSchema}
                    onChange={(e) => setEditForm({ ...editForm, isolationSchema: e.target.value })}
                    placeholder="tenant_abc_schema"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              {editForm.isolationMode === 'project' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project ref</label>
                  <input
                    type="text"
                    value={editForm.isolationProjectRef}
                    onChange={(e) => setEditForm({ ...editForm, isolationProjectRef: e.target.value })}
                    placeholder="abcdefgh12345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
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
          )}
          {editModalTab === 'subscription' && subTenant && (
            <form onSubmit={handleSubscriptionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gói</label>
                <select
                  value={subForm.plan}
                  onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
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
              {(() => {
                const proration = subTenant ? calculateProration(subTenant.plan, subForm.plan, subForm.expiresAt) : null;
                return proration ? (
                  <div className="p-4 rounded-lg border border-indigo-100 bg-indigo-50 space-y-1 text-sm">
                    <p className="font-medium text-indigo-900">Review proration</p>
                    <p className="text-indigo-800">Số ngày còn lại của chu kỳ hiện tại: <span className="font-medium">{proration.remainingDays} ngày</span></p>
                    <p className="text-indigo-800">Tín dụng từ gói cũ: <span className="font-medium">{proration.credit.toLocaleString('vi-VN')}đ</span></p>
                    <p className="text-indigo-800">Phí gói mới tính prorated: <span className="font-medium">{proration.charge.toLocaleString('vi-VN')}đ</span></p>
                    <p className="text-indigo-800">
                      {proration.isRefund
                        ? <>Số tiền <span className="font-medium">hoãn</span> (credit): {Math.abs(proration.net).toLocaleString('vi-VN')}đ</>
                        : <>Số tiền cần thu thêm: <span className="font-medium">{proration.net.toLocaleString('vi-VN')}đ</span></>}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">
                      ponytail: tính toán proration theo số ngày thực tế của tháng hiện tại, chỉ để admin review trước khi lưu. Không tự động tạo hóa đơn/tính tiền.
                    </p>
                  </div>
                ) : null;
              })()}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
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
          )}
          {editModalTab === 'features' && featureTenant && (
            <>
              {featureLoading ? (
                <p className="text-gray-600">Đang tải...</p>
              ) : (
                <form onSubmit={handleFeatureSubmit} className="space-y-3">
                {TENANT_FEATURE_FLAG_LIST.map(f => (
                  <label
                    key={f.key}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!featureFlags[f.key]}
                      onChange={(e) => handleFeatureToggle(f.key, e.target.checked)}
                      disabled={featureSubmitting}
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{f.label}</p>
                      <p className="text-xs text-gray-500">{f.description}</p>
                    </div>
                  </label>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={featureSubmitting}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-60"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={featureSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    {featureSubmitting ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )}
      {confirmDialog}
    </>
  );
}

// Action column for a tenant row: usage, edit, and grouped dropdown.
// ponytail: inline component because it is only used in this page; keeps the diff local.
interface TenantRowActionsProps {
  tenant: Tenant;
  isExpanded: boolean;
  onUsage: () => void;
  onEdit: () => void;
  onBackup: () => void;
  onRestore: () => void;
  onResetDemo: () => void;
  onArchive: () => void;
  onDelete: () => void;
  backingUp: boolean;
  restoring: boolean;
  resetting: boolean;
  deleting: boolean;
}

function TenantRowActions({
  tenant,
  isExpanded,
  onUsage,
  onEdit,
  onBackup,
  onRestore,
  onResetDemo,
  onArchive,
  onDelete,
  backingUp,
  restoring,
  resetting,
  deleting,
}: TenantRowActionsProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPos();
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleScrollResize = () => updateMenuPos();
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [open, updateMenuPos]);

  const isArchived = tenant.status === 'archived';

  const menu = (
    <div
      ref={menuRef}
      className="fixed w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-[100] origin-top-right"
      style={{ top: menuPos.top, right: menuPos.right }}
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <Database size={12} />
        Quản lý dữ liệu
      </div>
      <button
        type="button"
        onClick={() => { setOpen(false); onBackup(); }}
        disabled={backingUp}
        className="w-full text-left px-3 py-2 min-h-[44px] text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
      >
        <Download size={14} className="text-cyan-600" />
        {backingUp ? 'Đang backup...' : 'Backup'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); onRestore(); }}
        disabled={restoring}
        className="w-full text-left px-3 py-2 min-h-[44px] text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
      >
        <Upload size={14} className="text-indigo-600" />
        Restore
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); onResetDemo(); }}
        disabled={resetting}
        className="w-full text-left px-3 py-2 min-h-[44px] text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
      >
        <RotateCcw size={14} className="text-amber-600" />
        {resetting ? 'Đang reset...' : 'Reset demo'}
      </button>
      <div className="my-1 border-t border-gray-100" />
      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <Archive size={12} />
        Vòng đời
      </div>
      <button
        type="button"
        onClick={() => { setOpen(false); onArchive(); }}
        className="w-full text-left px-3 py-2 min-h-[44px] text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <Archive size={14} className={isArchived ? 'text-green-600' : 'text-gray-500'} />
        {isArchived ? 'Khôi phục' : 'Lưu trữ'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); onDelete(); }}
        disabled={deleting}
        className="w-full text-left px-3 py-2 min-h-[44px] text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
      >
        <Trash2 size={14} />
        {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
      </button>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onUsage}
        aria-label={isExpanded ? 'Ẩn usage' : 'Xem usage'}
        title={isExpanded ? 'Ẩn usage' : 'Xem usage'}
        className="w-11 h-11 flex items-center justify-center text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <Activity size={18} />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Sửa cửa hàng"
        title="Sửa cửa hàng"
        className="w-11 h-11 flex items-center justify-center text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Pencil size={18} />
      </button>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(prev => !prev)}
          aria-label="Thêm thao tác"
          title="Thêm thao tác"
          className="w-11 h-11 flex items-center justify-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <MoreHorizontal size={18} />
        </button>
        {open && createPortal(menu, document.body)}
      </div>
    </div>
  );
}
