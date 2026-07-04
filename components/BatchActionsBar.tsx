import React from 'react';
import { Trash2, Printer, Download, MoreVertical, X } from 'lucide-react';
import './BatchActionsBar.css';

interface BatchActionsBarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onPrintSelected: () => void;
  onExportData: () => void;
  onChangeStatus?: () => void;
  onClearSelection: () => void;
  /** Có hiển thị nút Xoá hay không (mặc định true). Truyền false cho các trang không cho phép xoá hàng loạt. */
  showDelete?: boolean;
}

export const BatchActionsBar: React.FC<BatchActionsBarProps> = ({
  selectedCount,
  onDeleteSelected,
  onPrintSelected,
  onExportData,
  onChangeStatus,
  onClearSelection,
  showDelete = true,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="batch-actions-bar">
      <div className="batch-actions-bar__count">
        Đã chọn <span className="batch-actions-bar__count-value">{selectedCount}</span> phiếu
      </div>
      <div className="batch-actions-bar__divider"></div>
      <div className="batch-actions-bar__actions">
        <button
          onClick={onPrintSelected}
          className="batch-actions-bar__btn"
          title="In nhiều phiếu"
        >
          <Printer size={16} className="batch-actions-bar__icon" />
          <span className="batch-actions-bar__btn-label">In</span>
        </button>
        <button
          onClick={onExportData}
          className="batch-actions-bar__btn"
          title="Xuất dữ liệu"
        >
          <Download size={16} className="batch-actions-bar__icon" />
          <span className="batch-actions-bar__btn-label">Xuất</span>
        </button>
        {onChangeStatus && (
          <button
            onClick={onChangeStatus}
            className="batch-actions-bar__btn"
            title="Đổi trạng thái"
          >
            <MoreVertical size={16} className="batch-actions-bar__icon" />
            <span className="batch-actions-bar__btn-label">Trạng thái</span>
          </button>
        )}
        {showDelete && (
          <button
            onClick={onDeleteSelected}
            className="batch-actions-bar__btn batch-actions-bar__btn--danger"
            title="Xóa các phiếu đã chọn"
          >
            <Trash2 size={16} className="batch-actions-bar__icon" />
            <span className="batch-actions-bar__btn-label">Xoá</span>
          </button>
        )}
      </div>
      <button
        onClick={onClearSelection}
        className="batch-actions-bar__clear"
        title="Bỏ chọn"
      >
        <X size={16} className="batch-actions-bar__icon" />
      </button>
    </div>
  );
};
