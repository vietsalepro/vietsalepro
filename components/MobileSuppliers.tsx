import React, { useState } from 'react';
import { Supplier, ImportReceipt } from '../types';
import { Plus, Search, Phone, MapPin, Trash2, X, History, CheckCircle } from 'lucide-react';
import MobileLayout from './MobileLayout';
import { DebtLedgerModal } from './DebtLedgerModal';

interface MobileSuppliersProps {
  suppliers: Supplier[];
  importReceipts?: ImportReceipt[];
  onAddSupplier: (supplier: Supplier) => Promise<void>;
  onUpdateSupplier: (supplier: Supplier) => Promise<void>;
  onDeleteSupplier: (id: string) => void;
  onPayDebt?: (receiptId: string, amount: number) => void;
}

const MobileSuppliers: React.FC<MobileSuppliersProps> = ({
  suppliers,
  importReceipts = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onPayDebt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', contactPerson: '' });
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [paymentReceiptId, setPaymentReceiptId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  // Phase 8d: Sổ cái công nợ NCC
  const [ledgerSupplierId, setLedgerSupplierId] = useState<string | null>(null);

  const filtered = suppliers.filter((s: Supplier) =>
    !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.name.trim()) { alert('Vui lòng nhập tên nhà cung cấp'); return; }
    const supplier: Supplier = {
      id: editingSupplier ? editingSupplier.id : 'SUP' + Date.now(),
      code: editingSupplier ? (editingSupplier as any).code : '',
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      contactPerson: formData.contactPerson.trim(),
      debt: editingSupplier ? editingSupplier.debt : 0,
    } as any;
    if (editingSupplier) await onUpdateSupplier(supplier);
    else await onAddSupplier(supplier);
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', address: '', contactPerson: '' });
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({ name: s.name, phone: s.phone || '', address: s.address || '', contactPerson: (s as any).contactPerson || '' });
    setShowModal(true);
  };

  const handlePayDebt = async (receiptId: string) => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) { alert('Nhập số tiền hợp lệ'); return; }
    if (onPayDebt) await onPayDebt(receiptId, amount);
    setPaymentReceiptId(null);
    setPaymentAmount('');
  };

  const supplierReceipts = (id: string) => importReceipts.filter((r: ImportReceipt) => r.supplierId === id);

  return (
    <MobileLayout>
      <div className="m-bg min-h-screen m-with-nav px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-4 animate-fade-in-up">
          <div>
            <h1 className="vsp-text-xl vsp-font-bold text-slate-800 tracking-tight">Nhà cung cấp</h1>
            <p className="vsp-text-xs text-slate-500 mt-0.5">{suppliers.length} nhà cung cấp</p>
          </div>
          <button
            onClick={() => { setEditingSupplier(null); setFormData({ name: '', phone: '', address: '', contactPerson: '' }); setShowModal(true); }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-200/50 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Thêm nhà cung cấp"
          >
            <Plus className="w-5 h-5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="m-search flex items-center px-3 py-2 mb-4">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm nhà cung cấp..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 ml-2 bg-transparent vsp-text-sm outline-none placeholder:text-slate-400 text-slate-700"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 active:scale-90 transition-transform">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-2.5 stagger">
          {filtered.length === 0 && (
            <div className="m-card text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 flex items-center justify-center mb-3">
                <Phone className="w-7 h-7 text-purple-400" />
              </div>
              <p className="text-slate-700 vsp-font-semibold">Không có nhà cung cấp nào</p>
              <p className="text-slate-400 vsp-text-sm mt-1">Thêm nhà cung cấp mới để bắt đầu.</p>
            </div>
          )}
          {filtered.map((supplier: Supplier) => (
            <div key={supplier.id} className="m-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="m-avatar w-11 h-11 vsp-text-sm shrink-0">
                      {supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="vsp-font-bold text-slate-800 vsp-text-sm truncate">{supplier.name}</h3>
                      <div className="mt-1 space-y-0.5 vsp-text-xs text-slate-500">
                        {supplier.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {supplier.phone}</div>}
                        {supplier.address && <div className="flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{supplier.address}</span></div>}
                        {(supplier as any).contactPerson && <div className="text-slate-400">LH: {(supplier as any).contactPerson}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={'vsp-text-sm vsp-font-bold m-counter ' + (Number(supplier.debt || 0) > 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {Number(supplier.debt || 0).toLocaleString('vi-VN')}₫
                    </div>
                    <div className="vsp-text-xxxs text-slate-400 uppercase tracking-wider vsp-font-semibold">Công nợ</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(supplier)} className="flex-1 py-2 vsp-text-xs vsp-font-bold text-purple-600 bg-purple-50 rounded-xl active:scale-95 transition-transform">Sửa</button>
                  <button onClick={() => setShowHistory(showHistory === supplier.id ? null : supplier.id)}
                    className="flex-1 py-2 vsp-text-xs vsp-font-bold text-slate-600 bg-slate-50 rounded-xl active:scale-95 transition-transform">
                    <History className="w-3.5 h-3.5 inline mr-1" />Lịch sử
                  </button>
                  <button onClick={() => setLedgerSupplierId(supplier.id)}
                    className="flex-1 py-2 vsp-text-xs vsp-font-bold text-indigo-600 bg-indigo-50 rounded-xl active:scale-95 transition-transform">
                    Sổ cái nợ
                  </button>
                  <button onClick={() => { if (confirm('Xoá nhà cung cấp này?')) onDeleteSupplier(supplier.id); }}
                    className="p-2 text-red-500 bg-red-50 rounded-xl active:scale-90 transition-transform"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {showHistory === supplier.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-fade-in-down">
                    {supplierReceipts(supplier.id).length === 0 && <div className="vsp-text-sm text-gray-400 text-center py-3">Chưa có lịch sử nhập hàng</div>}
                    {supplierReceipts(supplier.id).slice(0, 10).map((r: ImportReceipt) => {
                      const debtAmount = r.totalCost + (r.shippingCost || 0) - (r.paidAmount || 0);
                      return (
                        <div key={r.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="vsp-text-sm vsp-font-medium text-gray-700">{r.invoiceNumber || r.id}</div>
                              <div className="vsp-text-xs text-gray-400">{new Date(r.date).toLocaleDateString('vi-VN')}</div>
                            </div>
                            <div className="text-right">
                              <div className="vsp-text-sm vsp-font-semibold text-gray-700">{r.totalCost.toLocaleString('vi-VN')}₫</div>
                              {debtAmount > 0 && (
                                <div className="flex items-center gap-1 mt-1 justify-end">
                                  <span className="vsp-text-xs text-red-500">{debtAmount.toLocaleString('vi-VN')}₫</span>
                                  <button onClick={() => setPaymentReceiptId(paymentReceiptId === r.id ? null : r.id)} className="vsp-text-xs text-indigo-600 vsp-font-medium">Trả</button>
                                </div>
                              )}
                              {debtAmount <= 0 && <CheckCircle className="w-4 h-4 text-green-500 mt-1 ml-auto" />}
                            </div>
                          </div>
                          {paymentReceiptId === r.id && (
                            <div className="flex items-center gap-2 mt-2">
                              <input type="number" placeholder="Số tiền trả" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                className="flex-1 px-3 py-1.5 vsp-text-sm border border-gray-200 rounded-lg" />
                              <button onClick={() => handlePayDebt(r.id)} className="px-3 py-1.5 vsp-text-sm bg-indigo-600 text-white rounded-lg active:bg-indigo-700">Xác nhận</button>
                              <button onClick={() => { setPaymentReceiptId(null); setPaymentAmount(''); }} className="p-1.5 text-gray-400"><X className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-2xl h-[92vh] max-h-[92vh] md:h-auto flex flex-col p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="vsp-text-lg vsp-font-bold">{editingSupplier ? 'Sửa' : 'Thêm'} nhà cung cấp</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              <input placeholder="Tên nhà cung cấp *" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl vsp-text-sm vsp-font-regular" />
              <input placeholder="Số điện thoại" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl vsp-text-sm vsp-font-regular" />
              <input placeholder="Địa chỉ" value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl vsp-text-sm vsp-font-regular" />
              <input placeholder="Người liên hệ" value={formData.contactPerson} onChange={e => setFormData(f => ({ ...f, contactPerson: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl vsp-text-sm vsp-font-regular" />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-gray-600 vsp-font-medium">Huỷ</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl vsp-font-medium active:bg-indigo-700">Lưu</button>
            </div>
          </div>
        </div>
      )}
      {/* Phase 8d: Sổ cái công nợ NCC (xem ledger + điều chỉnh nợ có reason) */}
      {ledgerSupplierId && (
        <DebtLedgerModal
          isOpen={!!ledgerSupplierId}
          onClose={() => setLedgerSupplierId(null)}
          entityType="supplier"
          entityId={ledgerSupplierId}
          entityName={suppliers.find(s => s.id === ledgerSupplierId)?.name || ''}
        />
      )}
    </MobileLayout>
  );
};

export default MobileSuppliers;