import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherTableRow.css';

export interface VoucherTableRowProps {
  children?: React.ReactNode;
  renderCells?: () => React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const VoucherTableRow: React.FC<VoucherTableRowProps> = ({
  children,
  renderCells,
  selected = false,
  onClick,
  className = '',
}) => {
  return (
    <tr
      className={classNames(
        'voucher-table-row',
        selected && 'voucher-table-row--selected',
        onClick && 'voucher-table-row--clickable',
        className
      )}
      onClick={onClick}
      aria-selected={selected}
    >
      {renderCells ? renderCells() : children}
    </tr>
  );
};
