import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import { QuantityStepper } from './QuantityStepper';
import './CartItem.css';

import { ProductLot } from '../../types';

interface CartItemProps {
  item: CartItemType;
  index: number;
  isInvalid?: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onChangeLot?: (itemId: string, selectedLot: ProductLot | undefined) => void;
  availableLots?: ProductLot[];
}

/**
 * CartItem — Một dòng sản phẩm trong giỏ hàng
 * Hiển thị: STT, thumbnail, tên, mã, ĐVT, stepper, đơn giá, thành tiền, xóa
 */
export const CartItemComponent: React.FC<CartItemProps> = ({
  item, index, isInvalid, onUpdateQuantity, onRemove, onChangeLot, availableLots = []
}) => {
  const totalPrice = item.price * ((item as any).cartQuantity ?? item.quantity);

  return (
    <tr className={`cart-item ${isInvalid ? 'cart-item--invalid' : ''}`}>
      {/* STT */}
      <td className="cart-item__cell cart-item__cell--stt">
        <span className="cart-item__stt">{index + 1}</span>
      </td>

      {/* Mã hàng */}
      <td className="cart-item__cell cart-item__cell--code">
        <span className="cart-item__code">
          {(item as any).code}
        </span>
      </td>

      {/* Tên hàng + Thumbnail */}
      <td className="cart-item__cell cart-item__cell--name">
        <div className="cart-item__name-wrap">
          <img
            src={(item as any).image || 'https://via.placeholder.com/40'}
            className="cart-item__thumb"
            alt=""
          />
          <div className="cart-item__meta">
            <p className="cart-item__name">{item.name}</p>
            <div className="cart-item__meta-list">
              <div className="cart-item__meta-row">
                <span className="cart-item__unit">
                  {(item as any).selectedUnit?.name || item.unit}
                </span>
                {isInvalid && (
                  <span className="cart-item__invalid-tag">
                    <AlertTriangle />
                    Vượt tồn
                  </span>
                )}
              </div>

              {/* Chọn lô hàng nếu sản phẩm quản lý theo lô (hasBatches) */}
              {((item as any).hasBatches || (item as any).lots?.length > 0) && (
                <div className="cart-item__lot">
                  <span className="cart-item__lot-label">Lô xuất:</span>
                  {availableLots.length > 0 ? (
                    <select
                      value={(item as any).selectedLot?.id || ''}
                      onChange={(e) => {
                        const lot = availableLots.find(l => l.id === e.target.value);
                        onChangeLot?.(item.id, lot);
                      }}
                      className="cart-item__lot-select"
                    >
                      <option value="">-- Chọn lô --</option>
                      {availableLots.map((lot) => (
                        <option key={lot.id} value={lot.id}>
                          {lot.code} ({lot.quantity} {item.unit}) - HSD: {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('vi-VN') : 'N/A'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="cart-item__lot-empty">
                      Hết hàng trong lô
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Số lượng */}
      <td className="cart-item__cell cart-item__cell--qty">
        <div className="cart-item__qty-wrap">
          <QuantityStepper
            quantity={(item as any).cartQuantity ?? item.quantity}
            onChange={(qty) => onUpdateQuantity(item.id, qty)}
          />
        </div>
      </td>

      {/* Đơn giá */}
      <td className="cart-item__cell cart-item__cell--price">
        <span className="cart-item__price">{item.price.toLocaleString('vi-VN')}</span>
      </td>

      {/* Thành tiền */}
      <td className="cart-item__cell cart-item__cell--total">
        <span className="cart-item__total">{totalPrice.toLocaleString('vi-VN')}</span>
      </td>

      {/* Xóa */}
      <td className="cart-item__cell">
        <button
          onClick={() => onRemove(item.id)}
          className="cart-item__delete"
        >
          <Trash2 />
        </button>
      </td>
    </tr>
  );
};
