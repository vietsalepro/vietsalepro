import React from 'react';
import './SkeletonLoader.css';

export interface SkeletonLoaderProps {
  variant: 'text' | 'card' | 'table-row' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  lines?: number;
  rows?: number;
  cards?: number;
  className?: string;
}

const toStyleSize = (value?: string | number): React.CSSProperties['width'] => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant,
  width,
  height,
  lines = 3,
  rows = 3,
  cards = 3,
  className = '',
}) => {
  const baseClass = `skeleton skeleton--${variant}`;

  if (variant === 'text') {
    return (
      <div className={`skeleton-text ${className}`} style={{ width: toStyleSize(width) }} aria-busy="true" aria-label="Loading text">
        {Array.from({ length: lines }).map((_, i) => {
          const isLast = i === lines - 1;
          // Random-ish widths: vary by index so the last line is shorter
          const lineWidth = isLast ? '40%' : `${70 + ((i * 17) % 31)}%`;
          return (
            <div
              key={i}
              className="skeleton-text-line"
              style={{ width: lineWidth }}
            />
          );
        })}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`skeleton-card-grid ${className}`} aria-busy="true" aria-label="Loading cards">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-card-image" />
            <div className="skeleton-card-body">
              <div className="skeleton-card-line skeleton-card-line--lg" />
              <div className="skeleton-card-line" />
              <div className="skeleton-card-line skeleton-card-line--sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`skeleton-table ${className}`} aria-busy="true" aria-label="Loading table">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-table-row">
            <div className="skeleton-table-cell skeleton-table-cell--checkbox">
              <div className="skeleton skeleton--circle" style={{ width: 20, height: 20 }} />
            </div>
            <div className="skeleton-table-cell skeleton-table-cell--lg" />
            <div className="skeleton-table-cell skeleton-table-cell--md" />
            <div className="skeleton-table-cell skeleton-table-cell--sm" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    const size = toStyleSize(width ?? height ?? 40);
    return (
      <div
        className={`skeleton skeleton--circle ${className}`}
        style={{ width: size, height: size }}
        aria-busy="true"
        aria-label="Loading avatar"
      />
    );
  }

  // rect
  return (
    <div
      className={`skeleton skeleton--rect ${className}`}
      style={{ width: toStyleSize(width), height: toStyleSize(height) }}
      aria-busy="true"
      aria-label="Loading content"
    />
  );
};
