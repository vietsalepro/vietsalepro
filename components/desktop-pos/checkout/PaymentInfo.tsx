import React from 'react';
import { Tag } from 'lucide-react';
import './PaymentInfo.css';

interface PaymentInfoProps {
  subtotal: number;
  discount: number;
  total: number;
  totalQuantity: number;
  onOpenPromotions: () => void;
  selectedPromotionsCount: number;
}

/**
 * PaymentInfo — Hiển thị Tổng tiền, Giảm giá, Tổng thanh toán
 * Style đồng bộ Import Goods (slate, không tím)
 */
export const PaymentInfo: React.FC<PaymentInfoProps> = ({
  subtotal, discount, total, totalQuantity, onOpenPromotions, selectedPromotionsCount,
}) => {
  return (
    <div className="payment-info">
      <p className="payment-info__label">Thông tin thanh toán</p>

      <div className="payment-info__rows">
        {/* Tổng tiền hàng */}
        <div className="payment-info__row">
          <span className="payment-info__row-label">Tổng tiền hàng</span>
          <span className="payment-info__row-value">{subtotal.toLocaleString('vi-VN')}₫</span>
        </div>

        {/* Số lượng */}
        <div className="payment-info__row">
          <span className="payment-info__row-label">Số lượng</span>
          <span className="payment-info__row-value">{totalQuantity}</span>
        </div>

        {/* Giảm giá */}
        <div className="payment-info__row">
          <div className="payment-info__row-label-group">
            <span className="payment-info__row-label">Giảm giá</span>
            {onOpenPromotions && (
              <button
                onClick={onOpenPromotions}
                className="payment-info__promo-btn"
              >
                <Tag className="payment-info__promo-icon" />
                {selectedPromotionsCount > 0 ? `${selectedPromotionsCount} KM` : 'Thêm KM'}
              </button>
            )}
          </div>
          {discount > 0 ? (
            <span className="payment-info__row-value--discount">-{discount.toLocaleString('vi-VN')}₫</span>
          ) : (
            <span className="payment-info__row-value--muted">0₫</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="payment-info__divider" />

      {/* Tổng thanh toán */}
      <div className="payment-info__total-row">
        <span className="payment-info__total-label">Tổng thanh toán</span>
        <span className="payment-info__total-value">{total.toLocaleString('vi-VN')}₫</span>
      </div>
    </div>
  );
};
