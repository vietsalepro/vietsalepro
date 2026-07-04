import React from 'react';
import { User, Gift, X, History } from 'lucide-react';
import { Customer, Reward } from '../../../types';
import { RedeemableRewards } from './RedeemableRewards';
import './CustomerSection.css';

interface CustomerSectionProps {
  customer: Customer;
  onRemove: () => void;
  onOpenRewards: () => void;
  onOpenOrders: () => void;
  // Mới: rewards + redeem
  rewards?: Reward[];
  redeemedRewards?: { rewardId: string; rewardName: string; pointCost: number; quantity: number }[];
  onRedeemReward?: (reward: Reward) => void;
}

/**
 * CustomerSection — Hiển thị thông tin khách hàng đã chọn
 * Style đồng bộ Import Goods (slate, không tím)
 */
export const CustomerSection: React.FC<CustomerSectionProps> = ({
  customer, onRemove, onOpenRewards, onOpenOrders,
  rewards = [], redeemedRewards = [], onRedeemReward
}) => {
  const getRank = (spent: number): { label: string; modifier: string } => {
    if (spent >= 100000000) return { label: 'Kim Cương', modifier: 'customer-section__rank--diamond' };
    if (spent >= 50000000) return { label: 'Vàng', modifier: 'customer-section__rank--gold' };
    if (spent >= 20000000) return { label: 'Bạc', modifier: 'customer-section__rank--silver' };
    if (spent >= 5000000) return { label: 'Đồng', modifier: 'customer-section__rank--bronze' };
    return { label: 'Thường', modifier: 'customer-section__rank--regular' };
  };

  const rank = getRank(customer.totalSpent || 0);

  return (
    <div className="customer-section">
      {/* Header */}
      <div className="customer-section__header">
        <div className="customer-section__identity">
          <div className="customer-section__avatar">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="customer-section__name">{customer.name}</p>
            <p className="customer-section__phone">{customer.phone || 'Chưa có SĐT'}</p>
          </div>
        </div>
        <button onClick={onRemove} className="customer-section__remove-btn">
          <X />
        </button>
      </div>

      {/* Rank + Points */}
      <div className="customer-section__meta">
        <span className={`customer-section__rank ${rank.modifier}`}>
          {rank.label}
        </span>
        <span className="customer-section__spent">
          <span className="customer-section__spent-value">{(customer.totalSpent || 0).toLocaleString('vi-VN')}₫</span> tổng chi
        </span>
      </div>

      {/* Action Buttons */}
      <div className="customer-section__actions">
        <button onClick={onOpenRewards} className="customer-section__rewards-btn">
          <Gift />
          Quà tặng
        </button>
      </div>

      {/* Redeemable Rewards — Điểm + Quà có thể đổi */}
      {onRedeemReward && (
        <div className="customer-section__rewards-wrapper">
          <RedeemableRewards
            customer={customer}
            rewards={rewards}
            redeemedRewards={redeemedRewards}
            onRedeemReward={onRedeemReward}
          />
        </div>
      )}
    </div>
  );
};
