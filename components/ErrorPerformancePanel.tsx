import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Activity, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { DashboardV2KPI } from '../pages/Dashboard';
import { ErrorPerformance } from '../types/tenant';
import { getErrorPerformance } from '../services/errorPerformanceService';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#10b981'];

function formatNumber(n: number): string {
  if (n === 0) return '0';
  return n < 1 ? n.toFixed(2) : n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

export default function ErrorPerformancePanel() {
  const [data, setData] = useState<ErrorPerformance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getErrorPerformance();
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu lỗi/hiệu năng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const errorChartData = data?.errors?.bySource?.map((g) => ({
    name: `${g.source} (${g.level})`,
    source: g.source,
    level: g.level,
    count: g.count,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Lỗi & Hiệu năng</h2>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {loading && !data && (
        <p className="text-gray-600">Đang tải dữ liệu lỗi/hiệu năng...</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <DashboardV2KPI
              title="Tổng lỗi 24h"
              value={formatNumber(data.errors.total)}
              icon={<AlertCircle className="w-6 h-6" />}
              variant={data.errors.total > 0 ? 'danger' : 'success'}
              subtitle={`Từ ${new Date(data.errors.since).toLocaleString('vi-VN')}`}
            />
            <DashboardV2KPI
              title="RPS (queries/s)"
              value={formatNumber(data.performance.rps)}
              icon={<Activity className="w-6 h-6" />}
              variant={data.performance.rps > 50 ? 'warning' : 'success'}
              subtitle={`${formatNumber(data.performance.totalCalls)} calls`}
            />
            <DashboardV2KPI
              title="P95 latency"
              value={`${formatNumber(data.performance.p95Ms)}ms`}
              icon={<Clock className="w-6 h-6" />}
              variant={data.performance.p95Ms > 500 ? 'warning' : 'success'}
              subtitle={`P99: ${formatNumber(data.performance.p99Ms)}ms`}
            />
            <DashboardV2KPI
              title="Avg latency"
              value={`${formatNumber(data.performance.averageTimeMs)}ms`}
              icon={<Activity className="w-6 h-6" />}
              variant={data.performance.averageTimeMs > 200 ? 'warning' : 'success'}
              subtitle={`${formatNumber(data.performance.totalQueries)} unique queries`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Lỗi theo nguồn (24h)</h3>
              {errorChartData.length === 0 ? (
                <p className="text-sm text-gray-500">Không có lỗi trong 24 giờ qua.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={errorChartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="source" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: any, _name, props: any) => [value, `${props.payload.source} (${props.payload.level})`]}
                        labelFormatter={() => ''}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {errorChartData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top queries theo tổng thời gian</h3>
              {data.performance.topQueries.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có dữ liệu pg_stat_statements.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="pb-2 font-medium">Query</th>
                        <th className="pb-2 font-medium text-right">Calls</th>
                        <th className="pb-2 font-medium text-right">Avg (ms)</th>
                        <th className="pb-2 font-medium text-right">P95 (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.performance.topQueries.slice(0, 5).map((q, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 font-mono text-xs text-gray-700 truncate max-w-xs" title={q.query}>
                            {q.query}
                          </td>
                          <td className="py-2 text-right">{formatNumber(q.calls)}</td>
                          <td className="py-2 text-right">{formatNumber(q.mean_ms)}</td>
                          <td className="py-2 text-right">{formatNumber(q.p95_ms)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {data.errors.recent.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Lỗi gần đây</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Thời gian</th>
                      <th className="pb-2 font-medium">Nguồn</th>
                      <th className="pb-2 font-medium">Level</th>
                      <th className="pb-2 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.errors.recent.slice(0, 10).map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 text-gray-600">
                          {new Date(entry.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 font-medium text-gray-700">{entry.source}</td>
                        <td className="py-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            entry.level === 'error' ? 'bg-red-100 text-red-700' :
                            entry.level === 'warn' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {entry.level}
                          </span>
                        </td>
                        <td className="py-2 text-gray-700">{entry.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
