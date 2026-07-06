import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, CreditCard, FileText } from 'lucide-react';
import { Tenant } from '../types/tenant';
import { getAllTenants } from '../services/tenantService';
import { Invoice, Payment } from '../types/billing';
import { getInvoicesByTenant, confirmPayment, sendBillingEmail } from '../services/invoiceService';

const statusLabel = (status: Invoice['status']) => {
  switch (status) {
    case 'pending': return 'Chờ thanh toán';
    case 'overdue': return 'Quá hạn';
    case 'expired': return 'Hết hạn';
    case 'paid': return 'Đã thanh toán';
    case 'cancelled': return 'Đã hủy';
    case 'draft': return 'Nháp';
    default: return status;
  }
};

export default function InvoicePaymentConfirm() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailNote, setEmailNote] = useState<string | null>(null);

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
      setInvoices([]);
      setSelectedInvoiceId('');
      setPayment(null);
      return;
    }
    let cancelled = false;
    setInvoicesLoading(true);
    setPayment(null);
    getInvoicesByTenant(selectedTenantId)
      .then(list => {
        if (!cancelled) {
          setInvoices(list);
          setSelectedInvoiceId(list[0]?.id ?? '');
        }
      })
      .catch(err => { if (!cancelled) setError(err?.message || 'Không thể tải hóa đơn.'); })
      .finally(() => { if (!cancelled) setInvoicesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTenantId]);

  const selectedInvoice = useMemo(
    () => invoices.find(i => i.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId]
  );

  const canConfirm = selectedInvoice && !['paid', 'cancelled', 'draft'].includes(selectedInvoice.status);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setConfirming(true);
    setError(null);
    setPayment(null);
    setEmailNote(null);
    try {
      const p = await confirmPayment({ invoiceId: selectedInvoice.id });
      setPayment(p);
      const refreshed = await getInvoicesByTenant(selectedInvoice.tenantId);
      setInvoices(refreshed);
      setSelectedInvoiceId(refreshed.find(i => i.id === selectedInvoice.id)?.id ?? '');
      // Gửi email xác nhận (best-effort, không chặn nếu Resend/email lỗi).
      try {
        await sendBillingEmail({ invoiceId: selectedInvoice.id, type: 'confirmation' });
        setEmailNote('Đã gửi email xác nhận cho cửa hàng.');
      } catch (emailErr: any) {
        setEmailNote(`Không gửi được email xác nhận: ${emailErr?.message || 'lỗi không xác định'}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Xác nhận thanh toán thất bại.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-800">Xác nhận thanh toán</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 mb-4">
          {error}
        </div>
      )}

      {payment && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100 mb-4">
          <p className="font-medium">Đã xác nhận thanh toán {payment.amount.toLocaleString('vi-VN')} VNĐ</p>
          <p className="text-sm">Phương thức: {payment.paymentMethod}</p>
          <p className="text-sm">Ngày: {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}</p>
          {emailNote && <p className="text-sm mt-1">{emailNote}</p>}
        </div>
      )}

      {tenantsLoading ? (
        <p className="text-gray-600">Đang tải danh sách cửa hàng...</p>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng</label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Chọn cửa hàng</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
              ))}
            </select>
          </div>

          {selectedTenantId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hóa đơn</label>
              {invoicesLoading ? (
                <p className="text-gray-600">Đang tải hóa đơn...</p>
              ) : invoices.length === 0 ? (
                <p className="text-gray-600">Không có hóa đơn.</p>
              ) : (
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => { setSelectedInvoiceId(e.target.value); setPayment(null); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {invoices.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.invoiceNo} — {statusLabel(i.status)} — {i.total.toLocaleString('vi-VN')} VNĐ
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectedInvoice && (
            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 space-y-1">
              <div className="flex items-center gap-2 text-gray-800 font-medium">
                <FileText className="w-4 h-4" />
                Chi tiết hóa đơn {selectedInvoice.invoiceNo}
              </div>
              <p className="text-sm text-gray-600">
                Trạng thái: <span className="font-medium">{statusLabel(selectedInvoice.status)}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tổng tiền: <span className="font-medium">{selectedInvoice.total.toLocaleString('vi-VN')} VNĐ</span>
              </p>
              <p className="text-sm text-gray-600">
                Hạn thanh toán: {new Date(selectedInvoice.dueDate).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-sm text-gray-600">
                Sử dụng đến: {selectedInvoice.periodEnd ? new Date(selectedInvoice.periodEnd).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={confirming || !canConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {confirming ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
