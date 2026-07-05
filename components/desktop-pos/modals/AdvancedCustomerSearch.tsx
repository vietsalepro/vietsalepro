import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronRight, User } from 'lucide-react';
import { Customer } from '../../../types';
import { MasterModal } from '../../MasterModal';
import { EmptyState } from '../../EmptyState';
import { useDebounce } from '../../../hooks/useDebounce';
import './AdvancedCustomerSearch.css';

interface AdvancedCustomerSearchProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSearchCustomers?: (term: string) => Promise<Customer[]>;
  onSelectCustomer: (customer: Customer) => void;
  onQuickAdd: () => void;
}

/**
 * AdvancedCustomerSearch — Modal tìm kiếm khách hàng nâng cao
 * - Uses MasterModal container with standardized shell
 * - Uses EmptyState for empty list handling
 * - CSS-driven styling via AdvancedCustomerSearch.css
 * - Tìm kiếm theo tên, SĐT, mã
 * - Hỗ trợ server-side search qua onSearchCustomers
 */
export const AdvancedCustomerSearch: React.FC<AdvancedCustomerSearchProps> = ({
  isOpen, onClose, customers, onSearchCustomers, onSelectCustomer, onQuickAdd
}) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestId = useRef(0);

  // Server-side search khi có onSearchCustomers
  useEffect(() => {
    if (!onSearchCustomers) {
      setSearchResults([]);
      return;
    }
    const term = debouncedSearch.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    const requestId = ++searchRequestId.current;
    setIsSearching(true);

    onSearchCustomers(term)
      .then((results) => {
        if (requestId === searchRequestId.current) {
          setSearchResults(results);
          setIsSearching(false);
        }
      })
      .catch((err) => {

        if (requestId === searchRequestId.current) {
          setSearchResults([]);
          setIsSearching(false);
        }
      });
  }, [debouncedSearch, onSearchCustomers]);

  const filtered = useMemo(() => {
    if (onSearchCustomers) {
      return searchResults;
    }
    if (!search) return customers;
    const term = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      ((c as any).code && (c as any).code.toLowerCase().includes(term))
    );
  }, [customers, search, onSearchCustomers, searchResults]);

  if (!isOpen) return null;

  // ─── Search input renderer ────────────────────────────────
  const renderSearch = () => (
    <div className="acs-search-box">
      <Search className="acs-search-icon" aria-hidden="true" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm theo tên, SĐT, mã..."
        className="acs-search-input"
        autoFocus
        aria-label="Tìm kiếm khách hàng"
      />
    </div>
  );

  // ─── Customer row renderer ────────────────────────────────
  const renderCustomerRow = (c: Customer) => (
    <div
      key={c.id}
      onClick={() => onSelectCustomer(c)}
      className="acs-customer-row"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectCustomer(c);
        }
      }}
    >
      <div className="acs-customer-row-left">
        <div className="acs-customer-avatar">
          {c.name.charAt(0).toUpperCase()}
        </div>
        <div className="acs-customer-info">
          <p className="acs-customer-name">{c.name}</p>
          <div className="acs-customer-meta">
            <span>{c.phone || '—'}</span>
            {(c as any).code && <span className="acs-customer-code">| {(c as any).code}</span>}
          </div>
        </div>
      </div>
      <div className="acs-customer-row-right">
        {(c.debt || 0) > 0 && (
          <span className="acs-debt-badge">
            {(c.debt || 0).toLocaleString('vi-VN')}₫
          </span>
        )}
        <ChevronRight className="acs-chevron" aria-hidden="true" />
      </div>
    </div>
  );

  // ─── Body renderer ────────────────────────────────────────
  const renderBody = () => (
    <>
      {renderSearch()}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<User className="acs-empty-icon" />}
          title="Không tìm thấy khách hàng"
          action={
            <button onClick={onQuickAdd} className="acs-quick-add-btn">
              + Thêm khách hàng mới
            </button>
          }
          compact
        />
      ) : (
        <div className="acs-customer-list">
          {filtered.map(renderCustomerRow)}
        </div>
      )}
    </>
  );

  // ─── Footer renderer ──────────────────────────────────────
  const renderFooter = () => (
    <p className="acs-footer-text">
      {isSearching ? 'Đang tìm...' : (
        <>
          Tổng số: <strong className="acs-footer-count">{filtered.length}</strong> khách hàng
        </>
      )}
    </p>
  );

  return (
    <MasterModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tìm kiếm khách hàng"
      icon={<Search size={20} />}
      size="sm"
      footer={renderFooter()}
    >
      {renderBody()}
    </MasterModal>
  );
};
