import React from 'react';
import './FormTextarea.css';

export interface FormTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  className,
  error,
  resize = 'vertical',
}) => {
  return (
    <div className={`form-textarea-wrapper ${className || ''}`}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="form-textarea"
        style={{ resize }}
        aria-invalid={!!error}
      />
      {error && <span className="form-textarea-error">{error}</span>}
    </div>
  );
};
