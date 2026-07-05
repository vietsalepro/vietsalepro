import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disposal, DisposalFilter } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Loader2, Package, FileText, AlertCircle, CheckCircle, Trash, Search, ChevronDown, Check } from 'lucide-react';
import { DisposalDetailModal } from '../components/disposal-form/DisposalDetailModal';
import { StatusBadge as LegacyStatusBadge } from '../components/MasterModal';
import { StatusBadge } from '../components/StatusBadge';
import { ActionButton } from '../components/ActionButton';
import { DataGrid, DataGridColumn, SortDirection } from '../components/DataGrid';
import { useNewDataGridDisposals } from '../features';
import StatsRow from '../components/shared/StatsRow';
import { PageLayout } from '../components/shared/PageLayout';
import { DataGridBox } from '../components/shared/DataGridBox';
import { useDebounce } from '../hooks/useDebounce';
import { usePermissions } from '../hooks/usePermissions';
import '../components/shared/FilterBar.css';
import './Disposals.css';

const DEFAULT_DISPOSALS_PAGE_SIZE = 20;

export const Disposals: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [disposals, setDisposals] = useState<Disposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingDisposal, setViewingDisposal] = useState<Disposal | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const dataGridBoxRef = useRef<HTMLDivElement>(null);

  // Filters
  const [filters, setFilters] = useState<DisposalFilter>({});
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Phiếu tạm' },
    { value: 'COMPLETED', label: 'Đã hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // V2 DataGrid state
  const [pageSize] = useState(DEFAULT_DISPOSALS_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof Disposal; direction: 'asc' | 'desc' } | null>(null);

  // Fetch disposals server-side
  const fetchDisposals = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { disposals: data, totalCount } = await supabaseService.filterDisposalsPaginated(
        page,
        pageSize,
        debouncedSearchTerm,
        {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          status: status || undefined
        }
      );
      setDisposals(data);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Error fetching disposals:', error);
      alert('Lỗi tải danh sách xuất hủy');
    } finally {
      setLoading(false);
    }
  }, [pageSize, debouncedSearchTerm, fromDate, toDate, status]);

  useEffect(() => {
    fetchDisposals(currentPage);
  }, [currentPage, pageSize, debouncedSearchTerm, fromDate, toDate, status, sortConfig, fetchDisposals]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return disposals.slice(start, start + pageSize);
  }, [disposals, safeCurrentPage, pageSize]);

  // V2 DataGrid pagination + sorting
  const dataGridTotalPages = totalPages;
  const dataGridSafePage = safeCurrentPage;
  const dataGridDisposals = useMemo(
    () =>
      disposals
        .slice((dataGridSafePage - 1) * pageSize, dataGridSafePage * pageSize)
        .map((disposal, index) => ({ ...disposal, _index: index })),
    [disposals, dataGridSafePage, pageSize]
  );

  // Reset về trang 1 khi filters thay đổi
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearchTerm, fromDate, toDate, status]);

  // Reset selection khi đổi trang
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage]);

  // Nếu trang hiện tại vượt quá tổng trang, kéo về trang cuối
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Helper sinh dãy số trang có ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const total = totalPages;
    const current = safeCurrentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    if (left > 2) pages.push('ellipsis');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('ellipsis');
    pages.push(total);
    return pages;
  };

  const handleFilter = () => {
    setCurrentPage(1);
    fetchDisposals(1);
  };

  const handleDelete = async (id: string, status: string) => {
    const msg = status === 'COMPLETED'
      ? 'Phiếu đã hoàn thành. Xóa sẽ HOÀN LẠI hàng vào kho. Bạn chắc chắn?'
      : 'Bạn chắc chắn muốn xóa phiếu xuất hủy này?';
    if (!confirm(msg)) return;

    try {
      await supabaseService.deleteDisposal(id);
      fetchDisposals(currentPage);
      alert(status === 'COMPLETED' ? 'Đã xóa phiếu và hoàn kho' : 'Đã xóa phiếu');
    } catch (error) {
      console.error('Error deleting disposal:', error);
      alert('Lỗi xóa phiếu xuất hủy');
    }
  };

  const canEdit = (disposal: Disposal) => disposal.status === 'DRAFT';
  const canDelete = (disposal: Disposal) =>
    disposal.status === 'DRAFT' || disposal.status === 'COMPLETED';

  // V2 DataGrid helpers
  const handleDataGridSort = (key: string, direction: SortDirection) => {
    if (direction === 'none') {
      setSortConfig(null);
    } else {
      setSortConfig({ key: key as keyof Disposal, direction });
    }
  };

  const getStatusBadge = (disposal: Disposal) => {
    if (disposal.status === 'DRAFT') {
      return <StatusBadge label="Lưu tạm" type="warning" size="sm" />;
    }
    if (disposal.status === 'COMPLETED') {
      return <StatusBadge label="Hoàn thành" type="success" size="sm" />;
    }
    if (disposal.status === 'CANCELLED') {
      return <StatusBadge label="Đã hủy" type="danger" size="sm" />;
    }
    return <StatusBadge label={disposal.status || 'Không rõ'} type="default" size="sm" />;
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.size} phiếu xuất hủy đã chọn?`)) {
      const promises = Array.from(selectedIds).map((id) =>
        supabaseService.deleteDisposal(id).then(() => {
          setDisposals((prev) => prev.filter((d) => d.id !== id));
        })
      );
      Promise.all(promises)
        .then(() => {
          setSelectedIds(new Set());
          fetchDisposals(currentPage);
          alert('Đã xóa các phiếu đã chọn');
        })
        .catch((error) => {
          console.error('Error bulk deleting disposals:', error);
          alert('Lỗi xóa một số phiếu xuất hủy');
        });
    }
  };

  const disposalColumns: DataGridColumn<Disposal & { _index: number }>[] = [
    {
      key: '_index',
      label: 'STT',
      align: 'center',
      width: '48px',
      render: (disposal) => (
        <span className="disposals-v2-index">
          {(dataGridSafePage - 1) * pageSize + disposal._index + 1}
        </span>
      ),
    },
    {
      key: 'code',
      label: 'Mã phiếu',
      sortable: true,
      render: (disposal) => (
        <button
          className="disposals-v2-code"
          onClick={(e) => {
            e.stopPropagation();
            setViewingDisposal(disposal);
          }}
        >
          {disposal.code}
        </button>
      ),
    },
    {
      key: 'date',
      label: 'Ngày tạo',
      sortable: true,
      render: (disposal) => new Date(disposal.date).toLocaleDateString('vi-VN'),
    },
    {
      key: 'items',
      label: 'Số SP',
      align: 'center',
      render: (disposal) => disposal.items?.length || 0,
    },
    {
      key: 'totalQuantity',
      label: 'SL',
      sortable: true,
      align: 'center',
    },
    {
      key: 'totalValue',
      label: 'Giá trị',
      sortable: true,
      align: 'right',
      render: (disposal) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
          disposal.totalValue || 0
        ),
    },
    {
      key: 'reason',
      label: 'Lý do',
      sortable: true,
      render: (disposal) => disposal.reason || '—',
    },
    {
      key: 'status',
      label: 'Trạng thái',
      align: 'center',
      render: getStatusBadge,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      render: (disposal) => (
        <div className="disposals-v2-actions">
          {permissions.canDeleteRecord && canEdit(disposal) && (
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<Edit size={16} />}
              onClick={(e) => {
                e?.stopPropagation();
                navigate(`/inventory/disposals/${disposal.id}/edit`);
              }}
              aria-label="Sửa"
            />
          )}
          {permissions.canDeleteRecord && canDelete(disposal) && (
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<Trash2 size={16} />}
              onClick={(e) => {
                e?.stopPropagation();
                handleDelete(disposal.id, disposal.status);
              }}
              aria-label={disposal.status === 'COMPLETED' ? 'Xóa & hoàn kho' : 'Xóa'}
            />
          )}
        </div>
      ),
    },
  ];

  // Calculate KPI stats
  const totalDisposals = disposals.length;
  const totalItems = disposals.reduce((sum, d) => sum + (d.items?.length || 0), 0);
  const totalValue = disposals.reduce((sum, d) => sum + (d.totalValue || 0), 0);
  const completedCount = disposals.filter(d => d.status === 'COMPLETED').length;
  const draftCount = disposals.filter(d => d.status === 'DRAFT').length;

  return (
    <>
      {viewingDisposal ? (
        <div className="vsp-modal-sync min-h-screen w-full bg-slate-50 flex flex-col animate-fade-in">
          <DisposalDetailModal
            disposal={viewingDisposal}
            products={[]}
            onClose={() => setViewingDisposal(null)}
            onEdit={(disposal) => navigate(`/inventory/disposals/${disposal.id}/edit`)}
            onDelete={handleDelete}
          />
        </div>
      ) : (
        <PageLayout>
          {/* Header */}
          <div className="page-header items-start">
            <div className="flex items-center gap-3">
              <span className="inv-title-icon">
                <Trash className="w-4 h-4" />
              </span>
              <div>
                <h2 className="page-title">Xuất hủy hàng hóa</h2>
                <p className="page-subtitle">Quản lý các phiếu xuất hủy hàng hóa</p>
              </div>
            </div>

            <div className="flex flex-1 min-w-0 items-start md:mx-4">
              <div className="filter-bar">
                {!useNewDataGridDisposals && (
                  /* Search - canonical filter-bar style from /import */
                  <div className="filter-bar__search">
                    <Search className="filter-bar__search-icon" />
                    <input
                      type="text"
                      placeholder="Mã phiếu hoặc nội dung..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="filter-bar__search-input"
                    />
                  </div>
                )}

                {/* Date range */}
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="filter-bar__date-input"
                  title="Từ ngày"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="filter-bar__date-input"
                  title="Đến ngày"
                />

                {/* Status dropdown */}
                <div className="filter-bar__dropdown">
                  <button
                    onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                    className={`filter-bar__trigger ${status ? 'filter-bar__trigger--active' : ''}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Trạng thái{status ? `: ${statusOptions.find(o => o.value === status)?.label}` : ''}</span>
                    <ChevronDown className={`filter-bar__chevron ${isStatusFilterOpen ? 'filter-bar__chevron--open' : ''}`} />
                  </button>

                  {isStatusFilterOpen && (
                    <div className="filter-bar__menu">
                      <div className="filter-bar__menu-scroll">
                        {statusOptions.map(opt => (
                          <div
                            key={opt.value}
                            className="filter-bar__option"
                            onClick={() => { setStatus(opt.value); setIsStatusFilterOpen(false); }}
                          >
                            <div className={`filter-bar__check ${status === opt.value ? 'filter-bar__check--checked' : ''}`}>
                              {status === opt.value && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="filter-bar__option-label">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply filter */}
                <button
                  onClick={handleFilter}
                  className="btn-primary flex items-center gap-2 px-4 py-2.5 self-start flex-shrink-0 whitespace-nowrap"
                >
                  Tìm kiếm
                </button>
              </div>
            </div>

            {permissions.canManageInventory && (
            <button
              onClick={() => navigate('/inventory/disposals/create')}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 self-start flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Xuất hủy
            </button>
            )}
          </div>

          {/* KPI Stat Cards */}
          <StatsRow stats={[
            { label: 'Tổng phiếu xuất hủy', value: totalDisposals, subtext: 'Toàn bộ phiếu', icon: <Trash />, colorScheme: 'purple' },
            { label: 'Tổng số sản phẩm', value: totalItems, subtext: 'Đã hủy', icon: <Package />, colorScheme: 'blue' },
            { label: 'Tổng giá trị hủy', value: totalValue.toLocaleString('vi-VN') + '₫', subtext: 'Giá trị tài sản', icon: <FileText />, colorScheme: 'orange' },
            { label: 'Phiếu hoàn thành', value: completedCount, subtext: 'Đã xử lý', icon: <CheckCircle />, colorScheme: 'green' },
            { label: 'Phiếu tạm', value: draftCount, subtext: 'Chưa xử lý', icon: <AlertCircle />, colorScheme: 'red' },
          ]} />

          {/* ===== TABLE BOX — V2 DataGrid / Legacy ===== */}
          {useNewDataGridDisposals ? (
            <DataGridBox innerRef={dataGridBoxRef}>
              <DataGrid
                className="flex-1 min-h-0"
                embedded
                data={dataGridDisposals}
                columns={disposalColumns}
                keyExtractor={(disposal) => disposal.id}
                loading={loading && dataGridDisposals.length === 0}
                selectedRows={Array.from(selectedIds)}
                onSelectionChange={(ids) => setSelectedIds(new Set(ids as string[]))}
                onRowClick={(disposal) => setViewingDisposal(disposal)}
                sortKey={sortConfig?.key}
                sortDirection={sortConfig?.direction || 'none'}
                onSortChange={handleDataGridSort}
                pagination={{
                  currentPage: dataGridSafePage,
                  totalPages: dataGridTotalPages,
                  totalCount,
                  pageSize,
                  onPageChange: setCurrentPage,
                  showInfo: false,
                }}
                emptyTitle="Không tìm thấy phiếu xuất hủy"
                emptyDescription="Thử tìm kiếm với từ khóa khác hoặc tạo phiếu mới."
                emptyAction={
                  permissions.canManageInventory ? (
                  <ActionButton
                    variant="primary"
                    size="md"
                    icon={<Plus size={18} />}
                    onClick={() => navigate('/inventory/disposals/create')}
                  >
                    Tạo phiếu xuất hủy
                  </ActionButton>
                  ) : undefined
                }
              />
            </DataGridBox>
          ) : (
            <DataGridBox innerRef={dataGridBoxRef}>
              {loading && paginatedData.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-purple-600" size={32} />
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="text-center py-20 flex items-center justify-center">
                  <p className="text-slate-500 text-sm font-medium">Không tìm thấy phiếu xuất hủy</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <colgroup>
                        <col className="w-10 sm:w-14" />
                        <col className="w-[110px] sm:w-[140px]" />
                        <col className="w-[95px] sm:w-[120px]" />
                        <col className="w-[70px] sm:w-[90px]" />
                        <col className="w-[60px] sm:w-[80px]" />
                        <col className="w-[100px] sm:w-[130px]" />
                        <col className="hidden sm:table-column w-[110px]" />
                        <col className="w-[110px] sm:w-[120px]" />
                        <col className="w-[85px] sm:w-[130px]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">STT</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Mã phiếu</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Ngày tạo</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 tracking-wide">Số SP</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 tracking-wide">SL</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 tracking-wide">Giá trị</th>
                          <th scope="col" className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Lý do</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 tracking-wide">Trạng thái</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 tracking-wide">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedData.map((disposal, idx) => (
                          <tr key={disposal.id} className="group hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-mono text-xs text-center w-10 sm:w-14">
                              {(currentPage - 1) * pageSize + idx + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                onClick={() => setViewingDisposal(disposal)}
                                className="text-slate-800 font-semibold text-sm hover:text-purple-600 hover:underline cursor-pointer transition-colors"
                              >
                                {disposal.code}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-sm">
                              {new Date(disposal.date).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-700 text-center font-mono text-sm">
                              {disposal.items?.length || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-700 text-center font-mono text-sm">
                              {disposal.totalQuantity}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-700 text-right font-mono text-sm font-semibold">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(disposal.totalValue || 0)}
                            </td>
                            <td className="hidden sm:table-cell px-4 py-3 text-slate-500 max-w-[110px] truncate text-sm">
                              {disposal.reason || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              {disposal.status === 'DRAFT' && (
                                <LegacyStatusBadge label="Lưu tạm" variant="warning" />
                              )}
                              {disposal.status === 'COMPLETED' && (
                                <LegacyStatusBadge label="Hoàn thành" variant="success" />
                              )}
                              {disposal.status === 'CANCELLED' && (
                                <LegacyStatusBadge label="Đã hủy" variant="danger" />
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="inline-flex items-center gap-1">
                                {permissions.canDeleteRecord && canEdit(disposal) && (
                                  <button
                                    onClick={() => navigate(`/inventory/disposals/${disposal.id}/edit`)}
                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                    title="Sửa"
                                  >
                                    <Edit size={14} />
                                  </button>
                                )}
                                {permissions.canDeleteRecord && canDelete(disposal) && (
                                  <button
                                    onClick={() => handleDelete(disposal.id, disposal.status)}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    title={disposal.status === 'COMPLETED' ? 'Xóa & hoàn kho' : 'Xóa'}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="pagination-toolbar flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/40">
                    <p className="text-xs sm:text-sm text-slate-400 order-2 sm:order-1">
                      Hiển thị <span className="text-slate-700 font-medium">{(safeCurrentPage - 1) * pageSize + 1}</span> – <span className="text-slate-700 font-medium">{Math.min(safeCurrentPage * pageSize, totalCount)}</span> trên tổng số <span className="text-slate-700 font-medium">{totalCount}</span> phiếu xuất hủy
                    </p>
                    <nav className="inline-flex items-center gap-1 order-1 sm:order-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(safeCurrentPage - 1, 1))}
                          disabled={safeCurrentPage === 1}
                          className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Trang trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {getPageNumbers().map((p, idx) =>
                          p === 'ellipsis' ? (
                            <span key={`e-${idx}`} className="px-1 text-slate-400 text-sm select-none">…</span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              className={`inline-flex items-center justify-center min-w-[32px] h-[32px] text-sm font-semibold rounded-lg transition-all ${
                                p === safeCurrentPage
                                  ? 'bg-white text-purple-600 shadow-sm border border-slate-200'
                                  : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                          disabled={safeCurrentPage === totalPages}
                          className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Trang sau"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                </>
              )}
            </DataGridBox>
          )}
        </PageLayout>
      )}
    </>
  );
};
