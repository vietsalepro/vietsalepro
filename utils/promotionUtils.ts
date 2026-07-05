import { CartItem, Promotion, AppliedPromotion, PromotionType, Customer, CustomerRank, getCustomerRank, CUSTOMER_RANK_CONFIG } from '../types';

/**
 * Kiểm tra promotion còn hiệu lực theo ngày
 */
function isPromotionActive(promo: Promotion): boolean {
  if (!promo.isActive) return false;
  const now = new Date();
  if (promo.startDate && new Date(promo.startDate) > now) return false;
  if (promo.endDate && new Date(promo.endDate) < now) return false;
  return true;
}

// ponytail: strict-safe accessors for cart fields that may be undefined in legacy data
function getCartItemPrice(item: CartItem): number {
  return item.price ?? 0;
}

function getCartItemQuantity(item: CartItem): number {
  return item.cartQuantity ?? 0;
}

function getCartItemSubtotal(item: CartItem): number {
  return getCartItemPrice(item) * getCartItemQuantity(item);
}

/**
 * Tính tổng tiền giỏ hàng (trước giảm)
 */
function getCartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + getCartItemSubtotal(item), 0);
}

/**
 * Giới hạn discount theo maxDiscount của promotion
 */
function clampDiscount(discount: number, maxDiscount?: number): number {
  if (maxDiscount && maxDiscount > 0) {
    return Math.min(discount, maxDiscount);
  }
  return discount;
}

/**
 * Tính số tiền giảm cho 1 promotion dựa trên giỏ hàng và khách hàng
 * Phase 9: thêm kiểm tra minOrderValue và giới hạn maxDiscount
 */
