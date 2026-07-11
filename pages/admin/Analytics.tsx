import React, { useMemo, useState } from 'react';
import { BarChart3, Calendar } from 'lucide-react';
import RevenueMetrics from '../../components/RevenueMetrics';
import ChurnCohortMetrics from '../../components/ChurnCohortMetrics';
import {
  getAdminRevenueMetrics,
  getAdminChurnCohortMetrics,
} from '../../services/admin/analyticsAdminService';

function formatInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Analytics() {
  const today = useMemo(() => new Date(), []);
  const startOfMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatInputDate(d);
  }, [today]);
  const todayStr = useMemo(() => formatInputDate(today), [today]);

  const [dateRange, setDateRange] = useState({ startDate: startOfMonth, endDate: todayStr });

  const revenueLoader = React.useCallback(
    () => getAdminRevenueMetrics({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
    [dateRange],
  );

  const churnLoader = React.useCallback(
    () => getAdminChurnCohortMetrics({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
    [dateRange],
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Phân tích & Churn
          </h1>
          <p className="text-sm text-gray-600 mt-1">Doanh thu định kỳ, churn và cohort retention.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
          <Calendar className="w-4 h-4 text-gray-500 ml-2" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <RevenueMetrics loader={revenueLoader} />
      <ChurnCohortMetrics loader={churnLoader} />
    </div>
  );
}
