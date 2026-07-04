import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherScrollArea.css';

export interface VoucherScrollAreaProps {
  children?: React.ReactNode;
  className?: string;
}

export const VoucherScrollArea: React.FC<VoucherScrollAreaProps> = ({
  children,
  className,
}) => {
  return <div className={classNames('voucher-scroll-area', className)}>{children}</div>;
};