export function calculatePromotionDiscount(
  promo: Promotion,
  cart: CartItem[],
  customer?: Customer
): { discount: number; description: string } {
  if (!isPromotionActive(promo)) return { discount: 0, description: '' };

  const subtotal = getCartSubtotal(cart);

  // Phase 9: kiểm tra giá trị đơn hàng tối thiểu
  const minOrderValue = promo.minOrderValue ?? 0;
  if (minOrderValue > 0 && subtotal < minOrderValue) {
    return { discount: 0, description: '' };
  }

  switch (promo.type) {
    case 'percent_on_total': {
      // 1. Giảm X% tổng hóa đơn
      if (promo.discountPercent) {
        const discount = clampDiscount((subtotal * promo.discountPercent) / 100, promo.maxDiscount);
        return {
          discount,
          description: `Giảm ${promo.discountPercent}% tổng hóa đơn (-${discount.toLocaleString('vi-VN')}đ)`,
        };
      }
      return { discount: 0, description: '' };
    }

    case 'fixed_on_total': {
      // 2. Giảm X ngàn trên tổng hóa đơn
      if (promo.discountFixed) {
        const discount = clampDiscount(Math.min(promo.discountFixed, subtotal), promo.maxDiscount);
        return {
          discount,
          description: `Giảm ${promo.discountFixed.toLocaleString('vi-VN')}đ tổng hóa đơn`,
        };
      }
      return { discount: 0, description: '' };
    }

    case 'percent_on_product': {
      // 3. Giảm % cho sản phẩm cụ thể
      if (promo.targetProductId && promo.discountPercent) {
        const targetItem = cart.find(item => item.id === promo.targetProductId);
        if (targetItem) {
          const itemTotal = getCartItemSubtotal(targetItem);
          const discount = clampDiscount((itemTotal * promo.discountPercent) / 100, promo.maxDiscount);
          return {
            discount,
            description: `Giảm ${promo.discountPercent}% cho "${targetItem.name}" (-${discount.toLocaleString('vi-VN')}đ)`,
          };
        }
      }
      return { discount: 0, description: '' };
    }

    case 'percent_on_category': {
      // 4. Giảm % theo nhóm hàng
      if (promo.targetCategory && promo.discountPercent) {
        const categoryItems = cart.filter(item => item.category === promo.targetCategory);
        if (categoryItems.length > 0) {
          const categoryTotal = categoryItems.reduce((sum, item) => sum + getCartItemSubtotal(item), 0);
          const discount = clampDiscount((categoryTotal * promo.discountPercent) / 100, promo.maxDiscount);
          return {
            discount,
            description: `Giảm ${promo.discountPercent}% nhóm "${promo.targetCategory}" (-${discount.toLocaleString('vi-VN')}đ)`,
          };
        }
      }
      return { discount: 0, description: '' };
    }

    case 'buy_x_get_y': {
      // 5. Mua X tặng Y
      if (promo.buyProductId && promo.giftProductId && promo.buyQuantity) {
        const buyItem = cart.find(item => item.id === promo.buyProductId);
        if (buyItem && getCartItemQuantity(buyItem) >= promo.buyQuantity) {
          const giftItem = cart.find(item => item.id === promo.giftProductId);
          if (giftItem) {
            // Tính số lần được hưởng KM
            const times = Math.floor(getCartItemQuantity(buyItem) / promo.buyQuantity);
            const giftQty = Math.min(times * (promo.giftQuantity || 1), getCartItemQuantity(giftItem));
            if (giftQty > 0) {
              // Nếu giftDiscountPercent -> giảm %, nếu không -> tặng luôn
              if (promo.giftDiscountPercent) {
                const discount = clampDiscount((getCartItemPrice(giftItem) * giftQty * promo.giftDiscountPercent) / 100, promo.maxDiscount);
                return {
                  discount,
                  description: `Mua ${promo.buyQuantity} "${buyItem.name}" được giảm ${promo.giftDiscountPercent}% "${giftItem.name}" (-${discount.toLocaleString('vi-VN')}đ)`,
                };
              } else {
                // Tặng free sản phẩm Y
                const discount = clampDiscount(getCartItemPrice(giftItem) * giftQty, promo.maxDiscount);
                return {
                  discount,
                  description: `Mua ${promo.buyQuantity} "${buyItem.name}" tặng ${giftQty} "${giftItem.name}" (-${discount.toLocaleString('vi-VN')}đ)`,
                };
              }
            }
          }
        }
      }
      return { discount: 0, description: '' };
    }

    case 'tiered_quantity': {
      // 6. Chiết khấu theo số lượng (bậc)
      if (promo.tiers && promo.tiers.length > 0) {
        // Giả sử áp dụng cho toàn bộ giỏ hàng hoặc 1 sản phẩm
        const targetId = promo.targetProductId;
        const itemsToCheck = targetId
          ? cart.filter(item => item.id === targetId)
          : cart;

        if (itemsToCheck.length > 0) {
          // Tìm bậc cao nhất có thể áp dụng dựa trên tổng số lượng
          const totalQty = itemsToCheck.reduce((sum, item) => sum + getCartItemQuantity(item), 0);
          // Sắp xếp tiers theo minQty giảm dần để tìm bậc cao nhất đủ đk
          const sortedTiers = [...promo.tiers].sort((a, b) => b.minQty - a.minQty);
          const applicableTier = sortedTiers.find(t => totalQty >= t.minQty);
          if (applicableTier) {
            const discount = clampDiscount((subtotal * applicableTier.discountPercent) / 100, promo.maxDiscount);
            return {
              discount,
              description: `Chiết khấu ${applicableTier.discountPercent}% (từ ${applicableTier.minQty} sp) (-${discount.toLocaleString('vi-VN')}đ)`,
            };
          }
        }
      }
      return { discount: 0, description: '' };
    }

    case 'combo': {
      // 7. Combo - Mua kèm ưu đãi
      if (promo.mainProductId && promo.comboProductId && promo.comboDiscountPercent) {
        const mainItem = cart.find(item => item.id === promo.mainProductId);
        const comboItem = cart.find(item => item.id === promo.comboProductId);
        if (mainItem && comboItem && getCartItemQuantity(comboItem) > 0) {
          const discount = clampDiscount((getCartItemSubtotal(comboItem) * promo.comboDiscountPercent) / 100, promo.maxDiscount);
          return {
            discount,
            description: `Combo: mua "${mainItem.name}" giảm ${promo.comboDiscountPercent}% "${comboItem.name}" (-${discount.toLocaleString('vi-VN')}đ)`,
          };
        }
      }
      return { discount: 0, description: '' };
    }

    case 'customer_rank': {
      // 8. Khuyến mãi theo hạng khách hàng
      if (customer && promo.minCustomerRank) {
        const customerRank = getCustomerRank(customer.totalSpent || 0);
        // Thứ tự hạng: index nhỏ = hạng cao hơn
        const rankOrder: CustomerRank[] = ['platinum', 'diamond', 'gold', 'silver', 'bronze'];
        const customerRankIdx = rankOrder.indexOf(customerRank);
        const requiredRankIdx = rankOrder.indexOf((promo.minCustomerRank || '').toLowerCase() as CustomerRank);
        if (customerRankIdx >= 0 && requiredRankIdx >= 0 && customerRankIdx <= requiredRankIdx) {
          const rankConfig = CUSTOMER_RANK_CONFIG.find(r => r.rank === customerRank);
          // Nếu promotion có discountPercent riêng thì dùng, nếu không dùng mặc định theo cấu hình hạng
          const effectivePercent = promo.discountPercent ?? rankConfig?.discountPercent ?? 0;
          if (effectivePercent > 0) {
            const discount = clampDiscount((subtotal * effectivePercent) / 100, promo.maxDiscount);
            return {
              discount,
              description: `Chiết khấu hạng ${rankConfig?.name || customerRank} (${effectivePercent}%) (-${discount.toLocaleString('vi-VN')}đ)`,
            };
          }
        }
      }
      return { discount: 0, description: '' };
    }

    default:
      return { discount: 0, description: '' };
  }
}

