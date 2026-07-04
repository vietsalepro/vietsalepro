import React from 'react';
import { Banknote, Smartphone } from 'lucide-react';
import './PaymentMethod.css';

interface PaymentMethodProps {
  selected: string;
  onChange: (method: string) => void;
}

/**
 * PaymentMethod — 2 button lựa chọn phương thức thanh toán
 * [Tiền mặt] [Chuyển khoản]
 * Active: viền slate-900 + background slate-50
 */
export const PaymentMethod: React.FC<PaymentMethodProps> = ({ selected, onChange }) => {
  const methods = [
    { key: 'cash', label: 'Tiền mặt', icon: Banknote },
    { key: 'transfer', label: 'Chuyển khoản', icon: Smartphone },
  ];

  return (
    <div className="payment-method">
      <p className="payment-method__label">Phương thức thanh toán</p>
      <div className="payment-method__grid">
        {methods.map((m) => {
          const isActive = selected === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onChange(m.key)}
              className={`payment-method__option${
                isActive ? ' payment-method__option--active' : ''
              }`}
            >
              <m.icon />
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
