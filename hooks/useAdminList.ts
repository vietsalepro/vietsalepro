import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

export interface AdminListOptions<TFilter extends Record<string, unknown> = Record<string, unknown>> {
  initialFilters?: TFilter;
  initialPage?: number;
  initialPageSize?: number;
  debounceMs?: number;
}

export interface AdminListState<TItem, TFilter extends Record<string, unknown> = Record<string, unknown>> {
  data: TItem[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  searchTerm: string;
  filters: TFilter;
}

export type AdminListFetcher<TItem, TFilter extends Record<string, unknown> = Record<string, unknown>> = (
  params: { page: number; pageSize: number; search: string } & TFilter,
) => Promise<{ items: TItem[]; totalCount: number }>;

export interface UseAdminListResult<TItem, TFilter extends Record<string, unknown> = Record<string, unknown>>
  extends AdminListState<TItem, TFilter> {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearchTerm: (searchTerm: string) => void;
  setFilters: (filters: TFilter | ((prev: TFilter) => TFilter)) => void;
  setFilter: <K extends keyof TFilter>(key: K, value: TFilter[K]) => void;
  refresh: () => void;
}

export function useAdminList<TItem, TFilter extends Record<string, unknown> = Record<string, unknown>>(
  fetcher: AdminListFetcher<TItem, TFilter>,
  options: AdminListOptions<TFilter> = {},
): UseAdminListResult<TItem, TFilter> {
  const {
    initialFilters = {} as TFilter,
    initialPage = 1,
    initialPageSize = 20,
    debounceMs = 300,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFiltersState] = useState<TFilter>(initialFilters);
  const [data, setData] = useState<TItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const requestIdRef = useRef(0);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  const setFilters = useCallback((next: TFilter | ((prev: TFilter) => TFilter)) => {
    setFiltersState((prev) => (typeof next === 'function' ? (next as (prev: TFilter) => TFilter)(prev) : next));
  }, []);

  const setFilter = useCallback(<K extends keyof TFilter>(key: K, value: TFilter[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  // Reset về trang 1 khi search/filters thay đổi.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filters]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher({
        page,
        pageSize,
        search: debouncedSearchTerm.trim(),
        ...filters,
      });
      if (requestId !== requestIdRef.current) return;
      setData(result.items);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return;
      setError(err?.message || 'Không thể tải dữ liệu.');
      setData([]);
      setTotalCount(0);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetcher, page, pageSize, debouncedSearchTerm, filters, refreshTick]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    totalCount,
    isLoading,
    error,
    page,
    pageSize,
    searchTerm,
    filters,
    setPage,
    setPageSize,
    setSearchTerm,
    setFilters,
    setFilter,
    refresh,
  };
}
