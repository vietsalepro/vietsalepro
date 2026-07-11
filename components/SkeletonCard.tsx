import React from 'react';

export interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  lines = 3,
}) => {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
      aria-busy="true"
      aria-label="Loading card"
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 animate-pulse rounded bg-gray-200"
              style={{ width: i === lines - 1 ? '60%' : '100%' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
