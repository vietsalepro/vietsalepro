import React from 'react';
import { Disposal } from '../../types';
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  Box,
  Calendar,
} from 'lucide-react';
import { useRefactoredDisposalDetailModal } from '../../features';
import { MasterModal } from '../MasterModal';
import { SectionBox, SectionHeader, SectionContent } from '../SectionBox';
import { ModalInfoGrid } from '../ModalInfoGrid';
import { ModalTable } from '../ModalTable';
import { StatusBadge } from '../StatusBadge';
import { ActionButton } from '../ActionButton';
import { SummaryRow } from '../SummaryRow';
import './DisposalDetailModal.css';

interface DisposalDetailModalProps {
  disposal: Disposal;
  products?: any[];
  onClose: () => void;
  onEdit: (disposal: Disposal) => void;
  onDelete: (disposalId: string, status: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 vsp-text-xxs vsp-font-semibold border border-amber-200">
          Lưu tạm
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 vsp-text-xxs vsp-font-semibold border border-emerald-200">
          Hoàn thành
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 vsp-text-xxs vsp-font-semibold border border-rose-200">
          Đã hủy
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full vsp-text-xs vsp-font-medium bg-slate-50 text-slate-700 border border-slate-100">
          {status}
        </span>
      );
  }
};

// SVG icon: Hộp hàng hủy (custom box icon)
const DisposalBoxIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#7C3AED"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
    <path d="M9 8l3 1.5L15 8" />
  </svg>
);

