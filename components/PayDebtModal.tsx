/**
 * ═══════════════════════════════════════════════════════════════
 *  PAYDEBT MODAL — Sprint_19
 *  Source: UI_MIGRATION_MASTER_ROADMAP.md
 *  ═══════════════════════════════════════════════════════════════
 *
 *  V2 Feature Flag: useRefactoredPayDebtModal (in features.ts)
 *  When flag=true → MasterModal + SectionBox + ActionButton + TextInput + SelectInput
 *  When flag=false → legacy UI (unchanged)
 *
 *  Component dùng chung cho 4 vị trí thanh toán công nợ.
 *
 *  2 Modes:
 *    • Mode 'single' — thanh toán cho 1 đơn cụ thể (dùng ở Orders row/modal).
 *    • Mode 'multi'  — thanh toán cho nhiều đơn của 1 khách (dùng ở Customers row/modal).
 *                      User chọn từng đơn + nhập số tiền riêng.
 *
 *  Khi confirm → loop gọi onPayDebt(orderId, amount) cho từng đơn có amount > 0.
 *  ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { Order, Customer } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useRefactoredPayDebtModal } from '../features';
import './PayDebtModal.css';
import { MasterModal } from './MasterModal';
import { SectionBox, SectionHeader, SectionContent } from './SectionBox';
import { ModalInfoGrid } from './ModalInfoGrid';
import { TextInput } from './TextInput';
import { SelectInput } from './SelectInput';
import { ActionButton } from './ActionButton';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

/* ─── Types ──────────────────────────────────────────── */

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayDebt: (orderId: string, amount: number) => Promise<void> | void;

  // Mode 'single' — truyền 1 order
  order?: Order;

  // Mode 'multi'  — truyền customer, modal tự fetch các đơn nợ
  customer?: Customer;

  // Callback tùy chọn sau khi thanh toán xong (để parent refresh data)
  onPaymentSuccess?: () => void;
}

/* ─── Payment method options ────────────────────────── */

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'transfer', label: 'Chuyển khoản' },
  { value: 'card', label: 'Thẻ ngân hàng' },
];

