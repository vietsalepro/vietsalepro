import React, { useState } from 'react';
import { Product, ProductLot } from '../types';
import { X, Calendar, Package, Check, AlertCircle, Minus, Plus } from 'lucide-react';
import { useMasterModalV2 } from '../features';
import { MasterModal } from './MasterModal';
import { ActionButton } from './ActionButton';
import { TextInput } from './TextInput';
import './BatchSelectionModal.css';

interface BatchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (lot: ProductLot, quantity: number) => void;
}

const BatchSelectionModal: React.FC<BatchSelectionModalProps> = ({ isOpen, onClose, product, onConfirm }) => {
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  if (!isOpen) return null;

  const availableLots = product.lots?.filter(lot => lot.quantity > 0) || [];

  const handleConfirm = () => {
    const lot = availableLots.find(l => l.id === selectedLotId);
    if (lot && quantity > 0) {
      onConfirm(lot, quantity);
      onClose();
    }
  };

  const handleDecrement = () => setQuantity(Math.max(1, quantity - 1));
  const handleIncrement = () => setQuantity(quantity + 1);

  // ─── Shared content: lot list ──────────────────────────────
  const renderLotList = () => {
    if (availableLots.length > 0) {
      return (
        <div>
          <p className="batch-lot-section-label">Danh sách lô còn hàng</p>
          <div className="batch-lot-list">
            {availableLots.map(lot => (
              <div
                key={lot.id}
                onClick={() => setSelectedLotId(lot.id)}
                className={`batch-lot-card${selectedLotId === lot.id ? ' batch-lot-card--selected' : ''}`}
              >
                <div className="batch-lot-card-header">
                  <div className="batch-lot-card-title-group">
                    <span className="batch-lot-code">Lô: {lot.code}</span>
                    {selectedLotId === lot.id && (
                      <div className="batch-lot-check-badge">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <span className={`batch-lot-stock${lot.quantity < 10 ? ' batch-lot-stock--low' : ' batch-lot-stock--ok'}`}>
                    Còn: {lot.quantity} {product.unit}
                  </span>
                </div>
                <div className="batch-lot-card-meta">
                  <Calendar className="w-4 h-4" />
                  <span>HSD: {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="batch-empty-state">
        <div className="batch-empty-icon-wrapper">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <p className="batch-empty-title">Hết hàng trong lô</p>
          <p className="batch-empty-desc">Sản phẩm này hiện không còn lô hàng nào khả dụng.</p>
        </div>
      </div>
    );
  };

  // ─── Shared content: quantity section ──────────────────────
  const renderQuantitySection = () => {
    if (!selectedLotId) return null;

    return (
      <div className="batch-quantity-section">
        <label className="batch-quantity-label">Số lượng bán</label>
        <div className="batch-quantity-controls">
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={handleDecrement}
            icon={<Minus className="w-4 h-4" />}
            aria-label="Giảm số lượng"
          />
          <div className="batch-quantity-input-wrapper">
            <TextInput
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              aria-label="Số lượng"
            />
          </div>
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={handleIncrement}
            icon={<Plus className="w-4 h-4" />}
            aria-label="Tăng số lượng"
          />
        </div>
      </div>
    );
  };

  // ─── Shared footer ─────────────────────────────────────────
  const renderFooter = () => (
    <>
      <ActionButton variant="ghost" onClick={onClose}>
        Huỷ
      </ActionButton>
      <ActionButton
        variant="primary"
        disabled={!selectedLotId}
        onClick={handleConfirm}
      >
        Xác nhận
      </ActionButton>
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // V2: MasterModal path
  // ═══════════════════════════════════════════════════════════
  if (useMasterModalV2) {
    return (
      <MasterModal
        isOpen={isOpen}
        onClose={onClose}
        title="Chọn lô hàng"
        subtitle={product.name}
        icon={<Package className="w-5 h-5" />}
        size="md"
        footer={renderFooter()}
      >
        {renderLotList()}
        {renderQuantitySection()}
      </MasterModal>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // V1: Legacy path (unchanged behavior)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="vsp-font-bold vsp-text-base text-gray-900">Chọn lô hàng</h3>
              <p className="vsp-text-xs vsp-font-regular text-gray-500 truncate max-w-[200px]">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {availableLots.length > 0 ? (
            <div className="space-y-3">
              <p className="vsp-text-xs vsp-font-semibold text-gray-400 uppercase tracking-wider">Danh sách lô còn hàng</p>
              {availableLots.map(lot => (
                <div
                  key={lot.id}
                  onClick={() => setSelectedLotId(lot.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedLotId === lot.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-50'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="vsp-font-bold vsp-text-base text-gray-900">Lô: {lot.code}</span>
                      {selectedLotId === lot.id && (
                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className={`vsp-text-xs vsp-font-medium px-2 py-1 rounded-full ${
                      lot.quantity < 10 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      Còn: {lot.quantity} {product.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 vsp-text-sm vsp-font-regular text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>HSD: {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('vi-VN') : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <p className="vsp-font-bold vsp-text-base text-gray-900">Hết hàng trong lô</p>
                <p className="vsp-text-sm vsp-font-regular text-gray-500">Sản phẩm này hiện không còn lô hàng nào khả dụng.</p>
              </div>
            </div>
          )}

          {selectedLotId && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-slide-up">
              <label className="block vsp-text-sm vsp-font-bold text-gray-700 mb-2">Số lượng bán</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDecrement}
                  className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 h-10 bg-white border border-gray-200 rounded-lg text-center vsp-font-bold vsp-text-base text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleIncrement}
                  className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl vsp-font-bold vsp-text-base hover:bg-gray-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            disabled={!selectedLotId}
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl vsp-font-bold vsp-text-base hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchSelectionModal;