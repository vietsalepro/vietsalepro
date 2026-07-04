import React from 'react';
import { Star } from 'lucide-react';
import './CustomerPoints.css';

interface CustomerPointsProps {
  points: number;
}

/**
 * CustomerPoints — Card điểm tích lũy
 * Màu xanh nhạt (giữ nguyên màu xanh theo yêu cầu)
 * Chỉnh lại rounded + border đồng bộ Import Goods style
 */
export const CustomerPoints: React.FC<CustomerPointsProps> = ({ points }) => {
  return (
    <div className="customer-points">
      <div className="customer-points__icon">
        <Star className="customer-points__icon-svg" />
      </div>
      <div className="customer-points__body">
        <p className="customer-points__label">Điểm tích lũy</p>
        <p className="customer-points__value">{points.toLocaleString('vi-VN')} điểm</p>
      </div>
      <span className="customer-points__badge">
        <Star className="customer-points__badge-svg" />
        +{points}
      </span>
    </div>
  );
};
