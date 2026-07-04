import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherSelect.css';

export interface VoucherSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface VoucherSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  options: VoucherSelectOption[];
  placeholder?: string;
  error?: boolean | string;
}

export const VoucherSelect: React.FC<VoucherSelectProps> = ({
  size = 'md',
  fullWidth = false,
  options,
  placeholder,
  error,
  className = '',
  disabled,
  value,
  ...rest
}) => {
  const errorMessage = typeof error === 'string' ? error : undefined;
  const hasError = Boolean(error);
  const showPlaceholder = placeholder && !value;

  return (
    <div
      className={classNames(
        'voucher-select-wrapper',
        `voucher-select-wrapper--${size}`,
        fullWidth && 'voucher-select-wrapper--full-width',
        hasError && 'voucher-select-wrapper--error',
        disabled && 'voucher-select-wrapper--disabled',
        className
      )}
    >
      <select
        className="voucher-select"
        disabled={disabled}
        aria-invalid={hasError}
        value={value}
        {...rest}
      >
        {showPlaceholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {errorMessage && (
        <span className="voucher-select__error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
