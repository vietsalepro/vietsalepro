import React from 'react';

interface DataGridBoxProps {
  children: React.ReactNode;
  className?: string;
  innerRef?: React.Ref<HTMLDivElement>;
}

/**
 * Box chính chứa DataGrid / Table theo chuẩn tab Trả hàng.
 * Dùng flex để lấp đầy chiều cao còn lại và giữ pagination cố định dưới cùng.
 */
export const DataGridBox: React.FC<DataGridBoxProps> = ({
  children,
  className = '',
  innerRef,
}) => {
  return (
    <div
      ref={innerRef}
      className={`bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-100/50 p-6 flex flex-col flex-1 min-h-0 ${className}`}
    >
      {children}
    </div>
  );
};

export default DataGridBox;
