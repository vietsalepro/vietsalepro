import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Store, Users, Package, ShoppingBag, AlertTriangle, Clock, TrendingUp, CreditCard,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { getTenantUrl } from '../lib/tenant';
import { DashboardV2KPI } from './Dashboard';
import { AuditLog } from './AuditLog';
import BillingConfig from '../components/BillingConfig';
import VoucherManager from '../components/VoucherManager';
import TicketInbox from '../components/TicketInbox';
import EmailTemplateManager from '../components/EmailTemplateManager';
import NotificationManager from '../components/NotificationManager';
import SystemHealthPanel from '../components/SystemHealthPanel';
import ErrorPerformancePanel from '../components/ErrorPerformancePanel';
import StorageBackupPanel from '../components/StorageBackupPanel';
import BulkMaintenancePanel from '../components/BulkMaintenancePanel';
import './Dashboard.css';
import {
  Tenant,
  TenantPlan,
  TenantStatus,
  TenantRole,
  MemberWithEmail,
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
  getAllTenants,
  getTenantMembersWithEmail,
  inviteMemberByEmail,
  updateMemberRole,
  removeMember,
  resetMemberPassword,
  getSystemOverview,
  getTopTenants,
  getTenantGrowth,
  getTenantFeatureFlags,
  updateTenantFeatureFlags,
  startImpersonation,
} from '../services/tenantService';
import {
  RateLimitLog,
  SystemAdmin,
  getRateLimitLogs,
  getSystemAdmins,
  addSystemAdmin,
  removeSystemAdmin,
} from '../services/systemAdminService';
import {
  getDataRetentionStatus,
  getDefaultPlanLimits,
  setDefaultPlanLimits,
  getMaintenanceMode,
  setMaintenanceMode,
  checkSubdomain,
} from '../services/operationsService';

const PLANS: TenantPlan[] = ['free', 'vip'];
const STATUSES: TenantStatus[] = ['active', 'suspended', 'trial', 'pending', 'archived', 'read_only'];

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

const planLabel = (plan: TenantPlan) => plan === 'free' ? 'Free' : 'VIP';
const MONTHLY_PRICE_VIP = 69000;

export const calculateProration = (
  currentPlan: TenantPlan,
  newPlan: TenantPlan,
  expiresAt?: string | null
) => {
  if (currentPlan === newPlan) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = expiresAt ? new Date(expiresAt) : null;
  if (!end || end.getTime() <= today.getTime()) return null;
  const remainingDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  const currentMonthly = currentPlan === 'vip' ? MONTHLY_PRICE_VIP : 0;
  const newMonthly = newPlan === 'vip' ? MONTHLY_PRICE_VIP : 0;
  const credit = Math.round((currentMonthly * remainingDays) / 30);
  const charge = Math.round((newMonthly * remainingDays) / 30);
  const net = charge - credit;
  return {
    remainingDays,
    credit,
    charge,
    net,
    isRefund: net < 0,
  };
};

const ROLES: TenantRole[] = ['admin', 'cashier', 'inventory_manager', 'accountant'];

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

