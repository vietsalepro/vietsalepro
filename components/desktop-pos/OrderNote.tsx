import React from 'react';
import { Plus } from 'lucide-react';
import './OrderNote.css';

interface OrderNoteProps {
  onClick: () => void;
}

/**
 * OrderNote — Card dashed border để thêm ghi chú đơn hàng
 * Style: viền dashed tím, hover đổi màu
 */
export const OrderNote: React.FC<OrderNoteProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="pos-card-dashed order-note"
    >
      <Plus className="order-note__icon" />
      <span className="order-note__label">Thêm ghi chú đơn hàng</span>
    </button>
  );
};
