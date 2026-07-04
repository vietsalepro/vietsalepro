import React from 'react';
import { motion } from 'framer-motion';
import { Banknote, Smartphone, CreditCard, Loader2, Check, X } from 'lucide-react';
import { useMasterModalV2 } from '../../../features';
import { MasterModal } from '../../MasterModal';
import { ActionButton } from '../../ActionButton';
import { TextInput } from '../../TextInput';
import { LoadingState } from '../../LoadingState';
import { ErrorState } from '../../ErrorState';
import './PaymentModal.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalTotal: number;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  amountPaid: string;
  onAmountPaidChange: (value: string) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

/**
 * PaymentModal — Modal thanh toán
 * - Header gradient
 * - 3 phương thức: Tiền mặt, Chuyển khoản, Thẻ
 * - Input số tiền + gợi ý
 * - Nút xác nhận
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, finalTotal, paymentMethod, onPaymentMethodChange,
  amountPaid, onAmountPaidChange, onConfirm, isProcessing
}) => {
  if (!isOpen) return null;

  const formatPrice = (p: number) => p.toLocaleString('vi-VN');
  const changeAmount = Math.max(0, parseFloat(amountPaid || '0') - finalTotal);

  const paymentMethods = [
    { key: 'cash', label: 'Tiền mặt', icon: Banknote },
    { key: 'transfer', label: 'Chuyển khoản', icon: Smartphone },
    { key: 'card', label: 'Thẻ', icon: CreditCard },
  ];

  const quickAmounts = [
    finalTotal,
    Math.ceil(finalTotal / 1000) * 1000,
    Math.ceil(finalTotal / 5000) * 5000,
    Math.ceil(finalTotal / 10000) * 10000,
    Math.ceil(finalTotal / 50000) * 50000,
    Math.ceil(finalTotal / 100000) * 100000,
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

  // ─── Shared: payment method selection ─────────────────────
  const renderPaymentMethods = () => (
    <div className="payment-method-section">
      <label className="payment-method-label">Phương thức</label>
      <div className="payment-method-grid">
        {paymentMethods.map(m => (
          <button
            key={m.key}
            onClick={() => onPaymentMethodChange(m.key)}
            className={`payment-method-btn${paymentMethod === m.key ? ' payment-method-btn--selected' : ''}`}
          >
            <m.icon className="payment-method-icon" />
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Format amount for Vietnamese display (10.000) ─────────
  const formatDisplayAmount = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return parseInt(digits, 10).toLocaleString('vi-VN');
  };

  // ─── Shared: amount input section ──────────────────────────
  const renderAmountInput = () => {
    const displayValue = formatDisplayAmount(amountPaid);

    return (
      <div className="payment-amount-section">
        <label className="payment-amount-label">Số tiền thanh toán</label>
        <TextInput
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAmountPaidChange(e.target.value.replace(/\D/g, ''))}
          placeholder="Nhập số tiền..."
          size="lg"
          fullWidth
        />

        {/* Quick Amount Buttons */}
        {quickAmounts.length > 0 && (
          <div className="payment-quick-amounts">
            {quickAmounts.map(amount => (
              <ActionButton
                key={amount}
                variant="secondary"
                size="sm"
                onClick={() => onAmountPaidChange(amount.toString())}
              >
                {formatPrice(amount)}
              </ActionButton>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Shared: change amount display ─────────────────────────
  const renderChangeAmount = () => {
    if (parseFloat(amountPaid || '0') < finalTotal || finalTotal <= 0) return null;
    return (
      <div className="payment-change-section">
        <p className="payment-change-label">Tiền thừa</p>
        <p className="payment-change-amount">{formatPrice(changeAmount)}₫</p>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // V2: MasterModal path
  // ═══════════════════════════════════════════════════════════
  if (useMasterModalV2) {
    const renderFooter = () => (
      <ActionButton
        variant="primary"
        disabled={isProcessing || !amountPaid}
        loading={isProcessing}
        onClick={onConfirm}
        icon={<Check className="w-5 h-5" />}
        fullWidth
      >
        Xác nhận — {formatPrice(finalTotal)}₫
      </ActionButton>
    );

    const renderBody = () => {
      if (isProcessing) {
        return <LoadingState message="Đang xử lý..." />;
      }
      return (
        <>
          {renderPaymentMethods()}
          {renderAmountInput()}
          {renderChangeAmount()}
        </>
      );
    };

    return (
      <MasterModal
        isOpen={isOpen}
        onClose={onClose}
        title="Thanh toán"
        subtitle={`${formatPrice(finalTotal)}₫`}
        size="sm"
        footer={renderFooter()}
      >
        {renderBody()}
      </MasterModal>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // V1: Legacy path (unchanged behavior)
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" onClick={onClose} />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6C4DFF] to-[#8B7CFF] p-5 text-white">
            <div className="flex items-center justify-between mb-1">
              <h3 className="vsp-font-bold vsp-text-sm">Thanh toán</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="vsp-text-2xl vsp-font-bold">{formatPrice(finalTotal)}₫</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Payment Method */}
            <div>
              <label className="vsp-text-xxxs vsp-font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Phương thức</label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map(m => (
                  <button
                    key={m.key}
                    onClick={() => onPaymentMethodChange(m.key)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 vsp-text-xxs vsp-font-bold transition-all ${
                      paymentMethod === m.key
                        ? 'border-[#6C4DFF] bg-[#6C4DFF]/5 text-[#6C4DFF]'
                        : 'border-[#ECEEF5] text-[#6B7280] hover:border-gray-200'
                    }`}
                  >
                    <m.icon className="w-5 h-5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="vsp-text-xxxs vsp-font-bold text-[#6B7280] uppercase tracking-wider mb-2 block">Số tiền thanh toán</label>
              <input
                type="text"
                inputMode="numeric"
                value={amountPaid}
                onChange={(e) => onAmountPaidChange(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập số tiền..."
                className="w-full px-4 h-12 bg-[#F7F8FC] border border-[#ECEEF5] rounded-xl vsp-text-lg vsp-font-bold text-[#1B1F3B] outline-none focus:border-[#6C4DFF]/30 focus:ring-2 focus:ring-[#6C4DFF]/10 transition-all"
                autoFocus
              />

              {/* Quick Amount Buttons */}
              {quickAmounts.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      onClick={() => onAmountPaidChange(amount.toString())}
                      className="flex-1 py-1.5 vsp-text-xxxs vsp-font-bold bg-[#F7F8FC] text-[#6B7280] rounded-lg hover:bg-[#6C4DFF]/10 hover:text-[#6C4DFF] transition-colors"
                    >
                      {formatPrice(amount)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Change Amount */}
            {parseFloat(amountPaid || '0') >= finalTotal && finalTotal > 0 && (
              <div className="bg-gradient-to-r from-[#22C55E]/10 to-emerald-50 rounded-xl p-3 text-center border border-[#22C55E]/20">
                <span className="vsp-text-xxxs text-[#6B7280] vsp-font-medium">Tiền thừa</span>
                <p className="vsp-text-xl vsp-font-bold text-[#22C55E]">{formatPrice(changeAmount)}₫</p>
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              disabled={isProcessing || !amountPaid}
              className={`w-full h-14 rounded-2xl vsp-font-bold vsp-text-sm transition-all flex items-center justify-center gap-2 ${
                isProcessing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : amountPaid
                    ? 'bg-gradient-to-r from-[#6C4DFF] to-[#8B7CFF] text-white hover:shadow-lg hover:shadow-purple-200/50 active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Xác nhận — {formatPrice(finalTotal)}₫
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};
