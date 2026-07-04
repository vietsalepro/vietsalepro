import React from 'react';
import './VoucherSidebar.css';

export interface VoucherSidebarProps {
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export const VoucherSidebar: React.FC<VoucherSidebarProps> = ({
  children,
  actions,
}) => {
  return (
    <aside className="voucher-sidebar">
      <div className="voucher-sidebar-scroll">
        <div className="voucher-sidebar-content">
          {children}
        </div>
      </div>
      {actions}
    </aside>
  );
};
