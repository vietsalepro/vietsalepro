import React from 'react';
import { motion } from 'framer-motion';
import { X, Percent, Check } from 'lucide-react';
import { Promotion, AppliedPromotion } from '../../../types';
import { useRefactoredPromotionModal } from '../../../features';
import { MasterModal } from '../../MasterModal';
import { ActionButton } from '../../ActionButton';
import { EmptyState } from '../../EmptyState';
import './PromotionModal.css';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: { promotion: Promotion; result: { appliedPromotions: AppliedPromotion[]; totalDiscount: number } }[];
  selectedPromotions: Promotion[];
  onTogglePromotion: (promo: Promotion) => void;
}

/**
 * PromotionModal — Modal chọn khuyến mãi
 * - Header gradient tím
 * - Danh sách KM với discount preview
 * - Checkbox selection
 *
 * V2 (feature-flagged by useRefactoredPromotionModal):
 * - Uses MasterModal container with standardized shell
 * - Uses ActionButton for confirm action
 * - CSS-driven styling via PromotionModal.css
 */
export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen, onClose, suggestions, selectedPromotions, onTogglePromotion
}) => {
  if (!isOpen) return null;

  const formatPrice = (p: number) => p.toLocaleString('vi-VN');

  // ─── Shared: promotion list renderer ─────────────────────
  const renderPromotionList = () => (
    <div className="promotion-list">
      {suggestions.length === 0 ? (
        <EmptyState
          icon={<Percent className="promotion-empty-icon" />}
          title="Không có khuyến mãi phù hợp"
          description="Thêm sản phẩm vào giỏ để xem gợi ý"
          compact
        />
      ) : (
        suggestions.map(({ promotion: promo, result }) => {
          const isSelected = selectedPromotions.some(p => p.id === promo.id);
          return (
            <div
              key={promo.id}
              onClick={() => onTogglePromotion(promo)}
              className={`promotion-card${isSelected ? ' promotion-card--selected' : ''}`}
            >
              {/* Radio circle */}
              <div className="promotion-card-radio">
                {isSelected && <div className="promotion-card-radio-dot" />}
              </div>

              {/* Content */}
              <div className="promotion-card-content">
                <div className="promotion-card-name">{promo.name}</div>
                {promo.description && (
                  <div className="promotion-card-desc">{promo.description}</div>
                )}
                <div className="promotion-card-tags">
                  <span className="promotion-card-tag promotion-card-tag--discount">
                    Giảm {formatPrice(result.totalDiscount)}₫
                  </span>
                  {(promo.priority ?? 0) > 0 && (
                    <span className="promotion-card-tag">Ưu tiên {promo.priority}</span>
                  )}
                  {(promo.minOrderValue ?? 0) > 0 && (
                    <span className="promotion-card-tag">Đơn tối thiểu {formatPrice(promo.minOrderValue ?? 0)}₫</span>
                  )}
                  {promo.stackable && (
                    <span className="promotion-card-tag">Cộng dồn</span>
                  )}
                  {result.appliedPromotions.length > 0 && result.appliedPromotions.map((ap, idx) => (
                    <span key={idx} className="promotion-card-tag">
                      {ap.description || (ap as any).promotionName}: -{formatPrice(ap.discountAmount)}₫
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ─── Shared: footer summary ──────────────────────────────
  const totalSelectedDiscount = selectedPromotions.reduce((sum, p) => {
    const r = suggestions.find(s => s.promotion.id === p.id);
    return sum + (r?.result.totalDiscount || 0);
  }, 0);

  // ═══════════════════════════════════════════════════════════
  // V2: MasterModal + ActionButton path (feature-flagged)
  // ═══════════════════════════════════════════════════════════
  if (useRefactoredPromotionModal) {
    const renderFooter = () => (
      <div className="promotion-footer">
        <div className="promotion-summary">
          <span className="promotion-summary-label">
            Đã chọn: <strong>{selectedPromotions.length}</strong> chương trình
          </span>
          {selectedPromotions.length > 0 && (
            <span className="promotion-summary-value promotion-summary-value--discount">
              Giảm: -{formatPrice(totalSelectedDiscount)}₫
            </span>
          )}
        </div>
        <div className="promotion-footer-actions">
          <ActionButton variant="secondary" onClick={onClose}>
            Hủy
          </ActionButton>
          <ActionButton variant="primary" onClick={onClose}>
            <Check className="w-4 h-4" />
            Xác nhận
          </ActionButton>
        </div>
      </div>
    );

    return (
      <MasterModal
        isOpen={isOpen}
        onClose={onClose}
        title="Chọn khuyến mãi"
        subtitle={selectedPromotions.length > 0 ? `Đã chọn ${selectedPromotions.length} chương trình` : undefined}
        size="sm"
        footer={renderFooter()}
      >
        {renderPromotionList()}
      </MasterModal>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // V1: Legacy path (unchanged behavior)
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" onClick={onClose} />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6C4DFF] to-[#8B7CFF] p-4 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                <h3 className="vsp-font-bold vsp-text-sm">Chọn khuyến mãi</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-[#9CA3AF]">
                <Percent className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="vsp-text-sm vsp-font-medium">Không có khuyến mãi phù hợp</p>
                <p className="vsp-text-xs vsp-font-regular mt-1">Thêm sản phẩm vào giỏ để xem gợi ý</p>
              </div>
            ) : (
              suggestions.map(({ promotion: promo, result }) => {
                const isSelected = selectedPromotions.some(p => p.id === promo.id);
                return (
                  <div
                    key={promo.id}
                    onClick={() => onTogglePromotion(promo)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#6C4DFF] bg-[#6C4DFF]/5 shadow-sm'
                        : 'border-[#ECEEF5] hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="vsp-font-bold vsp-text-sm text-[#1B1F3B]">{promo.name}</h4>
                          <span className="vsp-text-xxxs bg-[#DCFCE7] text-[#22C55E] px-2 py-0.5 rounded-full vsp-font-bold">
                            -{formatPrice(result.totalDiscount)}₫
                          </span>
                        </div>
                        <p className="vsp-text-xs vsp-font-regular text-[#6B7280] mt-0.5 line-clamp-1">{promo.description || ''}</p>
                      </div>
                      <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 mt-1 ${
                        isSelected ? 'border-[#6C4DFF] bg-[#6C4DFF]' : 'border-[#9CA3AF]'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    {result.appliedPromotions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed border-[#ECEEF5]">
                        {result.appliedPromotions.map((ap, idx) => (
                          <p key={idx} className="vsp-text-xxxs text-[#6C4DFF] vsp-font-medium">
                            ▼ {ap.description || (ap as any).promotionName}: -{formatPrice(ap.discountAmount)}₫
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#ECEEF5] bg-[#F7F8FC] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="vsp-text-xxs vsp-font-regular text-[#6B7280]">
                Đã chọn: <strong className="text-[#6C4DFF]">{selectedPromotions.length}</strong> chương trình
              </span>
              {selectedPromotions.length > 0 && (
                <span className="vsp-text-xxs text-[#22C55E] vsp-font-bold">
                  Giảm: -{formatPrice(totalSelectedDiscount)}₫
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#6C4DFF] text-white rounded-2xl vsp-font-bold vsp-text-sm hover:bg-[#5A3FE0] transition-colors"
            >
              Xác nhận
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};