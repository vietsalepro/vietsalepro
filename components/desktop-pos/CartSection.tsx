import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Package, Pencil } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import { CartItemComponent } from './CartItem';
import './CartSection.css';

import { ProductLot } from '../../types';

interface CartSectionProps {
  items: CartItemType[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onClearAll: () => void;
  onSaveNote?: (note: string) => void;
  note?: string;
  onChangeLot?: (itemId: string, selectedLot: ProductLot | undefined) => void;
  getAvailableLotsForProduct?: (productId: string) => ProductLot[];
}

/**
 * CartSection — Giỏ hàng POS
 * Style đồng bộ Import Goods (ig-card, slate)
 */
export function CartSection(props: CartSectionProps) {
  const { items, onUpdateQuantity, onRemove, onClearAll, onSaveNote, note: initialNote, onChangeLot, getAvailableLotsForProduct } = props;
  const note = initialNote || '';
  const textareaRef = useRef<any>(null);
  const autoSaveRef = useRef<any>(null);
  const lastSavedRef = useRef(note);
  const [localNote, setLocalNote] = useState(note);

  useEffect(() => {
    setLocalNote(note);
    lastSavedRef.current = note;
  }, [note]);

  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      const current = localNote;
      if (current !== lastSavedRef.current) {
        lastSavedRef.current = current;
        onSaveNote?.(current);
      }
    }, 3000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [localNote, onSaveNote]);

  function handleBlur() {
    if (localNote !== lastSavedRef.current) {
      lastSavedRef.current = localNote;
      onSaveNote?.(localNote);
    }
  }

  function handleChange(e: React.ChangeEvent<any>) {
    setLocalNote(e.target.value);
  }

  const noteFooter = (
    <div className="shrink-0 cart-section__note-footer">
      <div className="cart-section__note-field">
        <label className="cart-section__note-label">
          <Pencil />
          Ghi chú đơn hàng
        </label>
        <textarea
          ref={textareaRef}
          value={localNote}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Nhập ghi chú cho đơn hàng..."
          className="cart-section__note-textarea"
        />
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="ig-card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="cart-section__empty-body">
            <div className="cart-section__empty-icon-wrap">
              <Package />
            </div>
            <p className="cart-section__empty-title">Chưa có sản phẩm nào</p>
            <p className="cart-section__empty-subtitle">Tìm kiếm sản phẩm để bắt đầu bán hàng</p>
          </div>
        </div>
        {noteFooter}
      </div>
    );
  }

  return (
    <div className="ig-card flex flex-col flex-1 overflow-hidden min-h-0">
      <header className="cart-section__header">
        <div className="cart-section__title-group">
          <h2 className="cart-section__title">Sản phẩm đã chọn</h2>
          <span className="cart-section__count-badge">
            {items.length}
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="cart-section__clear-btn"
        >
          <Trash2 />
          Xóa tất cả
        </button>
      </header>

      <div className="cart-section__body">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="cart-col-stt" />
            <col className="cart-col-code" />
            <col />
            <col className="cart-col-qty" />
            <col className="cart-col-price" />
            <col className="cart-col-total" />
            <col className="cart-col-action" />
          </colgroup>
          <thead className="cart-section__head">
            <tr className="cart-section__head-row">
              <th className="cart-section__th text-left">STT</th>
              <th className="cart-section__th text-left">Mã hàng</th>
              <th className="cart-section__th text-left">Tên hàng</th>
              <th className="cart-section__th text-center">SL</th>
              <th className="cart-section__th text-right">Đơn giá</th>
              <th className="cart-section__th text-right">Thành tiền</th>
              <th className="cart-section__th text-left"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: CartItemType, index: number) => (
              <CartItemComponent
                key={`${item.id}-${(item as any).selectedLot?.id || 'nolot'}`}
                item={item}
                index={index}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                onChangeLot={onChangeLot}
                availableLots={getAvailableLotsForProduct?.(item.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {noteFooter}
    </div>
  );
}