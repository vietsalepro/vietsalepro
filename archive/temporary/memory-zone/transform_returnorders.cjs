const fs = require('fs');
let content = fs.readFileSync('pages/ReturnOrders.tsx', 'utf8');

// 1. Update imports - add ChevronLeft, ChevronRight
content = content.replace(
  "import { Loader2, X, AlertTriangle } from 'lucide-react';",
  "import { Loader2, X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';"
);

// 2. Update the useReturnOrder destructuring to include pagination/filter values
const oldDestructure = `const {
    returnOrders,
    returnOrderItems,
    loading,
    error,
    formState,
    formItems,
    setFormState,
    setDebtReduction,
    setCashRefund,
    setReason,
    setNote,
    updateItem,
    submitReturn,
    initializeFromOrder,
    fetchReturnOrders,
    // Detail & Cancel
    selectedReturnOrder,
    detailLoading,
    detailError,
    fetchReturnOrderDetail,
    clearSelectedReturnOrder,
    cancelReturnOrder,
  } = useReturnOrder();`;

const newDestructure = `const {
    returnOrders,
    returnOrderItems,
    loading,
    error,
    formState,
    formItems,
    setFormState,
    setDebtReduction,
    setCashRefund,
    setReason,
    setNote,
    updateItem,
    submitReturn,
    initializeFromOrder,
    fetchReturnOrders,
    fetchReturnOrdersPaginated,
    // Detail & Cancel
    selectedReturnOrder,
    detailLoading,
    detailError,
    fetchReturnOrderDetail,
    clearSelectedReturnOrder,
    cancelReturnOrder,
    // Pagination & Filters
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    filters,
    setCurrentPage,
    setFilters,
    resetFilters,
  } = useReturnOrder();`;

content = content.replace(oldDestructure, newDestructure);

// 3. Remove searchTerm state and update useEffect to use paginated fetcher
content = content.replace(
  "  const [view, setView] = useState<<ViewState>('list');\n  const [searchTerm, setSearchTerm] = useState('');",
  "  const [view, setView] = useState<<ViewState>('list');"
);

// 4. Change the fetchReturnOrders useEffect to use fetchReturnOrdersPaginated
content = content.replace(
  "  useEffect(() => {\n    fetchReturnOrders();\n  }, [fetchReturnOrders]);",
  "  useEffect(() => {\n    fetchReturnOrdersPaginated();\n  }, [fetchReturnOrdersPaginated]);"
);

// 5. Remove getFilteredReturns function
// Find the getFilteredReturns function and remove it
const filterFuncStart = content.indexOf("  const getFilteredReturns = () => {");
const filterFuncEnd = content.indexOf("\n  // ========================\n  // CONFIRM DIALOG\n  // ========================");
if (filterFuncStart !== -1 && filterFuncEnd !== -1) {
  const before = content.substring(0, filterFuncStart);
  const after = content.substring(filterFuncEnd);
  content = before + after;
}

// 6. Replace the entire LIST VIEW section (from line 517 onward)
const listViewStart = content.indexOf("  // ========================\n  // LIST VIEW\n  // ========================\n  return (");
const listViewEnd = content.lastIndexOf("export default ReturnOrders;");

if (listViewStart !== -1) {
  const newListView = `  // ========================
  // LIST VIEW
  // ========================
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Trả hàng hoàn tiền</h1>
        <Button onClick={handleCreateNew}>Tạo phiếu trả hàng</Button>
      </div>

      {/* Filter Row */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ startDate: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ endDate: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Search by return code */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mã phiếu trả</label>
            <input
              type="text"
              placeholder="Nhập mã phiếu..."
              value={filters.returnId}
              onChange={(e) => setFilters({ returnId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Search by customer */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tên khách hàng</label>
            <input
              type="text"
              placeholder="Nhập tên khách..."
              value={filters.customerName}
              onChange={(e) => setFilters({ customerName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
          {/* Status filter */}
          <div className="w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="completed">Đã hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
              <option value="pending">Chờ xác nhận</option>
            </select>
          </div>

          {/* Reset button */}
          <button
            onClick={resetFilters}
            className="mt-5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-white"
          >
            Xóa lọc
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
          <span className="text-sm text-gray-500">Đang tải...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          Lỗi: {error}
        </div>
      )}

      {/* Return Orders List */}
      {!loading && returnOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Chưa có phiếu trả hàng nào</p>
          <p className="text-sm text-gray-400">Hãy tạo phiếu trả hàng mới</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {returnOrders.map((r) => (
              <div key={r.id} onClick={handleViewDetail(r)} className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{r.id?.slice(0, 8)}...</p>
                    <p className="text-sm text-gray-600">{r.customerName || 'Khách lẻ'}</p>
                    <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(r.totalRefundAmount)}</p>
                    {getStatusBadge(r.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t pt-4 mt-4">
            <p className="text-sm text-gray-500">
              Tổng số: <span className="font-medium">{totalCount}</span> phiếu
              {totalCount > 0 && (
                <> | Trang <span className="font-medium">{currentPage}</span>/<<span className="font-medium">{totalPages}</span></>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(0, Math.min(currentPage - 3, totalPages - 5));
                const pageNum = start + i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={\`px-3 py-1 text-sm rounded-lg \${
                      pageNum === currentPage
                        ? 'bg-blue-500 text-white'
                        : 'border hover:bg-gray-50'
                    }\`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};`;

  const beforeListView = content.substring(0, listViewStart);
  const afterListView = content.substring(listViewEnd);
  content = beforeListView + newListView + '\n\n' + afterListView;
}

// 7. Also update the handleSubmitReturn to refresh paginated
content = content.replace(
  "  const handleSubmitReturn = async () => {\n    const result = await submitReturn();\n    if (result) {\n      setView('list');\n      fetchReturnOrders();\n    }\n  };",
  "  const handleSubmitReturn = async () => {\n    const result = await submitReturn();\n    if (result) {\n      setView('list');\n      fetchReturnOrdersPaginated();\n    }\n  };"
);

fs.writeFileSync('pages/ReturnOrders.tsx', content);
console.log('ReturnOrders.tsx updated successfully');