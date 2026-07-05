import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherInput.css';

export interface VoucherInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  error?: boolean | string;
}

export const VoucherInput: React.FC<VoucherInputProps> = ({
  size = 'md',
  fullWidth = false,
  prefixIcon,
  suffixIcon,
  error,
  className = '',
  disabled,
  ...rest
}) => {
  const errorMessage = typeof error === 'string' ? error : undefined;
  const hasError = Boolean(error);

  return (
    <div
      className={classNames(
        'voucher-input-wrapper',
        `voucher-input-wrapper--${size}`,
        fullWidth && 'voucher-input-wrapper--full-width',
        hasError && 'voucher-input-wrapper--error',
        disabled && 'voucher-input-wrapper--disabled',
        prefixIcon ? 'voucher-input-wrapper--has-prefix' : null,
        suffixIcon ? 'voucher-input-wrapper--has-suffix' : null,
        className
      )}
    >
      {prefixIcon && <span className="voucher-input__icon voucher-input__icon--prefix">{prefixIcon}</span>}
      <input
        className="voucher-input"
        disabled={disabled}
        aria-invalid={hasError}
        {...rest}
      />
      {suffixIcon && <span className="voucher-input__icon voucher-input__icon--suffix">{suffixIcon}</span>}
      {errorMessage && (
        <span className="voucher-input__error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
