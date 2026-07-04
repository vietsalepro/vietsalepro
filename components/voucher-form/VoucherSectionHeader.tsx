import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherSectionHeader.css';

export interface VoucherSectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const VoucherSectionHeader: React.FC<VoucherSectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={classNames('voucher-section-header', className)}>
      <div className="voucher-section-header__top">
        <div className="voucher-section-header__title-group">
          <h3 className="voucher-section-header__title">{title}</h3>
          {subtitle && (
            <p className="voucher-section-header__subtitle">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="voucher-section-header__action">{action}</div>
        )}
      </div>
    </div>
  );
};
