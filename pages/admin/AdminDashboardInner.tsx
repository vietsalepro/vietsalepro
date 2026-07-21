import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Store, Users, ShoppingBag, AlertTriangle, Clock, TrendingUp,
} from 'lucide-react';
import AdminKpiCards from '../../components/AdminKpiCards';
import ComplianceManager from '../../components/ComplianceManager';
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
  getSystemOverview,
  getDataRetentionStatus,
  getDefaultPlanLimits,
  setDefaultPlanLimits,
  getMaintenanceMode,
  setMaintenanceMode,
} from '../../services/admin/systemAdminService';

import { planLabel } from './adminUtils';

const LazySystemHealthPanel = React.lazy(() => import('../../components/SystemHealthPanel'));

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

export type AdminTab = 'overview' | 'settings' | 'compliance' | 'health';

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

  const [retentionStatus, setRetentionStatus] = useState<DataRetentionStatus | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [defaultLimits, setDefaultLimits] = useState<DefaultPlanLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [limitsSubmitting, setLimitsSubmitting] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceMode>({ enabled: false, message: '' });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);


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

  // --- Settings tab ---

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

  useEffect(() => {
    if (activeTab === 'settings') {
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
                <div className="w-full h-64">
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
                            const maxPercent = Math.max(t.userPercent ?? 0, t.productPercent ?? 0, t.orderPercent ?? 0);
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

    {activeTab === 'settings' && (
      <div className="space-y-6">
        {/* Data retention */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Trạng thái data retention</h2>
          {retentionLoading && !retentionStatus ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{(retentionStatus as any)?.ordersCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">Order items</p>
                <p className="text-2xl font-bold text-gray-900">{(retentionStatus as any)?.orderItemsCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">Audit logs</p>
                <p className="text-2xl font-bold text-gray-900">{(retentionStatus as any)?.auditLogsCount ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600">Rate-limit logs</p>
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

    {activeTab === 'compliance' && <ComplianceManager />}

    {activeTab === 'health' && <LazyPanel><LazySystemHealthPanel /></LazyPanel>}
    </>
  );
}
