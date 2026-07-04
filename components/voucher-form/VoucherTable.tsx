import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherTable.css';

export interface VoucherTableProps {
  children: React.ReactNode;
  className?: string;
  empty?: React.ReactNode;
}

export const VoucherTable: React.FC<VoucherTableProps> = ({
  children,
  className = '',
  empty,
}) => {
  return (
    <div className={classNames('voucher-table-wrapper', className)}>
      <table className="voucher-table">
        {children}
      </table>
      {empty}
    </div>
  );
};
