import React from 'react';
import { Product, Customer, Invoice, Promotion, Reward, AppSettings } from '../types';
import { usePOS } from '../hooks/usePOS';
import { useBarcodeCapture } from '../hooks/useBarcodeCapture';
import { supabaseService } from '../services/supabaseService';
import { POSLayout } from '../components/desktop-pos/POSLayout';
import { SearchAndTabs } from '../components/desktop-pos/SearchAndTabs';
import { ProductSearchResults } from '../components/desktop-pos/ProductSearchResults';
import { CartSection } from '../components/desktop-pos/CartSection';
import { CheckoutSidebar } from '../components/desktop-pos/checkout/CheckoutSidebar';
import { PromotionModal } from '../components/desktop-pos/modals/PromotionModal';
import { RewardModal } from '../components/desktop-pos/modals/RewardModal';
import { QuickAddCustomerModal } from '../components/desktop-pos/modals/QuickAddCustomerModal';
import { AdvancedCustomerSearch } from '../components/desktop-pos/modals/AdvancedCustomerSearch';
import { CustomerOrdersModal } from '../components/desktop-pos/modals/CustomerOrdersModal';
import BarcodeScannerFix from '../components/BarcodeScannerFix';
import { Check, AlertTriangle } from 'lucide-react';

interface POSProps {
  products?: Product[];
  customers?: Customer[];
  invoices: Invoice[];
  activeTabId: number;
  onUpdateInvoices: (invoices: Invoice[]) => void;
  onSetActiveTabId: (id: number) => void;
  onCheckout: (invoiceId: number, paymentMethod: string, amountPaid: number, customerId?: string, appliedPromotions?: Promotion[]) => void;
  onAddCustomer: (customer: Customer) => Promise<void>;
  appSettings: AppSettings;
  rewards: Reward[];
  promotions: Promotion[];
}

