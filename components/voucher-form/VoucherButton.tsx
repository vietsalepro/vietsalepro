import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherButton.css';

export interface VoucherButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const VoucherButton: React.FC<VoucherButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={classNames(
        'voucher-button',
        `voucher-button--${variant}`,
        `voucher-button--${size}`,
        fullWidth && 'voucher-button--full-width',
        loading && 'voucher-button--loading',
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      {loading && <span className="voucher-button__spinner" aria-hidden="true" />}
      {!loading && icon && <span className="voucher-button__icon">{icon}</span>}
      {children && <span className="voucher-button__text">{children}</span>}
    </button>
  );
};
