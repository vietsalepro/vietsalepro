import React from 'react';
import { Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import './ProductSearchResults.css';

interface ProductSearchResultsProps {
  products: Product[];
  searchTerm: string;
  onSelectProduct: (product: Product) => void;
  isSearching?: boolean;
}

/**
 * ProductSearchResults — Dropdown kết quả tìm kiếm sản phẩm
 * Hiển thị: thumbnail, tên, mã, tồn kho, giá
 * Out of stock: mờ đi + badge HẾT
 */
export const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  products, searchTerm, onSelectProduct, isSearching
}) => {
  if (!searchTerm) return null;

  return (
    <div className="psr-dropdown">
      {/* Header */}
      <div className="psr-header">
        <span className="psr-header-label">
          {isSearching ? 'Đang tìm...' : `Sản phẩm (${products.length})`}
        </span>
      </div>

      {/* Loading state */}
      {isSearching && products.length === 0 && (
        <div className="psr-list">
          <div className="psr-row psr-row--loading">
            <Loader2 className="psr-loading-icon" />
            <span className="psr-loading-text">Đang tìm sản phẩm...</span>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="psr-list">
        {products.map((product) => {
          const isOutOfStock = (product.quantity ?? 0) <= 0;
          return (
            <div
              key={product.id}
              onClick={() => !isOutOfStock && onSelectProduct(product)}
              className={`psr-row ${isOutOfStock ? 'psr-row--out-of-stock' : ''}`}
            >
              {/* Thumbnail */}
              <div className="psr-thumb">
                <img
                  src={product.image || 'https://via.placeholder.com/44'}
                  className="psr-thumb-img"
                  alt=""
                />
                {isOutOfStock && (
                  <div className="psr-thumb-overlay">
                    <span className="psr-sold-out-badge">
                      HẾT
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="psr-info">
                <p className={`psr-name ${isOutOfStock ? 'psr-name--out-of-stock' : ''}`}>
                  {product.name}
                </p>
                <div className="psr-meta">
                  <span className="psr-code">{product.code}</span>
                  <span className={`psr-stock-badge ${
                    isOutOfStock
                      ? 'psr-stock-badge--out'
                      : 'psr-stock-badge--ok'
                  }`}>
                    {product.quantity} {product.unit}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="psr-price">
                <p className="psr-price-value">{(product.price ?? 0).toLocaleString('vi-VN')}</p>
                {!isOutOfStock && (product.quantity ?? 0) <= 5 && (product.quantity ?? 0) > 0 && (
                  <p className="psr-low-stock">
                    <AlertTriangle />
                    Sắp hết
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
