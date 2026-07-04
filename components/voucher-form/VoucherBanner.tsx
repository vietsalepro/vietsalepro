import React from 'react';
import './VoucherBanner.css';

export interface VoucherBannerProps {
  children?: React.ReactNode;
}

export const VoucherBanner: React.FC<VoucherBannerProps> = ({ children }) => {
  return <div className="voucher-banner">{children}</div>;
};
