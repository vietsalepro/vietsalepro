import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText, Download, Eye, X, Clock, Building2, CreditCard, Search, Mail,
} from 'lucide-react';
import {
  InvoiceWithTenant,
  InvoiceDetail,
  Invoice,
  InvoiceItem,
  Payment,
  BankAccount,
  CompanyInfo,
} from '../types/billing';
import {
  getAllInvoices,
  getInvoiceById,
  sendBillingEmail,
} from '../services/invoiceService';
import {
  getBankAccounts,
  getCompanyInfo,
} from '../services/bankAccountService';
import { exportInvoiceToPdf } from '../utils/invoicePdfExport';

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

const statusBadgeClass = (status: Invoice['status']) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700';
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'overdue': return 'bg-red-100 text-red-700';
    case 'expired': return 'bg-gray-200 text-gray-600';
    case 'cancelled': return 'bg-gray-100 text-gray-500';
    case 'draft': return 'bg-blue-50 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';

const countdownText = (dueDate: string, status: Invoice['status'], now: number) => {
  if (status === 'paid') return 'Đã thanh toán';
  if (status === 'cancelled') return 'Đã hủy';
  if (status === 'expired') return 'Hết hạn';
  if (status === 'draft') return 'Nháp';
  const due = new Date(dueDate + 'T00:00:00').getTime();
  const diff = due - now;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  if (diff > 0) return `Còn ${h}g ${m}p ${s}s`;
  return `Quá hạn ${h}g ${m}p ${s}s`;
};

