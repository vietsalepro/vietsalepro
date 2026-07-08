import React, { useEffect, useState } from 'react';
import { Database, HardDrive, Zap, RefreshCw } from 'lucide-react';
import { DashboardV2KPI } from '../pages/Dashboard';
import { SystemHealth, HealthCheck, HealthStatus } from '../types/tenant';
import { getSystemHealth } from '../services/systemHealthService';

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

export default function SystemHealthPanel() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải trạng thái hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    </div>
  );
}
