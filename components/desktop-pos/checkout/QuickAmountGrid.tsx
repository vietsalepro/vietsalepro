import React from 'react';
import './QuickAmountGrid.css';

interface QuickAmountGridProps {
  onSelect: (amount: number) => void;
}

/**
 * QuickAmountGrid — Grid button gợi ý số tiền
 * 100.000 | 200.000 | 500.000
 * 1.000.000 | 2.000.000 | 5.000.000 | 10.000.000
 * Style đồng bộ Import Goods (slate)
 */
export const QuickAmountGrid: React.FC<QuickAmountGridProps> = ({ onSelect }) => {
  const amounts = [100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000];

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  return (
    <div className="quick-amount-grid">
      <p className="quick-amount-grid__label">Gợi ý tiền</p>
      <div className="quick-amount-grid__grid">
        {amounts.map((amount) => (
          <button
            key={amount}
            onClick={() => onSelect(amount)}
            className="quick-amount-grid__btn"
          >
            {formatAmount(amount)}
          </button>
        ))}
      </div>
    </div>
  );
};
