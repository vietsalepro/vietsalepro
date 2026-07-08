import React, { useEffect, useState } from 'react';
import { HardDrive, Database, ShieldCheck, RefreshCw } from 'lucide-react';
import { DashboardV2KPI } from '../pages/Dashboard';
import { StorageUsage, BackupStatus } from '../types/tenant';
import { getTenantStorageUsage } from '../services/tenantService';
import { getBackupStatus } from '../services/systemBackupService';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

const backupStatusLabel = (status: BackupStatus['status']) => {
  switch (status) {
    case 'healthy': return 'Bình thường';
    case 'degraded': return 'Chưa bật PITR';
    default: return 'Không xác định';
  }
};

const backupStatusVariant = (status: BackupStatus['status']): 'success' | 'warning' | 'primary' => {
  switch (status) {
    case 'healthy': return 'success';
    case 'degraded': return 'warning';
    default: return 'primary';
  }
};

export default function StorageBackupPanel() {
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [backup, setBackup] = useState<{ checkedAt: string; backupStatus: BackupStatus } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storageData, backupData] = await Promise.all([
        getTenantStorageUsage(),
        getBackupStatus(),
      ]);
      setStorage(storageData);
      setBackup(backupData);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu storage & backup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // ponytail: eslint exhaustive-deps không được bật trong tsc-only lint; deps giữ ở mức tối thiểu.
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Storage & Backup</h2>
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

      {loading && !storage && !backup && (
        <p className="text-gray-600">Đang tải dữ liệu storage & backup...</p>
      )}

      {backup && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardV2KPI
            title="Trạng thái backup"
            value={backupStatusLabel(backup.backupStatus.status)}
            icon={<ShieldCheck className="w-6 h-6" />}
            variant={backupStatusVariant(backup.backupStatus.status)}
            subtitle={`Cập nhật: ${new Date(backup.checkedAt).toLocaleString('vi-VN')}`}
          />
          <DashboardV2KPI
            title="PITR"
            value={backup.backupStatus.pitrEnabled === true ? 'Bật' : backup.backupStatus.pitrEnabled === false ? 'Tắt' : 'Không rõ'}
            icon={<ShieldCheck className="w-6 h-6" />}
            variant={backup.backupStatus.pitrEnabled === true ? 'success' : 'warning'}
            subtitle={
              backup.backupStatus.pitrEarliestRecoveryPoint
                ? `Từ ${new Date(backup.backupStatus.pitrEarliestRecoveryPoint).toLocaleString('vi-VN')}`
                : 'Không có dữ liệu'
            }
          />
          <DashboardV2KPI
            title="Backup gần nhất"
            value={backup.backupStatus.lastBackupAt ? new Date(backup.backupStatus.lastBackupAt).toLocaleDateString('vi-VN') : 'N/A'}
            icon={<Database className="w-6 h-6" />}
            variant={backup.backupStatus.lastBackupAt ? 'success' : 'primary'}
            subtitle={backup.backupStatus.lastBackupAt ? 'Từ Supabase CLI / Management API' : 'Chưa có thông tin'}
          />
          <DashboardV2KPI
            title="CLI/API"
            value={backup.backupStatus.cliAvailable ? 'Kết nối' : 'Chưa cấu hình'}
            icon={<RefreshCw className="w-6 h-6" />}
            variant={backup.backupStatus.cliAvailable ? 'success' : 'primary'}
            subtitle={backup.backupStatus.cliAvailable ? 'Management API' : 'Cần SUPABASE_MANAGEMENT_TOKEN'}
          />
        </div>
      )}

      {storage && (
        <>
          <DashboardV2KPI
            title="Tổng dung lượng DB"
            value={formatBytes(storage.totalDatabaseBytes)}
            icon={<HardDrive className="w-6 h-6" />}
            variant="primary"
            subtitle={`Cập nhật: ${new Date(storage.checkedAt).toLocaleString('vi-VN')}`}
          />

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Storage theo tenant</h3>
            {storage.tenants.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có tenant nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Tenant</th>
                      <th className="pb-2 font-medium text-right">Dung lượng ước tính</th>
                      <th className="pb-2 font-medium text-right">Bảng chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storage.tenants.map((t) => (
                      <tr key={t.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2">
                          <div className="font-medium text-gray-700">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.subdomain}</div>
                        </td>
                        <td className="py-2 text-right font-medium">{formatBytes(t.bytes)}</td>
                        <td className="py-2 text-right text-xs text-gray-600">
                          {t.tables.length === 0
                            ? 'Không có dữ liệu'
                            : t.tables
                                .slice(0, 3)
                                .map((tbl) => `${tbl.name} (${formatBytes(tbl.bytes)})`)
                                .join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
