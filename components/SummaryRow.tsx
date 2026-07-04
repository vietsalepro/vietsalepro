/**
 * VIETSALE PRO — SummaryRow Component
 * ==========================================
 * Summary row for displaying key-value pairs.
 * Extracted from MasterModal — backward compatible.
 *
 * V1: accent = Tailwind class (e.g. 'text-slate-800')
 * V2: uses CSS classes via MasterModal.css
 */

import React from 'react';
import './SummaryRow.css';

export interface SummaryRowProps {
  label:   string;
  value:   string;
  bold?:   boolean;
  accent?: string;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  value,
  bold = false,
  accent = 'text-slate-800',
}) => (
  <div className={`summary-row${bold ? ' summary-row-bold' : ''}`}>
    <span className={`summary-row-label${bold ? ' summary-row-label-bold' : ''}`}>
      {label}
    </span>
    <span className={`summary-row-value${accent ? ` ${accent}` : ''}`}>
      {value}
    </span>
  </div>
);

export default SummaryRow;