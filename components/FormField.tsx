/**
 * ═══════════════════════════════════════════════════════════════
 *  FORM FIELD COMPONENT — Sprint_08 (Refactored)
 *  Source: MASTER_FORM_STANDARD_V1.md, MASTER_INPUT_STANDARD_V1.md
 *  Feature Flag: useNewFormField (features.ts)
 * ═══════════════════════════════════════════════════════════════
 *
 *  A wrapper that provides label, description, helper text, and
 *  error messaging to any child input component.
 *
 *  Props:
 *    - label, description, required, error, helperText, children
 *
 *  Design Tokens:
 *    All styling in FormField.css — no inline styles.
 *
 *  Structure:
 *    SectionBox (container)
 *      └── Label row
 *      └── Description (optional)
 *      └── Input content
 *      └── Error message (optional)
 *      └── Helper text (optional)
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useId } from 'react';
import './FormField.css';
import { SectionBox } from './SectionBox';

/* ─── Types ──────────────────────────────────────────── */

export interface FormFieldProps {
  /** Label text */
  label?: string;
  /** Description text displayed below the label */
  description?: string;
  /** Required field indicator */
  required?: boolean;
  /** Error message (replaces helperText when set) */
  error?: string;
  /** Helper text shown below the children */
  helperText?: string;
  /** The input component to wrap */
  children: React.ReactNode;
}

/* ─── FormField Component ────────────────────────────── */

export const FormField: React.FC<FormFieldProps> = ({
  label,
  description,
  required = false,
  error,
  helperText,
  children,
}) => {
  const generatedId = useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const helperId = helperText && !error ? `${generatedId}-helper` : undefined;

  const labelClass = [
    'vs-form-field-label',
    required ? 'vs-form-field-label--required' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <SectionBox>
      <div className="vs-form-field" role="group">
        {/* Label Row */}
        {(label || required) && (
          <div className="vs-form-field-label-row">
            {label && <span className={labelClass}>{label}</span>}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="vs-form-field-description">{description}</p>
        )}

        {/* Input Content */}
        <div
          className="vs-form-field-content"
          aria-invalid={!!error}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        >
          {children}
        </div>

        {/* Error Message */}
        {error && (
          <span className="vs-form-field-error" id={errorId} role="alert">
            {error}
          </span>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <span className="vs-form-field-helper" id={helperId}>
            {helperText}
          </span>
        )}
      </div>
    </SectionBox>
  );
};

FormField.displayName = 'FormField';

export default FormField;