const paymentMethodLabel = (method: Payment['paymentMethod']) => {
  switch (method) {
    case 'bank_transfer': return 'Chuyển khoản';
    case 'cash': return 'Tiền mặt';
    case 'card': return 'Thẻ';
    case 'other': return 'Khác';
    default: return method;
  }
};

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState<InvoiceWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | ''>('');
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(Date.now());

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailNote, setEmailNote] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAllInvoices()
      .then(list => { if (!cancelled) setInvoices(list); })
      .catch(err => { if (!cancelled) setError(err?.message || 'Không thể tải danh sách hóa đơn.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBankAccounts(), getCompanyInfo()])
      .then(([accounts, company]) => {
        if (!cancelled) {
          setBankAccounts(accounts);
          setCompanyInfo(company);
        }
      })
      .catch(() => { /* không chặn UI nếu cấu hình thanh toán lỗi */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!detailOpen || !detailId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    getInvoiceById(detailId)
      .then(d => {
        if (!cancelled) {
          if (d) setDetail(d);
          else setDetailError('Không tìm thấy hóa đơn.');
        }
      })
      .catch(err => { if (!cancelled) setDetailError(err?.message || 'Không thể tải chi tiết hóa đơn.'); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [detailOpen, detailId]);

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return invoices.filter(i => {
      const matchesStatus = statusFilter ? i.status === statusFilter : true;
      const matchesSearch = term
        ? (i.invoiceNo.toLowerCase().includes(term)
          || i.tenantName.toLowerCase().includes(term)
          || i.tenantSubdomain.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [invoices, statusFilter, search]);

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
    setDetail(null);
    setEmailNote(null);
  };

  const handleSendReminder = async () => {
    if (!detailId) return;
    setSendingEmail(true);
    setEmailNote(null);
    try {
      await sendBillingEmail({ invoiceId: detailId, type: 'reminder' });
      setEmailNote('Đã gửi email nhắc thanh toán.');
    } catch (err: any) {
      setEmailNote(`Gửi email thất bại: ${err?.message || 'lỗi không xác định'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailId(null);
    setDetail(null);
  };

  const handleExportPdf = async () => {
    if (!pdfRef.current || !detail?.invoice) return;
    setPdfExporting(true);
    try {
      const filename = `${detail.invoice.invoiceNo || 'HoaDon'}.pdf`;
      await exportInvoiceToPdf(pdfRef.current, filename);
    } catch (err: any) {
      setDetailError(err?.message || 'Xuất PDF thất bại.');
    } finally {
      setPdfExporting(false);
    }
  };

  const selectedInvoice = useMemo(
    () => invoices.find(i => i.id === detailId) || null,
    [invoices, detailId]
  );

  const defaultBank = bankAccounts.find(b => b.isDefault) || bankAccounts[0];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Quản lý hóa đơn</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hóa đơn, tên cửa hàng..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Invoice['status'] | '')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="overdue">Quá hạn</option>
          <option value="expired">Hết hạn</option>
          <option value="cancelled">Đã hủy</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">Đang tải danh sách hóa đơn...</p>
      ) : filteredInvoices.length === 0 ? (
        <p className="text-gray-600">Không có hóa đơn nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2 rounded-l-lg">Số hóa đơn</th>
                <th className="text-left px-3 py-2">Cửa hàng</th>
                <th className="text-left px-3 py-2">Trạng thái</th>
                <th className="text-right px-3 py-2">Tổng tiền</th>
                <th className="text-left px-3 py-2">Hạn thanh toán</th>
                <th className="text-left px-3 py-2">Thời gian còn lại</th>
                <th className="text-center px-3 py-2 rounded-r-lg">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900">{invoice.invoiceNo}</td>
                  <td className="px-3 py-3 text-gray-700">
                    <div>{invoice.tenantName}</div>
                    <div className="text-xs text-gray-500">{invoice.tenantSubdomain}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusBadgeClass(invoice.status)}`}>
                      {statusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-3 py-3 text-gray-700">{formatDate(invoice.dueDate)}</td>
                  <td className="px-3 py-3 text-gray-700">
                    <span className={`inline-flex items-center gap-1 ${invoice.status === 'overdue' || (invoice.status === 'pending' && new Date(invoice.dueDate + 'T00:00:00').getTime() < now) ? 'text-red-600 font-medium' : ''}`}>
                      <Clock className="w-3.5 h-3.5" />
                      {countdownText(invoice.dueDate, invoice.status, now)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => openDetail(invoice.id)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" /> Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-800">
                Chi tiết hóa đơn {selectedInvoice.invoiceNo}
              </h3>
              <div className="flex items-center gap-2">
                {!['paid', 'cancelled', 'draft'].includes(selectedInvoice.status) && (
                  <button
                    onClick={handleSendReminder}
                    disabled={sendingEmail || detailLoading}
                    className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-60 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {sendingEmail ? 'Đang gửi...' : 'Gửi nhắc thanh toán'}
                  </button>
                )}
                <button
                  onClick={handleExportPdf}
                  disabled={pdfExporting || detailLoading}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {pdfExporting ? 'Đang xuất...' : 'Xuất PDF'}
                </button>
                <button
                  onClick={closeDetail}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {detailError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 mb-4">
                  {detailError}
                </div>
              )}

              {emailNote && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 mb-4 text-sm">
                  {emailNote}
                </div>
              )}

              {detailLoading ? (
                <p className="text-gray-600">Đang tải chi tiết...</p>
              ) : (
                <div ref={pdfRef} className="bg-white p-6 border border-gray-200 rounded-lg space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusBadgeClass(selectedInvoice.status)}`}>
                          {statusLabel(selectedInvoice.status)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-3.5 h-3.5" />
                          {countdownText(selectedInvoice.dueDate, selectedInvoice.status, now)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Số hóa đơn: <span className="font-medium text-gray-900">{selectedInvoice.invoiceNo}</span></p>
                      <p className="text-sm text-gray-500">Cửa hàng: <span className="font-medium text-gray-900">{selectedInvoice.tenantName}</span> ({selectedInvoice.tenantSubdomain})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Ngày phát hành</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedInvoice.issueDate)}</p>
                      <p className="text-sm text-gray-500 mt-1">Hạn thanh toán</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedInvoice.dueDate)}</p>
                    </div>
                  </div>

                  {/* Company info */}
                  {companyInfo && (
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-2 mb-2 text-gray-800 font-medium">
                        <Building2 className="w-4 h-4" />
                        Thông tin công ty / thương hiệu
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                        <p><span className="text-gray-500">Tên công ty:</span> {companyInfo.companyName || '-'}</p>
                        <p><span className="text-gray-500">Thương hiệu:</span> {companyInfo.brandName || '-'}</p>
                        <p><span className="text-gray-500">MST:</span> {companyInfo.taxCode || '-'}</p>
                        <p><span className="text-gray-500">Điện thoại:</span> {companyInfo.phone || '-'}</p>
                        <p><span className="text-gray-500">Email:</span> {companyInfo.email || '-'}</p>
                        <p><span className="text-gray-500">Địa chỉ:</span> {companyInfo.address || '-'}</p>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-medium text-gray-800 mb-2">Chi tiết dịch vụ</p>
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-3 py-2">Diễn giải</th>
                          <th className="text-right px-3 py-2">Số tháng</th>
                          <th className="text-right px-3 py-2">Đơn giá</th>
                          <th className="text-right px-3 py-2">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(detail?.items || []).map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                        {detail?.items.length === 0 && (
                          <tr>
                            <td className="px-3 py-2 text-gray-500 italic" colSpan={4}>Không có dòng dịch vụ.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="mt-3 space-y-1 text-sm text-right">
                      <p className="text-gray-600">Tạm tính: <span className="font-medium text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</span></p>
                      {selectedInvoice.discount > 0 && (
                        <p className="text-gray-600">Giảm giá: <span className="font-medium text-gray-900">-{formatCurrency(selectedInvoice.discount)}</span></p>
                      )}
                      {selectedInvoice.tax > 0 && (
                        <p className="text-gray-600">Thuế: <span className="font-medium text-gray-900">{formatCurrency(selectedInvoice.tax)}</span></p>
                      )}
                      <p className="text-lg font-semibold text-gray-900">Tổng: {formatCurrency(selectedInvoice.total)}</p>
                      <p className="text-gray-600">Đã thanh toán: <span className="font-medium text-gray-900">{formatCurrency(selectedInvoice.amountPaid)}</span></p>
                      <p className="text-gray-600">Còn lại: <span className={`font-medium ${selectedInvoice.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(selectedInvoice.balance)}</span></p>
                    </div>
                  </div>

                  {/* Bank accounts */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 mb-2 text-gray-800 font-medium">
                      <CreditCard className="w-4 h-4" />
                      Thông tin thanh toán
                    </div>
                    {defaultBank ? (
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="text-gray-500">Chủ tài khoản:</span> {defaultBank.accountName}</p>
                        <p><span className="text-gray-500">Số tài khoản:</span> {defaultBank.accountNumber}</p>
                        <p><span className="text-gray-500">Ngân hàng:</span> {defaultBank.bankName}</p>
                        <p><span className="text-gray-500">Nội dung CK:</span> {defaultBank.transferContent || `Thanh toan ${selectedInvoice.invoiceNo}`}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Chưa có tài khoản ngân hàng mặc định.</p>
                    )}
                  </div>

                  {/* Payments */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-medium text-gray-800 mb-2">Lịch sử thanh toán</p>
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-3 py-2">Ngày</th>
                          <th className="text-left px-3 py-2">Phương thức</th>
                          <th className="text-right px-3 py-2">Số tiền</th>
                          <th className="text-left px-3 py-2">Mã tham chiếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(detail?.payments || []).map((p) => (
                          <tr key={p.id}>
                            <td className="px-3 py-2">{formatDate(p.paymentDate)}</td>
                            <td className="px-3 py-2">{paymentMethodLabel(p.paymentMethod)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                            <td className="px-3 py-2">{p.referenceCode || '-'}</td>
                          </tr>
                        ))}
                        {detail?.payments.length === 0 && (
                          <tr>
                            <td className="px-3 py-2 text-gray-500 italic" colSpan={4}>Chưa có giao dịch.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {selectedInvoice.notes && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="font-medium text-gray-800 mb-1">Ghi chú</p>
                      <p className="text-sm text-gray-700">{selectedInvoice.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
