import React, { useEffect, useState } from 'react';
import {
  Mail, Save, Send, Plus, X, Edit2, Trash2, Eye, RefreshCw, Palette, Image as ImageIcon, Type, User,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import {
  EmailTemplate,
  EmailBrandConfig,
  CreateEmailTemplateInput,
} from '../types/emailTemplate';
import {
  getEmailTemplates,
  getEmailBrand,
  updateEmailBrand,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  sendTemplateEmail,
} from '../services/emailTemplateService';

const defaultBrand: EmailBrandConfig = {
  logoUrl: '',
  brandColor: '#2563eb',
  signatureHtml: 'Trân trọng,<br/>Đội ngũ VietSales Pro',
  fromName: 'VietSales Pro',
};

const emptyTemplate: CreateEmailTemplateInput = {
  key: '',
  name: '',
  description: '',
  subject: '',
  bodyHtml: '',
  variables: [],
  isDefault: false,
  isActive: true,
};

const formatDate = (d?: string) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

const renderPreview = (brand: EmailBrandConfig, template: EmailTemplate | null) => {
  if (!template) return '';
  const body = template.bodyHtml
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => `[${key}]`);
  const logo = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="logo" style="max-height:56px;max-width:180px;display:block;margin-bottom:12px" />`
    : '';
  return `
<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;max-width:640px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;padding:16px">
  <div style="border-bottom:3px solid ${brand.brandColor};padding-bottom:12px;margin-bottom:16px">${logo}</div>
  <div>${body}</div>
  <p style="margin-top:24px">${brand.signatureHtml}</p>
</div>`;
};

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [brand, setBrand] = useState<EmailBrandConfig>(defaultBrand);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEmailTemplateInput>(emptyTemplate);
  const [variablesInput, setVariablesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, b] = await Promise.all([getEmailTemplates(), getEmailBrand()]);
      setTemplates(list);
      setBrand(b);
    } catch (err: any) {
      setError(err?.message || 'Không tải được cấu hình email.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.key.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && t.isActive) ||
      (activeFilter === 'inactive' && !t.isActive);
    return matchesSearch && matchesActive;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyTemplate });
    setVariablesInput('');
    setShowForm(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setEditingId(t.id);
    setForm({
      key: t.key,
      name: t.name,
      description: t.description ?? '',
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      variables: t.variables,
      isDefault: t.isDefault,
      isActive: t.isActive,
    });
    setVariablesInput(t.variables.join('\n'));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyTemplate);
    setVariablesInput('');
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await updateEmailBrand(brand);
      setSuccess('Đã lưu cấu hình thương hiệu email.');
    } catch (err: any) {
      setError(err?.message || 'Lưu cấu hình thương hiệu thất bại.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const variables = variablesInput
        .split(/\n/)
        .map((s) => s.trim())
        .filter((s) => /^[a-zA-Z0-9_]+$/.test(s));
      const payload: CreateEmailTemplateInput = {
        ...form,
        key: form.key.trim().toLowerCase(),
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        variables,
      };
      if (editingId) {
        await updateEmailTemplate(editingId, {
          name: payload.name,
          description: payload.description,
          subject: payload.subject,
          bodyHtml: payload.bodyHtml,
          variables: payload.variables,
          isActive: payload.isActive,
        });
      } else {
        await createEmailTemplate(payload);
      }
      closeForm();
      await load();
      setSuccess('Đã lưu mẫu email.');
    } catch (err: any) {
      setError(err?.message || 'Lưu mẫu email thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      setError('Không xóa mẫu mặc định của hệ thống.');
      return;
    }
    if (!window.confirm('Xóa mẫu email này?')) return;
    setError(null);
    try {
      await deleteEmailTemplate(id);
      await load();
      setSuccess('Đã xóa mẫu email.');
    } catch (err: any) {
      setError(err?.message || 'Xóa mẫu email thất bại.');
    }
  };

  const handleSendTest = async (template: EmailTemplate) => {
    if (!testEmail || !testEmail.includes('@')) {
      setError('Vui lòng nhập email hợp lệ để gửi thử.');
      return;
    }
    setSendingTest(true);
    setError(null);
    setSuccess(null);
    try {
      await sendTemplateEmail({
        templateKey: template.key,
        to: testEmail,
        variables: { brand_name: brand.fromName },
        test: true,
      });
      setSuccess(`Đã gửi thử mẫu "${template.name}" đến ${testEmail}.`);
    } catch (err: any) {
      setError(err?.message || 'Gửi thử email thất bại.');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mẫu email</h2>
              <p className="text-sm text-gray-500">Soạn thảo template, cấu hình logo/màu sắc/chữ ký, gửi thử.</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Tạo mẫu mới
          </button>
        </div>

        {(error || success) && (
          <div className={`mb-4 p-3 text-sm rounded-lg ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {error || success}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, key, mô tả..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bật</option>
            <option value="inactive">Đang tắt</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : filteredTemplates.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có mẫu email nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Mẫu</th>
                  <th className="px-3 py-2 text-left font-medium">Biến</th>
                  <th className="px-3 py-2 text-left font-medium">Trạng thái</th>
                  <th className="px-3 py-2 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTemplates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.key}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">{t.description}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {t.variables.map((v) => (
                          <span key={v} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {t.isActive ? 'Bật' : 'Tắt'}
                      </span>
                      {t.isDefault && (
                        <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Mặc định</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => setPreviewTemplate(t)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Xem trước"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.isDefault)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title={t.isDefault ? 'Không xóa mẫu mặc định' : 'Xóa'}
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

      {/* Brand config */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Thương hiệu email</h3>
            <p className="text-sm text-gray-500">Logo, màu chủ đạo, chữ ký và tên người gửi áp dụng cho mọi email.</p>
          </div>
        </div>
        <form onSubmit={handleSaveBrand} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="inline-flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Logo URL</span>
            </label>
            <input
              type="text"
              value={brand.logoUrl}
              onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="inline-flex items-center gap-1"><Palette className="w-4 h-4" /> Màu chủ đạo</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brand.brandColor}
                onChange={(e) => setBrand({ ...brand, brandColor: e.target.value })}
                className="h-9 w-12 rounded border border-gray-300"
              />
              <input
                type="text"
                value={brand.brandColor}
                onChange={(e) => setBrand({ ...brand, brandColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="inline-flex items-center gap-1"><User className="w-4 h-4" /> Tên người gửi</span>
            </label>
            <input
              type="text"
              value={brand.fromName}
              onChange={(e) => setBrand({ ...brand, fromName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VietSales Pro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="inline-flex items-center gap-1"><Type className="w-4 h-4" /> Chữ ký (HTML)</span>
            </label>
            <input
              type="text"
              value={brand.signatureHtml}
              onChange={(e) => setBrand({ ...brand, signatureHtml: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Trân trọng,..."
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
            >
              <Save className="w-4 h-4" />
              Lưu thương hiệu
            </button>
          </div>
        </form>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Sửa mẫu email' : 'Tạo mẫu email'}
              </h3>
              <button onClick={closeForm} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="billing_reminder"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên mẫu</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhắc thanh toán hóa đơn"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả ngắn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề (subject template)</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="[{{brand_name}}] Nhắc thanh toán hóa đơn {{invoice_no}}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung HTML (body template)</label>
                <textarea
                  required
                  rows={8}
                  value={form.bodyHtml}
                  onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="<p>Kính gửi {{tenant_name}},...</p>"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biến (mỗi biến trên một dòng)</label>
                <textarea
                  rows={3}
                  value={variablesInput}
                  onChange={(e) => setVariablesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="brand_name\ntenant_name\ninvoice_no"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Kích hoạt template</label>
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

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Xem trước: {previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email gửi thử</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSendTest(previewTemplate)}
                    disabled={sendingTest}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sendingTest ? 'Đang gửi...' : 'Gửi thử'}
                  </button>
                </div>
              </div>
              <div
                className="border border-gray-100 rounded-lg p-2"
                dangerouslySetInnerHTML={{ __html: renderPreview(brand, previewTemplate) }}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
