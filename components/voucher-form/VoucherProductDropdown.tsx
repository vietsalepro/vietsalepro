import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { classNames } from '../../utils/classNames';
import type { Product } from '../../types';
import './VoucherProductDropdown.css';

export type VoucherProductDropdownMode = 'client' | 'server';

export interface VoucherProductDropdownBaseProps {
  open: boolean;
  onRequestClose: () => void;
  onSelectProduct: (product: Product) => void;
  maxItems?: number;
  className?: string;
  disabled?: boolean;
}

export interface VoucherProductDropdownClientProps extends VoucherProductDropdownBaseProps {
  mode: 'client';
  products: Product[];
  searchValue: string;
}

export interface VoucherProductDropdownServerProps extends VoucherProductDropdownBaseProps {
  mode: 'server';
  results: Product[];
}

export type VoucherProductDropdownProps =
  | VoucherProductDropdownClientProps
  | VoucherProductDropdownServerProps;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function filterProducts(products: Product[], searchValue: string): Product[] {
  if (!searchValue.trim()) return products;
  const term = normalizeText(searchValue);
  return products.filter((p) => {
    const name = normalizeText(p.name || '');
    const code = normalizeText(p.code || '');
    const barcode = normalizeText(p.barcode || '');
    return name.includes(term) || code.includes(term) || barcode.includes(term);
  });
}

export const VoucherProductDropdown: React.FC<VoucherProductDropdownProps> = (props) => {
  const { open, onRequestClose, onSelectProduct, maxItems = 50, className = '', disabled = false } = props;

  const items = useMemo(() => {
    const source = props.mode === 'client' ? filterProducts(props.products, props.searchValue) : props.results;
    return source.slice(0, maxItems);
  }, [props, maxItems]);

  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  const handleClose = useCallback(() => {
    if (!open) return;
    onRequestClose();
  }, [open, onRequestClose]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setActiveIndex(items.length - 1);
          break;
        case 'Enter':
          if (items[activeIndex]) {
            event.preventDefault();
            onSelectProduct(items[activeIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, items, activeIndex, onSelectProduct, handleClose]);

  useEffect(() => {
    const item = itemRefs.current[activeIndex];
    if (item && listRef.current) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setActiveIndex(items.length - 1);
          break;
        case 'Enter':
          if (items[activeIndex]) {
            event.preventDefault();
            onSelectProduct(items[activeIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
      }
    },
    [open, items, activeIndex, onSelectProduct, handleClose]
  );

  if (!open || disabled || items.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className={classNames('voucher-product-dropdown', className)}
      role="listbox"
      aria-expanded={open}
      onKeyDown={handleKeyDown}
    >
      <div className="voucher-product-dropdown__header">
        <span className="voucher-product-dropdown__count">
          {items.length} sản phẩm
        </span>
        <span className="voucher-product-dropdown__hint">
          <ChevronUp size={12} />
          <ChevronDown size={12} />
          để chọn, Enter để thêm
        </span>
      </div>
      <ul className="voucher-product-dropdown__list">
        {items.map((product, index) => (
          <li
            key={product.id}
            ref={(el) => { itemRefs.current[index] = el; }}
            className={classNames(
              'voucher-product-dropdown__item',
              index === activeIndex && 'voucher-product-dropdown__item--active'
            )}
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => {
              setActiveIndex(index);
            }}
            onClick={() => {
              onSelectProduct(product);
            }}
          >
            <div className="voucher-product-dropdown__thumb">
              {product.image ? (
                <img src={product.image} alt="" />
              ) : (
                <Package size={18} />
              )}
            </div>
            <div className="voucher-product-dropdown__info">
              <div className="voucher-product-dropdown__name">{product.displayName || product.name}</div>
              <div className="voucher-product-dropdown__meta">
                {product.code && <span className="voucher-product-dropdown__code">{product.code}</span>}
                <span className="voucher-product-dropdown__stock">
                  Tồn: {product.quantity ?? 0} {product.unit || ''}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
