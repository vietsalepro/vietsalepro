import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import './InvoiceTabs.css';

interface InvoiceTabsProps {
  invoices: { id: number; name: string }[];
  activeTabId: number;
  onSetActiveTabId: (id: number) => void;
  onAddTab: () => void;
  onCloseTab: (e: React.MouseEvent, tabId: number) => void;
  cartCount: number;
}

/**
 * InvoiceTabs — Tab hóa đơn với drag-reorder animation
 *
 * Tab active: nền tím nhạt + border tím + chữ tím
 * Tab inactive: nền trắng + border xám
 * Mỗi tab: tên hóa đơn + nút đóng X
 * Micro interaction: hover glow, tab slide animation, active indicator
 */
export const InvoiceTabs: React.FC<InvoiceTabsProps> = ({
  invoices, activeTabId, onSetActiveTabId, onAddTab, onCloseTab, cartCount
}) => {
  return (
    <div className="invoice-tabs no-scrollbar">
      <LayoutGroup>
        {invoices.map((inv) => {
          const isActive = inv.id === activeTabId;

          return (
            <motion.div
              key={inv.id}
              layoutId={`tab-${inv.id}`}
              onClick={() => onSetActiveTabId(inv.id)}
              className={`invoice-tabs__tab ${isActive ? 'invoice-tabs__tab--active' : ''}`}
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="invoice-tabs__indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Invoice name */}
              <span className="invoice-tabs__name">
                {inv.name}
              </span>

              {/* Cart count badge */}
              {isActive && cartCount > 0 && (
                <span className="invoice-tabs__badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}

              {/* Close button — hidden if only 1 invoice */}
              <button
                onClick={(e) => onCloseTab(e, inv.id)}
                className={`invoice-tabs__close ${invoices.length === 1 ? 'invoice-tabs__close--hidden' : ''}`}
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
        className="invoice-tabs__add"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus />
      </motion.button>
    </div>
  );
};
