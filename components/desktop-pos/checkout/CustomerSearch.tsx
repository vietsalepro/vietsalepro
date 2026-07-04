import React from 'react';
import { Search, Plus, User } from 'lucide-react';
import { Customer } from '../../../types';
import './CustomerSearch.css';

interface CustomerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCustomers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onQuickAdd: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
}

/**
 * CustomerSearch — Tìm kiếm khách hàng trong sidebar
 * Style đồng bộ Import Goods (slate, không tím)
 */
export const CustomerSearch = React.forwardRef<HTMLDivElement, CustomerSearchProps>(({
  searchTerm, onSearchChange, filteredCustomers, onSelectCustomer, onQuickAdd,
  isDropdownOpen, setIsDropdownOpen
}, ref) => {
  return (
    <div ref={ref} className="customer-search">
      {/* Tiêu đề */}
      <p className="customer-search__label">Khách hàng</p>

      {/* Search Input */}
      <div className="customer-search__row">
        <div className="customer-search__field">
          <span className="customer-search__search-icon">
            <Search />
          </span>
          <input
            data-pos="customer-search"
            type="text"
            value={searchTerm}
            onChange={(e) => { onSearchChange(e.target.value); setIsDropdownOpen(true); }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Tìm khách hàng (F3)"
            className="customer-search__input"
          />
        </div>
        <button onClick={onQuickAdd} className="customer-search__add-btn">
          <Plus />
        </button>
      </div>

      {/* Dropdown Results — z-index cao hơn sticky top nav */}
      {isDropdownOpen && searchTerm && (
        <div className="customer-search__dropdown animate-fade-in">
          {filteredCustomers.length > 0 ? (
            <>
              {filteredCustomers.map(c => (
                <div
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  className="customer-search__item"
                >
                  <div className="customer-search__avatar">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="customer-search__info">
                    <p className="customer-search__name">{c.name}</p>
                    <p className="customer-search__phone">{c.phone || ''}</p>
                  </div>
                  {(c.debt || 0) > 0 && (
                    <span className="customer-search__debt-badge">Nợ</span>
                  )}
                </div>
              ))}
              <div className="customer-search__footer">
                <button className="customer-search__footer-btn">
                  Xem tất cả khách hàng →
                </button>
              </div>
            </>
          ) : (
            <div className="customer-search__empty">
              <p className="customer-search__empty-text">Không tìm thấy khách hàng</p>
              <button onClick={onQuickAdd} className="customer-search__empty-action">
                + Thêm khách hàng mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state — no customer selected */}
      {!searchTerm && !isDropdownOpen && (
        <div className="customer-search__no-customer">
          <span className="customer-search__no-customer-icon">
            <User />
          </span>
          <p className="customer-search__no-customer-text">Chưa chọn khách hàng</p>
        </div>
      )}
    </div>
  );
});

CustomerSearch.displayName = 'CustomerSearch';
