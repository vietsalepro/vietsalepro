import { ProductLot } from '../types';

/**
 * Phase 5b: Helper chọn lô theo FIFO/HSD.
 *
 * Quy tắc:
 *   1. Chỉ giữ lô có tồn > 0 (quantity > 0).
 *   2. Sắp xếp: HSD sớm trước (expiryDate ASC); nếu HSD bằng nhau hoặc không có HSD
 *      thì lô nhập trước bán trước (createdAt ASC).
 *
 * RPC `search_products_rpc` / `get_product_by_barcode` đã trả về product_lots theo
 * thứ tự tương tự, nhưng frontend vẫn sắp xếp lại để đảm bảo đúng quy tắc khi dữ liệu
 * đến từ các nguồn khác (ví dụ `getProductById`, cache, barcode scan).
 */
export function getAvailableLots(lots: ProductLot[] | undefined): ProductLot[] {
  if (!lots || lots.length === 0) return [];
  return lots.filter(lot => (lot.quantity || 0) > 0);
}

export function sortLotsByFifoExpiry(lots: ProductLot[]): ProductLot[] {
  return [...lots].sort((a, b) => {
    const aExpiry = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bExpiry = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (aExpiry !== bExpiry) return aExpiry - bExpiry;

    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aCreated - bCreated;
  });
}

/**
 * Chọn lô tự động theo FIFO/HSD cho số lượng cần bán.
 * Trả về lô đầu tiên trong danh sách đã sắp xếp.
 */
export function selectBestLotForQuantity(
  lots: ProductLot[] | undefined,
  _quantity: number
): ProductLot | undefined {
  const available = sortLotsByFifoExpiry(getAvailableLots(lots));
  return available[0];
}

/**
 * Kiểm tra số lượng trong giỏ có vượt quá tồn của lô đã chọn không.
 */
export function validateLotQuantity(
  selectedLot: ProductLot | undefined,
  quantity: number
): { valid: boolean; max?: number } {
  if (!selectedLot) return { valid: true };
  const max = selectedLot.quantity || 0;
  return { valid: quantity <= max, max };
}
