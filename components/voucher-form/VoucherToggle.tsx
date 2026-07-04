import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherToggle.css';

export interface VoucherToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const VoucherToggle: React.FC<VoucherToggleProps> = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  className = '',
  id,
}) => {
  const inputId = id || React.useId();

  return (
    <label
      htmlFor={inputId}
      className={classNames(
        'voucher-toggle',
        disabled && 'voucher-toggle--disabled',
        className
      )}
    >
      <span className="voucher-toggle__switch">
        <input
          id={inputId}
          type="checkbox"
          className="voucher-toggle__input"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span className="voucher-toggle__track" aria-hidden="true">
          <span className="voucher-toggle__thumb" />
        </span>
      </span>
      {label && <span className="voucher-toggle__label">{label}</span>}
    </label>
  );
};