/* ─── Component ──────────────────────────────────────── */

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  isOpen,
  onClose,
  onPayDebt,
  order,
  customer,
  onPaymentSuccess,
}) => {
  const mode: 'single' | 'multi' = order ? 'single' : 'multi';

  // ─── Mode SINGLE state ──────────────────────────────────────────────
  const [singleAmount, setSingleAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  // ─── Mode MULTI state ───────────────────────────────────────────────
  const [debtOrders, setDebtOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  // Map orderId → số tiền trả cho đơn đó (string để dễ binding input)
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  // Map orderId → payment method cho multi mode
  const [multiMethods, setMultiMethods] = useState<Record<string, string>>({});

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo state khi mở modal
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsProcessing(false);
    setPaymentMethod('cash');

    if (mode === 'single' && order) {
      // Default = toàn bộ nợ của đơn
      setSingleAmount(String(Number(order.debtRecorded || 0)));
    }

    if (mode === 'multi' && customer) {
      setLoadingOrders(true);
      setAmounts({});
      setMultiMethods({});
      supabaseService
        .getCustomerOrders(customer.id)
        .then((orders: Order[]) => {
          // Chỉ lấy đơn còn nợ (debt > 0) và chưa bị huỷ
          const debtList = (orders || []).filter(
            (o) => Number(o.debtRecorded || 0) > 0 && o.status !== 'cancelled'
          );
          // Sắp xếp cũ nhất trước để user dễ ưu tiên trả đơn cũ
          debtList.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setDebtOrders(debtList);
        })
        .catch((err) => {
          console.error('Failed to load debt orders:', err);
          setError('Không tải được danh sách đơn công nợ.');
        })
        .finally(() => setLoadingOrders(false));
    }
  }, [isOpen, mode, order?.id, customer?.id]);

  // ─── Tính tổng tiền sẽ thanh toán ───────────────────────────────────
  const totalPayment = useMemo(() => {
    if (mode === 'single') {
      const v = parseFloat(singleAmount);
      return isFinite(v) && v > 0 ? v : 0;
    }
    return Object.values(amounts).reduce((sum, str) => {
      const v = parseFloat(str);
      return sum + (isFinite(v) && v > 0 ? v : 0);
    }, 0);
  }, [mode, singleAmount, amounts]);

  const totalDebt = useMemo(() => {
    if (mode === 'single') return Number(order?.debtRecorded || 0);
    return debtOrders.reduce(
      (sum, o) => sum + Number(o.debtRecorded || 0),
      0
    );
  }, [mode, order, debtOrders]);

  // ─── Handlers cho mode MULTI ────────────────────────────────────────
  const setAmountFor = (orderId: string, value: string) => {
    setAmounts((prev) => ({ ...prev, [orderId]: value }));
  };

  const fillFullForOrder = (o: Order) => {
    setAmounts((prev) => ({
      ...prev,
      [o.id]: String(Number(o.debtRecorded || 0)),
    }));
  };

  const fillAll = () => {
    const next: Record<string, string> = {};
    debtOrders.forEach((o) => {
      next[o.id] = String(Number(o.debtRecorded || 0));
    });
    setAmounts(next);
  };

  const clearAll = () => setAmounts({});

  // ─── Submit ─────────────────────────────────────────────────────────
  //
  // Phase 14: Server đã validate + clamp + atomic. Client chỉ cần validate sơ bộ
  // (rỗng, âm) rồi truyền lên RPC. Mode multi xử lý partial failure rõ ràng:
  // báo cáo từng đơn đã trả vs đơn lỗi.
  const handleConfirm = async () => {
    setError(null);

    if (mode === 'single') {
      const v = parseFloat(singleAmount);
      if (!isFinite(v) || v <= 0) {
        setError('Vui lòng nhập số tiền hợp lệ (> 0).');
        return;
      }
      setIsProcessing(true);
      try {
        await onPayDebt(order!.id, v);
        onPaymentSuccess?.();
        onClose();
      } catch (err: any) {
        console.error('Pay debt error:', err);
        setError(err?.message || 'Lỗi khi thanh toán công nợ.');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Mode MULTI — validate từng dòng ở client (sơ bộ)
    const tasks: { orderId: string; amount: number; shortId: string }[] = [];
    for (const o of debtOrders) {
      const raw = amounts[o.id];
      if (!raw || raw.trim() === '') continue;
      const v = parseFloat(raw);
      if (!isFinite(v) || v < 0) {
        setError(
          `Đơn #${o.id}: số tiền không hợp lệ.`
        );
        return;
      }
      if (v === 0) continue; // Bỏ qua dòng = 0
      tasks.push({
        orderId: o.id,
        amount: v,
        shortId: o.id,
      });
    }

    if (tasks.length === 0) {
      setError('Vui lòng nhập số tiền thanh toán cho ít nhất 1 đơn.');
      return;
    }

    setIsProcessing(true);

    // Gọi tuần tự — RPC atomic ở DB lo race condition.
    // Không dừng khi gặp lỗi: tiếp tục xử lý các đơn còn lại + báo cáo tổng kết.
    const succeeded: string[] = [];
    const failed: { shortId: string; reason: string }[] = [];
    for (const t of tasks) {
      try {
        await onPayDebt(t.orderId, t.amount);
        succeeded.push(t.shortId);
      } catch (err: any) {
        const reason = err?.message || 'lỗi không xác định';
        console.error(`Pay debt failed for ${t.shortId}:`, err);
        failed.push({ shortId: t.shortId, reason });
      }
    }

    setIsProcessing(false);

    // Tổng kết: 3 trường hợp
    if (failed.length === 0) {
      // Tất cả thành công
      onPaymentSuccess?.();
      onClose();
    } else if (succeeded.length === 0) {
      // Tất cả fail — giữ modal mở, hiển thị lỗi
      setError(
        `Không thể thanh toán ${failed.length} đơn:\n` +
          failed.map((f) => `• #${f.shortId}: ${f.reason}`).join('\n')
      );
    } else {
      // Partial: một số thành công, một số fail
      // Refresh parent để UI cập nhật, nhưng giữ modal mở để user xem báo cáo
      onPaymentSuccess?.();
      setError(
        `Đã thanh toán ${succeeded.length}/${tasks.length} đơn.\n\nThất bại ${failed.length} đơn:\n` +
          failed.map((f) => `• #${f.shortId}: ${f.reason}`).join('\n')
      );
      // Bỏ các đơn đã thành công khỏi danh sách input để user thấy còn gì cần làm
      setAmounts((prev) => {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(prev)) {
          const orderItem = debtOrders.find((o) => o.id === k);
          if (
            orderItem &&
            !succeeded.includes(orderItem.id)
          ) {
            next[k] = v;
          }
        }
        return next;
      });
    }
  };

  if (!isOpen) return null;

  /* ═══════════════════════════════════════════════════════════════
   *  V1 — Legacy Path (Flag OFF)
   *  ═══════════════════════════════════════════════════════════════ */
  if (!useRefactoredPayDebtModal) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => !isProcessing && onClose()}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-md">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="vsp-font-bold vsp-text-lg text-slate-800">
                  Thanh toán công nợ
                </h3>
                <p className="vsp-text-xs vsp-font-regular text-slate-500 mt-0.5">
                  {mode === 'single'
                    ? `Đơn #${order?.id}`
                    : `Khách hàng: ${customer?.name}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Mode SINGLE */}
            {mode === 'single' && order && (
              <>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="vsp-font-medium vsp-text-base">
                      Công nợ hiện tại
                    </span>
                  </div>
                  <span className="vsp-font-bold vsp-text-lg text-red-700">
                    {(order.debtRecorded || 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div>
                  <label className="block vsp-text-sm vsp-font-medium text-slate-700 mb-2">
                    Số tiền thanh toán
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={singleAmount}
                      onChange={(e) => setSingleAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl vsp-text-lg vsp-font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 vsp-font-medium">
                      đ
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSingleAmount(
                          String(Number(order.debtRecorded || 0))
                        )
                      }
                      className="vsp-text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 vsp-font-medium"
                    >
                      Trả đủ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSingleAmount(
                          String(
                            Math.floor(Number(order.debtRecorded || 0) / 2)
                          )
                        )
                      }
                      className="vsp-text-xs px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 vsp-font-medium"
                    >
                      Trả 50%
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Mode MULTI */}
            {mode === 'multi' && (
              <>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="vsp-font-medium vsp-text-base">
                      Tổng công nợ
                    </span>
                  </div>
                  <span className="vsp-font-bold vsp-text-lg text-red-700">
                    {totalDebt.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Đang tải danh sách đơn nợ...
                  </div>
                ) : debtOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                    <p className="text-sm">
                      Khách hàng này không có đơn công nợ.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Quick actions */}
                    <div className="flex items-center justify-between vsp-text-xs vsp-font-regular">
                      <span className="text-slate-500">
                        <strong className="vsp-font-bold text-slate-700">
                          {debtOrders.length}
                        </strong>{' '}
                        đơn còn nợ
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={fillAll}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 vsp-font-medium"
                        >
                          Trả đủ tất cả
                        </button>
                        <button
                          type="button"
                          onClick={clearAll}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 vsp-font-medium"
                        >
                          Xoá hết
                        </button>
                      </div>
                    </div>

                    {/* Bảng đơn nợ */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full vsp-text-sm vsp-font-regular">
                        <thead className="bg-slate-50 text-slate-500 vsp-text-xs vsp-font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2 text-left vsp-font-semibold">
                              Đơn / Ngày
                            </th>
                            <th className="px-3 py-2 text-right vsp-font-semibold">
                              Công nợ
                            </th>
                            <th className="px-3 py-2 text-right vsp-font-semibold">
                              Thanh toán
                            </th>
                            <th className="px-3 py-2 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {debtOrders.map((o) => {
                            const debt = Number(o.debtRecorded || 0);
                            const amountStr = amounts[o.id] || '';
                            const amountNum = parseFloat(amountStr);
                            const isFull =
                              isFinite(amountNum) && amountNum === debt;
                            return (
                              <tr key={o.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2.5">
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <div className="vsp-font-semibold text-slate-800 vsp-text-xs">
                                        #{o.id}
                                      </div>
                                      <div className="vsp-text-xxs vsp-font-regular text-slate-400 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {new Date(o.date).toLocaleDateString(
                                          'vi-VN'
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-right vsp-font-bold text-red-600 vsp-text-sm">
                                  {debt.toLocaleString('vi-VN')}đ
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max={debt}
                                    step="1000"
                                    value={amountStr}
                                    onChange={(e) =>
                                      setAmountFor(o.id, e.target.value)
                                    }
                                    placeholder="0"
                                    className={`w-full px-2 py-1.5 text-right vsp-text-sm border rounded-lg focus:outline-none focus:border-purple-500 ${
                                      isFull
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 vsp-font-semibold'
                                        : 'border-slate-200'
                                    }`}
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => fillFullForOrder(o)}
                                    className="vsp-text-xxs px-2 py-1 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 vsp-font-medium whitespace-nowrap"
                                    title="Trả đủ đơn này"
                                  >
                                    Trả đủ
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 vsp-text-sm vsp-font-regular text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between">
            <div className="vsp-text-sm vsp-font-regular">
              <span className="text-slate-500">Tổng thanh toán: </span>
              <span className="vsp-font-bold text-purple-600 vsp-text-lg">
                {totalPayment.toLocaleString('vi-VN')}đ
              </span>
              {totalDebt > 0 && (
                <span className="vsp-text-xs vsp-font-regular text-slate-400 ml-2">
                  / {totalDebt.toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 vsp-text-sm vsp-font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing || totalPayment <= 0}
                className="px-5 py-2 vsp-text-sm vsp-font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận thanh toán
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
   *  V2 — Refactored Path (Flag ON)
   *  Uses: MasterModal, SectionBox, SectionHeader, SectionContent,
   *        ModalInfoGrid, TextInput, SelectInput, ActionButton,
   *        LoadingState, ErrorState
   *  ═══════════════════════════════════════════════════════════════ */
  return (
    <MasterModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        mode === 'single'
          ? `Thanh toán công nợ — #${order?.id}`
          : `Thanh toán công nợ — ${customer?.name}`
      }
    >
      {/* ── Header ── */}
      <SectionBox>
        <SectionHeader
          title={
            mode === 'single'
              ? `Thanh toán công nợ — #${order?.id}`
              : `Thanh toán công nợ — ${customer?.name}`
          }
          subtitle={
            mode === 'single'
              ? undefined
              : `${debtOrders.length} đơn còn nợ`
          }
        />
        <SectionContent>
          {/* ── Mode SINGLE ── */}
          {mode === 'single' && order && (
            <>
              {/* Debt info */}
              <div className="pay-debt-debt-info">
              <ModalInfoGrid
                items={[
                  {
                    label: 'Mã đơn hàng',
                    value: `#${order.id}`,
                    span: false,
                    mono: true,
                  },
                  {
                    label: 'Công nợ hiện tại',
                    value: (
                      <span className="pay-debt-total-badge pay-debt-total-badge-danger">
                        <AlertCircle size={14} />
                        {Number(order.debtRecorded || 0).toLocaleString(
                          'vi-VN'
                        )}
                        đ
                      </span>
                    ),
                    span: true,
                  },
                ]}
              />
              </div>

              {/* Payment amount */}
              <div className="pay-debt-form">
                <div className="pay-debt-form-row">
                  <TextInput
                    label="Số tiền thanh toán"
                    type="number"
                    min={0}
                    step={1000}
                    value={singleAmount}
                    onChange={(e) => setSingleAmount(e.target.value)}
                    placeholder="0"
                    autoFocus
                    fullWidth
                    helperText={
                      Number(order.debtRecorded || 0) > 0
                        ? `Công nợ: ${Number(
                            order.debtRecorded
                          ).toLocaleString('vi-VN')}đ`
                        : undefined
                    }
                  />
                  <SelectInput
                    label="Phương thức thanh toán"
                    options={PAYMENT_METHODS}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    fullWidth
                  />
                </div>
              </div>

              {/* Quick fill buttons */}
              <div className="pay-debt-quick-fill">
                <button
                  type="button"
                  onClick={() =>
                    setSingleAmount(String(Number(order.debtRecorded || 0)))
                  }
                  className="pay-debt-quick-fill-btn pay-debt-quick-fill-btn--primary"
                >
                  Trả đủ
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSingleAmount(
                      String(
                        Math.floor(Number(order.debtRecorded || 0) / 2)
                      )
                    )
                  }
                  className="pay-debt-quick-fill-btn pay-debt-quick-fill-btn--secondary"
                >
                  Trả 50%
                </button>
              </div>
            </>
          )}

          {/* ── Mode MULTI ── */}
          {mode === 'multi' && (
            <>
              {/* Total debt info */}
              <div className="pay-debt-debt-info">
              <ModalInfoGrid
                items={[
                  {
                    label: 'Tổng công nợ',
                    value: (
                      <span className="pay-debt-total-badge pay-debt-total-badge-danger">
                        <AlertCircle size={14} />
                        {totalDebt.toLocaleString('vi-VN')}đ
                      </span>
                    ),
                    span: true,
                  },
                  {
                    label: 'Khách hàng',
                    value: customer?.name || '—',
                    span: true,
                  },
                ]}
              />
              </div>

              {loadingOrders ? (
                <LoadingState
                  message="Đang tải danh sách đơn nợ..."
                  compact
                />
              ) : debtOrders.length === 0 ? (
                <div className="pay-debt-empty-state">
                  <CheckCircle2
                    size={32}
                    className="pay-debt-empty-state-icon"
                  />
                  <p className="pay-debt-empty-state-text">
                    Khách hàng này không có đơn công nợ.
                  </p>
                </div>
              ) : (
                <>
                  {/* Quick actions */}
                  <div className="pay-debt-quick-actions">
                    <span className="pay-debt-quick-actions-count">
                      <strong>{debtOrders.length}</strong> đơn còn nợ
                    </span>
                    <div className="pay-debt-quick-actions-buttons">
                      <button
                        type="button"
                        onClick={fillAll}
                        className="pay-debt-quick-fill-btn pay-debt-quick-fill-btn--primary"
                      >
                        Trả đủ tất cả
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="pay-debt-quick-fill-btn pay-debt-quick-fill-btn--secondary"
                      >
                        Xoá hết
                      </button>
                    </div>
                  </div>

                  {/* Debt orders table */}
                  <div className="pay-debt-table-wrapper">
                    <table className="pay-debt-table">
                      <thead>
                        <tr className="pay-debt-table-header">
                          <th>Đơn / Ngày</th>
                          <th className="pay-debt-table-header-right">Công nợ</th>
                          <th className="pay-debt-table-header-right">
                            Thanh toán
                          </th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {debtOrders.map((o) => {
                          const debt = Number(o.debtRecorded || 0);
                          const amountStr = amounts[o.id] || '';
                          const amountNum = parseFloat(amountStr);
                          const isFull =
                            isFinite(amountNum) && amountNum === debt;
                          return (
                            <tr key={o.id} className="pay-debt-table-row">
                              <td className="pay-debt-table-cell">
                                <div className="pay-debt-table-order-cell">
                                  <FileText
                                    size={16}
                                    className="pay-debt-table-order-icon"
                                  />
                                  <div>
                                    <div className="pay-debt-table-order-id">
                                      #{o.id}
                                    </div>
                                    <div className="pay-debt-table-order-date">
                                      <Clock size={12} />
                                      {new Date(o.date).toLocaleDateString(
                                        'vi-VN'
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="pay-debt-table-cell pay-debt-table-cell-amount pay-debt-table-cell-debt">
                                {debt.toLocaleString('vi-VN')}đ
                              </td>
                              <td className="pay-debt-table-cell">
                                <input
                                  type="number"
                                  min={0}
                                  max={debt}
                                  step={1000}
                                  value={amountStr}
                                  onChange={(e) =>
                                    setAmountFor(o.id, e.target.value)
                                  }
                                  placeholder="0"
                                  className={`pay-debt-table-input${
                                    isFull ? ' pay-debt-table-input--full' : ''
                                  }`}
                                />
                              </td>
                              <td className="pay-debt-table-cell">
                                <button
                                  type="button"
                                  onClick={() => fillFullForOrder(o)}
                                  className="pay-debt-table-fill-btn"
                                  title="Trả đủ đơn này"
                                >
                                  Trả đủ
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Error message ── */}
          {error && (
            <ErrorState
              message={error}
              compact
            />
          )}

          {/* ── Processing state ── */}
          {isProcessing && (
            <div className="pay-debt-processing">
              <LoadingState message="Đang xử lý thanh toán..." compact />
            </div>
          )}

          {/* ── Total Row ── */}
          {!isProcessing && totalDebt > 0 && (
            <div className="pay-debt-total-row">
              <span className="pay-debt-total-label">Tổng thanh toán</span>
                <div className="pay-debt-total-row-inner">
                  <span className="pay-debt-total-value">
                    {totalPayment.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="pay-debt-total-remaining">
                    / {totalDebt.toLocaleString('vi-VN')}đ
                  </span>
                </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="pay-debt-modal-footer">
            <ActionButton variant="secondary" onClick={onClose}>
              Huỷ
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleConfirm}
              disabled={isProcessing || totalPayment <= 0}
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </ActionButton>
          </div>
        </SectionContent>
      </SectionBox>
    </MasterModal>
  );
};

export default PayDebtModal;