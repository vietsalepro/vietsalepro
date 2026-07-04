import React from 'react';
import { Gift, Star } from 'lucide-react';
import { Reward, Customer } from '../../../types';
import { MasterModal } from '../../MasterModal';
import { EmptyState } from '../../EmptyState';
import './RewardModal.css';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: Reward[];
  customer: Customer | undefined;
  onRedeemReward: (reward: Reward) => void;
  redeemedRewards: { rewardId: string; rewardName: string; pointCost: number; quantity: number }[];
}

/**
 * RewardModal — Modal đổi quà tặng
 * - Uses MasterModal container with standardized shell
 * - Uses EmptyState for empty list handling
 * - CSS-driven styling via RewardModal.css
 */
export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen, onClose, rewards, customer, onRedeemReward, redeemedRewards
}) => {
  if (!isOpen) return null;

  const activeRewards = rewards.filter(r => r.isActive);
  const redeemedIds = redeemedRewards.map(r => r.rewardId);

  // ─── Customer points info renderer ────────────────────────
  const renderPointsInfo = () => {
    if (!customer) return null;
    return (
      <div className="reward-points-info">
        <div className="reward-points-row">
          <Star className="reward-points-star" size={16} aria-hidden="true" />
          <span className="reward-points-label">Điểm hiện tại:</span>
          <span className="reward-points-value">
            {((customer as any).loyaltyPoints || 0).toLocaleString('vi-VN')} điểm
          </span>
        </div>
        <p className="reward-points-spent">
          Tổng chi tiêu: {((customer as any).totalSpent || 0).toLocaleString('vi-VN')}₫
        </p>
      </div>
    );
  };

  // ─── Reward list renderer ─────────────────────────────────
  const renderRewardList = () => (
    <div className="reward-list">
      {activeRewards.map(reward => {
        const canRedeem = customer && ((customer as any).loyaltyPoints || 0) >= reward.pointCost;
        const isRedeemed = redeemedIds.includes(reward.id);
        const btnClass = isRedeemed
          ? 'reward-redeem-btn reward-redeem-btn--redeemed'
          : canRedeem
            ? 'reward-redeem-btn reward-redeem-btn--available'
            : 'reward-redeem-btn reward-redeem-btn--disabled';
        return (
          <div
            key={reward.id}
            className={`reward-card${canRedeem ? '' : ' reward-card--disabled'}`}
          >
            <div className="reward-card-header">
              <div className="reward-card-info">
                <h4 className="reward-card-name">{reward.name}</h4>
                <p className="reward-card-desc">{reward.description || ''}</p>
              </div>
              <div className="reward-card-points">
                <span className="reward-card-points-value">
                  {reward.pointCost.toLocaleString('vi-VN')} điểm
                </span>
                {reward.stock !== undefined && (
                  <span className="reward-card-stock">Còn: {reward.stock}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => canRedeem && onRedeemReward(reward)}
              disabled={!canRedeem || isRedeemed}
              className={btnClass}
            >
              {isRedeemed ? '✓ Đã thêm' : canRedeem ? 'Đổi ngay' : 'Không đủ điểm'}
            </button>
          </div>
        );
      })}
    </div>
  );

  // ─── Body renderer ────────────────────────────────────────
  const renderBody = () => {
    if (activeRewards.length === 0) {
      return (
        <EmptyState
          icon={<Gift className="reward-empty-icon" />}
          title="Chưa có quà tặng nào"
          description="Vào Cài đặt → Quà tặng để thêm"
          compact
        />
      );
    }
    return (
      <>
        {renderPointsInfo()}
        {renderRewardList()}
      </>
    );
  };

  return (
    <MasterModal
      isOpen={isOpen}
      onClose={onClose}
      title="Đổi quà tặng"
      icon={<Gift size={20} />}
      size="sm"
    >
      {renderBody()}
    </MasterModal>
  );
};