/**
 * Tự động gợi ý danh sách khuyến mãi áp dụng được cho giỏ hàng hiện tại
 * Phase 9: sắp xếp theo priority tăng dần (ưu tiên cao trước), sau đó đến discount lớn
 * @returns Danh sách promotion kèm discount đã tính
 */
export function suggestPromotions(
  promotions: Promotion[],
  cart: CartItem[],
  customer?: Customer
): (AppliedPromotion & { promotion: Promotion })[] {
  const suggestions: (AppliedPromotion & { promotion: Promotion })[] = [];

  for (const promo of promotions) {
    if (!isPromotionActive(promo)) continue;

    const { discount, description } = calculatePromotionDiscount(promo, cart, customer);
    if (discount > 0) {
      suggestions.push({
        promotionId: promo.id,
        promotionName: promo.name,
        discountAmount: discount,
        description,
        promotion: promo,
      });
    }
  }

  // Phase 9: ưu tiên priority nhỏ trước, sau đó đến discount lớn
  suggestions.sort((a, b) => {
    const priorityA = a.promotion.priority ?? 0;
    const priorityB = b.promotion.priority ?? 0;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return b.discountAmount - a.discountAmount;
  });

  return suggestions;
}

/**
 * Áp dụng 1 promotion vào giỏ hàng và trả về kết quả chi tiết
 * Đây là function được POS.tsx sử dụng để tính discount cho từng promotion
 */
export function applyPromotions(
  cart: CartItem[],
  promo: Promotion,
  customer?: Customer
): { appliedPromotions: { promotionId: string; promotionName: string; discountAmount: number; description?: string }[]; totalDiscount: number } {
  const { discount, description } = calculatePromotionDiscount(promo, cart, customer);
  if (discount > 0) {
    return {
      appliedPromotions: [
        { promotionId: promo.id, promotionName: promo.name, discountAmount: discount, description }
      ],
      totalDiscount: discount
    };
  }
  return { appliedPromotions: [], totalDiscount: 0 };
}

