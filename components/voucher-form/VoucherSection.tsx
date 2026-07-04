import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherSection.css';

export interface VoucherSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const VoucherSection: React.FC<VoucherSectionProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={classNames('voucher-section', className)}>
      {children}
    </div>
  );
};
