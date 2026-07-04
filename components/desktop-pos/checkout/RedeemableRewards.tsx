import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Check, Plus, RotateCcw } from 'lucide-react';
import { Reward, Customer } from '../../../types';
import './RedeemableRewards.css';

interface RedeemableRewardsProps {
  customer: Customer;
  rewards: Reward[];
  redeemedRewards: { rewardId: string; rewardName: string; pointCost: number; quantity: number }[];
  onRedeemReward: (reward: Reward) => void;
}

/**
 * RedeemableRewards — Hiển thị điểm khách hàng + danh sách quà có thể đổi
 * 
 * Cơ chế đổi quà động:
 * - Mỗi lần user đổi quà → remainingPoints giảm dần
 * - Hệ thống tự động quét lại danh sách, chỉ hiển thị quà ≤ remainingPoints
 * - Nếu hết điểm hoặc không còn quà nào khả dụng → ẩn section
 * 
 * Ví dụ: Khách 100 điểm
 *   1. Hiển thị quà ≤ 100đ: [Gấu 70đ, Sữa 20đ, Bánh 5đ]
 *   2. Đổi Gấu 70đ → còn 30đ → tự động ẩn Gấu, hiển thị [Sữa 20đ, Bánh 5đ]
 *   3. Đổi Sữa 20đ → còn 10đ → tự động ẩn Sữa, hiển thị [Bánh 5đ]
 *   4. Đổi Bánh 5đ → còn 5đ → ẩn hết
 */
export const RedeemableRewards: React.FC<RedeemableRewardsProps> = ({
  customer, rewards, redeemedRewards, onRedeemReward
}) => {
  // Customer có thể có points (type) hoặc loyaltyPoints (supabase response)
  const customerPoints = (customer as any).loyaltyPoints || customer.points || 0;

  // Tổng điểm đã đổi từ các quà đã chọn
  const totalRedeemedPoints = redeemedRewards.reduce(
    (sum, r) => sum + (r.pointCost * r.quantity), 0
  );

  // Điểm còn lại có thể dùng để đổi
  const remainingPoints = customerPoints - totalRedeemedPoints;

  // Chỉ lấy quà đang kích hoạt và ≤ remainingPoints
  const redeemableRewards = rewards.filter(r =>
    r.isActive !== false &&
    (r.pointCost || 0) > 0 &&
    remainingPoints >= (r.pointCost || 0)
  );

  // Nếu không còn điểm hoặc không có quà nào → không render
  if (remainingPoints <= 0 || redeemableRewards.length === 0) return null;

  const getRedeemedQuantity = (rewardId: string): number => {
    const found = redeemedRewards.find(r => r.rewardId === rewardId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="redeem-rewards">
      {/* Header - Điểm còn lại có thể đổi */}
      <div className="redeem-rewards-header">
        <div className="flex items-center gap-2">
          <div className="redeem-rewards-header-icon">
            <Star className="w-4 h-4 fill-current" />
          </div>
          <div>
            <p className="redeem-rewards-label">Điểm còn lại</p>
            <p className="redeem-rewards-points">
              {remainingPoints.toLocaleString('vi-VN')} điểm
            </p>
            {totalRedeemedPoints > 0 && (
              <p className="redeem-rewards-redeemed-note">
                Đã đổi: {totalRedeemedPoints.toLocaleString('vi-VN')} điểm
              </p>
            )}
          </div>
        </div>
        <span className="redeem-rewards-count-badge">
          <Gift className="w-3.5 h-3.5" />
          {redeemableRewards.length} quà
        </span>
      </div>

      {/* Danh sách quà có thể đổi (đã tự động lọc theo remainingPoints) */}
      <div className="redeem-rewards-list">
        {redeemableRewards.map((reward, index) => {
          const redeemedQty = getRedeemedQuantity(reward.id);
          const alreadyRedeemed = redeemedQty > 0;

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="redeem-rewards-item"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="redeem-rewards-name truncate">
                    {reward.name}
                  </span>
                  {alreadyRedeemed && (
                    <span className="redeem-rewards-redeemed-badge">
                      <Check className="w-2.5 h-2.5" />
                      {redeemedQty}
                    </span>
                  )}
                </div>
                <span className="redeem-rewards-point-cost">
                  {reward.pointCost.toLocaleString('vi-VN')} điểm
                </span>
                {reward.stock !== undefined && (
                  <span className="redeem-rewards-stock">
                    · Tồn: {reward.stock}
                  </span>
                )}
              </div>

              <button
                onClick={() => onRedeemReward(reward)}
                className={`redeem-rewards-btn ${
                  alreadyRedeemed
                    ? 'redeem-rewards-btn--redeemed'
                    : 'redeem-rewards-btn--available'
                }`}
              >
                {alreadyRedeemed ? (
                  <>
                    <Plus className="w-3 h-3" />
                    Thêm
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3" />
                    Đổi
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};