export const POS: React.FC<POSProps> = ({
  products = [], customers = [], invoices, activeTabId, onUpdateInvoices, onSetActiveTabId,
  onCheckout, onAddCustomer, appSettings, rewards, promotions
}) => {
  const pos = usePOS({
    products, customers, invoices, activeTabId, promotions, rewards, appSettings,
    onUpdateInvoices, onSetActiveTabId, onCheckout, onAddCustomer
  });

  // ─── Handle scan success ───
  const handleScanSuccess = async (code: string) => {
    const product = await pos.searchProductByBarcode(code);
    if (product) {
      pos.addToCart(product);
      pos.showToast(`Đã thêm: ${product.name}`);
    } else {
      pos.showToast('Không tìm thấy sản phẩm', 'error');
    }
  };

  // ─── Desktop Barcode Capture (máy quét hồng ngoại / HID keyboard) ───
  const {
    isListening: isBarcodeListening,
    lastScannedCode,
    flashFeedback: barcodeFlash,
  } = useBarcodeCapture({
    onBarcodeScanned: handleScanSuccess,
    charIntervalThreshold: 50,
    bufferTimeout: 200,
    debounceTime: 2000,
    enableSound: true,
  });

  // ─── Left Content ───
  const leftContent = (
    <div className="flex flex-col h-full gap-3 min-h-0">
      {/* Search & Invoice Tabs — combined box */}
      <div ref={pos.productSearchRef} className="relative">
        <SearchAndTabs
          productSearchTerm={pos.productSearchTerm}
          onSearchChange={(value) => {
            pos.setProductSearchTerm(value);
            pos.setShowProductResults(true);
          }}
          onSearchFocus={() => pos.setShowProductResults(true)}
          isBarcodeListening={isBarcodeListening}
          barcodeFlash={barcodeFlash}
          lastScannedCode={lastScannedCode}
          invoices={invoices.map(inv => ({ id: inv.id, name: (inv as any).name || `Hóa đơn ${inv.id}` }))}
          activeTabId={activeTabId}
          onSetActiveTabId={(id: string | number) => onSetActiveTabId(id as number)}
          onAddTab={pos.handleAddTab}
          onCloseTab={(e: React.MouseEvent, tabId: string | number) => pos.handleCloseTab(e, tabId as number)}
          cartCount={pos.activeCart.length}
        />
        <ProductSearchResults
          products={pos.filteredProducts}
          searchTerm={pos.showProductResults ? pos.productSearchTerm : ''}
          onSelectProduct={pos.addToCart}
          isSearching={pos.isSearchingProduct}
        />
      </div>

      {/* Cart Section */}
      <CartSection
        items={pos.activeCart}
        onUpdateQuantity={(itemId, qty) => pos.updateCartItem(itemId, { cartQuantity: qty })}
        onRemove={pos.removeCartItem}
        onClearAll={() => {
          const inv = pos.activeInvoice;
          if (inv) {
            pos.updateInvoice({ ...inv, cart: [] });
          }
        }}
        note={pos.activeInvoice?.note || ''}
        onSaveNote={(newNote) => {
          const inv = pos.activeInvoice;
          if (inv) {
            pos.updateInvoice({ ...inv, note: newNote });
          }
        }}
        onChangeLot={(itemId, lot) => pos.changeCartItemLot(itemId, lot)}
        getAvailableLotsForProduct={(productId) => pos.getAvailableLotsForProduct(productId)}
      />
    </div>
  );

  // Redeemed rewards từ active invoice
  const redeemedRewards = (pos.activeInvoice as any)?.redeemedRewards || [];

  // ─── Right Sidebar ───
  const rightSidebar = (
    <CheckoutSidebar
      customerSearchTerm={pos.customerSearchTerm}
      onCustomerSearchChange={pos.setCustomerSearchTerm}
      filteredCustomers={pos.filteredCustomers}
      onSelectCustomer={pos.handleSelectCustomer}
      activeCustomer={pos.activeCustomer}
      onRemoveCustomer={pos.handleRemoveCustomer}
      onQuickAddOpen={() => pos.setIsQuickAddCustomerOpen(true)}
      isCustomerDropdownOpen={pos.isCustomerDropdownOpen}
      setIsCustomerDropdownOpen={pos.setIsCustomerDropdownOpen}
      customerSearchRef={pos.customerSearchRef}
      cartTotal={pos.cartTotal}
      totalQuantity={pos.totalQuantity}
      totalPromotionDiscount={pos.totalPromotionDiscount}
      paymentMethod={pos.paymentMethod}
      onPaymentMethodChange={pos.setPaymentMethod}
      amountPaid={pos.amountPaid}
      onAmountPaidChange={pos.setAmountPaid}
      onCheckout={pos.handleDirectCheckout}
      isProcessing={pos.isProcessing}
      hasItems={pos.activeCart.length > 0}
      onOpenPromotions={() => pos.setIsPromotionModalOpen(true)}
      selectedPromotionsCount={pos.selectedPromotions.length}
      activeCustomerPoints={(pos.activeCustomer as any)?.loyaltyPoints || (pos.activeCustomer as any)?.points}
      onOpenRewards={() => pos.setIsRewardModalOpen(true)}
      onOpenOrders={() => pos.setIsCustomerOrdersOpen(true)}
      onOpenNote={() => pos.showToast('Tính năng ghi chú')}
      // Mới: rewards + redeem
      rewards={rewards}
      redeemedRewards={redeemedRewards}
      onRedeemReward={pos.handleRedeemReward}
    />
  );

  return (
    <>
      {/* Empty top nav — moved to SearchAndTabs */}
      <POSLayout
        topNav={<div />}
        leftContent={leftContent}
        rightSidebar={rightSidebar}
      />

      {/* ─── Promotion Modal ─── */}
      <PromotionModal
        isOpen={pos.isPromotionModalOpen}
        onClose={() => pos.setIsPromotionModalOpen(false)}
        suggestions={pos.promotionSuggestions}
        selectedPromotions={pos.selectedPromotions}
        onTogglePromotion={pos.handleTogglePromotion}
      />

      {/* ─── Reward Modal ─── */}
      <RewardModal
        isOpen={pos.isRewardModalOpen}
        onClose={() => pos.setIsRewardModalOpen(false)}
        rewards={rewards}
        customer={pos.activeCustomer}
        onRedeemReward={pos.handleRedeemReward}
        redeemedRewards={(pos.activeInvoice as any)?.redeemedRewards || []}
      />

      {/* ─── Quick Add Customer Modal ─── */}
      <QuickAddCustomerModal
        isOpen={pos.isQuickAddCustomerOpen}
        onClose={() => pos.setIsQuickAddCustomerOpen(false)}
        form={pos.quickAddForm}
        onFormChange={pos.setQuickAddForm}
        onSubmit={pos.handleQuickAddCustomer}
      />

      {/* ─── Advanced Customer Search ─── */}
      <AdvancedCustomerSearch
        isOpen={pos.isAdvancedCustomerSearchOpen}
        onClose={() => pos.setIsAdvancedCustomerSearchOpen(false)}
        customers={customers}
        onSearchCustomers={(term) => supabaseService.searchCustomers(term)}
        onSelectCustomer={(c) => {
          pos.handleSelectCustomer(c);
          pos.setIsAdvancedCustomerSearchOpen(false);
        }}
        onQuickAdd={() => {
          pos.setIsAdvancedCustomerSearchOpen(false);
          pos.setIsQuickAddCustomerOpen(true);
        }}
      />

      {/* ─── Customer Orders Modal ─── */}
      {pos.activeCustomer && (
        <CustomerOrdersModal
          isOpen={pos.isCustomerOrdersOpen}
          onClose={() => pos.setIsCustomerOrdersOpen(false)}
          customer={pos.activeCustomer}
        />
      )}

      {/* ─── Barcode Scanner ─── */}
      <BarcodeScannerFix
        isOpen={pos.isScannerOpen}
        onScanSuccess={handleScanSuccess}
        onClose={() => pos.setIsScannerOpen(false)}
      />

      {/* ─── Toast Notification ─── */}
      {pos.toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] animate-slide-in-up ${
          pos.toast.type === 'success' ? 'bg-gradient-to-r from-[#22C55E] to-emerald-500' : 'bg-gradient-to-r from-[#EF4444] to-rose-500'
        } text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2`}>
          {pos.toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {pos.toast.message}
        </div>
      )}
    </>
  );
};