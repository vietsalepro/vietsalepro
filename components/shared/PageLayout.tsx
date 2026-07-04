import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Container chuẩn cho các trang list view.
 * Đồng bộ padding 4 cạnh theo chuẩn tab Trả hàng (lg:p-8 ≈ 32px ~ 1cm).
 * Dùng h-full để khớp chính xác với chiều cao vùng hiển thị (không vượt quá gây scroll thừa).
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`p-4 md:p-6 lg:p-8 w-full bg-[#f8fafc] h-full flex flex-col space-y-6 animate-fade-in ${className}`}
    >
      {children}
    </div>
  );
};

export default PageLayout;
