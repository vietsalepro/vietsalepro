import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useToast } from '../ToastContainer';
import {
  exportAuditLogs,
  AdminAuditExportFormat,
  AdminAuditLogFilter,
  AdminAuditAction,
} from '../../services/admin/auditAdminService';

interface AuditExportPanelProps {
  filters: AdminAuditLogFilter;
}

const FORMAT_OPTIONS: { value: AdminAuditExportFormat; label: string; icon: React.ElementType }[] = [
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'json', label: 'JSON', icon: FileJson },
];

const ACTION_OPTIONS: Array<AdminAuditAction | ''> = ['', 'INSERT', 'UPDATE', 'DELETE'];

export default function AuditExportPanel({ filters }: AuditExportPanelProps) {
  const { addToast } = useToast();
  const [format, setFormat] = useState<AdminAuditExportFormat>('csv');
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(filters.dateTo ?? '');
  const [action, setAction] = useState<AdminAuditAction | ''>(filters.action ?? '');
  const [entityType, setEntityType] = useState(filters.entityType ?? '');
  const [entityId, setEntityId] = useState(filters.entityId ?? '');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await exportAuditLogs({
        format,
        tenantId: filters.tenantId,
        actorId: filters.actorId,
        action: action || null,
        entityType: entityType || null,
        entityId: entityId || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      });
      saveAs(blob, filename);
      addToast({ type: 'success', message: `Đã xuất ${filename}.` });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Xuất audit log thất bại.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Download className="w-5 h-5" />
        Xuất audit log
      </h2>
      <p className="text-sm text-gray-600">Xuất toàn bộ bản ghi khớp bộ lọc ra file CSV hoặc JSON.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="audit-export-from" className="block text-xs font-medium text-gray-700 mb-1">Từ ngày</label>
          <input
            id="audit-export-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="audit-export-to" className="block text-xs font-medium text-gray-700 mb-1">Đến ngày</label>
          <input
            id="audit-export-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="audit-export-action" className="block text-xs font-medium text-gray-700 mb-1">Hành động</label>
          <select
            id="audit-export-action"
            value={action}
            onChange={(e) => setAction(e.target.value as AdminAuditAction | '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a || 'Tất cả'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Định dạng</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {FORMAT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormat(value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm ${
                  format === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                aria-pressed={format === value}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="audit-export-entity-type" className="block text-xs font-medium text-gray-700 mb-1">Loại thực thể</label>
          <input
            id="audit-export-entity-type"
            type="text"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="VD: tenants"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="audit-export-entity-id" className="block text-xs font-medium text-gray-700 mb-1">Entity ID</label>
          <input
            id="audit-export-entity-id"
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="UUID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
      >
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Xuất {format.toUpperCase()}
      </button>
    </div>
  );
}
