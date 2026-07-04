import React from 'react';
import './StatsRow.css';

export type StatsColorScheme = 'purple' | 'blue' | 'orange' | 'red' | 'green' | 'cyan';

export interface StatItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  colorScheme: StatsColorScheme;
}

interface StatsRowProps {
  stats: StatItem[];
  className?: string;
}

const StatsRow: React.FC<StatsRowProps> = ({ stats, className = '' }) => (
  <div className={`stats-row${className ? ' ' + className : ''}`}>
    {stats.map((stat, i) => (
      <div key={i} className="stats-card">
        <div className={`stats-card__icon stats-card__icon--${stat.colorScheme}`}>
          {stat.icon}
        </div>
        <div className="stats-card__body">
          <p className="stats-card__label">{stat.label}</p>
          <p className="stats-card__value">{stat.value}</p>
          {stat.subtext && <p className="stats-card__subtext">{stat.subtext}</p>}
        </div>
        <svg
          className={`stats-card__sparkline stats-card__sparkline--${stat.colorScheme}`}
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,25 Q15,15 30,20 T60,10 T90,18 T100,5 L100,30 L0,30 Z" fill="currentColor" />
        </svg>
      </div>
    ))}
  </div>
);

export default StatsRow;
