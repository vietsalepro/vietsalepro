import React, { useEffect, useState } from 'react';
import {
  Database, Server, Layers, RefreshCw, Plus, Play, RotateCcw,
  CheckCircle2, XCircle, AlertCircle, Clock, Loader2,
} from 'lucide-react';
import { Tenant, HeavyOpJob, HeavyOpJobStatus, ConnectionPoolStats, ReadReplicaStatus } from '../types/tenant';
import { getAllTenants } from '../services/tenantService';
import {
  getConnectionPoolStats,
  getReadReplicaStatus,
  getHeavyOpJobs,
  enqueueHeavyOpJob,
  retryHeavyOpJob,
  claimHeavyOpJob,
  completeHeavyOpJob,
} from '../services/heavyOpsQueueService';
import { isReadReplicaConfigured } from '../lib/supabaseReadReplica';

const statusLabel: Record<HeavyOpJobStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};

const statusClass: Record<HeavyOpJobStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const poolStatusClass: Record<ConnectionPoolStats['status'], string> = {
  healthy: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-600',
};

const isValidJson = (value: string): boolean => {
  try { JSON.parse(value); return true; } catch { return false; }
};

export default function ReadReplicaQueueManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [jobs, setJobs] = useState<HeavyOpJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [poolStats, setPoolStats] = useState<ConnectionPoolStats | null>(null);
  const [replicaStatus, setReplicaStatus] = useState<ReadReplicaStatus | null>(null);

  const [filterTenantId, setFilterTenantId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<HeavyOpJobStatus | ''>('');

  const [newTenantId, setNewTenantId] = useState<string>('');
  const [newJobType, setNewJobType] = useState<string>('report_export');
  const [newPayload, setNewPayload] = useState<string>('{}');
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTenants = async () => {
    setTenantsLoading(true);
    try {
      const data = await getAllTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách cửa hàng.');
    } finally {
      setTenantsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [pool, replica] = await Promise.all([
        getConnectionPoolStats(),
        getReadReplicaStatus(),
      ]);
      setPoolStats(pool);
      setReplicaStatus(replica);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông số hạ tầng.');
    }
  };

  const loadJobs = async () => {
    setJobsLoading(true);
    setError(null);
    try {
      const data = await getHeavyOpJobs({
        tenantId: filterTenantId || undefined,
        status: filterStatus || null,
        limit: 50,
      });
      setJobs(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách job.');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
    loadStats();
    loadJobs();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [filterTenantId, filterStatus]);

  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantId) {
      setError('Vui lòng chọn cửa hàng.');
      return;
    }
    if (!isValidJson(newPayload)) {
      setError('Payload phải là JSON hợp lệ.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await enqueueHeavyOpJob({
        tenantId: newTenantId,
        jobType: newJobType,
        payload: JSON.parse(newPayload),
      });
      setSuccess('Đã thêm job vào hàng đợi.');
      setNewPayload('{}');
      await loadJobs();
    } catch (err: any) {
      setError(err?.message || 'Thêm job thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await retryHeavyOpJob(jobId);
      setSuccess('Đã retry job.');
      await loadJobs();
    } catch (err: any) {
      setError(err?.message || 'Retry thất bại.');
    }
  };

  const handleClaimAndComplete = async () => {
    setClaiming(true);
    setError(null);
    setSuccess(null);
    try {
      const job = await claimHeavyOpJob();
      if (!job) {
        setSuccess('Không có job nào đang chờ.');
        return;
      }
      // ponytail: demo worker đánh dấu hoàn thành luôn; trong thực tế worker sẽ gọi external queue (QStash/Inngest).
      await completeHeavyOpJob(job.id, 'completed', { processedAt: new Date().toISOString() });
      setSuccess(`Đã xử lý job ${job.id.slice(0, 8)}.`);
      await loadJobs();
    } catch (err: any) {
      setError(err?.message || 'Xử lý job thất bại.');
    } finally {
      setClaiming(false);
    }
  };

  const globalReplicaConfigured = isReadReplicaConfigured();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Read replica + Pool + Queue
        </h2>
        <button
          onClick={() => { loadStats(); loadJobs(); }}
          disabled={jobsLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${jobsLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">Read replica</span>
          </div>
          <div className="flex items-center gap-2">
            {globalReplicaConfigured || replicaStatus?.enabled ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-lg font-semibold text-gray-800">
              {globalReplicaConfigured || replicaStatus?.enabled ? 'Đã cấu hình' : 'Chưa cấu hình'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tenant cấu hình: {replicaStatus?.configuredTenants ?? 0}
          </p>
          {replicaStatus?.message && (
            <p className="text-xs text-gray-500 mt-1">{replicaStatus.message}</p>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Server className="w-4 h-4" />
              <span className="text-sm font-medium">Connection pool</span>
            </div>
            {poolStats && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${poolStatusClass[poolStats.status]}`}>
                {poolStats.status.toUpperCase()}
              </span>
            )}
          </div>
          {poolStats ? (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-800">{poolStats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{poolStats.idle}</p>
                <p className="text-xs text-gray-500">Idle</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{poolStats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{poolStats.max}</p>
                <p className="text-xs text-gray-500">Max ước tính</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Đang tải...</p>
          )}
          {poolStats?.message && <p className="text-xs text-amber-600 mt-2">{poolStats.message}</p>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm heavy-op job (demo)
        </h3>
        <form onSubmit={handleEnqueue} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng</label>
            <select
              value={newTenantId}
              onChange={(e) => setNewTenantId(e.target.value)}
              disabled={tenantsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại job</label>
            <input
              type="text"
              value={newJobType}
              onChange={(e) => setNewJobType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payload (JSON)</label>
            <input
              type="text"
              value={newPayload}
              onChange={(e) => setNewPayload(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-4 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Đang thêm...' : 'Thêm job'}
            </button>
            <button
              type="button"
              onClick={handleClaimAndComplete}
              disabled={claiming}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60"
            >
              <Play className="w-4 h-4" />
              {claiming ? 'Đang xử lý...' : 'Chạy 1 job chờ'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Heavy ops jobs
          </h3>
          <div className="flex gap-3">
            <select
              value={filterTenantId}
              onChange={(e) => setFilterTenantId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả cửa hàng</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as HeavyOpJobStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              {(['pending','processing','completed','failed','cancelled'] as HeavyOpJobStatus[]).map((s) => (
                <option key={s} value={s}>{statusLabel[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Cửa hàng</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Attempts</th>
                <th className="px-4 py-3 font-medium">Lỗi / Kết quả</th>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {jobsLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chưa có job nào.</td></tr>
              ) : (
                jobs.map((job) => {
                  const tenant = tenants.find((t) => t.id === job.tenantId);
                  return (
                    <tr key={job.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{job.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">{tenant?.name || job.tenantId.slice(0, 8)}</td>
                      <td className="px-4 py-3">{job.jobType}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[job.status]}`}>
                          {job.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {job.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {job.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {statusLabel[job.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">{job.attempts}/{job.maxAttempts}</td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        {job.errorMessage || (job.result ? JSON.stringify(job.result) : '-')}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {job.createdAt ? new Date(job.createdAt).toLocaleString('vi-VN') : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(job.status === 'failed' || job.status === 'cancelled') && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
