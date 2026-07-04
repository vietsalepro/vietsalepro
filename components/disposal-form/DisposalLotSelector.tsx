import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { ProductLot } from '../../types';
import './DisposalLotSelector.css';

interface DisposalLotSelectorProps {
  /** Danh sách lot của sản phẩm */
  lots: ProductLot[];
  /** Lot hiện tại đã chọn */
  selectedLot: ProductLot | null | undefined;
  /** Callback khi chọn lot */
  onSelectLot: (lot: ProductLot | null) => void;
  /** Tên sản phẩm để hiển thị */
  productName: string;
  /** Mã sản phẩm để hiển thị */
  productCode?: string;
}

/**
 * DisposalLotSelector — Modal/Dropdown để chọn lô hạn sử dụng
 * khi tạo phiếu xuất hủy cho sản phẩm có quản lý lô.
 *
 * UI:
 * - Hiển thị danh sách lot với code + HSD + tồn kho
 * - Cho phép chọn 1 lot hoặc "Không chọn" (null)
 * - Hiển thị lot đã chọn trong header
 */
export const DisposalLotSelector: React.FC<DisposalLotSelectorProps> = ({
  lots,
  selectedLot,
  onSelectLot,
  productName,
  productCode,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectLot = (lot: ProductLot) => {
    onSelectLot(lot);
    setIsOpen(false);
  };

  const handleClearLot = () => {
    onSelectLot(null);
    setIsOpen(false);
  };

  if (!lots || lots.length === 0) {
    return (
      <div className="disposal-lot-selector__empty">
        Không có lô nào
      </div>
    );
  }

  return (
    <div className="disposal-lot-selector">
      {/* Button mở selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="disposal-lot-selector__trigger"
      >
        <Package size={14} className="disposal-lot-selector__trigger-icon" />
        {selectedLot ? (
          <span>
            <span className="disposal-lot-selector__trigger-code">{selectedLot.code}</span>
            {selectedLot.expiryDate && (
              <span className="disposal-lot-selector__trigger-expiry">
                HSD: {selectedLot.expiryDate.slice(0, 10)}
              </span>
            )}
          </span>
        ) : (
          <span className="disposal-lot-selector__trigger-placeholder">Chọn lô...</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="disposal-lot-selector__overlay"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div className="disposal-lot-selector__popover">
            {/* Header */}
            <div className="disposal-lot-selector__header">
              <div className="disposal-lot-selector__header-title">
                {productCode && <span className="disposal-lot-selector__header-code">[{productCode}]</span>} {productName}
              </div>
              <div className="disposal-lot-selector__header-subtitle">
                Chọn lô hạn sử dụng
              </div>
            </div>

            {/* List */}
            <div className="disposal-lot-selector__list">
              {/* Clear button */}
              <button
                type="button"
                onClick={handleClearLot}
                className="disposal-lot-selector__clear"
              >
                <span>Không chọn lô</span>
                {!selectedLot && <span className="disposal-lot-selector__clear-check">✓</span>}
              </button>

              {/* Lot items */}
              {lots.map((lot) => {
                const isSelected = selectedLot?.id === lot.id;
                const quantity = lot.quantity || 0;
                const expiryDate = lot.expiryDate ? lot.expiryDate.slice(0, 10) : null;

                return (
                  <button
                    key={lot.id}
                    type="button"
                    onClick={() => handleSelectLot(lot)}
                    className={`disposal-lot-selector__item${
                      isSelected ? ' disposal-lot-selector__item--selected' : ''
                    }`}
                  >
                    <div className="disposal-lot-selector__item-content">
                      <div className="disposal-lot-selector__item-main">
                        <div className="disposal-lot-selector__item-code-row">
                          Lô: <span className="disposal-lot-selector__item-code">{lot.code}</span>
                        </div>
                        {expiryDate && (
                          <div className="disposal-lot-selector__item-expiry">
                            HSD: <span className="disposal-lot-selector__item-expiry-value">{expiryDate}</span>
                          </div>
                        )}
                        <div className="disposal-lot-selector__item-quantity">
                          Tồn: <span className="disposal-lot-selector__item-qty-value">{quantity.toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="disposal-lot-selector__item-check">✓</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="disposal-lot-selector__footer">
              {lots.length} lô có sẵn
            </div>
          </div>
        </>
      )}
    </div>
  );
};
