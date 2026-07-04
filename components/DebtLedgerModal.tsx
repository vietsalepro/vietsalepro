/**
 * ═══════════════════════════════════════════════════════════════
 *  DEBT LEDGER MODAL — Phase 8d
 *  ═══════════════════════════════════════════════════════════════
 *  Modal xem sổ cái công nợ (customer_payment_ledger / supplier_payment_ledger)
 *  + nút "Điều chỉnh nợ" (adjust) có reason bắt buộc.
 *
 *  Dùng chung cho Khách hàng (customer) và Nhà cung cấp (supplier).
 *  Gọi các RPC đã có sẵn từ Phase 8a:
 *    - get_customer_debt_ledger / get_supplier_debt_ledger
 *    - adjust_customer_debt / adjust_supplier_debt
 *
 *  Tham chiếu ERPNext: Payment Entry list view + Ledger view.
 *  (Chỉ tham chiếu quy tắc, KHÔNG copy code GPL.)
 *  ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Wallet, Loader2, AlertCircle, SlidersHorizontal, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export type DebtLedgerEntityType = 'customer' | 'supplier';

interface DebtLedgerEntry {
  id: number;
  referenceType: string;
  referenceId: string | null;
  amount: number;
  balanceAfter: number | null;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface DebtLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: DebtLedgerEntityType;
  entityId: string;
  entityName: string;
  /** Callback sau khi adjust thành công (để parent refresh lại cột debt/đanh sách) */
  onAdjusted?: () => void;
}

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  order: 'Bán nợ',
  return: 'Trả hàng',
  cancel_order: 'Huỷ đơn',
  cancel_return: 'Huỷ trả hàng',
  payment: 'Thanh toán',
  adjustment: 'Điều chỉnh',
  backfill: 'Dời lịch sử',
  import: 'Nhập hàng',
  delete_import: 'Xoá phiếu nhập',
  update_import: 'Cập nhật phiếu nhập',
};

