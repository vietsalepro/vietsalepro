import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastItem, ToastType } from './ToastContainer';

export interface ToastProps extends ToastItem {
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="toast__icon" aria-hidden="true" />,
  error: <XCircle className="toast__icon" aria-hidden="true" />,
  warning: <AlertTriangle className="toast__icon" aria-hidden="true" />,
  info: <Info className="toast__icon" aria-hidden="true" />,
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}) => {
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onDismiss(id), 200);
  };

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  return (
    <div
      className={`toast toast--${type}${exiting ? ' toast--exiting' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="toast__content">
        <span className={`toast__indicator toast__indicator--${type}`}>{ICONS[type]}</span>
        <div className="toast__body">
          {title && <p className="toast__title">{title}</p>}
          <p className="toast__message">{message}</p>
        </div>
        <button
          type="button"
          className="toast__close"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {duration > 0 && (
        <div
          className={`toast__progress toast__progress--${type}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};
