import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherLabel.css';

export interface VoucherLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const VoucherLabel: React.FC<VoucherLabelProps> = ({
  required,
  children,
  className = '',
  ...rest
}) => {
  return (
    <label className={classNames('voucher-label', className)} {...rest}>
      {children}
      {required && <span className="voucher-label__required" aria-hidden="true">*</span>}
    </label>
  );
};
