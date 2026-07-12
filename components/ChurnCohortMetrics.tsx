import React, { useEffect, useMemo, useState } from 'react';
import { TrendingDown, Users, Wallet, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts';
import { getChurnCohortMetrics as defaultGetChurnCohortMetrics } from '../services/billingAutomationService';
import type { ChurnCohortMetrics as MetricsData } from '../types/billing';

const currency = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} ₫`;

const FUNNEL_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
const LINE_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
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

interface ChurnCohortMetricsProps {
  loader?: () => Promise<MetricsData>;
}

export default function ChurnCohortMetrics({ loader }: ChurnCohortMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await (loader || defaultGetChurnCohortMetrics)();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải chỉ số churn/cohort.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [loader]);

  const funnelData = useMemo(() => {
    if (!metrics) return [];
    return [
      { stage: 'Trial', count: metrics.funnel.trial },
      { stage: 'Active Free', count: metrics.funnel.activeFree },
      { stage: 'Paying', count: metrics.funnel.paying },
      { stage: 'Churned', count: metrics.funnel.churned },
    ];
  }, [metrics]);

  const cohortChart = useMemo(() => {
    if (!metrics) return { data: [] as Record<string, number | string>[], cohorts: [] as string[] };
    const data: Record<string, number | string>[] = metrics.cohort.months.map((m) => ({ month: m }));
    metrics.cohort.cohorts.forEach((c) => {
      c.retention.forEach((r) => {
        const row = data.find((d) => d.month === r.month);
        if (row) row[c.month] = r.conversionRate;
      });
    });
    return { data, cohorts: metrics.cohort.cohorts.map((c) => c.month) };
  }, [metrics]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Churn, Cohort &amp; LTV</h2>
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

      {loading && !metrics ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : metrics ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Churn rate" value={`${metrics.churn.churnRate.toFixed(2)}%`} icon={TrendingDown} color="red" />
            <KpiCard label="LTV trung bình" value={currency(metrics.ltv.averageLtv)} icon={Wallet} color="green" />
            <KpiCard label="Tenant trả phí" value={metrics.ltv.payingTenants.toLocaleString()} icon={Users} color="blue" />
            <KpiCard label="Doanh thu lifetime" value={currency(metrics.ltv.totalRevenue)} icon={Wallet} color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sales funnel</h3>
              <div className="h-64">
                {funnelData.length === 0 ? (
                  <p className="text-gray-500">Chưa có dữ liệu funnel.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        width={90}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.15)' }}
                        formatter={(value) => [`${Number(value ?? 0).toLocaleString('vi-VN')}`, 'Tenant']}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                        {funnelData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Cohort conversion to paid (%)</h3>
              <div className="h-64">
                {cohortChart.data.length === 0 ? (
                  <p className="text-gray-500">Chưa có dữ liệu cohort.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={cohortChart.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.15)' }}
                        formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, 'Conversion']}
                      />
                      {cohortChart.cohorts.map((key, i) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={LINE_COLORS[i % LINE_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {metrics.ltv.byPlan.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">LTV theo gói</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.ltv.byPlan.map((item) => (
                  <KpiCard
                    key={item.plan}
                    label={item.planName || item.plan}
                    value={currency(item.ltv)}
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
