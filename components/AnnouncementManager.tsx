import React, { useEffect, useMemo, useState } from 'react';
import {
  Megaphone, Plus, X, Search, Calendar, Save, Trash2, Edit2, Archive,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Announcement,
  AnnouncementStatus,
  AnnouncementTargetType,
  CreateAnnouncementInput,
} from '../types/announcement';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  announcementStatusLabel,
  announcementTargetTypeLabel,
  todayStr,
} from '../services/announcementService';
import { getAllTenants } from '../services/tenantService';
import { Tenant } from '../types/tenant';

const STATUS_LIST: AnnouncementStatus[] = ['draft', 'scheduled', 'active', 'archived'];
const TARGET_TYPE_LIST: AnnouncementTargetType[] = ['all', 'specific_tenants', 'specific_plans'];

const statusClass = (status: AnnouncementStatus) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'scheduled': return 'bg-blue-100 text-blue-700';
    case 'archived': return 'bg-gray-200 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const formatDate = (d?: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('vi-VN');
};

const emptyForm: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'createdBy'> = {
  title: '',
  content: '',
  targetType: 'all',
  targets: [],
  status: 'draft',
  scheduledAt: '',
  expiresAt: '',
};

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [targetsInput, setTargetsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, t] = await Promise.all([
        getAnnouncements({ status: statusFilter || undefined, searchTerm: debouncedSearch || undefined }),
        getAllTenants(),
      ]);
      setAnnouncements(list);
      setTenants(t);
    } catch (err: any) {
      setError(err?.message || 'Không tải được danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, debouncedSearch]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, status: 'draft' });
    setTargetsInput('');
    setShowForm(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      content: a.content,
      targetType: a.targetType,
      targets: a.targets || [],
      status: a.status,
      scheduledAt: a.scheduledAt || '',
      expiresAt: a.expiresAt || '',
    });
    setTargetsInput((a.targets || []).join('\n'));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setTargetsInput('');
  };

  const parseTargets = (raw: string): string[] => {
    return raw
      .split(/\n/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const targets = parseTargets(targetsInput);
      const payload: CreateAnnouncementInput = {
        title: form.title.trim(),
        content: form.content.trim(),
        targetType: form.targetType,
        targets: form.targetType === 'all' ? undefined : targets,
        status: form.status,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      if (editingId) {
        await updateAnnouncement(editingId, payload);
      } else {
        await createAnnouncement(payload);
      }
      closeForm();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Lưu thông báo thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa thông báo này?')) return;
    setError(null);
    try {
      await deleteAnnouncement(id);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Xóa thông báo thất bại.');
    }
  };

  const handleArchive = async (id: string) => {
    setError(null);
    try {
      await updateAnnouncement(id, { status: 'archived' });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Lưu trữ thông báo thất bại.');
    }
  };

  const targetPreview = (a: Announcement) => {
    if (a.targetType === 'all') return 'Tất cả';
    const count = a.targets?.length ?? 0;
    return `${announcementTargetTypeLabel(a.targetType)} (${count})`;
  };

  const targetHint = useMemo(() => {
    if (form.targetType === 'specific_tenants') {
      return 'Nhập mỗi tenant ID trên một dòng.';
    }
    if (form.targetType === 'specific_plans') {
      return 'Nhập tên gói trên mỗi dòng (ví dụ: free, vip).';
    }
    return '';
  }, [form.targetType]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Megaphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Thông báo</h2>
              <p className="text-sm text-gray-500">Tạo và lên lịch thông báo hiển thị trong app tenant.</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Tạo thông báo
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as AnnouncementStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_LIST.map(s => (
              <option key={s} value={s}>{announcementStatusLabel(s)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có thông báo nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Tiêu đề</th>
                  <th className="px-3 py-2 text-left font-medium">Đối tượng</th>
                  <th className="px-3 py-2 text-left font-medium">Trạng thái</th>
                  <th className="px-3 py-2 text-left font-medium">Lên lịch</th>
                  <th className="px-3 py-2 text-left font-medium">Hết hạn</th>
                  <th className="px-3 py-2 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {announcements.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">{a.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{a.content}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{targetPreview(a)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusClass(a.status)}`}>
                        {announcementStatusLabel(a.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{formatDate(a.scheduledAt)}</td>
                    <td className="px-3 py-3 text-gray-600">{formatDate(a.expiresAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {a.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(a.id)}
                            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Lưu trữ"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Sửa thông báo' : 'Tạo thông báo'}
              </h3>
              <button onClick={closeForm} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tiêu đề thông báo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nội dung thông báo..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng</label>
                  <select
                    value={form.targetType}
                    onChange={e => setForm({ ...form, targetType: e.target.value as AnnouncementTargetType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TARGET_TYPE_LIST.map(t => (
                      <option key={t} value={t}>{announcementTargetTypeLabel(t)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as AnnouncementStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_LIST.map(s => (
                      <option key={s} value={s}>{announcementStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
              {form.targetType !== 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách đối tượng</label>
                  <textarea
                    rows={3}
                    value={targetsInput}
                    onChange={e => setTargetsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={targetHint}
                  />
                  <p className="text-xs text-gray-500 mt-1">{targetHint}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lên lịch (không bắt buộc)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Để trống nếu muốn active ngay.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn (không bắt buộc)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
