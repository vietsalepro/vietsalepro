import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherSectionContent.css';

export interface VoucherSectionContentProps {
  children: React.ReactNode;
  className?: string;
}

export const VoucherSectionContent: React.FC<VoucherSectionContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={classNames('voucher-section-content', className)}>
      {children}
    </div>
  );
};
