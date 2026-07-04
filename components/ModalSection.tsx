/**
 * VIETSALE PRO — ModalSection Component
 * ==========================================
 * Section box with title for modal content.
 * Extracted from MasterModal — backward compatible.
 *
 * V1: accent = Tailwind classes (e.g. 'bg-slate-50 border-slate-200')
 * V2: uses CSS classes via MasterModal.css
 */

import React from 'react';

export interface ModalSectionProps {
  title:    string;
  icon?:    React.ReactNode;
  accent?:  string;
  children: React.ReactNode;
}

export const ModalSection: React.FC<ModalSectionProps> = ({
  title,
  icon,
  accent,
  children,
}) => {
  const accentClass = accent ?? '';

  return (
    <section className={`modal-section${accentClass ? ` ${accentClass}` : ''}`}>
      <p className="modal-section-title">
        {icon && <span className="modal-section-icon">{icon}</span>}
        {title}
      </p>
      {children}
    </section>
  );
};

export default ModalSection;