/**
 * ═══════════════════════════════════════════════════════════════
 *  DATA GRID COMPONENT — Sprint_26
 *  Source: MASTER_DATA_GRID_STANDARD_V1.md, MASTER_TABLE_STANDARD_V1.md
 *  ═══════════════════════════════════════════════════════════════
 *
 *  Purpose:
 *    Standardized data table container with toolbar, sortable headers,
 *    row selection, pagination, and state handling.
 *
 *  Sub-components:
 *    - DataGrid           → Container + state orchestration
 *    - DataGridToolbar    → Search, filter, actions
 *    - DataGridHeader     → Sortable column headers + select-all
 *    - DataGridBody       → Row list
 *    - DataGridRow        → Single row + selection checkbox
 *    - DataGridPagination → Page controls + page size
 *
 *  Design Tokens:
 *    All styling in DataGrid.css — no inline styles.
 *
 *  Governance:
 *    This is a NEW foundation component. No existing page or business
 *    logic is modified in this sprint.
 *  ═══════════════════════════════════════════════════════════════
 */

import React, { useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Filter, ListFilter } from 'lucide-react';
import { TextInput } from './TextInput';
import { SelectInput } from './SelectInput';
import { ActionButton } from './ActionButton';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import './DataGrid.css';

/* ─── Types ──────────────────────────────────────────── */

export type ColumnAlign = 'left' | 'center' | 'right';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface DataGridColumn<T = unknown> {
  /** Unique key used to access row data */
  key: string;
  /** Header label */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom render function for cell content (receives item and row index) */
  render?: (item: T, index: number) => React.ReactNode;
  /** Column width (CSS value, e.g. '140px', '1fr') */
  width?: string;
  /** Minimum column width (CSS value, e.g. '100px') */
  minWidth?: string;
  /** Maximum column width (CSS value, e.g. '400px') */
  maxWidth?: string;
  /** Cell alignment */
  align?: ColumnAlign;
}

export interface DataGridPaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of records */
  totalCount: number;
  /** Number of rows per page */
  pageSize?: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Show page size selector and total count on the left side (default: true) */
  showInfo?: boolean;
}

export interface DataGridToolbarProps {
  /** Search query value */
  searchValue?: string;
  /** Callback when search query changes (debounced by parent) */
  onSearchChange?: (value: string) => void;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Show filter button */
  showFilter?: boolean;
  /** Callback when filter button is clicked */
  onFilterClick?: () => void;
  /** Custom slot rendered on the left side */
  left?: React.ReactNode;
  /** Custom slot rendered on the right side */
  right?: React.ReactNode;
}

export interface DataGridProps<T = unknown> {
  /** Data array to display */
  data: T[];
  /** Column definitions */
  columns: DataGridColumn<T>[];
  /** Unique key extractor for each row */
  keyExtractor: (item: T) => string | number;
  /** Loading state */
  loading?: boolean;
  /** Error message (if any) */
  error?: string | null;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Empty state action */
  emptyAction?: React.ReactNode;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** Row click callback */
  onRowClick?: (item: T) => void;
  /** Currently selected row keys */
  selectedRows?: (string | number)[];
  /** Selection change callback */
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;
  /** Toolbar configuration */
  toolbar?: DataGridToolbarProps | React.ReactNode;
  /** Pagination configuration */
  pagination?: DataGridPaginationProps;
  /** Current sort key */
  sortKey?: string;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Sort change callback */
  onSortChange?: (key: string, direction: SortDirection) => void;
  /** Additional class name */
  className?: string;
  /** Remove outer border/shadow when used inside a card/box */
  embedded?: boolean;
}

/* ─── Utility Helpers ────────────────────────────────── */

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200];

function getSortIcon(direction: SortDirection, active: boolean): React.ReactNode {
  if (!active || direction === 'none') {
    return (
      <span className="datagrid-header__sort datagrid-header__sort--inactive">
        <ChevronUp size={14} />
        <ChevronDown size={14} />
      </span>
    );
  }

  return (
    <span className="datagrid-header__sort datagrid-header__sort--active">
      {direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </span>
  );
}

function getColumnStyle<T>(column: DataGridColumn<T>): React.CSSProperties | undefined {
  const style: React.CSSProperties = {};
  if (column.width) style.flex = `0 0 ${column.width}`;
  if (column.minWidth) style.minWidth = column.minWidth;
  if (column.maxWidth) style.maxWidth = column.maxWidth;
  return Object.keys(style).length > 0 ? style : undefined;
}

/* ─── DataGridToolbar ────────────────────────────────── */

export const DataGridToolbar: React.FC<DataGridToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  showFilter = true,
  onFilterClick,
  left,
  right,
}) => {
  return (
    <div className="datagrid-toolbar">
      <div className="datagrid-toolbar__left">
        {left}
        {onSearchChange && (
          <div className="datagrid-toolbar__search">
            <TextInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              prefixIcon={<Search size={18} />}
              size="md"
              aria-label="Search data grid"
            />
          </div>
        )}
        {showFilter && (
          <ActionButton
            variant="ghost"
            size="md"
            icon={<Filter size={18} />}
            onClick={onFilterClick}
            aria-label="Open filters"
          >
            Lọc
          </ActionButton>
        )}
      </div>
      <div className="datagrid-toolbar__right">
        {right}
      </div>
    </div>
  );
};

