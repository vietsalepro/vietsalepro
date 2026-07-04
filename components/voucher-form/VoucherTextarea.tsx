import React from 'react';
import { classNames } from '../../utils/classNames';
import './VoucherTextarea.css';

export interface VoucherTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fullWidth?: boolean;
  error?: boolean | string;
}

export const VoucherTextarea: React.FC<VoucherTextareaProps> = ({
  fullWidth = false,
  error,
  className = '',
  disabled,
  rows = 3,
  ...rest
}) => {
  const errorMessage = typeof error === 'string' ? error : undefined;
  const hasError = Boolean(error);

  return (
    <div
      className={classNames(
        'voucher-textarea-wrapper',
        fullWidth && 'voucher-textarea-wrapper--full-width',
        hasError && 'voucher-textarea-wrapper--error',
        disabled && 'voucher-textarea-wrapper--disabled',
        className
      )}
    >
      <textarea
        className="voucher-textarea"
        disabled={disabled}
        rows={rows}
        aria-invalid={hasError}
        {...rest}
      />
      {errorMessage && (
        <span className="voucher-textarea__error" role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