const formatVnd = (n: number) => {
  const v = Number(n) || 0;
  return v.toLocaleString('vi-VN') + '₫';
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export const DebtLedgerModal: React.FC<DebtLedgerModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  onAdjusted,
}) => {
  const [currentBalance, setCurrentBalance] = useState(0);
  const [entries, setEntries] = useState<DebtLedgerEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adjust form state
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    if (!entityId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = entityType === 'customer'
        ? await supabaseService.getCustomerDebtLedger(entityId, 100, 0)
        : await supabaseService.getSupplierDebtLedger(entityId, 100, 0);
      setCurrentBalance(Number(res.currentBalance) || 0);
      setEntries((res.entries || []) as DebtLedgerEntry[]);
      setTotalEntries(Number(res.totalEntries) || 0);
    } catch (err: any) {
      console.error('DebtLedgerModal: fetch error', err);
      setError(err?.message || 'Không tải được sổ cái công nợ.');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    if (isOpen) {
      setShowAdjust(false);
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustError(null);
      fetchLedger();
    }
  }, [isOpen, fetchLedger]);

  const handleAdjustSubmit = async () => {
    setAdjustError(null);
    const amount = parseFloat(adjustAmount);
    if (!isFinite(amount) || amount === 0) {
      setAdjustError('Số tiền phải khác 0. Dùng số dương để tăng nợ, số âm để giảm nợ.');
      return;
    }
    const reason = adjustReason.trim();
    if (!reason) {
      setAdjustError('Lý do điều chỉnh là bắt buộc.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (entityType === 'customer') {
        await supabaseService.adjustCustomerDebt(entityId, amount, reason);
      } else {
        await supabaseService.adjustSupplierDebt(entityId, amount, reason);
      }
      setShowAdjust(false);
      setAdjustAmount('');
      setAdjustReason('');
      await fetchLedger();
      onAdjusted?.();
    } catch (err: any) {
      console.error('DebtLedgerModal: adjust error', err);
      setAdjustError(err?.message || 'Lỗi khi điều chỉnh công nợ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isCustomer = entityType === 'customer';
  const accent = isCustomer ? '#7c3aed' : '#6366f1';
  const balanceColor = currentBalance > 0 ? '#dc2626' : '#059669';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'dlmFadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes dlmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dlmSlideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .dlm-scroll::-webkit-scrollbar { width: 8px; }
        .dlm-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'dlmSlideUp 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: accent + '14', color: accent,
            }}>
              <Wallet size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                Sổ cái công nợ {isCustomer ? 'khách hàng' : 'nhà cung cấp'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{entityName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6 }}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="dlm-scroll" style={{ overflowY: 'auto', padding: '18px 22px', flex: 1 }}>
          {/* Balance summary */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 12, background: '#f8fafc', marginBottom: 16,
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.05 }}>
                Số dư nợ hiện tại
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: balanceColor, marginTop: 2 }}>
                {formatVnd(currentBalance)}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {totalEntries} bút toán
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#94a3b8' }}>
              <Loader2 size={22} className="animate-spin" /> <span style={{ marginLeft: 10 }}>Đang tải sổ cái…</span>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, background: '#fef2f2', borderRadius: 10, color: '#dc2626', fontSize: 14 }}>
              <AlertCircle size={18} className="shrink-0" /> <div>{error}</div>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36, color: '#94a3b8', fontSize: 14 }}>
              Chưa có bút toán nào trong sổ cái.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th style={thStyle}>Thời gian</th>
                  <th style={thStyle}>Loại</th>
                  <th style={thStyle}>Lý do</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Số tiền</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Số dư sau</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const amt = Number(e.amount) || 0;
                  const isIncrease = amt > 0;
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={tdStyle}>{formatDate(e.createdAt)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          background: isIncrease ? '#fef2f2' : '#ecfdf5',
                          color: isIncrease ? '#dc2626' : '#059669',
                        }}>
                          {isIncrease ? <ArrowUpCircle size={13} /> : <ArrowDownCircle size={13} />}
                          {REFERENCE_TYPE_LABELS[e.referenceType] || e.referenceType}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.reason || (e.referenceId ? `#${e.referenceId}` : '—')}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: isIncrease ? '#dc2626' : '#059669' }}>
                        {amt > 0 ? '+' : ''}{formatVnd(amt)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#334155', fontWeight: 600 }}>
                        {e.balanceAfter != null ? formatVnd(e.balanceAfter) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Adjust form */}
          {showAdjust && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              border: '1px solid #e2e8f0', background: '#fff',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                Điều chỉnh công nợ
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                Dùng số dương để <b>tăng nợ</b>, số âm (vd <code>-50000</code>) để <b>giảm nợ</b>. Mỗi điều chỉnh đều ghi 1 bút toán vào sổ cái.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Số tiền (VNĐ) *</label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="vd 50000 hoặc -50000"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Lý do *</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="vd Nợ chết, nợ đầu kỳ, xoá nợ sai…"
                    style={inputStyle}
                  />
                </div>
              </div>
              {adjustError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: 13, marginBottom: 10 }}>
                  <AlertCircle size={15} /> {adjustError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => { setShowAdjust(false); setAdjustError(null); }}
                  style={btnGhost}
                >
                  Huỷ
                </button>
                <button
                  onClick={handleAdjustSubmit}
                  disabled={isSubmitting}
                  style={{ ...btnPrimary, background: accent, opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
                  Ghi điều chỉnh
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 22px', borderTop: '1px solid #f1f5f9',
        }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Nợ = tổng cộng dồn từ sổ cái, không sửa tay.
          </div>
          {!showAdjust && (
            <button
              onClick={() => setShowAdjust(true)}
              style={{ ...btnPrimary, background: accent }}
            >
              <SlidersHorizontal size={15} /> Điều chỉnh nợ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── inline style helpers ──────────────────────────────────────
const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 8px', fontSize: 11, fontWeight: 600,
  color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.05, borderBottom: '1px solid #e2e8f0',
};
const tdStyle: React.CSSProperties = {
  padding: '11px 8px', color: '#334155', verticalAlign: 'middle',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 14, outline: 'none',
};
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
  border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
const btnGhost: React.CSSProperties = {
  padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: 10,
  background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

export default DebtLedgerModal;
