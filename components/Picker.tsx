import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './Picker.css';

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */
export interface PickerOption {
  value: string;
  label: string;
}

export interface PickerProps {
  options: PickerOption[];
  value?: string;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

/* ─────────────────────────────────────────────────────────────
   ChevronDown Icon (inline SVG – visual only, no inline styles)
   ───────────────────────────────────────────────────────────── */
const ChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   SearchIcon (inline SVG – visual only, no inline styles)
   ───────────────────────────────────────────────────────────── */
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   EmptyIcon (inline SVG – visual only, no inline styles)
   ───────────────────────────────────────────────────────────── */
const EmptyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Picker Component
   ───────────────────────────────────────────────────────────── */
const Picker: React.FC<PickerProps> = ({
  options,
  value,
  placeholder = 'Select...',
  searchable = false,
  disabled = false,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLUListElement>(null);

  /* ── Filtered options ────────────────────────── */
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, searchTerm]);

  /* ── Selected option ─────────────────────────── */
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  /* ── Reset highlighted index when filtered list changes ── */
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions.length]);

  /* ── Focus search input when dropdown opens ──── */
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  /* ── Close on click outside ──────────────────── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /* ── Open / Close ────────────────────────────── */
  const openDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
    }
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  /* ── Select option ───────────────────────────── */
  const selectOption = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      closeDropdown();
    },
    [onChange, closeDropdown]
  );

  /* ── Keyboard navigation ─────────────────────── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
            return;
          }
          setHighlightedIndex((prev) => {
            const next = prev + 1;
            return next >= filteredOptions.length ? 0 : next;
          });
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
            return;
          }
          setHighlightedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? filteredOptions.length - 1 : next;
          });
          break;
        }

        case 'Enter': {
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
            return;
          }
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            selectOption(filteredOptions[highlightedIndex].value);
          }
          break;
        }

        case 'Escape': {
          e.preventDefault();
          if (isOpen) {
            closeDropdown();
          }
          break;
        }

        default:
          break;
      }
    },
    [disabled, isOpen, openDropdown, closeDropdown, highlightedIndex, filteredOptions, selectOption]
  );

  /* ── Option click handler ────────────────────── */
  const handleOptionClick = useCallback(
    (optionValue: string) => {
      selectOption(optionValue);
    },
    [selectOption]
  );

  /* ── Render ──────────────────────────────────── */
  return (
    <div
      className={`picker-wrapper ${className ?? ''}`}
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        className="picker-trigger"
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        aria-haspopup="listbox"
        onClick={isOpen ? closeDropdown : openDropdown}
        tabIndex={disabled ? -1 : 0}
      >
        {selectedOption ? (
          <span className="picker-value">{selectedOption.label}</span>
        ) : (
          <span className="picker-placeholder">{placeholder}</span>
        )}
        <ChevronDown className={`picker-arrow ${isOpen ? 'picker-arrow--open' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="picker-dropdown" role="listbox" aria-label={placeholder}>
          {/* Search Input */}
          {searchable && (
            <div className="picker-search">
              <input
                ref={searchInputRef}
                className="picker-search-input"
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            <ul className="picker-options" ref={optionsListRef}>
              {filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  className={`picker-option${
                    index === highlightedIndex ? ' picker-option--highlighted' : ''
                  }${option.value === value ? ' picker-option--selected' : ''}`}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleOptionClick(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          ) : (
            /* Empty / No Results State */
            <div className="picker-empty">
              {searchTerm ? (
                <>
                  <SearchIcon className="picker-no-results-icon" />
                  <p className="picker-no-results-text">
                    Không tìm thấy kết quả cho "{searchTerm}"
                  </p>
                </>
              ) : (
                <>
                  <EmptyIcon className="picker-empty-icon" />
                  <p className="picker-empty-text">Không có dữ liệu</p>
                  <p className="picker-empty-hint">
                    Không có tùy chọn nào để hiển thị
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Picker;