/**
 * Phase 9 — Áp dụng tập hợp khuyến mãi tối ưu theo quy tắc ERPNext:
 *  - Sắp xếp theo priority (số nhỏ = ưu tiên cao).
 *  - Trong nhóm không cho phép cộng dồn (stackable=false), chỉ chọn 1 KM tốt nhất.
 *  - Các KM cho phép cộng dồn (stackable=true) sẽ cộng thêm.
 *  - Mỗi KM đều phải vượt qua điều kiện minOrderValue và maxDiscount.
 */
export function applyBestPromotions(
  promotions: Promotion[],
  cart: CartItem[],
  customer?: Customer
): {
  appliedPromotions: AppliedPromotion[];
  totalDiscount: number;
  appliedPromotionsFull: Promotion[];
} {
  // Chỉ xét các promotion còn hiệu lực và có thể áp dụng (discount > 0)
  const applicable = promotions
    .filter(isPromotionActive)
    .map(promo => ({
      promo,
      ...calculatePromotionDiscount(promo, cart, customer),
    }))
    .filter(item => item.discount > 0);

  // Sắp xếp theo priority tăng dần, cùng priority thì discount lớn hơn trước
  applicable.sort((a, b) => {
    const priorityA = a.promo.priority ?? 0;
    const priorityB = b.promo.priority ?? 0;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return b.discount - a.discount;
  });

  const nonStackable = applicable.filter(item => !(item.promo.stackable ?? false));
  const stackable = applicable.filter(item => item.promo.stackable ?? false);

  // Chọn 1 KM không stackable ưu tiên cao nhất (đã sort nên phần tử đầu là tốt nhất)
  const bestNonStackable = nonStackable.length > 0 ? nonStackable[0] : null;

  const appliedPromotions: AppliedPromotion[] = [];
  const appliedPromotionsFull: Promotion[] = [];
  let totalDiscount = 0;

  if (bestNonStackable) {
    appliedPromotions.push({
      promotionId: bestNonStackable.promo.id,
      promotionName: bestNonStackable.promo.name,
      discountAmount: bestNonStackable.discount,
      description: bestNonStackable.description,
      type: bestNonStackable.promo.type,
    });
    appliedPromotionsFull.push(bestNonStackable.promo);
    totalDiscount += bestNonStackable.discount;
  }

  // Cộng thêm tất cả KM được phép cộng dồn
  for (const item of stackable) {
    appliedPromotions.push({
      promotionId: item.promo.id,
      promotionName: item.promo.name,
      discountAmount: item.discount,
      description: item.description,
      type: item.promo.type,
    });
    appliedPromotionsFull.push(item.promo);
    totalDiscount += item.discount;
  }

  return { appliedPromotions, totalDiscount, appliedPromotionsFull };
}

/**
 * Tính tổng discount từ danh sách khuyến mãi đã chọn
 */
export function calculateTotalPromotionDiscount(
  appliedPromotions: AppliedPromotion[]
): number {
  return appliedPromotions.reduce((sum, ap) => sum + ap.discountAmount, 0);
}

/**
 * Kiểm tra xem promotion có xung đột không (cùng loại 1,2,8 - chỉ nên chọn 1)
 */
export function getPromotionTypeLabel(type: PromotionType): string {
  const labels: Record<PromotionType, string> = {
    percent_on_total: 'Giảm % tổng hóa đơn',
    fixed_on_total: 'Giảm số tiền cố định',
    percent_on_product: 'Giảm giá SP cụ thể',
    percent_on_category: 'Giảm giá theo nhóm hàng',
    buy_x_get_y: 'Mua X tặng Y',
    tiered_quantity: 'Chiết khấu theo số lượng',
    combo: 'Combo mua kèm',
    customer_rank: 'Theo hạng khách hàng',
  };
  return labels[type] || type;
}