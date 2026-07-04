import React from 'react';
import { classNames } from '../../utils/classNames';
import { VoucherLabel } from './VoucherLabel';
import './VoucherField.css';

export interface VoucherFieldProps {
  label?: React.ReactNode;
  labelFor?: string;
  required?: boolean;
  error?: boolean | string;
  hint?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const VoucherField: React.FC<VoucherFieldProps> = ({
  label,
  labelFor,
  required,
  error,
  hint,
  fullWidth = false,
  className = '',
  children,
}) => {
  const errorMessage = typeof error === 'string' ? error : undefined;
  const hasError = Boolean(error);

  return (
    <div
      className={classNames(
        'voucher-field',
        fullWidth && 'voucher-field--full-width',
        hasError && 'voucher-field--error',
        className
      )}
    >
      {label && (
        <VoucherLabel htmlFor={labelFor} required={required} className="voucher-field__label">
          {label}
        </VoucherLabel>
      )}
      <div className="voucher-field__control">{children}</div>
      {hint && !hasError && <span className="voucher-field__hint">{hint}</span>}
      {errorMessage && (
        <span className="voucher-field__error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
