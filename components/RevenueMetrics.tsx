import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Calendar, RefreshCw } from 'lucide-react';
import { getRevenueMetrics } from '../services/billingAutomationService';
import type { RevenueMetrics as RevenueMetricsData } from '../types/billing';

const currency = (n: number) =>
  `${Math.round(n).toLocaleString('vi-VN')} ₫`;

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]} flex items-center gap-4`}>
      <div className="p-2 bg-white/60 rounded-lg">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function RevenueMetrics() {
  const [metrics, setMetrics] = useState<RevenueMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRevenueMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải chỉ số doanh thu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">MRR/ARR & Doanh thu theo gói</h2>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          title="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 mb-4">
          {error}
        </div>
      )}

      {metrics && (
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Kỳ: {metrics.periodStart ? new Date(metrics.periodStart).toLocaleDateString('vi-VN') : '-'} — {metrics.periodEnd ? new Date(metrics.periodEnd).toLocaleDateString('vi-VN') : '-'}
        </p>
      )}

      {loading && !metrics ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : metrics ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard label="MRR (tháng)" value={currency(metrics.mrr)} icon={Wallet} color="blue" />
            <KpiCard label="ARR (năm)" value={currency(metrics.arr)} icon={TrendingUp} color="green" />
            <KpiCard label="Doanh thu trong kỳ" value={currency(metrics.totalRevenue)} icon={Wallet} color="purple" />
          </div>

          {metrics.revenueByPlan.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Doanh thu theo gói</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.revenueByPlan.map((item) => (
                  <KpiCard
                    key={item.plan}
                    label={item.planName || item.plan}
                    value={currency(item.revenue)}
                    icon={Wallet}
                    color="amber"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
