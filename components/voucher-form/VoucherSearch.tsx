import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { classNames } from '../../utils/classNames';
import './VoucherSearch.css';

export interface VoucherSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  slot?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export const VoucherSearch: React.FC<VoucherSearchProps> = ({
  value,
  onChange,
  placeholder = 'Tìm sản phẩm...',
  slot,
  loading = false,
  disabled = false,
  className = '',
  inputRef,
  onFocus,
  onBlur,
  onKeyDown,
}) => {
  return (
    <div
      className={classNames(
        'voucher-search',
        loading && 'voucher-search--loading',
        disabled && 'voucher-search--disabled',
        className
      )}
    >
      <span className="voucher-search__icon">
        {loading ? <Loader2 size={16} className="voucher-search__spinner" /> : <Search size={16} />}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="voucher-search__input"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoComplete="off"
        aria-autocomplete="list"
      />
      {slot && <div className="voucher-search__slot">{slot}</div>}
    </div>
  );
};
