import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { InvoiceTabs } from './InvoiceTabs';

interface TopNavigationProps {
  invoices: { id: number; name: string }[];
  activeTabId: number;
  onSetActiveTabId: (id: number) => void;
  onAddTab: () => void;
  onCloseTab: (e: React.MouseEvent, tabId: number) => void;
  cartCount: number;
}

/**
 * TopNavigation — Thanh tab hóa đơn
 * Style: Import Goods (ig-card, flat)
 */
export const TopNavigation: React.FC<TopNavigationProps> = ({
  invoices, activeTabId, onSetActiveTabId, onAddTab, onCloseTab, cartCount
}) => {
  return (
    <nav className="ig-card h-[72px] px-5 flex items-center">
      {/* Invoice Tabs */}
      <div className="flex-1 overflow-hidden">
        <InvoiceTabs
          invoices={invoices}
          activeTabId={activeTabId}
          onSetActiveTabId={onSetActiveTabId}
          onAddTab={onAddTab}
          onCloseTab={onCloseTab}
          cartCount={cartCount}
        />
      </div>
    </nav>
  );
};