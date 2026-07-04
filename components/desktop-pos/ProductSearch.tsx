import React, { useEffect } from 'react';
import { Search, ScanLine, CheckCircle } from 'lucide-react';
import './ProductSearch.css';

interface ProductSearchProps {
  productSearchTerm: string;
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  /** Trạng thái đang chờ quét mã từ máy quét hồng ngoại */
  isBarcodeListening?: boolean;
  /** Flash feedback khi quét thành công */
  barcodeFlash?: boolean;
  /** Mã vừa quét được */
  lastScannedCode?: string | null;
  /** Nếu true, bỏ qua ig-card wrapper (dùng khi lồng trong component cha) */
  noCard?: boolean;
}

/**
 * ProductSearch — Ô tìm kiếm sản phẩm
 * Style: Import Goods (ig-card, slate)
 * Icon kính lúp dùng flexbox (không absolute) để tránh đè chữ placeholder
 * Tích hợp barcode capture cho máy quét hồng ngoại desktop
 * Máy quét tự động nhập liệu vào ô tìm kiếm — không cần nút quét riêng
 */
export const ProductSearch: React.FC<ProductSearchProps> = ({
  productSearchTerm, onSearchChange, onFocus,
  isBarcodeListening = false,
  barcodeFlash = false,
  lastScannedCode = null,
  noCard = false,
}) => {
  // Input ref để hook useBarcodeCapture có thể attach
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Expose inputRef ra ngoài qua data attribute để hook có thể tìm
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.dataset.posBarcode = 'true';
    }
  }, []);

  const fieldClass = `product-search__field${
    barcodeFlash
      ? ' product-search__field--flash'
      : isBarcodeListening
        ? ' product-search__field--listening'
        : ''
  }`;

  const iconClass = `product-search__icon${
    barcodeFlash
      ? ' product-search__icon--success animate-bounce-in'
      : isBarcodeListening
        ? ' product-search__icon--listening animate-pulse'
        : ' product-search__icon--default'
  }`;

  const searchContent = (
    <>
      {/* Search Input — dùng flex, icon nằm trong flow, không absolute */}
      <div className={fieldClass}>
        {barcodeFlash ? (
          <CheckCircle className={iconClass} />
        ) : isBarcodeListening ? (
          <ScanLine className={iconClass} />
        ) : (
          <Search className={iconClass} />
        )}
        <input
          ref={inputRef}
          type="text"
          value={productSearchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onFocus}
          placeholder={
            isBarcodeListening
              ? '🔍Tìm sản phẩm'
              : 'Tìm kiếm sản phẩm (Tên, mã, barcode...)'
          }
          className="product-search__input"
          autoComplete="off"
        />
      </div>

      {/* Badge hiển thị mã vừa quét */}
      {lastScannedCode && (
        <div className="product-search__badge animate-fade-in-up">
          {lastScannedCode}
        </div>
      )}
    </>
  );

  if (noCard) {
    return (
      <div
        className={`product-search--inline${
          barcodeFlash ? ' product-search--flash' : ''
        }`}
      >
        {searchContent}
      </div>
    );
  }

  return (
    <div
      className={`ig-card product-search${
        barcodeFlash ? ' product-search--flash' : ''
      }`}
    >
      {searchContent}
    </div>
  );
};
