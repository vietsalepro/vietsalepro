import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Store, Users, ShoppingBag, AlertTriangle, Clock, TrendingUp,
} from 'lucide-react';
import AdminKpiCards from '../../components/AdminKpiCards';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import VoucherManager from '../../components/VoucherManager';
import TicketInbox from '../../components/TicketInbox';
import EmailTemplateManager from '../../components/EmailTemplateManager';
import NotificationManager from '../../components/NotificationManager';
import TwoFactorManager from '../../components/TwoFactorManager';
import ComplianceManager from '../../components/ComplianceManager';
import ReadReplicaQueueManager from '../../components/ReadReplicaQueueManager';
import '../Dashboard.css';
import {
  SystemOverview,
  TopTenant,
  TenantGrowthPoint,
  PlanLimits,
  DefaultPlanLimits,
  MaintenanceMode,
  DataRetentionStatus,
} from '../../types/tenant';
import {
  getTopTenants,
  getTenantGrowth,
} from '../../services/admin/tenantAdminService';
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
  getDataRetentionStatus,
  getDefaultPlanLimits,
  setDefaultPlanLimits,
  getMaintenanceMode,
  setMaintenanceMode,
} from '../../services/admin/systemAdminService';

import { planLabel } from './adminUtils';

// ponytail: lazy-load heavy admin panels so the AdminDashboardInner chunk stays ≤ 200 kB;
// each panel is only fetched when its tab is activated.
const LazySystemHealthPanel = React.lazy(() => import('../../components/SystemHealthPanel'));
const LazyErrorPerformancePanel = React.lazy(() => import('../../components/ErrorPerformancePanel'));
const LazyStorageBackupPanel = React.lazy(() => import('../../components/StorageBackupPanel'));
const LazyBulkMaintenancePanel = React.lazy(() => import('../../components/BulkMaintenancePanel'));
const LazyApiKeyManager = React.lazy(() => import('../../components/ApiKeyManager'));
const LazyWebhookManager = React.lazy(() => import('../../components/WebhookManager'));
const LazyIntegrationMarketplace = React.lazy(() => import('../../components/IntegrationMarketplace'));
const LazyWhiteLabelManager = React.lazy(() => import('../../components/WhiteLabelManager'));

function PanelLoader() {
  return (
    <div className="p-8 text-center text-gray-600">
      <div className="mx-auto mb-3 w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      Đang tải panel...
    </div>
  );
}

function LazyPanel({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PanelLoader />}>{children}</Suspense>;
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

export type AdminTab = 'overview' | 'rateLimit' | 'systemAdmins' | 'loginHistory' | 'operations' | 'vouchers' | 'tickets' | 'emails' | 'notifications' | 'health' | 'errors' | 'storage' | 'bulkMaintenance' | 'apiKeys' | 'webhooks' | 'integrations' | 'twoFactor' | 'compliance' | 'whiteLabel' | 'readReplicaQueue' | 'security' | 'settings';

export interface AdminDashboardInnerProps {
  activeTab: AdminTab;
}

export default function AdminDashboardInner({ activeTab }: AdminDashboardInnerProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();


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
      setSuccess('Đã thêm system admin từ user có sẵn.');
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


  const kpiCards = useMemo(() => [
    { label: 'Tổng cửa hàng', value: overview?.totalTenants ?? 0, icon: Store, color: 'var(--color-primary-500)' },
    { label: 'Hoạt động', value: overview?.activeTenants ?? 0, icon: TrendingUp, color: 'var(--color-success-500)' },
    { label: 'Gói VIP', value: overview?.vipTenants ?? 0, icon: Users, color: 'var(--color-warning-500)' },
    { label: 'Sắp hết hạn', value: overview?.expiringSoon ?? 0, icon: Clock, color: 'var(--color-danger-500)' },
    { label: 'Gần giới hạn', value: overview?.nearLimit ?? 0, icon: AlertTriangle, color: 'var(--color-warning-500)' },
    { label: 'Mới tháng này', value: overview?.newThisMonth ?? 0, icon: ShoppingBag, color: 'var(--color-success-500)' },
  ], [overview]);


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
                  <ResponsiveContainer width="100%" height="100%" minHeight={256} minWidth={0}>
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
                          <td className="px-6 py-4 text-sm text-gray-700">{(t.ordersThisMonth ?? 0).toLocaleString()}</td>
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


    {activeTab === 'vouchers' && <VoucherManager />}

    {activeTab === 'tickets' && <TicketInbox />}

    {activeTab === 'emails' && <EmailTemplateManager />}

    {activeTab === 'notifications' && <NotificationManager />}

    {activeTab === 'health' && <LazyPanel><LazySystemHealthPanel /></LazyPanel>}

    {activeTab === 'errors' && <LazyPanel><LazyErrorPerformancePanel /></LazyPanel>}

    {activeTab === 'storage' && <LazyPanel><LazyStorageBackupPanel /></LazyPanel>}

    {activeTab === 'bulkMaintenance' && <LazyPanel><LazyBulkMaintenancePanel /></LazyPanel>}

    {activeTab === 'apiKeys' && <LazyPanel><LazyApiKeyManager /></LazyPanel>}

    {activeTab === 'webhooks' && <LazyPanel><LazyWebhookManager /></LazyPanel>}

    {activeTab === 'integrations' && <LazyPanel><LazyIntegrationMarketplace /></LazyPanel>}

    {activeTab === 'twoFactor' && <TwoFactorManager />}

    {activeTab === 'compliance' && <ComplianceManager />}

    {activeTab === 'whiteLabel' && <LazyPanel><LazyWhiteLabelManager /></LazyPanel>}

    {activeTab === 'readReplicaQueue' && <ReadReplicaQueueManager />}

      {confirmDialog}
    </>
  );
}
