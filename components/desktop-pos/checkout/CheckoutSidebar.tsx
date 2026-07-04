import React from 'react';
import { CustomerSection } from './CustomerSection';
import { CustomerSearch } from './CustomerSearch';
import { CustomerPoints } from './CustomerPoints';
import { PaymentInfo } from './PaymentInfo';
import { CustomerPayment } from './CustomerPayment';
import { PaymentMethod } from './PaymentMethod';
import { QuickAmountGrid } from './QuickAmountGrid';
import { ChangeDisplay } from './ChangeDisplay';
import { CheckoutButton } from './CheckoutButton';
import { Customer, Reward } from '../../../types';
import './CheckoutSidebar.css';

interface CheckoutSidebarProps {
  customerSearchTerm: string;
  onCustomerSearchChange: (value: string) => void;
  filteredCustomers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  activeCustomer: Customer | undefined;
  onRemoveCustomer: () => void;
  onQuickAddOpen: () => void;
  isCustomerDropdownOpen: boolean;
  setIsCustomerDropdownOpen: (open: boolean) => void;
  customerSearchRef: React.RefObject<HTMLDivElement | null>;
  cartTotal: number;
  totalQuantity: number;
  totalPromotionDiscount: number;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  amountPaid: string;
  onAmountPaidChange: (value: string) => void;
  onCheckout: () => void;
  isProcessing: boolean;
  hasItems: boolean;
  onOpenPromotions: () => void;
  selectedPromotionsCount: number;
  activeCustomerPoints?: number;
  onOpenRewards: () => void;
  onOpenOrders: () => void;
  onOpenNote: () => void;
  // Mới: rewards + redeem
  rewards?: Reward[];
  redeemedRewards?: { rewardId: string; rewardName: string; pointCost: number; quantity: number }[];
  onRedeemReward?: (reward: Reward) => void;
}

/**
 * CheckoutSidebar — Sidebar thanh toán bên phải
 * Dùng ig-card để đồng bộ với phong cách Import Goods
 */
export const CheckoutSidebar: React.FC<CheckoutSidebarProps> = ({
  customerSearchTerm, onCustomerSearchChange, filteredCustomers, onSelectCustomer,
  activeCustomer, onRemoveCustomer, onQuickAddOpen, isCustomerDropdownOpen, setIsCustomerDropdownOpen, customerSearchRef,
  cartTotal, totalQuantity, totalPromotionDiscount, paymentMethod, onPaymentMethodChange,
  amountPaid, onAmountPaidChange, onCheckout, isProcessing, hasItems,
  onOpenPromotions, selectedPromotionsCount, activeCustomerPoints, onOpenNote,
  rewards = [], redeemedRewards = [], onRedeemReward
}) => {
  const changeAmount = Math.max(0, parseFloat(amountPaid || '0') - (cartTotal - totalPromotionDiscount));

  return (
    <div className="ig-card flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Customer Section */}
        {activeCustomer ? (
          <CustomerSection
            customer={activeCustomer}
            onRemove={onRemoveCustomer}
            onOpenRewards={onOpenPromotions}
            onOpenOrders={onOpenNote}
            rewards={rewards}
            redeemedRewards={redeemedRewards}
            onRedeemReward={onRedeemReward}
          />
        ) : (
          <CustomerSearch
            ref={customerSearchRef}
            searchTerm={customerSearchTerm}
            onSearchChange={onCustomerSearchChange}
            filteredCustomers={filteredCustomers}
            onSelectCustomer={onSelectCustomer}
            onQuickAdd={onQuickAddOpen}
            isDropdownOpen={isCustomerDropdownOpen}
            setIsDropdownOpen={setIsCustomerDropdownOpen}
          />
        )}

        {/* Customer Points */}
        {activeCustomer && activeCustomerPoints !== undefined && activeCustomerPoints > 0 && (
          <CustomerPoints points={activeCustomerPoints} />
        )}

        {/* Divider */}
        <div className="checkout-sidebar__divider" />

        {/* Payment Info */}
        <PaymentInfo
          subtotal={cartTotal}
          discount={totalPromotionDiscount}
          total={cartTotal - totalPromotionDiscount}
          totalQuantity={totalQuantity}
          onOpenPromotions={onOpenPromotions}
          selectedPromotionsCount={selectedPromotionsCount}
        />

        {/* Customer Payment */}
        <CustomerPayment
          amountPaid={amountPaid}
          onAmountPaidChange={onAmountPaidChange}
        />

        {/* Payment Method */}
        <PaymentMethod
          selected={paymentMethod}
          onChange={onPaymentMethodChange}
        />

        {/* Quick Amount Grid */}
        <QuickAmountGrid
          onSelect={(amount) => onAmountPaidChange(amount.toString())}
        />

        {/* Change Display */}
        {parseFloat(amountPaid || '0') > 0 && (
          <ChangeDisplay changeAmount={changeAmount} />
        )}
      </div>

      {/* Checkout CTA — fixed at bottom */}
      <div className="shrink-0 p-4 pt-0">
        <CheckoutButton
          onClick={onCheckout}
          disabled={!hasItems}
          loading={isProcessing}
          total={cartTotal - totalPromotionDiscount}
        />
      </div>
    </div>
  );
};