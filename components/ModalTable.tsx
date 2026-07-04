/**
 * VIETSALE PRO — ModalTable Component
 * ==========================================
 * Data table for modal content with headers and rows.
 * Extracted from MasterModal — backward compatible.
 *
 * V1: Tailwind classes
 * V2: uses CSS classes via MasterModal.css
 */

import React from 'react';

export interface ModalTableProps {
  headers: string[];
  rows:    React.ReactNode[][];
  align?:  ('left' | 'center' | 'right')[];
  empty?:  string;
}

export const ModalTable: React.FC<ModalTableProps> = ({
  headers,
  rows,
  align,
  empty = 'Không có dữ liệu',
}) => (
  <div className="modal-table-wrapper">
    <table className="modal-table">
      <thead>
        <tr className="modal-table-header-row">
          {headers.map((h, i) => (
            <th
              key={i}
              className={`modal-table-th modal-table-align-${align?.[i] ?? 'left'}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="modal-table-body">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="modal-table-empty">
              {empty}
            </td>
          </tr>
        ) : (
          rows.map((row, ri) => (
            <tr key={ri} className="modal-table-row">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`modal-table-cell modal-table-align-${align?.[ci] ?? 'left'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default ModalTable;