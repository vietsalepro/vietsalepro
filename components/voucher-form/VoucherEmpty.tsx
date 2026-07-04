import React from 'react';
import { Inbox } from 'lucide-react';
import { classNames } from '../../utils/classNames';
import './VoucherEmpty.css';

export interface VoucherEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const VoucherEmpty: React.FC<VoucherEmptyProps> = ({
  title = 'Chưa có dữ liệu',
  description,
  icon = <Inbox size={40} />,
  action,
  className = '',
}) => {
  return (
    <div className={classNames('voucher-empty', className)}>
      <div className="voucher-empty__icon">{icon}</div>
      <div className="voucher-empty__title">{title}</div>
      {description && <div className="voucher-empty__description">{description}</div>}
      {action && <div className="voucher-empty__action">{action}</div>}
    </div>
  );
};
