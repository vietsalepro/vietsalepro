import React, { useEffect, useState } from 'react';
import { Database, HardDrive, Zap, RefreshCw, CalendarClock } from 'lucide-react';
import { DashboardV2KPI } from '../pages/Dashboard';
import { SystemHealth, HealthCheck, HealthStatus, CronJobLog, CronJobStatus } from '../types/tenant';
import { getSystemHealth } from '../services/systemHealthService';
import { getCronJobLogs } from '../services/cronJobService';

const statusLabel = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy': return 'Bình thường';
    case 'degraded': return 'Suy giảm';
    case 'down': return 'Ngừng hoạt động';
    default: return 'Không xác định';
  }
};

const statusVariant = (status: HealthStatus): 'success' | 'warning' | 'danger' | 'primary' => {
  switch (status) {
    case 'healthy': return 'success';
    case 'degraded': return 'warning';
    case 'down': return 'danger';
    default: return 'primary';
  }
};

const checkIcon = (name: string) => {
  if (name.toLowerCase().includes('database')) return <Database className="w-6 h-6" />;
  if (name.toLowerCase().includes('storage')) return <HardDrive className="w-6 h-6" />;
  if (name.toLowerCase().includes('edge')) return <Zap className="w-6 h-6" />;
  return <Zap className="w-6 h-6" />;
};

const cronStatusClass = (status: CronJobStatus): string => {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-700';
    case 'failed': return 'bg-red-100 text-red-700';
    case 'running': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const cronStatusLabel = (status: CronJobStatus): string => {
  switch (status) {
    case 'success': return 'Thành công';
    case 'failed': return 'Thất bại';
    case 'running': return 'Đang chạy';
    default: return status;
  }
};

const cronJobLabel = (name: string): string => {
  switch (name) {
    case 'billing_reminders': return 'Nhắc thanh toán';
    case 'audit_log_cleanup': return 'Dọn audit log';
    default: return name;
  }
};

const formatDate = (d?: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('vi-VN');
};

export default function SystemHealthPanel() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [cronLogs, setCronLogs] = useState<CronJobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, logs] = await Promise.all([
        getSystemHealth(),
        getCronJobLogs(),
      ]);
      setHealth(healthData);
      setCronLogs(logs);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải trạng thái hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const latestByJob = React.useMemo(() => {
    const map = new Map<string, CronJobLog>();
    cronLogs.forEach((log) => {
      const existing = map.get(log.jobName);
      if (!existing || new Date(log.startedAt) > new Date(existing.startedAt)) {
        map.set(log.jobName, log);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.jobName.localeCompare(b.jobName));
  }, [cronLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">System health</h2>
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

      {loading && !health && (
        <p className="text-gray-600">Đang kiểm tra trạng thái hệ thống...</p>
      )}

      {health && (
        <>
          <DashboardV2KPI
            title="Tổng trạng thái"
            value={statusLabel(health.overall)}
            icon={<Zap className="w-6 h-6" />}
            variant={statusVariant(health.overall)}
            subtitle={`Cập nhật: ${new Date(health.checkedAt).toLocaleString('vi-VN')}`}
          />

          <div className="dashboard-v2__grid">
            {health.checks.map((check: HealthCheck) => (
              <DashboardV2KPI
                key={check.name}
                title={check.name}
                value={statusLabel(check.status)}
                icon={checkIcon(check.name)}
                variant={statusVariant(check.status)}
                subtitle={check.latencyMs !== undefined ? `Latency: ${check.latencyMs}ms${check.detail ? ` · ${check.detail}` : ''}` : check.detail}
              />
            ))}
          </div>
        </>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <CalendarClock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Trạng thái cron jobs</h3>
            <p className="text-sm text-gray-500">Lịch chạy tự động: nhắc thanh toán hàng ngày, dọn audit log hàng tuần.</p>
          </div>
        </div>

        {latestByJob.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            Chưa có lịch sử chạy cron job.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-3">Tên cron job</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Chạy lần cuối</th>
                  <th className="px-6 py-3">Kết thúc</th>
                  <th className="px-6 py-3">Retry</th>
                  <th className="px-6 py-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {latestByJob.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-3 font-medium text-gray-900">{cronJobLabel(log.jobName)}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cronStatusClass(log.status)}`}>
                        {cronStatusLabel(log.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(log.startedAt)}</td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(log.completedAt)}</td>
                    <td className="px-6 py-3 text-gray-600">{log.retryCount}</td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate">
                      {log.errorMessage || (log.details ? JSON.stringify(log.details) : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
