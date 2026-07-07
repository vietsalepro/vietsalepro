import React, { useEffect, useState } from 'react';
import {
  Activity, AlertCircle, Clock, RefreshCw, Receipt, Building2, PlayCircle, AlertTriangle,
} from 'lucide-react';
import {
  BillingAutomationStatus,
  BillingJobLog,
} from '../types/billing';
import {
  getBillingAutomationStatus,
  getBillingJobLogs,
} from '../services/billingAutomationService';

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'amber' | 'red' | 'purple';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]} flex items-center gap-4`}>
      <div className="p-3 bg-white rounded-lg shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

const statusClass = (status: string) => {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-700';
    case 'failed': return 'bg-red-100 text-red-700';
    case 'running': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const invoiceStatusClass = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'overdue': return 'bg-orange-100 text-orange-700';
    case 'expired': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const tenantStatusClass = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'read_only': return 'bg-red-100 text-red-700';
    case 'trial': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function BillingAutomationDashboard() {
  const [status, setStatus] = useState<BillingAutomationStatus | null>(null);
  const [logs, setLogs] = useState<BillingJobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, l] = await Promise.all([
        getBillingAutomationStatus(),
        getBillingJobLogs(50),
      ]);
      setStatus(s);
      setLogs(l);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dashboard tự động hóa billing.');
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
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Dashboard tự động hóa billing</h2>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading && !status ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Sắp hết hạn (7 ngày)"
              value={status?.expiringSoonCount ?? 0}
              icon={Clock}
              color="blue"
            />
            <KpiCard
              label="Hóa đơn chờ xử lý"
              value={status?.pendingInvoiceCount ?? 0}
              icon={Receipt}
              color="amber"
            />
            <KpiCard
              label="Hóa đơn quá hạn / hết hạn"
              value={status?.overdueInvoiceCount ?? 0}
              icon={AlertTriangle}
              color="red"
            />
            <KpiCard
              label="Tenant đang dunning"
              value={status?.dunningTenantCount ?? 0}
              icon={Building2}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-gray-800">Tenant sắp hết hạn</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-600">Tenant</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Hết hạn</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(status?.expiringSoon || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-gray-500">Không có tenant sắp hết hạn.</td>
                      </tr>
                    ) : (
                      status?.expiringSoon.map(t => (
                        <tr key={t.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{t.name}</div>
                            <div className="text-xs text-gray-500">{t.subdomain}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(t.expiresAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${t.daysRemaining <= 3 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {t.daysRemaining} ngày
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="font-medium text-gray-800">Hóa đơn quá hạn / hết hạn</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-600">Hóa đơn</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Tenant</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Đến hạn</th>
                      <th className="px-4 py-2 font-medium text-gray-600">Còn nợ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(status?.overdueInvoices || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-gray-500">Không có hóa đơn quá hạn.</td>
                      </tr>
                    ) : (
                      status?.overdueInvoices.map(i => (
                        <tr key={i.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{i.invoiceNo}</div>
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${invoiceStatusClass(i.status)}`}>
                              {i.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{i.tenantName}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(i.dueDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-gray-800">
                            {new Intl.NumberFormat('vi-VN').format(i.balance)} đ
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-gray-800">Tenant đang dunning</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-600">Tenant</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Trạng thái</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(status?.dunningTenants || []).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-gray-500">Không có tenant đang dunning.</td>
                    </tr>
                  ) : (
                    status?.dunningTenants.map(t => (
                      <tr key={t.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.subdomain}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${tenantStatusClass(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${t.billingStatus === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {t.billingStatus || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-gray-600" />
              <h3 className="font-medium text-gray-800">Lịch sử job chạy ({logs.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-600">Job</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Trạng thái</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Thời gian</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Bản ghi</th>
                    <th className="px-4 py-2 font-medium text-gray-600">Thông báo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-gray-500">Chưa có job nào được ghi nhận.</td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 font-medium text-gray-800">{log.jobName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusClass(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(log.runAt).toLocaleString('vi-VN')}
                          {log.durationMs !== undefined && log.durationMs !== null && (
                            <span className="text-xs text-gray-500 block">{log.durationMs}ms</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{log.recordsAffected}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-md truncate">{log.message || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