/* ─── DataGridPagination ─────────────────────────────── */

export const DataGridPagination: React.FC<DataGridPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  showInfo = true,
}) => {
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages, start + maxVisible - 1);
      const adjustedStart = Math.max(1, end - maxVisible + 1);

      if (adjustedStart > 1) pages.push(1, '...');
      for (let i = adjustedStart; i <= end; i++) pages.push(i);
      if (end < totalPages) pages.push('...', totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="datagrid-pagination">
      {showInfo && (
        <div className="datagrid-pagination__info">
          {onPageSizeChange && (
            <div className="datagrid-pagination__size">
              <SelectInput
                size="sm"
                value={String(pageSize)}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                options={pageSizeOptions.map((size) => ({
                  value: String(size),
                  label: `${size} / trang`,
                }))}
                aria-label="Rows per page"
              />
            </div>
          )}
          <span className="datagrid-pagination__total">
            Tổng: {totalCount.toLocaleString('vi-VN')} dòng
          </span>
        </div>
      )}

      <div className="datagrid-pagination__nav">
        <ActionButton
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          Trước
        </ActionButton>

        <div className="datagrid-pagination__pages" role="group" aria-label="Pagination">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={`${page}-${index}`}>
              {page === '...' ? (
                <span className="datagrid-pagination__ellipsis">...</span>
              ) : (
                <ActionButton
                  variant={currentPage === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </ActionButton>
              )}
            </React.Fragment>
          ))}
        </div>

        <ActionButton
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          Sau
        </ActionButton>
      </div>
    </div>
  );
};

/* ─── DataGridHeader ─────────────────────────────────── */

interface DataGridHeaderProps<T> {
  columns: DataGridColumn<T>[];
  sortKey?: string;
  sortDirection?: SortDirection;
  onSortChange?: (key: string, direction: SortDirection) => void;
  selectable?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: () => void;
}

