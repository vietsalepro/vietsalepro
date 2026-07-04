import React from 'react';
import { Wallet } from 'lucide-react';
import './CustomerPayment.css';

interface CustomerPaymentProps {
  amountPaid: string;
  onAmountPaidChange: (value: string) => void;
}

/**
 * CustomerPayment — Input tiền khách đưa
 * Style đồng bộ Import Goods (ig-input)
 */
export const CustomerPayment: React.FC<CustomerPaymentProps> = ({ amountPaid, onAmountPaidChange }) => {
  return (
    <div className="customer-payment">
      <p className="customer-payment__label">Khách thanh toán</p>
      <div className="customer-payment__field">
        <span className="customer-payment__icon">
          <Wallet />
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={amountPaid}
          onChange={(e) => onAmountPaidChange(e.target.value.replace(/\D/g, ''))}
          placeholder="Nhập số tiền..."
          className="customer-payment__input"
        />
        {amountPaid && (
          <span className="customer-payment__currency">₫</span>
        )}
      </div>
    </div>
  );
};
