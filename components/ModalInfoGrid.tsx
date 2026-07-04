/**
 * VIETSALE PRO — ModalInfoGrid Component
 * ==========================================
 * 2-column grid layout for label/value pairs.
 * Extracted from MasterModal — backward compatible.
 *
 * V1: Tailwind classes
 * V2: uses CSS classes via MasterModal.css
 */

import React from 'react';

export interface ModalInfoGridItem {
  label: string;
  value: React.ReactNode;
  span?: boolean;
  mono?: boolean;
}

export interface ModalInfoGridProps {
  items: ModalInfoGridItem[];
}

export const ModalInfoGrid: React.FC<ModalInfoGridProps> = ({ items }) => (
  <dl className="modal-info-grid">
    {items.map((item, i) => (
      <div key={i} className={item.span ? 'modal-info-grid-span' : ''}>
        <dt className="modal-info-grid-label">{item.label}</dt>
        <dd className={`modal-info-grid-value${item.mono ? ' modal-info-grid-mono' : ''}`}>
          {item.value ?? <span className="modal-info-grid-placeholder">&mdash;</span>}
        </dd>
      </div>
    ))}
  </dl>
);

export default ModalInfoGrid;