import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { Tenant, UsageSummary } from '../types/tenant';
import { getAllTenants, getTenantUsageSummary } from '../services/tenantService';
import { createInvoice, calculateInvoicePrice } from '../services/invoiceService';
import { CreateInvoiceInput, Invoice } from '../types/billing';

const defaultForm: Omit<CreateInvoiceInput, 'tenantId'> = {
  cycleType: 'monthly',
  quantity: 1,
  bonusMonths: 0,
  notes: '',
};

export default function InvoiceCreator() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTenantsLoading(true);
    getAllTenants()
      .then(list => { if (!cancelled) setTenants(list.filter(t => t.status !== 'archived')); })
      .catch(err => { if (!cancelled) setError(err?.message || 'Không thể tải danh sách cửa hàng.'); })
      .finally(() => { if (!cancelled) setTenantsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedTenantId) {
      setUsage(null);
      return;
    }
    let cancelled = false;
    setUsageLoading(true);
    getTenantUsageSummary(selectedTenantId)
      .then(u => { if (!cancelled) setUsage(u); })
      .catch(() => { if (!cancelled) setUsage(null); })
      .finally(() => { if (!cancelled) setUsageLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTenantId]);

  const preview = useMemo(() => {
    if (!selectedTenantId) return null;
    return calculateInvoicePrice(form, usage?.expiresAt);
  }, [form, usage, selectedTenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const invoice = await createInvoice({ ...form, tenantId: selectedTenantId });
      setCreated(invoice);
      setForm(defaultForm);
      setSelectedTenantId('');
      setUsage(null);
    } catch (err: any) {
      setError(err?.message || 'Tạo hóa đơn thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Tạo hóa đơn thủ công</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 mb-4">
          {error}
        </div>
      )}

      {created && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100 mb-4">
          <p className="font-medium">Đã tạo hóa đơn {created.invoiceNo}</p>
          <p className="text-sm">Tổng tiền: {created.total.toLocaleString('vi-VN')} VNĐ</p>
          <p className="text-sm">Hạn thanh toán: {new Date(created.dueDate).toLocaleDateString('vi-VN')}</p>
          <p className="text-sm">Sử dụng đến: {created.periodEnd ? new Date(created.periodEnd).toLocaleDateString('vi-VN') : '-'}</p>
        </div>
      )}

      {tenantsLoading ? (
        <p className="text-gray-600">Đang tải danh sách cửa hàng...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng</label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Chọn cửa hàng</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chu kỳ</label>
              <select
                value={form.cycleType}
                onChange={(e) => setForm({ ...form, cycleType: e.target.value as 'monthly' | 'yearly' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="monthly">Tháng (69.000đ/tháng)</option>
                <option value="yearly">Năm (59.000đ/tháng)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.cycleType === 'yearly' ? 'Số năm' : 'Số tháng trả trước'}
              </label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tháng tặng</label>
              <input
                type="number"
                min={0}
                value={form.bonusMonths}
                onChange={(e) => setForm({ ...form, bonusMonths: Math.max(0, parseInt(e.target.value || '0', 10)) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {preview && (
            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 space-y-1">
              <p className="text-sm text-gray-600">
                Thời hạn: {new Date(preview.periodStart).toLocaleDateString('vi-VN')} → {new Date(preview.periodEnd).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-sm text-gray-600">
                Đơn giá: {preview.unitPrice.toLocaleString('vi-VN')}đ / tháng · Số tháng: {preview.paidMonths}
              </p>
              <p className="text-base font-semibold text-gray-900">
                Tổng: {preview.total.toLocaleString('vi-VN')} VNĐ
              </p>
              {usageLoading && <p className="text-xs text-gray-500">Đang tính từ ngày hết hạn hiện tại...</p>}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !selectedTenantId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {submitting ? 'Đang tạo...' : 'Tạo hóa đơn'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
