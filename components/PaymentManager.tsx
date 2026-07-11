import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, DollarSign, Receipt, Save, Search } from 'lucide-react';
import { InvoiceWithTenant, Payment } from '../types/billing';
import {
  getAllInvoices,
  getAllPayments,
  confirmPayment,
} from '../services/invoiceService';
import { useToast } from './ToastContainer';

const invoiceStatusLabel: Record<string, string> = {
  draft: 'Nháp',
  open: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  void: 'Đã hủy',
  uncollectible: 'Không thu được',
};

const invoiceStatusClass: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  open: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  void: 'bg-gray-100 text-gray-500',
  uncollectible: 'bg-red-100 text-red-700',
};

const paymentStatusClass: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const paymentMethodLabel: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  cash: 'Tiền mặt',
  card: 'Thẻ',
  other: 'Khác',
};

const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';

export default function PaymentManager() {
  const [invoices, setInvoices] = useState<InvoiceWithTenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'card' | 'other'>('bank_transfer');
  const [referenceCode, setReferenceCode] = useState('');
  const [recording, setRecording] = useState(false);
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [invoiceList, paymentList] = await Promise.all([
        getAllInvoices(),
        getAllPayments(),
      ]);
      setInvoices(invoiceList);
      setPayments(paymentList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter(i =>
      i.invoiceNo.toLowerCase().includes(term) ||
      i.tenantName.toLowerCase().includes(term) ||
      i.tenantSubdomain.toLowerCase().includes(term)
    );
  }, [invoices, search]);

  const openInvoices = useMemo(
    () => invoices.filter(i => i.status === 'open'),
    [invoices]
  );

  const selectedInvoice = useMemo(
    () => invoices.find(i => i.id === selectedInvoiceId),
    [invoices, selectedInvoiceId]
  );

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    setRecording(true);
    try {
      await confirmPayment({
        invoiceId: selectedInvoiceId,
        paymentMethod,
        referenceCode: referenceCode || undefined,
      });
      setReferenceCode('');
      setSelectedInvoiceId('');
      await load();
      addToast({ type: 'success', message: 'Đã ghi nhận thanh toán.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Ghi nhận thanh toán thất bại.' });
    } finally {
      setRecording(false);
    }
  };

  const invoicePayments = (invoiceId?: string) =>
    payments.filter(p => p.invoiceId === invoiceId);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Quản lý thanh toán</h2>
      </div>

      <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 rounded-lg border border-gray-100 bg-gray-50">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Hóa đơn</label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Chọn hóa đơn chưa thanh toán</option>
            {openInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNo} · {inv.tenantName} · {formatCurrency(inv.total)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Phương thức</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="card">Thẻ</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Mã tham chiếu</label>
          <input
            type="text"
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value)}
            placeholder="Ref / Mã giao dịch"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={recording || !selectedInvoiceId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {recording ? 'Đang ghi...' : 'Ghi nhận thanh toán'}
          </button>
        </div>
      </form>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-800">Hóa đơn</h3>
        </div>
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hóa đơn, tên cửa hàng..."
            className="w-full md:w-1/2 pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : filteredInvoices.length === 0 ? (
          <p className="text-gray-500">Không có hóa đơn nào.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2">Số hóa đơn</th>
                  <th className="px-4 py-2">Cửa hàng</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2 text-right">Tổng tiền</th>
                  <th className="px-4 py-2">Lịch sử thanh toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{inv.tenantName}</div>
                      <div className="text-xs text-gray-500">{inv.tenantSubdomain}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${invoiceStatusClass[inv.status]}`}>
                        {invoiceStatusLabel[inv.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3">
                      {invoicePayments(inv.id).length === 0 ? (
                        <span className="text-gray-500 text-xs">Chưa có</span>
                      ) : (
                        <ul className="space-y-1">
                          {invoicePayments(inv.id).map((p) => (
                            <li key={p.id} className="text-xs text-gray-700 flex items-center gap-2">
                              <span className={`inline-flex px-1.5 py-0.5 rounded ${paymentStatusClass[p.status]}`}>
                                {p.status}
                              </span>
                              {paymentMethodLabel[p.paymentMethod]} · {formatCurrency(p.amount)}
                              {p.referenceCode && <span className="text-gray-500">({p.referenceCode})</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
