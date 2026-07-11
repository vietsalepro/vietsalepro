import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, CreditCard, RefreshCw, XCircle } from 'lucide-react';
import { TenantSubscription } from '../types/tenant';
import { Tenant } from '../types/tenant';
import {
  getTenantSubscription,
  upgradeDowngradeSubscription,
  cancelSubscription,
  renewSubscription,
} from '../services/admin/billingAdminService';
import { getTenantsAdmin } from '../services/tenantService';
import { getPlans } from '../services/planService';
import { Plan } from '../types/tenant';
import { useToast } from './ToastContainer';

const statusLabel: Record<string, string> = {
  trialing: 'Dùng thử',
  active: 'Đang hoạt động',
  past_due: 'Quá hạn',
  suspended: 'Tạm ngưng',
  cancelled: 'Đã hủy',
};

const statusBadgeClass: Record<string, string> = {
  trialing: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';

export default function SubscriptionManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getTenantsAdmin({ limit: 100 }),
      getPlans(),
    ])
      .then(([tenantsResult, plansList]) => {
        if (cancelled) return;
        setTenants(tenantsResult.items);
        setPlans(plansList);
        if (tenantsResult.items[0]) {
          setSelectedTenantId(tenantsResult.items[0].id);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;
    let cancelled = false;
    setLoading(true);
    getTenantSubscription(selectedTenantId)
      .then((sub) => {
        if (!cancelled) {
          setSubscription(sub);
          if (sub) {
            setSelectedPlan(sub.plan);
            setSelectedPeriod(sub.billingPeriod ?? 'month');
          }
        }
      })
      .catch(() => { if (!cancelled) setSubscription(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTenantId]);

  const activePlan = useMemo(
    () => plans.find(p => p.key === subscription?.plan),
    [plans, subscription]
  );

  const handleUpgradeDowngrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || !selectedPlan) return;
    setActionLoading(true);
    try {
      const updated = await upgradeDowngradeSubscription(selectedTenantId, selectedPlan, selectedPeriod);
      setSubscription(updated);
      addToast({ type: 'success', message: 'Đã cập nhật gói đăng ký.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Cập nhật gói thất bại.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedTenantId) return;
    setActionLoading(true);
    try {
      const updated = await cancelSubscription(selectedTenantId);
      setSubscription(updated);
      addToast({ type: 'success', message: 'Đã hủy đăng ký.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Hủy đăng ký thất bại.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!selectedTenantId) return;
    setActionLoading(true);
    try {
      const updated = await renewSubscription(selectedTenantId);
      setSubscription(updated);
      addToast({ type: 'success', message: 'Đã gia hạn đăng ký.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Gia hạn đăng ký thất bại.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Quản lý đăng ký (Subscription)</h2>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Tenant</label>
        <select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Chọn tenant</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : !subscription ? (
        <p className="text-gray-500">Không tìm thấy đăng ký cho tenant này.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Gói hiện tại</span>
                <span className="font-medium text-gray-900">{activePlan?.name || subscription.plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trạng thái</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusBadgeClass[subscription.status ?? 'active']}`}>
                  {statusLabel[subscription.status ?? 'active']}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chu kỳ</span>
                <span className="font-medium text-gray-900">
                  {subscription.billingPeriod === 'year' ? 'Năm' : 'Tháng'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Hết hạn</span>
                <span className="font-medium text-gray-900">{formatDate(subscription.expiresAt)}</span>
              </div>
              {(subscription.billingPeriodStart || subscription.billingPeriodEnd) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {formatDate(subscription.billingPeriodStart)} - {formatDate(subscription.billingPeriodEnd)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {subscription.status !== 'cancelled' && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Hủy đăng ký
                </button>
              )}
              {(subscription.status === 'suspended' || subscription.status === 'past_due' || subscription.status === 'cancelled') && (
                <button
                  onClick={handleRenew}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Gia hạn / Kích hoạt
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleUpgradeDowngrade} className="space-y-4 p-4 rounded-lg border border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              Chuyển đổi gói
            </h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Gói</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {plans.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Chu kỳ thanh toán</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'year')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="month">Tháng</option>
                <option value="year">Năm</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={actionLoading || selectedPlan === subscription.plan}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {actionLoading ? 'Đang cập nhật...' : 'Cập nhật gói'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
