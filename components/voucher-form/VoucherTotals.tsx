import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherTotals.css';

export interface VoucherTotalItem {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

export interface VoucherTotalsProps {
  items: VoucherTotalItem[];
  className?: string;
}

export const VoucherTotals: React.FC<VoucherTotalsProps> = ({
  items,
  className = '',
}) => {
  if (items.length === 0) return null;

  return (
    <div className={classNames('voucher-totals', className)}>
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className={classNames(
            'voucher-totals__item',
            item.highlight && 'voucher-totals__item--highlight'
          )}
        >
          <span className="voucher-totals__label">{item.label}</span>
          <span className="voucher-totals__value">{item.value}</span>
        </div>
      ))}
    </div>
  );
};
