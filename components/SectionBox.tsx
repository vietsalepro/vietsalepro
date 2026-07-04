/*
 * ═══════════════════════════════════════════════════════════════
 *  VIETSALE PRO — SectionBox Container Component
 *  ═══════════════════════════════════════════════════════════════
 *
 *  Sub-components:
 *    - SectionBox     → Card style container with border, radius, shadow
 *    - SectionHeader  → Title + optional subtitle + optional action slot
 *    - SectionContent → Content wrapper with standard padding
 *
 *  Design Standard: MASTER_SECTION_BOX_STANDARD_V1
 *  Feature Flag:    useNewSectionBox (in features.ts)
 *  ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import './SectionBox.css';

/* ── Types ───────────────────────────────────────── */
export interface SectionBoxProps {
  children: React.ReactNode;
  className?: string;
}

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export interface SectionContentProps {
  children: React.ReactNode;
  className?: string;
}

/* ── SectionBox ──────────────────────────────────── */
export const SectionBox: React.FC<SectionBoxProps> = ({
  children,
  className = '',
}) => {
  const classes = ['section-box', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

/* ── SectionHeader ───────────────────────────────── */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  const classes = ['section-header', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="section-header__top">
        <div className="section-header__title-group">
          <h3 className="section-header__title">{title}</h3>
          {subtitle && (
            <p className="section-header__subtitle">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="section-header__action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── SectionContent ──────────────────────────────── */
export const SectionContent: React.FC<SectionContentProps> = ({
  children,
  className = '',
}) => {
  const classes = ['section-content', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};