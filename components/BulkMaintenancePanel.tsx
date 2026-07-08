import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { DashboardV2KPI } from '../pages/Dashboard';
import {
  MaintenanceWindow,
  MaintenanceWindowStatus,
  Tenant,
  TenantPlan,
  TenantStatus,
} from '../types/tenant';
import { getAllTenants } from '../services/tenantService';
import {
  bulkUpdateTenants,
  createMaintenanceWindow,
  deleteMaintenanceWindow,
  getMaintenanceWindows,
  updateMaintenanceWindow,
} from '../services/maintenanceService';

const STATUS_OPTIONS: TenantStatus[] = ['active', 'suspended', 'trial', 'pending', 'archived', 'read_only'];
const PLAN_OPTIONS: TenantPlan[] = ['free', 'vip'];
const WINDOW_STATUS_OPTIONS: MaintenanceWindowStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];

const statusLabel = (status: TenantStatus) => {
  switch (status) {
    case 'active': return 'Hoạt động';
    case 'suspended': return 'Tạm dừng';
    case 'trial': return 'Dùng thử';
    case 'pending': return 'Chờ duyệt';
    case 'archived': return 'Đã lưu trữ';
    case 'read_only': return 'Hết hạn (chỉ đọc)';
    default: return status;
  }
};

const windowStatusLabel = (status: MaintenanceWindowStatus) => {
  switch (status) {
    case 'scheduled': return 'Đã lên lịch';
    case 'in_progress': return 'Đang bảo trì';
    case 'completed': return 'Hoàn tất';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
};

const windowStatusClass = (status: MaintenanceWindowStatus) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-700';
    case 'in_progress': return 'bg-amber-100 text-amber-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'cancelled': return 'bg-gray-200 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
};

function toLocalInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInputValue(value: string): Date {
  const d = new Date(value);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() + offset * 60000);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function BulkMaintenancePanel() {
  // -- Tenants / bulk state --
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<TenantStatus | ''>('');
  const [bulkPlan, setBulkPlan] = useState<TenantPlan | ''>('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ updated: number; skipped: number } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // -- Maintenance windows state --
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [windowLoading, setWindowLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingWindow, setEditingWindow] = useState<MaintenanceWindow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStartsAt, setFormStartsAt] = useState('');
  const [formEndsAt, setFormEndsAt] = useState('');
  const [formStatus, setFormStatus] = useState<MaintenanceWindowStatus>('scheduled');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadTenants = async () => {
    setTenantLoading(true);
    try {
      const data = await getAllTenants();
      setTenants(data);
    } finally {
      setTenantLoading(false);
    }
  };

  const loadWindows = async () => {
    setWindowLoading(true);
    try {
      const start = startOfMonth(currentMonth).toISOString();
      const end = endOfMonth(currentMonth).toISOString();
      const data = await getMaintenanceWindows({ start, end });
      setWindows(data);
    } finally {
      setWindowLoading(false);
    }
  };

  const loadAll = async () => {
    setBulkError(null);
    setFormError(null);
    await Promise.all([loadTenants(), loadWindows()]);
  };

  useEffect(() => {
    loadAll();
  }, [currentMonth]);

  // -- Calendar grid --
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days: Date[] = [];
    const firstDayOfWeek = start.getDay(); // 0 = Sunday
    const padDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday-first
    for (let i = padDays - 1; i >= 0; i--) {
      days.push(new Date(start.getTime() - (i + 1) * 86400000));
    }
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1];
      days.push(new Date(last.getTime() + 86400000));
    }
    return days;
  }, [currentMonth]);

  const windowsByDay = useMemo(() => {
    const map = new Map<string, MaintenanceWindow[]>();
    windows.forEach((w) => {
      const start = new Date(w.startsAt);
      const end = new Date(w.endsAt);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toDateString();
        const arr = map.get(key) || [];
        arr.push(w);
        map.set(key, arr);
      }
    });
    return map;
  }, [windows]);

  // -- Bulk actions --
  const toggleSelectAll = () => {
    if (selectedIds.size === tenants.length && tenants.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tenants.map((t) => t.id)));
    }
  };

  const toggleTenant = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) {
      setBulkError('Vui lòng chọn ít nhất một tenant.');
      return;
    }
    if (!bulkStatus && !bulkPlan) {
      setBulkError('Vui lòng chọn trạng thái hoặc gói mới.');
      return;
    }
    setBulkSubmitting(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const result = await bulkUpdateTenants(Array.from(selectedIds), {
        status: bulkStatus || undefined,
        plan: bulkPlan || undefined,
      });
      setBulkResult({ updated: result.updated, skipped: result.skippedIds.length });
      await loadTenants();
    } catch (err: any) {
      setBulkError(err?.message || 'Cập nhật hàng loạt thất bại.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // -- Maintenance form --
  const openCreateForm = (date?: Date) => {
    setEditingWindow(null);
    setFormTitle('');
    setFormDescription('');
    setFormStatus('scheduled');
    const base = date || new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0);
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 11, 0, 0);
    setFormStartsAt(toLocalInputValue(start));
    setFormEndsAt(toLocalInputValue(end));
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (w: MaintenanceWindow) => {
    setEditingWindow(w);
    setFormTitle(w.title);
    setFormDescription(w.description || '');
    setFormStatus(w.status);
    setFormStartsAt(toLocalInputValue(new Date(w.startsAt)));
    setFormEndsAt(toLocalInputValue(new Date(w.endsAt)));
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingWindow(null);
    setFormError(null);
  };

  const handleSaveWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Tiêu đề không được để trống.');
      return;
    }
    const startsAt = fromLocalInputValue(formStartsAt).toISOString();
    const endsAt = fromLocalInputValue(formEndsAt).toISOString();
    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingWindow) {
        await updateMaintenanceWindow(editingWindow.id, {
          title: formTitle,
          description: formDescription,
          startsAt,
          endsAt,
          status: formStatus,
        });
      } else {
        await createMaintenanceWindow({
          title: formTitle,
          description: formDescription,
          startsAt,
          endsAt,
          status: formStatus,
        });
      }
      closeForm();
      await loadWindows();
    } catch (err: any) {
      setFormError(err?.message || 'Lưu maintenance window thất bại.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteWindow = async (id: string) => {
    if (!confirm('Xóa maintenance window này?')) return;
    try {
      await deleteMaintenanceWindow(id);
      await loadWindows();
    } catch (err: any) {
      setFormError(err?.message || 'Xóa maintenance window thất bại.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Bulk operations & Bảo trì</h2>
        <button
          onClick={loadAll}
          disabled={tenantLoading || windowLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${tenantLoading || windowLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardV2KPI
          title="Tenant đã chọn"
          value={selectedIds.size}
          icon={<CheckSquare className="w-6 h-6" />}
          variant={selectedIds.size > 0 ? 'success' : 'primary'}
          subtitle="sẵn sàng cập nhật hàng loạt"
        />
        <DashboardV2KPI
          title="Maintenance windows"
          value={windows.length}
          icon={<Wrench className="w-6 h-6" />}
          variant="primary"
          subtitle={`tháng ${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`}
        />
        <DashboardV2KPI
          title="Đang lên lịch"
          value={windows.filter((w) => w.status === 'scheduled').length}
          icon={<CalendarIcon className="w-6 h-6" />}
          variant="warning"
          subtitle="chưa diễn ra"
        />
        <DashboardV2KPI
          title="Đã hoàn tất"
          value={windows.filter((w) => w.status === 'completed').length}
          icon={<Clock className="w-6 h-6" />}
          variant="success"
          subtitle="trong tháng này"
        />
      </div>

      {/* Bulk operations */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-gray-500" />
          <h3 className="text-base font-semibold text-gray-800">Cập nhật hàng loạt tenant</h3>
        </div>

        {bulkError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 text-sm">{bulkError}</div>
        )}
        {bulkResult && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-100 text-sm">
            Đã cập nhật {bulkResult.updated} tenant, bỏ qua {bulkResult.skipped}.
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái mới</label>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as TenantStatus | '')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Giữ nguyên --</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gói mới</label>
            <select
              value={bulkPlan}
              onChange={(e) => setBulkPlan(e.target.value as TenantPlan | '')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Giữ nguyên --</option>
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>{p.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleBulkUpdate}
            disabled={bulkSubmitting || selectedIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {bulkSubmitting ? 'Đang cập nhật...' : 'Áp dụng'}
          </button>
        </div>

        {tenantLoading && tenants.length === 0 ? (
          <p className="text-sm text-gray-500">Đang tải danh sách tenant...</p>
        ) : (
          <div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-100 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-gray-500">
                  <th className="p-3 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={tenants.length > 0 && selectedIds.size === tenants.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 font-medium">Tên cửa hàng</th>
                  <th className="p-3 font-medium">Subdomain</th>
                  <th className="p-3 font-medium">Trạng thái</th>
                  <th className="p-3 font-medium">Gói</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleTenant(t.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-3 font-medium text-gray-700">{t.name}</td>
                    <td className="p-3 text-gray-500">{t.subdomain}</td>
                    <td className="p-3">{statusLabel(t.status)}</td>
                    <td className="p-3 uppercase">{t.plan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance calendar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-base font-semibold text-gray-800">Lịch bảo trì</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {currentMonth.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => openCreateForm()}
              className="ml-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              + Thêm
            </button>
          </div>
        </div>

        {formError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 text-sm">{formError}</div>
        )}

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-1">
          <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const key = day.toDateString();
            const dayWindows = windowsByDay.get(key) || [];
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            return (
              <button
                key={idx}
                onClick={() => openCreateForm(day)}
                className={`min-h-[80px] p-2 rounded-lg border text-left transition-colors ${
                  isCurrentMonth ? 'border-gray-100 bg-white hover:bg-blue-50' : 'border-gray-50 bg-gray-50 text-gray-400'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayWindows.slice(0, 3).map((w) => (
                    <div
                      key={w.id}
                      onClick={(e) => { e.stopPropagation(); openEditForm(w); }}
                      className={`text-[10px] px-1 py-0.5 rounded truncate ${windowStatusClass(w.status)}`}
                      title={w.title}
                    >
                      {w.title}
                    </div>
                  ))}
                  {dayWindows.length > 3 && (
                    <div className="text-[10px] text-gray-500">+{dayWindows.length - 3}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Window list */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Danh sách maintenance windows</h4>
          {windowLoading && windows.length === 0 ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : windows.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có maintenance window nào trong tháng này.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Tiêu đề</th>
                    <th className="pb-2 font-medium">Bắt đầu</th>
                    <th className="pb-2 font-medium">Kết thúc</th>
                    <th className="pb-2 font-medium">Trạng thái</th>
                    <th className="pb-2 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {windows.map((w) => (
                    <tr key={w.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 font-medium text-gray-700">
                        {w.title}
                        {w.description && <div className="text-xs text-gray-500 font-normal">{w.description}</div>}
                      </td>
                      <td className="py-2 text-gray-600">{formatDateTime(w.startsAt)}</td>
                      <td className="py-2 text-gray-600">{formatDateTime(w.endsAt)}</td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${windowStatusClass(w.status)}`}>
                          {windowStatusLabel(w.status)}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEditForm(w)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWindow(w.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {editingWindow ? 'Sửa maintenance window' : 'Thêm maintenance window'}
              </h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveWindow} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Bảo trì hệ thống..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={formStartsAt}
                    onChange={(e) => setFormStartsAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={formEndsAt}
                    onChange={(e) => setFormEndsAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as MaintenanceWindowStatus)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WINDOW_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{windowStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang lưu...' : <><Save className="w-4 h-4 inline mr-1" /> Lưu</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
