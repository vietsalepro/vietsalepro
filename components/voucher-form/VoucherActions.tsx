import React from 'react';
import './VoucherActions.css';

export interface VoucherActionsProps {
  children?: React.ReactNode;
}

export const VoucherActions: React.FC<VoucherActionsProps> = ({ children }) => {
  return <div className="voucher-actions">{children}</div>;
};
