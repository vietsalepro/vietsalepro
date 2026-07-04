/**
 * ═══════════════════════════════════════════════════════════════
 *  SELECT INPUT COMPONENT — Sprint_04
 *  Source: MASTER_INPUT_STANDARD_V1.md
 * ═══════════════════════════════════════════════════════════════
 *
 *  Props:
 *    - label, options, placeholder, helperText, error
 *    - disabled, required
 *    - fullWidth, size
 *
 *  Design Tokens:
 *    All styling in SelectInput.css — no inline styles.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { forwardRef, useId } from 'react';
import './SelectInput.css';
import type { InputSize } from './TextInput';

/* ─── Types ──────────────────────────────────────────── */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Label text displayed above the select */
  label?: string;
  /** Array of options */
  options: SelectOption[];
  /** Placeholder option text */
  placeholder?: string;
  /** Helper text shown below the select */
  helperText?: string;
  /** Error message (replaces helperText when set) */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Full-width mode */
  fullWidth?: boolean;
  /** Size preset: sm (36px), md (40px), lg (44px) */
  size?: InputSize;
}

/* ─── Arrow Icon Component ───────────────────────────── */

const CaretDownIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─── SelectInput Component ──────────────────────────── */

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  (
    {
      label,
      options,
      placeholder,
      helperText,
      error,
      disabled = false,
      required = false,
      fullWidth = false,
      size = 'md',
      id: externalId,
      className,
      value,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = externalId || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText && !error ? `${selectId}-helper` : undefined;

    const wrapperClass = [
      'vs-select-wrapper',
      fullWidth ? 'vs-select-wrapper--full-width' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const containerClass = [
      'vs-select-container',
      `vs-select-container--${size}`,
      disabled ? 'vs-select-container--disabled' : '',
      error ? 'vs-select-container--error' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const labelClass = [
      'vs-select-label',
      required ? 'vs-select-label--required' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={wrapperClass}>
        {label && (
          <label className={labelClass} htmlFor={selectId}>
            {label}
          </label>
        )}

        <div className={containerClass}>
          <select
            ref={ref}
            id={selectId}
            className="vs-select"
            disabled={disabled}
            required={required}
            value={value}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </select>

          <span className="vs-select-arrow" aria-hidden="true">
            <CaretDownIcon />
          </span>
        </div>

        {error && (
          <span className="vs-select-error" id={errorId} role="alert">
            {error}
          </span>
        )}

        {helperText && !error && (
          <span className="vs-select-helper" id={helperId}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

SelectInput.displayName = 'SelectInput';

export default SelectInput;