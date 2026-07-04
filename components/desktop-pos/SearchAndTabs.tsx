import React from 'react';
import { Plus, X } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { ProductSearch } from './ProductSearch';
import './SearchAndTabs.css';

// ─── Invoice tabs props ───
export interface InvoiceTabData {
  id: string | number;
  name: string;
}

interface SearchAndTabsProps {
  // ProductSearch props
  productSearchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  isBarcodeListening?: boolean;
  barcodeFlash?: boolean;
  lastScannedCode?: string | null;

  // InvoiceTabs props
  invoices: InvoiceTabData[];
  activeTabId: string | number;
  onSetActiveTabId: (id: string | number) => void;
  onAddTab: () => void;
  onCloseTab: (e: React.MouseEvent, tabId: string | number) => void;
  cartCount: number;
}

/**
 * SearchAndTabs — Kết hợp thanh tìm kiếm sản phẩm và tab hóa đơn
 * vào một box duy nhất (ig-card).
 *
 * Bố cục:
 *   [Hàng 1] Thanh tìm kiếm sản phẩm (giữ nguyên style ProductSearch)
 *   [Hàng 2] Tab hóa đơn + nút thêm tab (+)
 *
 * Style: Import Goods (ig-card, slate)
 */
export const SearchAndTabs: React.FC<SearchAndTabsProps> = ({
  productSearchTerm, onSearchChange, onSearchFocus,
  isBarcodeListening = false,
  barcodeFlash = false,
  lastScannedCode = null,
  invoices, activeTabId, onSetActiveTabId, onAddTab, onCloseTab, cartCount,
}) => {
  return (
    <div className="ig-card search-tabs">
      {/* ── Hàng 1: Thanh tìm kiếm sản phẩm ── */}
      <div className="search-tabs__search">
        <ProductSearch
          productSearchTerm={productSearchTerm}
          onSearchChange={onSearchChange}
          onFocus={onSearchFocus}
          isBarcodeListening={isBarcodeListening}
          barcodeFlash={barcodeFlash}
          lastScannedCode={lastScannedCode}
          noCard
        />
      </div>

      {/* ── Hàng 2: Tab hóa đơn ── */}
      <div className="search-tabs__tab-list no-scrollbar">
        <LayoutGroup>
          {invoices.map((inv, index) => {
            const isActive = inv.id === activeTabId;
            const isFirst = index === 0;

            return (
              <motion.div
                key={inv.id}
                layoutId={`tab-${inv.id}`}
                onClick={() => onSetActiveTabId(inv.id)}
                className={`search-tabs__tab${isActive ? ' search-tabs__tab--active' : ''}`}
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="search-tabs__indicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Invoice name */}
                <span className="search-tabs__name">
                  {inv.name}
                </span>

                {/* Cart count badge */}
                {isActive && cartCount > 0 && (
                  <span className="search-tabs__badge">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}

                {/* Close button — hidden if only 1 invoice */}
                <button
                  onClick={(e) => onCloseTab(e, inv.id)}
                  className={`search-tabs__close${invoices.length === 1 ? ' search-tabs__close--hidden' : ''}${isActive ? ' search-tabs__close--active' : ''}`}
                >
                  <X />
                </button>
              </motion.div>
            );
          })}
        </LayoutGroup>

        {/* Add Tab Button */}
        <motion.button
          onClick={onAddTab}
          className="search-tabs__add"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus />
        </motion.button>
      </div>
    </div>
  );
};
