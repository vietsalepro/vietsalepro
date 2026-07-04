import React from 'react';
import { Package } from 'lucide-react';
import './OrderSummary.css';

interface OrderSummaryProps {
  totalQuantity: number;
}

/**
 * OrderSummary — Chỉ hiển thị Tổng số lượng
 * (Tạm tính, Tổng tiền đã dời vào sidebar)
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  totalQuantity
}) => {
  return (
    <div className="pos-card order-summary">
      <div className="order-summary__icon">
        <Package />
      </div>
      <div className="min-w-0">
        <p className="order-summary__label">Tổng số lượng</p>
        <p className="order-summary__value pos-text-amount">
          {totalQuantity} <span className="order-summary__unit">sản phẩm</span>
        </p>
      </div>
    </div>
  );
};
