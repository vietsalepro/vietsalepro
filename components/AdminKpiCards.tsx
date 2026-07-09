import React from 'react';
import type { LucideIcon } from 'lucide-react';
import './AdminKpiCards.css';

/* ─── Types ─────────────────────────────────────────── */
export interface KpiCardData {
  label: string;
  value: string | number;
  trend?: number;          // percent change, e.g. +12
  trendLabel?: string;     // "so với tháng trước"
  icon: LucideIcon;
  color?: string;          // CSS variable name, default --color-primary-500
}

interface AdminKpiCardsProps {
  cards: KpiCardData[];
}

/* ─── Arrow icon cho trend ─────────────────────────── */
const TrendArrow: React.FC<{ direction: 'up' | 'down' }> = ({ direction }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {direction === 'up' ? (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ) : (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </>
    )}
  </svg>
);

/* ─── Component ─────────────────────────────────────── */
export const AdminKpiCards: React.FC<AdminKpiCardsProps> = ({ cards }) => {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="admin-kpi-cards" role="region" aria-label="Key performance indicators">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        const trendUp = card.trend != null && card.trend > 0;
        const trendDown = card.trend != null && card.trend < 0;
        const trendColor = card.color || 'var(--color-primary-500)';

        return (
          <div
            key={index}
            className="admin-kpi-card"
            style={{ '--kpi-accent': trendColor } as React.CSSProperties}
          >
            <div className="admin-kpi-card__header">
              <div className="admin-kpi-card__icon">
                <IconComponent size={22} />
              </div>
              {card.trend != null && (
                <span
                  className={`admin-kpi-card__trend ${
                    trendUp
                      ? 'admin-kpi-card__trend--up'
                      : trendDown
                      ? 'admin-kpi-card__trend--down'
                      : 'admin-kpi-card__trend--neutral'
                  }`}
                >
                  <TrendArrow direction={trendUp ? 'up' : trendDown ? 'down' : 'up'} />
                  {Math.abs(card.trend)}%
                </span>
              )}
            </div>
            <div className="admin-kpi-card__value">{card.value}</div>
            <div className="admin-kpi-card__label">{card.label}</div>
            {card.trendLabel && (
              <div className="admin-kpi-card__trend-label">{card.trendLabel}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminKpiCards;