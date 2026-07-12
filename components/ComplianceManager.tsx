import React, { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw, Shield, Loader2, FileDown, Trash2, AlertTriangle } from 'lucide-react';
import {
  TermsAcceptance,
  Tenant,
  TermsType,
  TERMS_TYPE_LABELS,
} from '../types/tenant';
import { getAllTenants } from '../services/tenantService';
import {
  exportTenantData,
  getTermsAcceptances,
  recordTermsAcceptance,
} from '../services/complianceService';
import {
  GdprRequest,
  GdprRequestType,
  createGdprRequest,
  getGdprRequests,
  getGdprExportData,
  deleteUserData,
  downloadGdprExport,
} from '../services/admin/complianceAdminService';
import { useAuth } from '../contexts/AuthContext';
import { isSystemAdmin } from '../lib/permissions';
import FraudRetentionPanel from './FraudRetentionPanel';

const TERMS_TYPES: TermsType[] = ['tos', 'privacy', 'gdpr', 'cookie', 'custom'];
const GDPR_TYPES: GdprRequestType[] = ['export', 'deletion'];
const GDPR_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};

export default function ComplianceManager() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [termsType, setTermsType] = useState<TermsType | ''>('');
  const [termsAcceptances, setTermsAcceptances] = useState<TermsAcceptance[]>([]);
  const [termsCount, setTermsCount] = useState(0);
  const [termsPage, setTermsPage] = useState(1);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const [recordForm, setRecordForm] = useState({
    userId: user?.id ?? '',
    termsVersion: '1.0',
    termsType: 'tos' as TermsType,
  });
  const [recording, setRecording] = useState(false);

  const [gdprRequests, setGdprRequests] = useState<GdprRequest[]>([]);
  const [gdprCount, setGdprCount] = useState(0);
  const [gdprPage, setGdprPage] = useState(1);
  const [gdprLoading, setGdprLoading] = useState(false);
  const [gdprError, setGdprError] = useState<string | null>(null);
  const [gdprForm, setGdprForm] = useState({
    userId: '',
    type: 'export' as GdprRequestType,
    reason: '',
    dryRun: true,
    confirm: '',
  });
  const [gdprSubmitting, setGdprSubmitting] = useState(false);
  const [gdprPreview, setGdprPreview] = useState<any>(null);

  const pageSize = 20;
  const gdprPageSize = 20;

  const loadTenants = async () => {
    setTenantsLoading(true);
    try {
      const list = await getAllTenants();
      setTenants(list);
    } catch (err: any) {
      setExportError(err?.message || 'Không thể tải danh sách tenant.');
    } finally {
      setTenantsLoading(false);
    }
  };

  const loadTermsAcceptances = async () => {
    setTermsLoading(true);
    setTermsError(null);
    try {
      const result = await getTermsAcceptances({
        tenantId: selectedTenantId || undefined,
        termsType: termsType || undefined,
        limit: pageSize,
        offset: (termsPage - 1) * pageSize,
      });
      setTermsAcceptances(result.data);
      setTermsCount(result.count);
    } catch (err: any) {
      setTermsError(err?.message || 'Không thể tải terms acceptance log.');
    } finally {
      setTermsLoading(false);
    }
  };

  const loadGdprRequests = async () => {
    if (isAdmin === false) return;
    setGdprLoading(true);
    setGdprError(null);
    try {
      const result = await getGdprRequests({
        limit: gdprPageSize,
        offset: (gdprPage - 1) * gdprPageSize,
      });
      setGdprRequests(result.data);
      setGdprCount(result.count);
    } catch (err: any) {
      setGdprError(err?.message || 'Không thể tải GDPR requests.');
    } finally {
      setGdprLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
    let cancelled = false;
    isSystemAdmin().then((admin) => {
      if (!cancelled) setIsAdmin(admin);
    });
    return () => { cancelled = true; };
    // ponytail: initial GDPR load on mount; page changes reload separately.
  }, []);

  useEffect(() => {
    loadGdprRequests();
    // ponytail: load GDPR only after admin role is known to avoid 403.
  }, [isAdmin]);

  useEffect(() => {
    setTermsPage(1);
    loadTermsAcceptances();
    // ponytail: eslint exhaustive-deps disabled in tsc-only lint; keep deps minimal.
  }, [selectedTenantId, termsType]);

  useEffect(() => {
    loadTermsAcceptances();
  }, [termsPage]);

  useEffect(() => {
    loadGdprRequests();
    // ponytail: keep dependency minimal; function is stable within component.
  }, [gdprPage]);

  const handleExport = async () => {
    if (!selectedTenantId) {
      setExportError('Vui lòng chọn tenant để export.');
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportTenantData(selectedTenantId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenant-export-${selectedTenantId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err?.message || 'Export dữ liệu tenant thất bại.');
    } finally {
      setExporting(false);
    }
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.userId.trim()) {
      setTermsError('Vui lòng nhập user ID.');
      return;
    }
    setRecording(true);
    setTermsError(null);
    try {
      await recordTermsAcceptance({
        userId: recordForm.userId.trim(),
        tenantId: selectedTenantId || undefined,
        termsVersion: recordForm.termsVersion,
        termsType: recordForm.termsType,
      });
      setRecordForm({ userId: '', termsVersion: '1.0', termsType: 'tos' });
      await loadTermsAcceptances();
    } catch (err: any) {
      setTermsError(err?.message || 'Ghi nhận terms acceptance thất bại.');
    } finally {
      setRecording(false);
    }
  };

  const handleGdprSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setGdprError('Chỉ system admin mới được tạo yêu cầu GDPR.');
      return;
    }
    const userId = gdprForm.userId.trim();
    if (!userId) {
      setGdprError('Vui lòng nhập User ID.');
      return;
    }
    if (gdprForm.type === 'deletion' && gdprForm.confirm.trim().toLowerCase() !== 'xóa') {
      setGdprError('Vui lòng gõ "xóa" để xác nhận yêu cầu xóa dữ liệu.');
      return;
    }
    setGdprSubmitting(true);
    setGdprError(null);
    setGdprPreview(null);
    try {
      await createGdprRequest({
        userId,
        type: gdprForm.type,
        reason: gdprForm.reason,
        dryRun: gdprForm.dryRun,
      });
      if (gdprForm.type === 'export') {
        const data = await getGdprExportData(userId);
        downloadGdprExport(data);
      } else {
        const result = await deleteUserData(userId, gdprForm.dryRun);
        setGdprPreview(result);
      }
      setGdprForm({ userId: '', type: 'export', reason: '', dryRun: true, confirm: '' });
      await loadGdprRequests();
    } catch (err: any) {
      setGdprError(err?.message || 'Gửi GDPR request thất bại.');
    } finally {
      setGdprSubmitting(false);
    }
  };

  const handleDownloadExport = async (req: GdprRequest) => {
    setGdprSubmitting(true);
    setGdprError(null);
    try {
      const data = await getGdprExportData(req.userId);
      downloadGdprExport(data);
    } catch (err: any) {
      setGdprError(err?.message || 'Export dữ liệu thất bại.');
    } finally {
      setGdprSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Tuân thủ GDPR / Nghị định 13/2023
        </h2>
      </div>

      {(exportError || termsError || gdprError) && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {exportError || termsError || gdprError}
        </div>
      )}

      {isAdmin === false && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-100">
          Chỉ system admin mới có quyền quản lý GDPR.
        </div>
      )}

      {/* Data export */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export dữ liệu tenant
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            disabled={tenantsLoading}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{tenantsLoading ? 'Đang tải...' : 'Chọn tenant'}</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subdomain})
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={exporting || !selectedTenantId}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export JSON
          </button>
        </div>
      </div>

      {/* GDPR requests */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Yêu cầu GDPR
          </h3>
          <button
            onClick={loadGdprRequests}
            disabled={gdprLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${gdprLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        <form onSubmit={handleGdprSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="User ID"
            value={gdprForm.userId}
            onChange={(e) => setGdprForm({ ...gdprForm, userId: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={gdprForm.type}
            onChange={(e) => setGdprForm({ ...gdprForm, type: e.target.value as GdprRequestType })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GDPR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'export' ? 'Export dữ liệu' : 'Xóa dữ liệu'}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Lý do"
            value={gdprForm.reason}
            onChange={(e) => setGdprForm({ ...gdprForm, reason: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={gdprForm.dryRun}
              onChange={(e) => setGdprForm({ ...gdprForm, dryRun: e.target.checked })}
              className="rounded border-gray-300"
            />
            Dry-run
          </label>
          {gdprForm.type === 'deletion' && (
            <input
              type="text"
              placeholder='Gõ "xóa" để xác nhận'
              value={gdprForm.confirm}
              onChange={(e) => setGdprForm({ ...gdprForm, confirm: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          )}
          <button
            type="submit"
            disabled={gdprSubmitting}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
              gdprForm.type === 'deletion' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {gdprSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : gdprForm.type === 'deletion' ? <Trash2 className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
            {gdprForm.type === 'deletion' ? 'Yêu cầu xóa' : 'Tạo export'}
          </button>
        </form>

        {gdprPreview && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              Kết quả dry-run / xóa
            </div>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(gdprPreview, null, 2)}
            </pre>
          </div>
        )}

        {gdprLoading && gdprRequests.length === 0 ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : gdprRequests.length === 0 ? (
          <p className="text-gray-500">Chưa có yêu cầu GDPR nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">User ID</th>
                  <th className="px-4 py-2 text-left font-medium">Loại</th>
                  <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-2 text-left font-medium">Dry-run</th>
                  <th className="px-4 py-2 text-left font-medium">Ngày tạo</th>
                  <th className="px-4 py-2 text-left font-medium">Ngày hoàn tất</th>
                  <th className="px-4 py-2 text-left font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gdprRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-700 truncate max-w-[200px]">{req.userId}</td>
                    <td className="px-4 py-2 text-gray-700">{req.type === 'export' ? 'Export' : 'Xóa'}</td>
                    <td className="px-4 py-2 text-gray-700">{GDPR_STATUS_LABELS[req.status] || req.status}</td>
                    <td className="px-4 py-2 text-gray-700">{req.dryRun ? 'Có' : 'Không'}</td>
                    <td className="px-4 py-2 text-gray-700">{new Date(req.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2 text-gray-700">{req.completedAt ? new Date(req.completedAt).toLocaleString('vi-VN') : '-'}</td>
                    <td className="px-4 py-2">
                      {req.type === 'export' && (
                        <button
                          onClick={() => handleDownloadExport(req)}
                          disabled={gdprSubmitting}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                        >
                          <Download className="w-3 h-3" />
                          Tải xuống
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {gdprCount > gdprPageSize && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setGdprPage((p) => Math.max(1, p - 1))}
              disabled={gdprPage === 1 || gdprLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {gdprPage} / {Math.max(1, Math.ceil(gdprCount / gdprPageSize))}
            </span>
            <button
              onClick={() => setGdprPage((p) => p + 1)}
              disabled={gdprPage * gdprPageSize >= gdprCount || gdprLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Terms acceptance log */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Terms acceptance log
          </h3>
          <button
            onClick={loadTermsAcceptances}
            disabled={termsLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${termsLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={termsType}
            onChange={(e) => setTermsType(e.target.value as TermsType | '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả loại</option>
            {TERMS_TYPES.map((type) => (
              <option key={type} value={type}>
                {TERMS_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {termsLoading && termsAcceptances.length === 0 ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : termsAcceptances.length === 0 ? (
          <p className="text-gray-500">Chưa có bản ghi nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">User ID</th>
                  <th className="px-4 py-2 text-left font-medium">Tenant</th>
                  <th className="px-4 py-2 text-left font-medium">Loại</th>
                  <th className="px-4 py-2 text-left font-medium">Phiên bản</th>
                  <th className="px-4 py-2 text-left font-medium">IP</th>
                  <th className="px-4 py-2 text-left font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {termsAcceptances.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-700 truncate max-w-[200px]">{a.userId}</td>
                    <td className="px-4 py-2 text-gray-700">{a.tenantId ? a.tenantId.slice(0, 8) : '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{TERMS_TYPE_LABELS[a.termsType] || a.termsType}</td>
                    <td className="px-4 py-2 text-gray-700">{a.termsVersion}</td>
                    <td className="px-4 py-2 text-gray-700">{a.ipAddress || '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{new Date(a.acceptedAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {termsCount > pageSize && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setTermsPage((p) => Math.max(1, p - 1))}
              disabled={termsPage === 1 || termsLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {termsPage} / {Math.max(1, Math.ceil(termsCount / pageSize))}
            </span>
            <button
              onClick={() => setTermsPage((p) => p + 1)}
              disabled={termsPage * pageSize >= termsCount || termsLoading}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Record acceptance */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-base font-semibold text-gray-800">Ghi nhận chấp thuận điều khoản</h3>
        <form onSubmit={handleRecord} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="User ID"
            value={recordForm.userId}
            onChange={(e) => setRecordForm({ ...recordForm, userId: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Phiên bản"
            value={recordForm.termsVersion}
            onChange={(e) => setRecordForm({ ...recordForm, termsVersion: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={recordForm.termsType}
            onChange={(e) => setRecordForm({ ...recordForm, termsType: e.target.value as TermsType })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TERMS_TYPES.map((type) => (
              <option key={type} value={type}>
                {TERMS_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={recording}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Ghi nhận
          </button>
        </form>
      </div>

      {/* Fraud detection + data retention */}
      <FraudRetentionPanel />
    </div>
  );
}