export function DataGridHeader<T>({
  columns,
  sortKey,
  sortDirection,
  onSortChange,
  selectable,
  allSelected,
  someSelected,
  onSelectAll,
}: DataGridHeaderProps<T>): React.ReactElement {
  const handleSortClick = (column: DataGridColumn<T>) => {
    if (!column.sortable || !onSortChange) return;

    const currentDirection = sortKey === column.key ? sortDirection : 'none';
    const nextDirection: SortDirection =
      currentDirection === 'none' ? 'asc' : currentDirection === 'asc' ? 'desc' : 'none';

    onSortChange(column.key, nextDirection);
  };

  return (
    <div className="datagrid-header" role="rowgroup">
      <div className="datagrid-header__row" role="row">
        {selectable && (
          <div
            className="datagrid-header__cell datagrid-header__cell--checkbox"
            role="columnheader"
          >
            <input
              type="checkbox"
              className="datagrid-checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = !!someSelected;
              }}
              onChange={onSelectAll}
              aria-label="Select all rows"
            />
          </div>
        )}
        {columns.map((column) => (
          <div
            key={column.key}
            className={[
              'datagrid-header__cell',
              column.sortable ? 'datagrid-header__cell--sortable' : '',
              `datagrid-header__cell--align-${column.align || 'left'}`,
            ].join(' ')}
            role="columnheader"
            style={getColumnStyle(column)}
            onClick={() => handleSortClick(column)}
            aria-sort={
              sortKey === column.key && sortDirection !== 'none'
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined
            }
          >
            <span className="datagrid-header__label">{column.label}</span>
            {column.sortable && getSortIcon(sortDirection || 'none', sortKey === column.key)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DataGridRow ────────────────────────────────────── */

interface DataGridRowProps<T> {
  item: T;
  columns: DataGridColumn<T>[];
  rowKey: string | number;
  index: number;
  selected?: boolean;
  onSelect?: (key: string | number) => void;
  onClick?: (item: T) => void;
}

export function DataGridRow<T>({
  item,
  columns,
  rowKey,
  index,
  selected,
  onSelect,
  onClick,
}: DataGridRowProps<T>): React.ReactElement {
  const handleRowClick = () => {
    onClick?.(item);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(rowKey);
  };

  return (
    <div
      className={[
        'datagrid-row',
        selected ? 'datagrid-row--selected' : '',
        onClick ? 'datagrid-row--clickable' : '',
      ].join(' ')}
      role="row"
      onClick={handleRowClick}
    >
      {onSelect && (
        <div
          className="datagrid-cell datagrid-cell--checkbox"
          role="cell"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="datagrid-checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            aria-label="Select row"
          />
        </div>
      )}
      {columns.map((column) => (
        <div
          key={column.key}
          className={[
            'datagrid-cell',
            `datagrid-cell--align-${column.align || 'left'}`,
          ].join(' ')}
          role="cell"
          style={getColumnStyle(column)}
        >
          {column.render ? column.render(item, index) : (item as Record<string, unknown>)[column.key] as React.ReactNode}
        </div>
      ))}
    </div>
  );
}

/* ─── DataGridBody ───────────────────────────────────── */

interface DataGridBodyProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  keyExtractor: (item: T) => string | number;
  selectedRows?: (string | number)[];
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
}

export function DataGridBody<T>({
  data,
  columns,
  keyExtractor,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  selectable,
}: DataGridBodyProps<T>): React.ReactElement {
  const selectedSet = useMemo(() => new Set(selectedRows), [selectedRows]);

  const handleSelect = (key: string | number) => {
    if (!onSelectionChange) return;

    const newSet = new Set(selectedSet);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    onSelectionChange(Array.from(newSet));
  };

  return (
    <div className="datagrid-body" role="rowgroup">
      {data.map((item, index) => {
        const rowKey = keyExtractor(item);
        return (
          <DataGridRow
            key={rowKey}
            item={item}
            columns={columns}
            rowKey={rowKey}
            index={index}
            selected={selectedSet.has(rowKey)}
            onSelect={selectable ? handleSelect : undefined}
            onClick={onRowClick}
          />
        );
      })}
    </div>
  );
}

/* ─── DataGrid ───────────────────────────────────────── */

export function DataGrid<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  error = null,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyAction,
  onRetry,
  onRowClick,
  selectedRows,
  onSelectionChange,
  toolbar,
  pagination,
  sortKey,
  sortDirection,
  onSortChange,
  className,
  embedded = false,
}: DataGridProps<T>): React.ReactElement {
  const selectable = !!onSelectionChange;
  const selectedSet = useMemo(() => new Set(selectedRows || []), [selectedRows]);
  const allSelected = data.length > 0 && data.every((item) => selectedSet.has(keyExtractor(item)));
  const someSelected = data.some((item) => selectedSet.has(keyExtractor(item))) && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => keyExtractor(item)));
    }
  };

  const renderToolbar = () => {
    if (!toolbar) return null;
    if (React.isValidElement(toolbar)) return toolbar;
    return <DataGridToolbar {...(toolbar as DataGridToolbarProps)} />;
  };

  const renderPagination = () => {
    if (!pagination) return null;
    return <DataGridPagination {...pagination} />;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="datagrid-state datagrid-state--loading">
          <LoadingState message="Đang tải dữ liệu..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="datagrid-state datagrid-state--error">
          <ErrorState
            title="Không thể tải dữ liệu"
            message={error}
            retryLabel="Tải lại"
            onRetry={onRetry}
          />
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="datagrid-state datagrid-state--empty">
          <EmptyState
            icon={<ListFilter size={48} />}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </div>
      );
    }

    return (
      <div className="datagrid-table" role="table" aria-label="Data grid">
        <DataGridHeader
          columns={columns}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
          selectable={selectable}
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={handleSelectAll}
        />
        <DataGridBody
          data={data}
          columns={columns}
          keyExtractor={keyExtractor}
          selectedRows={selectedRows}
          onSelectionChange={onSelectionChange}
          onRowClick={onRowClick}
          selectable={selectable}
        />
      </div>
    );
  };

  const rootClass = ['datagrid', embedded ? 'datagrid--embedded' : '', className || '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {renderToolbar()}
      <div className="datagrid-content">
        {renderContent()}
      </div>
      {renderPagination()}
    </div>
  );
}

/* ─── Default Export ─────────────────────────────────── */

export default DataGrid;
