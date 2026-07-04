import React, { useState } from 'react';
import './ImportPreviewModal.css';
import { AlertCircle, CheckCircle2, X, Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import { ImportResult, ParsedOrder, ImportError, ConflictAction, SourceSoftware } from '../../utils/excel/orderImporter';

interface ImportPreviewModalProps {
  result: ImportResult;
  // onConfirm nhận về danh sách parsedOrders đã cập nhật conflictAction
  onConfirm: (orders: ParsedOrder[]) => Promise<void>;
  onCancel: () => void;
}

const SOURCE_LABELS: Record<SourceSoftware, string> = {
  vietsale: 'VietSale Pro',
  misa: 'MISA',
  kiotviet: 'KiotViet',
  fast: 'Fast Accounting',
};

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  result,
  onConfirm,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<'valid' | 'errors'>('valid');
  const [isImporting, setIsImporting] = useState(false);
  // Quản lý conflictAction cho từng đơn trùng (theo index trong result.success)
  const [actions, setActions] = useState<Record<number, ConflictAction>>(() => {
    const init: Record<number, ConflictAction> = {};
    result.success.forEach((p, idx) => {
      if (p.isDuplicate) init[idx] = p.conflictAction || 'skip';
    });
    return init;
  });

  const duplicates = result.success.filter(p => p.isDuplicate);
  const willImportCount = result.success.filter((p, idx) =>
    !p.isDuplicate || actions[idx] === 'create_new'
  ).length;

  const setAction = (idx: number, action: ConflictAction) => {
    setActions(prev => ({ ...prev, [idx]: action }));
  };

  const handleConfirm = async () => {
    if (willImportCount === 0) {
      alert('Không có đơn hàng nào sẽ được nhập!');
      return;
    }
    if (!window.confirm(`Xác nhận nhập ${willImportCount} đơn hàng vào hệ thống?`)) return;

    // Gắn conflictAction đã chọn vào từng đơn trước khi gửi đi
    const merged: ParsedOrder[] = result.success.map((p, idx) => ({
      ...p,
      conflictAction: p.isDuplicate ? (actions[idx] || 'skip') : p.conflictAction,
    }));

    setIsImporting(true);
    try {
      await onConfirm(merged);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="import-preview-modal">
      <div className="import-preview-modal__dialog">

        {/* Header */}
        <div className="import-preview-modal__header">
          <div className="import-preview-modal__header-row">
            <div>
              <h3 className="import-preview-modal__title">
                <AlertTriangle className="import-preview-modal__title-icon" />
                Xem trước dữ liệu nhập
              </h3>
              <div className="import-preview-modal__summary">
                <span className="import-preview-modal__stat import-preview-modal__stat--source">
                  Nguồn: <span className="import-preview-modal__stat-value">{SOURCE_LABELS[result.sourceSoftware]}</span>
                </span>
                <span className="import-preview-modal__stat">
                  Tổng: <span className="import-preview-modal__stat-value">{result.summary.total}</span>
                </span>
                <span className="import-preview-modal__stat import-preview-modal__stat--import">
                  Sẽ nhập: <span className="import-preview-modal__stat-value">{willImportCount}</span>
                </span>
                <span className="import-preview-modal__stat import-preview-modal__stat--duplicate">
                  Trùng: <span className="import-preview-modal__stat-value">{duplicates.length}</span>
                </span>
                <span className="import-preview-modal__stat import-preview-modal__stat--error">
                  Lỗi: <span className="import-preview-modal__stat-value">{result.summary.invalid}</span>
                </span>
                {result.summary.newCustomers > 0 && (
                  <span className="import-preview-modal__stat import-preview-modal__stat--new">
                    <UserPlus className="import-preview-modal__stat-icon" />
                    KH mới: <span className="import-preview-modal__stat-value">{result.summary.newCustomers}</span>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isImporting}
              className="import-preview-modal__close-btn"
              aria-label="Đóng"
            >
              <X className="import-preview-modal__close-icon" />
            </button>
          </div>

          {/* Tabs */}
          <div className="import-preview-modal__tabs">
            <button
              onClick={() => setActiveTab('valid')}
              className={`import-preview-modal__tab import-preview-modal__tab--valid ${
                activeTab === 'valid' ? 'import-preview-modal__tab--active' : ''
              }`}
            >
              <CheckCircle2 className="import-preview-modal__tab-icon" />
              Dữ liệu ({result.summary.valid})
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`import-preview-modal__tab import-preview-modal__tab--errors ${
                activeTab === 'errors' ? 'import-preview-modal__tab--active' : ''
              }`}
            >
              <AlertCircle className="import-preview-modal__tab-icon" />
              Lỗi ({result.summary.invalid})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="import-preview-modal__content">
          {activeTab === 'valid' ? (
            <OrdersTable orders={result.success} actions={actions} onSetAction={setAction} />
          ) : (
            <ErrorsTable errors={result.errors} />
          )}
        </div>

        {/* Footer */}
        <div className="import-preview-modal__footer">
          <button
            onClick={onCancel}
            disabled={isImporting}
            className="import-preview-modal__btn-cancel"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleConfirm}
            disabled={isImporting || willImportCount === 0}
            className="import-preview-modal__btn-confirm"
          >
            {isImporting ? (
              <>
                <Loader2 className="import-preview-modal__spinner" />
                Đang nhập...
              </>
            ) : (
              <>
                <CheckCircle2 className="import-preview-modal__confirm-icon" />
                Nhập {willImportCount} đơn hàng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== SUB-COMPONENTS ==========

const OrdersTable: React.FC<{
  orders: ParsedOrder[];
  actions: Record<number, ConflictAction>;
  onSetAction: (idx: number, action: ConflictAction) => void;
}> = ({ orders, actions, onSetAction }) => {
  if (orders.length === 0) {
    return (
      <div className="import-preview-modal__empty-state">
        <AlertCircle className="import-preview-modal__empty-state-icon" />
        <p>Không có đơn hàng hợp lệ nào</p>
      </div>
    );
  }

  return (
    <div className="import-preview-modal__table-container">
      <table className="import-preview-modal__table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Ngày</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((parsed, idx) => {
            const isDup = parsed.isDuplicate;
            const action = actions[idx] || 'skip';
            const willImport = !isDup || action === 'create_new';
            return (
              <tr
                key={idx}
                className={willImport ? undefined : 'import-preview-modal__row--skipped'}
              >
                <td className="import-preview-modal__cell--mono">{parsed.order.id.slice(0, 14)}</td>
                <td>
                  <span>{parsed.order.customerName}</span>
                  {parsed.isNewCustomer && (
                    <span className="import-preview-modal__badge--new-customer">
                      <UserPlus className="import-preview-modal__badge-icon" /> mới
                    </span>
                  )}
                </td>
                <td className="import-preview-modal__cell--muted">
                  {new Date(parsed.order.date).toLocaleDateString('vi-VN')}
                </td>
                <td className="import-preview-modal__cell--amount">
                  {parsed.order.totalAmount.toLocaleString('vi-VN')}đ
                </td>
                <td className="import-preview-modal__cell--center">
                  {isDup ? (
                    <select
                      value={action}
                      onChange={(e) => onSetAction(idx, e.target.value as ConflictAction)}
                      className="import-preview-modal__conflict-select"
                    >
                      <option value="skip">Bỏ qua (trùng)</option>
                      <option value="create_new">Tạo mới (ID khác)</option>
                    </select>
                  ) : (
                    <span className="import-preview-modal__status import-preview-modal__status--success">
                      <CheckCircle2 className="import-preview-modal__status-icon" /> Sẽ nhập
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const ErrorsTable: React.FC<{ errors: ImportError[] }> = ({ errors }) => {
  if (errors.length === 0) {
    return (
      <div className="import-preview-modal__empty-state import-preview-modal__empty-state--success">
        <CheckCircle2 className="import-preview-modal__empty-state-icon" />
        <p>Không có lỗi nào! Tất cả dữ liệu đều hợp lệ.</p>
      </div>
    );
  }

  return (
    <div className="import-preview-modal__table-container import-preview-modal__table-container--errors">
      <table className="import-preview-modal__table">
        <thead>
          <tr>
            <th>Dòng</th>
            <th>Lỗi</th>
            <th>Dữ liệu gốc</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((err, idx) => (
            <tr key={idx}>
              <td className="import-preview-modal__cell--mono import-preview-modal__cell--error-row">#{err.row}</td>
              <td className="import-preview-modal__cell--error-message">{err.error}</td>
              <td className="import-preview-modal__cell--mono import-preview-modal__cell--muted import-preview-modal__cell--truncate">
                {err.rawData ? JSON.stringify(err.rawData).slice(0, 100) + '...' : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
