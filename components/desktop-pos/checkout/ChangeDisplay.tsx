import React from 'react';
import './ChangeDisplay.css';

interface ChangeDisplayProps {
  changeAmount: number;
}

/**
 * ChangeDisplay — Tiền thừa trả khách
 * Màu xanh lá, font lớn, nổi bật
 * Style đồng bộ Import Goods (flat, không gradient)
 */
export const ChangeDisplay: React.FC<ChangeDisplayProps> = ({ changeAmount }) => {
  if (changeAmount <= 0) return null;

  return (
    <div className="change-display">
      <p className="change-display__label">Tiền thừa trả khách</p>
      <p className="change-display__amount">
        {changeAmount.toLocaleString('vi-VN')}₫
      </p>
    </div>
  );
};