const roleLabel = (role: TenantRole) => {
  switch (role) {
    case 'admin': return 'Admin';
    case 'cashier': return 'Thu ngân';
    case 'inventory_manager': return 'Quản kho';
    case 'accountant': return 'Kế toán';
    default: return role;
  }
};

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

  const [featureTenant, setFeatureTenant] = useState<Tenant | null>(null);
  const [featureFlags, setFeatureFlags] = useState<TenantFeatureFlags>(DEFAULT_TENANT_FEATURE_FLAGS);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureSubmitting, setFeatureSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'members' | 'audit' | 'rateLimit' | 'systemAdmins' | 'operations' | 'billing' | 'vouchers' | 'tickets' | 'emails' | 'notifications' | 'health' | 'errors' | 'storage' | 'bulkMaintenance'>('overview');
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [memberTenantId, setMemberTenantId] = useState<string>('');
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TenantRole>('cashier');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [memberAction, setMemberAction] = useState<{ userId: string; action: string } | null>(null);

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
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [systemAdminSubmitting, setSystemAdminSubmitting] = useState(false);

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

  const handleLoginAs = async (tenant: Tenant) => {
    if (!window.confirm(`Đăng nhập với tư cách admin của cửa hàng "${tenant.name}"?\n\nBạn sẽ rời khỏi trang admin dashboard.`)) return;
    setImpersonatingTenantId(tenant.id);
    setError(null);
    try {
      const res = await startImpersonation(tenant.id);
      window.location.href = getTenantUrl(res.tenant.subdomain);
    } catch (err: any) {
      setImpersonatingTenantId(null);
      setError(err?.message || 'Impersonate thất bại.');
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

  const openFeatureFlags = async (tenant: Tenant) => {
    setFeatureTenant(tenant);
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

  const closeFeatureFlags = () => {
    setFeatureTenant(null);
    setFeatureSubmitting(false);
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
      closeFeatureFlags();
    } catch (err: any) {
      setError(err?.message || 'Cập nhật feature flags thất bại.');
    } finally {
      setFeatureSubmitting(false);
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

  // --- Overview tab ---

  const loadOverview = async () => {
    setOverviewLoading(true);
    setAnalyticsError(null);
    try {
      const [overviewData, topData, growthData] = await Promise.all([
        getSystemOverview(),
        getTopTenants(10),
        getTenantGrowth(6),
      ]);
      setOverview(overviewData);
      setTopTenants(topData);
      setGrowth(growthData);
    } catch (err: any) {
      setAnalyticsError(err?.message || 'Không thể tải dữ liệu tổng quan.');
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview();
    }
    // ponytail: eslint exhaustive-deps không được bật trong tsc-only lint; deps giữ ở mức tối thiểu.
  }, [activeTab]);

  // --- Audit & security tabs ---

  const loadRateLimitLogs = async (p: number) => {
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
  };

  const loadSystemAdmins = async () => {
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
  };

  // --- Operations tab ---

  const loadOperations = async () => {
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
  };

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
    const s = form.subdomain.trim();
    if (!s) {
      setSubdomainCheck({ checking: false, available: false, message: 'Vui lòng nhập subdomain.' });
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
      const headers = ['ID', 'Tên', 'Subdomain', 'Gói', 'Trạng thái', 'Owner ID', 'Ngày tạo', 'Ngày cập nhật'];
      const rows = list.map(t => [
        t.id,
        t.name,
        t.subdomain,
        t.plan,
        t.status,
        t.ownerId ?? '',
        t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '',
        t.updatedAt ? new Date(t.updatedAt).toLocaleString('vi-VN') : '',
      ]);
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

  const handleAddSystemAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUserId.trim()) return;
    setSystemAdminSubmitting(true);
    setError(null);
    try {
      await addSystemAdmin(newAdminUserId.trim());
      setNewAdminUserId('');
      await loadSystemAdmins();
    } catch (err: any) {
      setError(err?.message || 'Thêm system admin thất bại.');
    } finally {
      setSystemAdminSubmitting(false);
    }
  };

  const handleRemoveSystemAdmin = async (userId: string) => {
    if (!window.confirm('Xóa quyền system admin của user này?')) return;
    setError(null);
    try {
      await removeSystemAdmin(userId);
      await loadSystemAdmins();
    } catch (err: any) {
      setError(err?.message || 'Xóa system admin thất bại.');
    }
  };

  useEffect(() => {
    if (activeTab === 'rateLimit') {
      loadRateLimitLogs(rateLimitPage);
    }
  }, [activeTab, rateLimitPage]);

  useEffect(() => {
    if (activeTab === 'systemAdmins') {
      loadSystemAdmins();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'operations') {
      loadOperations();
    }
  }, [activeTab]);

  // --- Members tab ---

  const loadAllTenantsForSelector = async () => {
    try {
      const list = await getAllTenants();
      setAllTenants(list);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách cửa hàng.');
    }
  };

  const loadMembers = async (tenantId: string) => {
    if (!tenantId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    setError(null);
    try {
      const list = await getTenantMembersWithEmail(tenantId);
      setMembers(list);
    } catch (err: any) {
      setMembers([]);
      setError(err?.message || 'Không thể tải danh sách thành viên.');
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'members') {
      loadAllTenantsForSelector();
    }
  }, [activeTab]);

  useEffect(() => {
    loadMembers(memberTenantId);
  }, [memberTenantId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberTenantId) {
      setError('Vui lòng chọn cửa hàng trước khi mời.');
      return;
    }
    setInviteSubmitting(true);
    setError(null);
    try {
      await inviteMemberByEmail(memberTenantId, inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail('');
      await loadMembers(memberTenantId);
    } catch (err: any) {
      setError(err?.message || 'Mời thành viên thất bại.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: TenantRole) => {
    if (!memberTenantId) return;
    setMemberAction({ userId, action: 'role' });
    setError(null);
    try {
      await updateMemberRole(memberTenantId, userId, role);
      await loadMembers(memberTenantId);
    } catch (err: any) {
      setError(err?.message || 'Đổi vai trò thất bại.');
    } finally {
      setMemberAction(null);
    }
  };

  const handleRemoveMember = async (userId: string, email?: string) => {
    if (!memberTenantId) return;
    if (!window.confirm(`Xóa thành viên "${email || userId}" khỏi cửa hàng?`)) return;
    setMemberAction({ userId, action: 'remove' });
    setError(null);
    try {
      await removeMember(memberTenantId, userId);
      await loadMembers(memberTenantId);
    } catch (err: any) {
      setError(err?.message || 'Xóa thành viên thất bại.');
    } finally {
      setMemberAction(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!memberTenantId) return;
    setMemberAction({ userId, action: 'reset' });
    setError(null);
    try {
      const res = await resetMemberPassword(memberTenantId, userId);
      alert(res?.link ? `Link ${res.action}: ${res.link}` : `Đã gửi yêu cầu ${res?.action || 'reset'}.`);
    } catch (err: any) {
      setError(err?.message || 'Reset mật khẩu thất bại.');
    } finally {
      setMemberAction(null);
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

        {/* Tabs */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'tenants' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Cửa hàng
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'members' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Thành viên
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Audit log
          </button>
          <button
            onClick={() => setActiveTab('rateLimit')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'rateLimit' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Rate limit
          </button>
          <button
            onClick={() => setActiveTab('systemAdmins')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'systemAdmins' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            System admins
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'operations' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Vận hành
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'billing' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Thanh toán
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'vouchers' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Voucher
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'tickets' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Support tickets
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'emails' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Email templates
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Thông báo
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'health' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Health
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'errors' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Lỗi & Hiệu năng
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'storage' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Lưu trữ
          </button>
          <button
            onClick={() => setActiveTab('bulkMaintenance')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'bulkMaintenance' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Bulk & Bảo trì
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {analyticsError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
                {analyticsError}
              </div>
            )}

            {/* KPI cards */}
            <div className="dashboard-v2__grid">
              <DashboardV2KPI
                title="Tổng cửa hàng"
                value={overview?.totalTenants ?? 0}
                icon={<Store className="w-6 h-6" />}
                variant="primary"
              />
              <DashboardV2KPI
                title="Hoạt động"
                value={overview?.activeTenants ?? 0}
                icon={<TrendingUp className="w-6 h-6" />}
                variant="success"
              />
              <DashboardV2KPI
                title="Gói VIP"
                value={overview?.vipTenants ?? 0}
                icon={<Users className="w-6 h-6" />}
                variant="warning"
              />
              <DashboardV2KPI
                title="Sắp hết hạn"
                value={overview?.expiringSoon ?? 0}
                icon={<Clock className="w-6 h-6" />}
                variant="warning"
              />
              <DashboardV2KPI
                title="Gần giới hạn"
                value={overview?.nearLimit ?? 0}
                icon={<AlertTriangle className="w-6 h-6" />}
                variant="warning"
              />
              <DashboardV2KPI
                title="Mới tháng này"
                value={overview?.newThisMonth ?? 0}
                icon={<ShoppingBag className="w-6 h-6" />}
                variant="success"
              />
            </div>

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
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                              onClick={() => handleLoginAs(t)}
                              disabled={impersonatingTenantId === t.id || t.status !== 'active'}
                              title={t.status !== 'active' ? 'Chỉ impersonate tenant đang hoạt động' : 'Đăng nhập với tư cách admin tenant'}
                              className="px-3 py-1.5 text-sm text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {impersonatingTenantId === t.id ? 'Đang xử lý...' : 'Login as'}
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
                            <button
                              onClick={() => openFeatureFlags(t)}
                              className="px-3 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg"
                            >
                              Tính năng
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
    )}

    {activeTab === 'members' && (
      <div className="space-y-6">
        {/* Tenant selector */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chọn cửa hàng</label>
          <select
            value={memberTenantId}
            onChange={(e) => setMemberTenantId(e.target.value)}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn cửa hàng --</option>
            {allTenants.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
            ))}
          </select>
        </div>

        {/* Invite form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Mời thành viên</h2>
          <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TenantRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
            </div>
            <div>
              <button
                type="submit"
                disabled={inviteSubmitting || !memberTenantId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {inviteSubmitting ? 'Đang mời...' : 'Mời'}
              </button>
            </div>
          </form>
        </div>

        {/* Members table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Danh sách thành viên</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Vai trò</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Mời bởi</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Ngày tạo</th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {membersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {memberTenantId ? 'Không có thành viên nào.' : 'Vui lòng chọn cửa hàng.'}
                    </td>
                  </tr>
                ) : members.map(m => {
                  const isBusy = memberAction?.userId === m.userId;
                  return (
                    <tr key={m.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{m.email || m.userId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value as TenantRole)}
                          disabled={isBusy}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{m.invitedByEmail || m.invitedBy || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResetPassword(m.userId)}
                            disabled={isBusy}
                            className="px-3 py-1.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg disabled:opacity-60"
                          >
                            Reset MK
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m.userId, m.email)}
                            disabled={isBusy}
                            className="px-3 py-1.5 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-60"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    {activeTab === 'audit' && (
      <AuditLog systemAdmin tenants={allTenants} />
    )}

    {activeTab === 'rateLimit' && (
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

    {activeTab === 'systemAdmins' && (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Thêm system admin</h2>
          <form onSubmit={handleAddSystemAdmin} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={newAdminUserId}
                onChange={(e) => setNewAdminUserId(e.target.value)}
                placeholder="UUID của user"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={systemAdminSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {systemAdminSubmitting ? 'Đang thêm...' : 'Thêm'}
            </button>
          </form>
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

    {activeTab === 'operations' && (
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
                      ponytail: tính toán thủ công 30 ngày/tháng, chỉ để admin review trước khi lưu. Không tự động tạo hóa đơn/tính tiền.
                    </p>
                  </div>
                ) : null;
              })()}
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

      {/* Feature flags modal */}
      {featureTenant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.currentTarget === e.target && !featureSubmitting) closeFeatureFlags();
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Feature flags — {featureTenant.name}
            </h3>
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
                    onClick={closeFeatureFlags}
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
          </div>
        </div>
      )}

    </div>
  );
}
