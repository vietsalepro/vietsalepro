import React, { useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAdminList } from '../../hooks/useAdminList';
import {
  getAdminAuditLogs,
  AdminAuditLogEntry,
  AdminAuditAction,
} from '../../services/admin/auditAdminService';
import AuditExportPanel from '../../components/admin/AuditExportPanel';
import { listAccounts } from '../../services/admin/tenantAdminService';
import { Tenant } from '../../types/tenant';

const PAGE_SIZE = 50;

const ACTIONS: AdminAuditAction[] = ['INSERT', 'UPDATE', 'DELETE'];

const actionLabel: Record<string, string> = {
  INSERT: 'Thêm',
  UPDATE: 'Cập nhật',
  DELETE: 'Xoá',
};

const actionClass: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));

const DataPreview: React.FC<{ data: any }> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  if (data === null || data === undefined) return <span className="text-gray-400 italic">—</span>;

  const text = JSON.stringify(data, null, 2);
  const short = text.length > 120 ? text.slice(0, 120) + '…' : text;

  return (
    <div className="max-w-xs">
      <pre className="text-xs whitespace-pre-wrap break-all text-gray-700 bg-gray-50 rounded p-1">
        {expanded ? text : short}
      </pre>
      {text.length > 120 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
        >
          {expanded ? 'Thu gọn' : 'Mở rộng'}
        </button>
      )}
    </div>
  );
};

interface AuditFilters {
  tenantId: string;
  actorId: string;
  action: AdminAuditAction | '';
  entityType: string;
  entityId: string;
  dateFrom: string;
  dateTo: string;
  [key: string]: unknown;
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <p className="text-sm text-gray-600">Trang {page} / {totalPages} · {total} kết quả</p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Trước
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

export default function Audit() {
  const {
    data: tenants,
    isLoading: tenantsLoading,
    searchTerm: tenantSearch,
    setSearchTerm: setTenantSearch,
    page: tenantPage,
    setPage: setTenantPage,
    totalCount: tenantTotal,
  } = useAdminList<Tenant>(
    async (params) => {
      const result = await listAccounts({
        search: params.search,
        page: params.page,
        pageSize: params.pageSize,
      });
      return { items: result.accounts, totalCount: result.totalCount };
    },
    { initialPageSize: 20, debounceMs: 300 },
  );

  const {
    data: logs,
    totalCount,
    isLoading,
    error,
    page,
    filters,
    setPage,
    setFilters,
  } = useAdminList<AdminAuditLogEntry, AuditFilters>(
    async (params) => {
      const offset = (params.page - 1) * PAGE_SIZE;
      const result = await getAdminAuditLogs({
        limit: PAGE_SIZE,
        offset,
        tenantId: params.tenantId || null,
        actorId: params.actorId || null,
        action: params.action || null,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        dateFrom: params.dateFrom || null,
        dateTo: params.dateTo || null,
      });
      return { items: result.data, totalCount: result.count ?? 0 };
    },
    {
      initialFilters: { tenantId: '', actorId: '', action: '', entityType: '', entityId: '', dateFrom: '', dateTo: '' },
      initialPageSize: PAGE_SIZE,
    },
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
            Nhật ký hoạt động
          </h1>
          <p className="text-sm text-gray-600 mt-1">Ghi lại các thao tác quản trị trên cửa hàng và thành viên.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Tenant selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-xs font-medium text-gray-700 mb-1">Cửa hàng</label>
        {tenantsLoading && tenants.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải…
          </div>
        ) : (
          <>
            <select
              value={filters.tenantId}
              onChange={(e) => setFilters((prev) => ({ ...prev, tenantId: e.target.value }))}
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả cửa hàng</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subdomain})
                </option>
              ))}
            </select>
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={tenantSearch}
                onChange={(e) => {
                  setTenantSearch(e.target.value);
                  setTenantPage(1);
                }}
                placeholder="Tìm cửa hàng…"
                className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tenantTotal > 20 && (
                <p className="text-sm text-gray-600 self-center">
                  Trang {tenantPage} · {tenantTotal} kết quả
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Actor ID</label>
          <input
            type="text"
            value={filters.actorId}
            onChange={(e) => setFilters((prev) => ({ ...prev, actorId: e.target.value }))}
            placeholder="Actor ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hành động</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value as AdminAuditAction | '' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {actionLabel[a]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Entity type</label>
          <input
            type="text"
            value={filters.entityType}
            onChange={(e) => setFilters((prev) => ({ ...prev, entityType: e.target.value }))}
            placeholder="ví dụ: tenants"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Từ ngày</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Đến ngày</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Export */}
      <AuditExportPanel
        filters={{
          tenantId: filters.tenantId || null,
          actorId: filters.actorId || null,
          action: filters.action || null,
          entityType: filters.entityType || null,
          entityId: filters.entityId || null,
          dateFrom: filters.dateFrom || null,
          dateTo: filters.dateTo || null,
        }}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading && logs.length === 0 && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Đang tải…</span>
          </div>
        )}

        {!isLoading && logs.length === 0 && !error && (
          <div className="p-8 text-center text-gray-500">Không có bản ghi nào.</div>
        )}

        {(logs.length > 0 || isLoading) && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Thời gian</th>
                  <th className="px-4 py-3 text-left font-medium">Actor ID</th>
                  <th className="px-4 py-3 text-left font-medium">Hành động</th>
                  <th className="px-4 py-3 text-left font-medium">Entity type</th>
                  <th className="px-4 py-3 text-left font-medium">Entity ID</th>
                  <th className="px-4 py-3 text-left font-medium">Cửa hàng</th>
                  <th className="px-4 py-3 text-left font-medium">Dữ liệu cũ</th>
                  <th className="px-4 py-3 text-left font-medium">Dữ liệu mới</th>
                  <th className="px-4 py-3 text-left font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={log.actorId ?? undefined}>
                      {log.actorId ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${actionClass[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {actionLabel[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.entityType}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={log.entityId}>
                      {log.entityId}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={log.tenantId ?? undefined}>
                      {log.tenantId ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <DataPreview data={log.oldData} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <DataPreview data={log.newData} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.ipAddress ?? <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pageSize={PAGE_SIZE} total={totalCount} onPageChange={setPage} />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {totalCount} bản ghi · Trang {page}/{totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