// SVG icon: Lịch nhỏ màu xám cho HSD
const CalendarGrayIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9CA3AF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const DisposalDetailModalLegacy: React.FC<DisposalDetailModalProps> = ({
  disposal,
  onClose,
  onEdit,
  onDelete,
  products,
}) => {
  return (
    <div className="flex flex-col flex-1">
      {/* ===== HEADER: Back + Title + Action Buttons (giống Import) ===== */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="vsp-font-bold vsp-text-lg text-slate-800">
          Chi tiết phiếu: {disposal.code}
        </h3>
        <div className="ml-auto flex gap-2">
          {disposal.status === 'DRAFT' && (
            <button
              onClick={() => onEdit(disposal)}
              className="btn-primary flex items-center gap-2 px-4 py-2"
            >
              <Edit className="w-4 h-4" /> Sửa
            </button>
          )}
          <button
            onClick={() => {
              onDelete(disposal.id, disposal.status);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 btn-danger"
          >
            <Trash2 className="w-4 h-4" /> Xoá
          </button>
        </div>
      </div>

      {/* ===== BODY: wrapped in white box ===== */}
      <div className="flex-1 p-6 overflow-hidden min-h-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full overflow-hidden min-h-0 flex flex-col md:flex-row gap-6">
        {/* ===== LEFT COLUMN (30%) ===== */}
        <div className="w-full md:w-[30%] md:flex-shrink-0 space-y-4 overflow-y-auto">
          {/* ----- BOX 1: Lý Do Hủy ----- */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="vsp-text-xs vsp-font-bold text-purple-600 uppercase mb-3 tracking-wider">
              Lý do hủy
            </p>
            <p className="vsp-text-sm vsp-font-medium text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-purple-600" />
              <span className="truncate">{disposal.reason || 'Không có'}</span>
            </p>
          </div>

          {/* ----- BOX 2: Thông tin Phiếu ----- */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <p className="vsp-text-xxs vsp-font-bold text-slate-400 uppercase tracking-wider">
              Thông tin phiếu
            </p>

            <div className="flex justify-between vsp-text-xs vsp-font-regular gap-2">
              <span className="text-slate-500 w-[72px] flex-shrink-0">Mã phiếu:</span>
              <span className="vsp-font-semibold text-slate-800 vsp-font-mono text-right">
                {disposal.code}
              </span>
            </div>

            <div className="flex justify-between vsp-text-xs vsp-font-regular gap-2">
              <span className="text-slate-500 w-[72px] flex-shrink-0">Ngày hủy:</span>
              <span className="vsp-font-semibold text-slate-800 text-right">
                {new Date(disposal.date).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <div className="flex justify-between vsp-text-xs vsp-font-regular items-center gap-2">
              <span className="text-slate-500 w-[72px] flex-shrink-0">Trạng thái:</span>
              <span>{getStatusBadge(disposal.status)}</span>
            </div>

            <div className="flex justify-between vsp-text-xs vsp-font-regular gap-2">
              <span className="text-slate-500 w-[72px] flex-shrink-0">Người tạo:</span>
              <span className="vsp-font-semibold text-slate-800 text-right">
                {disposal.createdBy || '—'}
              </span>
            </div>
          </div>

          {/* ----- BOX 3: Tóm tắt xuất hủy (gradient) ----- */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-xl p-5">
            <p className="vsp-text-xxs uppercase vsp-font-bold tracking-wider opacity-80 mb-4">
              Tóm tắt xuất hủy
            </p>

            <div className="space-y-3">
              <div className="flex justify-between vsp-text-base vsp-font-regular">
                <span className="opacity-90">Tổng số sản phẩm:</span>
                <span className="vsp-font-bold">{disposal.items?.length || 0}</span>
              </div>

              <div className="flex justify-between vsp-text-base vsp-font-regular">
                <span className="opacity-90">Tổng số lượng:</span>
                <span className="vsp-font-bold">
                  {disposal.totalQuantity?.toLocaleString('vi-VN') || 0}
                </span>
              </div>

              <div className="border-t border-white/30 my-2"></div>

              <div className="flex justify-between vsp-text-base vsp-font-regular items-center">
                <span className="opacity-90 vsp-font-bold">Tổng giá trị (vốn):</span>
                <span className="vsp-font-bold">
                  {disposal.totalValue?.toLocaleString('vi-VN') || 0} đ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN (70%): Product Table ===== */}
        <div className="w-full md:w-[70%] md:flex-1 flex flex-col overflow-hidden md:border-l md:border-slate-100 md:pl-6 min-h-0">
          <h4 className="vsp-text-base vsp-font-semibold text-slate-700 mb-3 flex items-center gap-2 flex-shrink-0">
            <Box className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <span>Sản phẩm được hủy ({disposal.items?.length || 0})</span>
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-left vsp-text-sm vsp-font-regular">
                <thead className="bg-slate-50 text-slate-500 vsp-font-semibold vsp-text-xs border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3 min-w-[140px]">Sản phẩm</th>
                    <th className="px-4 py-3 min-w-[100px]">Danh mục</th>
                    <th className="px-4 py-3 min-w-[100px]">Thương hiệu</th>
                    <th className="px-4 py-3 min-w-[120px]">Số lô / HSD</th>
                    <th className="px-4 py-3 text-center w-14">SL</th>
                    <th className="px-4 py-3 text-right min-w-[90px]">Giá vốn</th>
                    <th className="px-4 py-3 text-right min-w-[100px]">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(disposal.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 vsp-font-mono vsp-text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="vsp-font-semibold text-slate-800 vsp-text-sm">
                            {item.productName}
                          </span>
                          {item.productCode && (
                            <span className="vsp-text-xxs text-slate-400 vsp-font-mono mt-0.5">
                              {item.productCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 vsp-text-sm vsp-font-regular">
                          {item.categoryName || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 vsp-text-sm vsp-font-regular">
                          {item.brandName || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.lotCode ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 vsp-font-mono vsp-text-xxs vsp-font-bold border border-amber-200/50 w-max">
                              {item.lotCode}
                            </span>
                            {item.expiryDate && (
                              <span className="vsp-text-xxxs text-slate-400 flex items-center gap-1 mt-0.5">
                                <CalendarGrayIcon />
                                <span>HSD: {item.expiryDate}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 vsp-text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center vsp-font-semibold text-slate-800 vsp-font-mono vsp-text-sm">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right vsp-font-mono text-slate-600 vsp-text-sm pr-5">
                        {item.costPrice?.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3 text-right vsp-font-bold text-slate-800 vsp-font-mono vsp-text-sm pr-5">
                        {item.totalValue?.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

const getV2StatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <StatusBadge label="Lưu tạm" type="warning" size="md" />;
    case 'COMPLETED':
      return <StatusBadge label="Hoàn thành" type="success" size="md" />;
    case 'CANCELLED':
      return <StatusBadge label="Đã hủy" type="danger" size="md" />;
    default:
      return <StatusBadge label={status} type="default" size="md" />;
  }
};

const DisposalDetailModalV2: React.FC<DisposalDetailModalProps> = ({
  disposal,
  onClose,
  onEdit,
  onDelete,
}) => {
  const infoItems = [
    { label: 'Mã phiếu', value: disposal.code, mono: true },
    {
      label: 'Ngày hủy',
      value: new Date(disposal.date).toLocaleDateString('vi-VN'),
    },
    { label: 'Trạng thái', value: getV2StatusBadge(disposal.status) },
    { label: 'Người tạo', value: disposal.createdBy || '—' },
  ];

  const tableHeaders = [
    '#',
    'Sản phẩm',
    'Danh mục',
    'Thương hiệu',
    'Số lô / HSD',
    'SL',
    'Giá vốn',
    'Thành tiền',
  ];

  const tableAlign: ('left' | 'center' | 'right')[] = [
    'center',
    'left',
    'left',
    'left',
    'left',
    'center',
    'right',
    'right',
  ];

  const tableRows = (disposal.items || []).map((item, idx) => [
    <span key={`stt-${idx}`} className="disposal-detail-modal__index">
      {idx + 1}
    </span>,
    <div key={`name-${idx}`} className="disposal-detail-modal__product-cell">
      <span className="disposal-detail-modal__product-name">{item.productName}</span>
      {item.productCode && (
        <span className="disposal-detail-modal__product-code">{item.productCode}</span>
      )}
    </div>,
    <span key={`cat-${idx}`} className="disposal-detail-modal__cell-text">
      {item.categoryName || '—'}
    </span>,
    <span key={`brand-${idx}`} className="disposal-detail-modal__cell-text">
      {item.brandName || '—'}
    </span>,
    item.lotCode ? (
      <div key={`lot-${idx}`} className="disposal-detail-modal__lot-cell">
        <span className="disposal-detail-modal__lot-code">{item.lotCode}</span>
        {item.expiryDate && (
          <span className="disposal-detail-modal__lot-expiry">
            <Calendar className="disposal-detail-modal__lot-expiry-icon" />
            <span>HSD: {item.expiryDate}</span>
          </span>
        )}
      </div>
    ) : (
      <span key={`lot-${idx}`} className="disposal-detail-modal__cell-placeholder">
        —
      </span>
    ),
    <span key={`qty-${idx}`} className="disposal-detail-modal__quantity">
      {item.quantity}
    </span>,
    <span key={`cost-${idx}`} className="disposal-detail-modal__currency">
      {item.costPrice?.toLocaleString('vi-VN') ?? '—'} đ
    </span>,
    <span key={`total-${idx}`} className="disposal-detail-modal__currency-total">
      {item.totalValue?.toLocaleString('vi-VN') ?? '—'} đ
    </span>,
  ]);

  return (
    <MasterModal
      isOpen={true}
      onClose={onClose}
      size="lg"
      title={`Chi tiết phiếu: ${disposal.code}`}
      icon={<Box className="disposal-detail-modal__header-icon" />}
      accentColor="#dc2626"
      footer={
        <div className="disposal-detail-modal__footer">
          {disposal.status === 'DRAFT' && (
            <ActionButton
              variant="primary"
              icon={<Edit className="disposal-detail-modal__action-icon" />}
              onClick={() => onEdit(disposal)}
            >
              Sửa
            </ActionButton>
          )}
          <ActionButton
            variant="danger"
            icon={<Trash2 className="disposal-detail-modal__action-icon" />}
            onClick={() => {
              onDelete(disposal.id, disposal.status);
              onClose();
            }}
          >
            Xoá
          </ActionButton>
          <ActionButton variant="secondary" onClick={onClose}>
            Đóng
          </ActionButton>
        </div>
      }
    >
      <div className="disposal-detail-modal__layout">
        <div className="disposal-detail-modal__sidebar">
          <SectionBox className="disposal-detail-modal__reason">
            <SectionHeader title="Lý do hủy" />
            <SectionContent>
              <div className="disposal-detail-modal__reason-content">
                <AlertCircle className="disposal-detail-modal__reason-icon" />
                <span className="disposal-detail-modal__reason-text">
                  {disposal.reason || 'Không có'}
                </span>
              </div>
            </SectionContent>
          </SectionBox>

          <SectionBox>
            <SectionHeader title="Thông tin phiếu" />
            <SectionContent>
              <ModalInfoGrid items={infoItems} />
            </SectionContent>
          </SectionBox>

          <SectionBox>
            <SectionHeader title="Tóm tắt xuất hủy" />
            <SectionContent>
              <SummaryRow
                label="Tổng số sản phẩm"
                value={(disposal.items?.length || 0).toLocaleString('vi-VN')}
              />
              <SummaryRow
                label="Tổng số lượng"
                value={(disposal.totalQuantity || 0).toLocaleString('vi-VN')}
              />
              <SummaryRow
                label="Tổng giá trị (vốn)"
                value={`${(disposal.totalValue || 0).toLocaleString('vi-VN')} đ`}
                bold
              />
            </SectionContent>
          </SectionBox>
        </div>

        <div className="disposal-detail-modal__main">
          <SectionBox className="disposal-detail-modal__table-section">
            <SectionHeader
              title={`Sản phẩm được hủy (${disposal.items?.length || 0})`}
            />
            <SectionContent>
              <div className="disposal-detail-modal__table-scroll">
                <ModalTable
                  headers={tableHeaders}
                  rows={tableRows}
                  align={tableAlign}
                  empty="Không có sản phẩm nào"
                />
              </div>
            </SectionContent>
          </SectionBox>
        </div>
      </div>
    </MasterModal>
  );
};

export const DisposalDetailModal: React.FC<DisposalDetailModalProps> = (
  props
) => {
  if (!useRefactoredDisposalDetailModal) {
    return <DisposalDetailModalLegacy {...props} />;
  }
  return <DisposalDetailModalV2 {...props} />;
};
