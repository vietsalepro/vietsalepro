import React from 'react';
import { AlertCircle } from 'lucide-react';
import './FormField.css';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className = '',
}) => {
  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`.trim()}>
      <label htmlFor={htmlFor} className="form-field__label">
        {label}
        {required && (
          <span className="form-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="form-field__control">{children}</div>
      {hint && !error && <p className="form-field__hint">{hint}</p>}
      {error && (
        <p className="form-field__error" role="alert">
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};
