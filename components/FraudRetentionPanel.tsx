import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, RefreshCw, Settings, Trash2, Loader2 } from 'lucide-react';
import {
  FraudDetectionConfig,
  FraudQueueItem,
  FraudQueueStatus,
  FraudSeverity,
  FraudStats,
  DataRetentionConfig,
  DataRetentionRunResult,
} from '../types/tenant';
import {
  getFraudDetectionConfig,
  setFraudDetectionConfig,
  runFraudDetection,
  getFraudQueue,
  getFraudStats,
  updateFraudQueueStatus,
  getDataRetentionConfig,
  setDataRetentionConfig,
  runDataRetention,
} from '../services/fraudRetentionService';

const STATUS_OPTIONS: { value: FraudQueueStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'open', label: 'Mở' },
  { value: 'reviewing', label: 'Đang xem xét' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'dismissed', label: 'Bỏ qua' },
];

const SEVERITY_OPTIONS: { value: FraudSeverity | ''; label: string }[] = [
  { value: '', label: 'Tất cả mức độ' },
  { value: 'high', label: 'Cao' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'low', label: 'Thấp' },
];

export default function FraudRetentionPanel() {
  const [error, setError] = useState<string | null>(null);

  const [fraudConfig, setFraudConfig] = useState<FraudDetectionConfig | null>(null);
  const [fraudConfigDraft, setFraudConfigDraft] = useState<FraudDetectionConfig | null>(null);
  const [fraudConfigLoading, setFraudConfigLoading] = useState(false);
  const [fraudConfigSaving, setFraudConfigSaving] = useState(false);

  const [fraudQueue, setFraudQueue] = useState<FraudQueueItem[]>([]);
  const [fraudQueueCount, setFraudQueueCount] = useState(0);
  const [fraudQueuePage, setFraudQueuePage] = useState(1);
  const [fraudQueueLoading, setFraudQueueLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState<FraudQueueStatus | ''>('');
  const [queueSeverity, setQueueSeverity] = useState<FraudSeverity | ''>('');

  const [fraudStats, setFraudStats] = useState<FraudStats | null>(null);
  const [fraudStatsLoading, setFraudStatsLoading] = useState(false);
  const [runningFraudDetection, setRunningFraudDetection] = useState(false);

  const [retentionConfig, setRetentionConfig] = useState<DataRetentionConfig | null>(null);
  const [retentionConfigDraft, setRetentionConfigDraft] = useState<DataRetentionConfig | null>(null);
  const [retentionConfigLoading, setRetentionConfigLoading] = useState(false);
  const [retentionConfigSaving, setRetentionConfigSaving] = useState(false);
  const [runningRetention, setRunningRetention] = useState(false);
  const [retentionResult, setRetentionResult] = useState<DataRetentionRunResult | null>(null);

  const pageSize = 20;

  const loadFraudConfig = async () => {
    setFraudConfigLoading(true);
    try {
      const config = await getFraudDetectionConfig();
      setFraudConfig(config);
      setFraudConfigDraft(config);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải cấu hình fraud detection.');
    } finally {
      setFraudConfigLoading(false);
    }
  };

  const loadFraudQueue = async () => {
    setFraudQueueLoading(true);
    try {
      const result = await getFraudQueue({
        status: queueStatus || null,
        severity: queueSeverity || null,
        limit: pageSize,
        offset: (fraudQueuePage - 1) * pageSize,
      });
      setFraudQueue(result.data);
      setFraudQueueCount(result.count);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải fraud queue.');
    } finally {
      setFraudQueueLoading(false);
    }
  };

  const loadFraudStats = async () => {
    setFraudStatsLoading(true);
    try {
      const stats = await getFraudStats();
      setFraudStats(stats);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải fraud stats.');
    } finally {
      setFraudStatsLoading(false);
    }
  };

  const loadRetentionConfig = async () => {
    setRetentionConfigLoading(true);
    try {
      const config = await getDataRetentionConfig();
      setRetentionConfig(config);
      setRetentionConfigDraft(config);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải cấu hình data retention.');
    } finally {
      setRetentionConfigLoading(false);
    }
  };

  useEffect(() => {
    loadFraudConfig();
    loadFraudStats();
    loadRetentionConfig();
  }, []);

  useEffect(() => {
    loadFraudQueue();
  }, [fraudQueuePage, queueStatus, queueSeverity]);

  const handleSaveFraudConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fraudConfigDraft) return;
    setFraudConfigSaving(true);
    setError(null);
    try {
      const config = await setFraudDetectionConfig(fraudConfigDraft);
      setFraudConfig(config);
      setFraudConfigDraft(config);
    } catch (err: any) {
      setError(err?.message || 'Lưu cấu hình fraud detection thất bại.');
    } finally {
      setFraudConfigSaving(false);
    }
  };

  const handleRunFraudDetection = async () => {
    setRunningFraudDetection(true);
    setError(null);
    try {
      await runFraudDetection();
      await Promise.all([loadFraudQueue(), loadFraudStats()]);
    } catch (err: any) {
      setError(err?.message || 'Chạy fraud detection thất bại.');
    } finally {
      setRunningFraudDetection(false);
    }
  };

  const handleUpdateQueueStatus = async (id: string, status: FraudQueueStatus) => {
    try {
      await updateFraudQueueStatus(id, status);
      await loadFraudQueue();
      await loadFraudStats();
    } catch (err: any) {
      setError(err?.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  const handleSaveRetentionConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retentionConfigDraft) return;
    setRetentionConfigSaving(true);
    setError(null);
    try {
      const config = await setDataRetentionConfig(retentionConfigDraft);
      setRetentionConfig(config);
      setRetentionConfigDraft(config);
    } catch (err: any) {
      setError(err?.message || 'Lưu cấu hình data retention thất bại.');
    } finally {
      setRetentionConfigSaving(false);
    }
  };

  const handleRunRetention = async () => {
    setRunningRetention(true);
    setError(null);
    setRetentionResult(null);
    try {
      const result = await runDataRetention();
      setRetentionResult(result);
      await loadFraudStats();
    } catch (err: any) {
      setError(err?.message || 'Chạy data retention thất bại.');
    } finally {
      setRunningRetention(false);
    }
  };

  const severityClass = (severity: FraudSeverity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const severityLabel = (severity: FraudSeverity) => {
    switch (severity) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return severity;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'ip_burst': return 'IP burst';
      case 'email_domain_burst': return 'Email domain burst';
      case 'owner_burst': return 'Owner burst';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Fraud detection config */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Cấu hình phát hiện gian lận
        </h3>
        {fraudConfigLoading && !fraudConfig ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : fraudConfigDraft ? (
          <form onSubmit={handleSaveFraudConfig} className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fraudConfigDraft.enabled}
                onChange={(e) => setFraudConfigDraft({ ...fraudConfigDraft, enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Bật heuristic phát hiện spam / tạo nhiều account</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'IP window (giờ)', key: 'ipWindowHours', maxKey: 'ipMax', labelMax: 'IP max' },
                { label: 'Email domain window (giờ)', key: 'emailDomainWindowHours', maxKey: 'emailDomainMax', labelMax: 'Domain max' },
                { label: 'Owner window (giờ)', key: 'ownerWindowHours', maxKey: 'ownerMax', labelMax: 'Owner max' },
              ].map((field) => (
                <React.Fragment key={field.key}>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
                    <input
                      type="number"
                      min={1}
                      value={(fraudConfigDraft as any)[field.key]}
                      onChange={(e) => setFraudConfigDraft({ ...fraudConfigDraft, [field.key]: Math.max(1, Number(e.target.value)) } as FraudDetectionConfig)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{field.labelMax}</label>
                    <input
                      type="number"
                      min={1}
                      value={(fraudConfigDraft as any)[field.maxKey]}
                      onChange={(e) => setFraudConfigDraft({ ...fraudConfigDraft, [field.maxKey]: Math.max(1, Number(e.target.value)) } as FraudDetectionConfig)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={fraudConfigSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {fraudConfigSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* Fraud stats + run */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Hàng đợi gian lận
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunFraudDetection}
              disabled={runningFraudDetection}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {runningFraudDetection ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Chạy detection
            </button>
            <button
              onClick={() => { loadFraudQueue(); loadFraudStats(); }}
              disabled={fraudQueueLoading || fraudStatsLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${fraudQueueLoading || fraudStatsLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-600">Tổng cảnh báo</p>
            <p className="text-2xl font-bold text-gray-900">{fraudStats?.total ?? 0}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-600">Theo mức độ</p>
            <p className="text-sm font-medium text-gray-900">
              {fraudStats ? Object.entries(fraudStats.bySeverity).map(([k, v]) => `${severityLabel(k as FraudSeverity)}: ${v}`).join(' / ') : '-'}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-600">Theo trạng thái</p>
            <p className="text-sm font-medium text-gray-900">
              {fraudStats ? Object.entries(fraudStats.byStatus).map(([k, v]) => `${k}: ${v}`).join(' / ') : '-'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={queueStatus}
            onChange={(e) => { setQueueStatus(e.target.value as FraudQueueStatus | ''); setFraudQueuePage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={queueSeverity}
            onChange={(e) => { setQueueSeverity(e.target.value as FraudSeverity | ''); setFraudQueuePage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {fraudQueueLoading && fraudQueue.length === 0 ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : fraudQueue.length === 0 ? (
          <p className="text-gray-500">Chưa có cảnh báo nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Loại</th>
                  <th className="px-4 py-2 text-left font-medium">Mức độ</th>
                  <th className="px-4 py-2 text-left font-medium">Giá trị</th>
                  <th className="px-4 py-2 text-left font-medium">Số event</th>
                  <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-2 text-left font-medium">Ghi chú</th>
                  <th className="px-4 py-2 text-left font-medium">Thời gian</th>
                  <th className="px-4 py-2 text-left font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fraudQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{typeLabel(item.type)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityClass(item.severity)}`}>
                        {severityLabel(item.severity)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700 font-mono text-xs truncate max-w-[150px]">{item.targetValue || '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{item.eventCount}</td>
                    <td className="px-4 py-2 text-gray-700 capitalize">{item.status}</td>
                    <td className="px-4 py-2 text-gray-700">{item.notes || '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {item.status === 'open' && (
                          <button
                            onClick={() => handleUpdateQueueStatus(item.id, 'reviewing')}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          >
                            Xem xét
                          </button>
                        )}
                        {(item.status === 'open' || item.status === 'reviewing') && (
                          <>
                            <button
                              onClick={() => handleUpdateQueueStatus(item.id, 'resolved')}
                              className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                            >
                              Xử lý
                            </button>
                            <button
                              onClick={() => handleUpdateQueueStatus(item.id, 'dismissed')}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            >
                              Bỏ qua
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {fraudQueueCount > pageSize && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setFraudQueuePage((p) => Math.max(1, p - 1))}
              disabled={fraudQueuePage === 1 || fraudQueueLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {fraudQueuePage} / {Math.max(1, Math.ceil(fraudQueueCount / pageSize))}
            </span>
            <button
              onClick={() => setFraudQueuePage((p) => p + 1)}
              disabled={fraudQueuePage * pageSize >= fraudQueueCount || fraudQueueLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Data retention config */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Cấu hình data retention
        </h3>
        {retentionConfigLoading && !retentionConfig ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : retentionConfigDraft ? (
          <form onSubmit={handleSaveRetentionConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Orders (ngày)', key: 'retentionDaysOrders' },
                { label: 'Processed operations (ngày)', key: 'retentionDaysProcessedOperations' },
                { label: 'Rate limit logs (ngày)', key: 'retentionDaysRateLimitLogs' },
                { label: 'Fraud queue (ngày)', key: 'retentionDaysFraudQueue' },
                { label: 'Registration events (ngày)', key: 'retentionDaysRegistrationEvents' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
                  <input
                    type="number"
                    min={1}
                    value={(retentionConfigDraft as any)[field.key]}
                    onChange={(e) => setRetentionConfigDraft({ ...retentionConfigDraft, [field.key]: Math.max(1, Number(e.target.value)) } as DataRetentionConfig)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Lịch cron</label>
                <input
                  type="text"
                  value={retentionConfigDraft.cronSchedule}
                  onChange={(e) => setRetentionConfigDraft({ ...retentionConfigDraft, cronSchedule: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRunRetention}
                disabled={runningRetention}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {runningRetention ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Chạy retention ngay
              </button>
              <button
                type="submit"
                disabled={retentionConfigSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {retentionConfigSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </form>
        ) : null}

        {retentionResult && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100 text-sm">
            <p className="font-medium mb-1">Data retention đã chạy:</p>
            <ul className="list-disc list-inside">
              <li>Đơn hàng archived: {retentionResult.archivedOrders}</li>
              <li>Dòng sản phẩm archived: {retentionResult.archivedItems}</li>
              <li>Processed operations đã xóa: {retentionResult.deletedProcessedOperations}</li>
              <li>Rate limit logs đã xóa: {retentionResult.deletedRateLimitLogs}</li>
              <li>Fraud queue đã xóa: {retentionResult.deletedFraudQueue}</li>
              <li>Registration events đã xóa: {retentionResult.deletedRegistrationEvents}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
