/**
 * ═══════════════════════════════════════════════════════════════
 *  TEXT INPUT COMPONENT — Sprint_04
 *  Source: MASTER_INPUT_STANDARD_V1.md
 * ═══════════════════════════════════════════════════════════════
 *
 *  Props:
 *    - label, placeholder, helperText, error
 *    - disabled, required
 *    - prefixIcon, suffixIcon
 *    - fullWidth, size
 *
 *  Design Tokens:
 *    All styling in TextInput.css — no inline styles.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { forwardRef, useId } from 'react';
import './TextInput.css';

/* ─── Types ──────────────────────────────────────────── */

export type InputSize = 'sm' | 'md' | 'lg';

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text displayed above the input */
  label?: string;
  /** Placeholder text inside the input */
  placeholder?: string;
  /** Helper text shown below the input */
  helperText?: string;
  /** Error message (replaces helperText when set) */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Icon element rendered on the left side */
  prefixIcon?: React.ReactNode;
  /** Icon element rendered on the right side */
  suffixIcon?: React.ReactNode;
  /** Full-width mode */
  fullWidth?: boolean;
  /** Size preset: sm (36px), md (40px), lg (44px) */
  size?: InputSize;
}

/* ─── TextInput Component ────────────────────────────── */

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      placeholder,
      helperText,
      error,
      disabled = false,
      required = false,
      prefixIcon,
      suffixIcon,
      fullWidth = false,
      size = 'md',
      id: externalId,
      className,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;

    const wrapperClass = [
      'vs-text-input-wrapper',
      fullWidth ? 'vs-text-input-wrapper--full-width' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const containerClass = [
      'vs-text-input-container',
      `vs-text-input-container--${size}`,
      disabled ? 'vs-text-input-container--disabled' : '',
      error ? 'vs-text-input-container--error' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const labelClass = [
      'vs-text-input-label',
      required ? 'vs-text-input-label--required' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={wrapperClass}>
        {label && (
          <label className={labelClass} htmlFor={inputId}>
            {label}
          </label>
        )}

        <div className={containerClass}>
          {prefixIcon && (
            <span className="vs-text-input-prefix" aria-hidden="true">
              {prefixIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className="vs-text-input"
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            {...rest}
          />

          {suffixIcon && (
            <span className="vs-text-input-suffix" aria-hidden="true">
              {suffixIcon}
            </span>
          )}
        </div>

        {error && (
          <span className="vs-text-input-error" id={errorId} role="alert">
            {error}
          </span>
        )}

        {helperText && !error && (
          <span className="vs-text-input-helper" id={helperId}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

export default TextInput;