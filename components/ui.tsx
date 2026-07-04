/** * VIETSALE PRO - UI Component Library * Shoply-inspired Design (Purple Theme) */
import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, X, Loader2, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// ============================================
// SPRINT_32 — LEGACY ui.tsx MIGRATION MAP
// ============================================
//
// Source of Truth: UI_MIGRATION_MASTER_ROADMAP.md (SPRINT_32)
//
// | Legacy Export | New Standard Component | Status            | Migration Path / Notes |
// |---------------|------------------------|-------------------|------------------------|
// | Card          | SectionBox             | manual-cleanup    | Generic container; replace with SectionBox or page-specific layout. |
// | StatCard      | —                      | legacy            | No direct replacement; build dashboard KPI widgets with SectionBox + MASTER_DASHBOARD_STANDARD_V1. |
// | Button        | ActionButton           | direct-replacement| Map primary/success/danger/warning to ActionButton variants; ghost/outline to Ghost/Secondary. |
// | Toast         | NotificationSystem     | direct-replacement| Single toast message → NotificationSystem toast item. |
// | ToastContainer| NotificationSystem     | direct-replacement| Use NotificationSystem container for stacking + auto-dismiss. |
// | Skeleton      | —                      | legacy            | No direct replacement; manual cleanup per page. |
// | EmptyState    | EmptyState             | direct-replacement| Same props (icon, title, description, action). |
// | Badge         | StatusBadge            | direct-replacement| Map success/warning/danger/info/purple; default/neutral/indigo require manual color mapping. |
// | LoadingSpinner| LoadingState           | manual-cleanup    | LoadingState is a full state block; inline spinner usage needs local CSS replacement. |
// | SuccessAnimation| —                    | legacy            | No direct replacement; keep as-is or replace with future illustration component. |
// | PulseDot      | —                      | legacy            | No direct replacement; replace with StatusBadge dot variant if applicable. |
// | Input         | TextInput              | direct-replacement| Same core props; wrap with FormField for label/error layout. |
// | Select        | SelectInput            | direct-replacement| Same core props; wrap with FormField for label/error layout. |
//
// ============================================
// CARD COMPONENTS - Shoply Style
// ============================================

/**
 * @deprecated Use SectionBox from components/SectionBox.tsx for standard card containers.
 *             See SPRINT_32 migration map for page-specific layout guidance.
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'gradient' | 'glass' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hoverable?: boolean;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  hoverable = false,
  animate = true
}) => {
  const paddingClasses: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };

  const variantClasses: Record<string, string> = {
    default: 'bg-white rounded-lg border border-gray-200 shadow-sm',
    elevated: 'bg-white rounded-lg border border-gray-200/60 shadow-lg',
    gradient: 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white rounded-lg shadow-xl shadow-purple-200/50',
    glass: 'bg-white/80 backdrop-blur-md rounded-lg border border-white/50 shadow-sm',
    interactive: 'bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:border-purple-200 hover:-translate-y-1 transition-all duration-200'
  };

  return (
    <div
      className={`${variantClasses[variant] || ''} ${paddingClasses[padding] || ''} ${
        hoverable ? 'hover:shadow-md hover:border-purple-500 hover:-translate-y-1 transition-all duration-200' : ''
      } ${animate ? 'animate-fade-in' : ''} ${onClick ? 'cursor-pointer' : ''} transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// ============================================
// STAT CARD COMPONENT - Shoply Style
// ============================================

/**
 * @deprecated No direct replacement. Build dashboard KPI widgets with SectionBox +
 *             MASTER_DASHBOARD_STANDARD_V1.
 */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  onClick,
  className = ''
}) => {
  const variantStyles: Record<string, any> = {
    default: {
      bg: 'bg-gradient-to-br from-white to-gray-50/50',
      iconBg: 'bg-gradient-to-br from-gray-500 to-gray-700',
      iconShadow: 'shadow-gray-200/50',
      valueColor: 'text-gray-900'
    },
    primary: {
      bg: 'bg-gradient-to-br from-white to-purple-50/50',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-700',
      iconShadow: 'shadow-purple-200/50',
      valueColor: 'text-purple-900'
    },
    success: {
      bg: 'bg-gradient-to-br from-white to-emerald-50/50',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      iconShadow: 'shadow-emerald-200/50',
      valueColor: 'text-emerald-900'
    },
    warning: {
      bg: 'bg-gradient-to-br from-white to-amber-50/50',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      iconShadow: 'shadow-amber-200/50',
      valueColor: 'text-amber-900'
    },
    danger: {
      bg: 'bg-gradient-to-br from-white to-red-50/50',
      iconBg: 'bg-gradient-to-br from-red-500 to-red-700',
      iconShadow: 'shadow-red-200/50',
      valueColor: 'text-red-900'
    }
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`stat-card min-w-0 p-4 sm:p-5 ${style.bg} border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group cursor-default ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        {icon && (
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${style.iconBg} flex items-center justify-center shadow-lg ${
              style.iconShadow
            } group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0`}
          >
            {icon}
          </div>
        )}
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full vsp-text-xs vsp-font-bold shrink-0 ${
              trend === 'up'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : trend === 'down'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-gray-50 border border-gray-200 text-gray-600'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="vsp-text-xs vsp-font-semibold text-gray-400 uppercase tracking-wider mb-1 truncate">{title}</p>
      <p className={`vsp-text-lg lg:vsp-text-2xl vsp-font-bold ${style.valueColor} tracking-tight break-words leading-tight`}>{value}</p>
      {subtitle && <p className="vsp-text-xs text-gray-400 mt-2 vsp-font-medium truncate">{subtitle}</p>}
    </div>
  );
};


// ============================================
// ANIMATED BUTTON COMPONENT - Shoply Style
// ============================================

/**
 * @deprecated Use ActionButton from components/ActionButton.tsx (PrimaryButton, SecondaryButton,
 *             DangerButton, GhostButton).
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  ripple?: boolean;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ripple = true,
  onClick,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }
    onClick?.(e);
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 vsp-text-xs rounded-md',
    md: 'px-4 py-2 rounded-lg vsp-text-sm',
    lg: 'px-6 py-2.5 rounded-lg vsp-text-base'
  };

  const variantClasses: Record<string, string> = {
    primary:
      'bg-gradient-to-br from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-200/60 focus-visible:ring-2 focus-visible:ring-purple-500',
    success:
      'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-200/60 focus-visible:ring-2 focus-visible:ring-emerald-500',
    danger:
      'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-200/60 focus-visible:ring-2 focus-visible:ring-red-500',
    warning:
      'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-200/60 focus-visible:ring-2 focus-visible:ring-amber-500',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-400',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-500 hover:text-purple-700 focus-visible:ring-2 focus-visible:ring-purple-400'
  };

  return (
    <button
      ref={buttonRef}
      className={`btn ${variantClasses[variant] || ''} ${sizeClasses[size] || ''} inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.96] relative overflow-hidden ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{ left: ripple.x - 50, top: ripple.y - 50, width: 100, height: 100 }}
        />
      ))}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
};

// ============================================
// TOAST NOTIFICATION COMPONENT - Shoply Style
// ============================================

/**
 * @deprecated Use NotificationSystem from components/NotificationSystem.tsx for toast messages.
 */
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles: Record<string, string> = {
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-200/50',
    error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200/50',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-200/50',
    info: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-purple-200/50'
  };

  const icons: Record<string, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  return (
    <div className={`px-5 py-3 rounded-xl shadow-xl vsp-text-sm vsp-font-semibold flex items-center gap-3 animate-toast-in ${typeStyles[type] || ''}`}>
      {icons[type] || null}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-0.5 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
/**
 * @deprecated Use NotificationSystem from components/NotificationSystem.tsx for toast stacking and
 *             auto-dismiss.
 */
interface ToastContainerProps {
  children?: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5">{children}</div>
);

// ============================================
// SKELETON LOADING COMPONENT
// ============================================

/**
 * @deprecated No direct replacement. Manual cleanup required per page.
 */
interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ variant = 'rect', width, height, className = '' }) => {
  const variantClasses: Record<string, string> = {
    text: 'rounded h-4',
    circle: 'rounded-full',
    rect: 'rounded-lg'
  };

  return (
    <div
      className={`skeleton bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 ${
        variantClasses[variant] || ''
      } ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  );
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

/**
 * @deprecated Use EmptyState from components/EmptyState.tsx.
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
    {icon && (
      <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5 text-gray-400">
        {icon}
      </div>
    )}
    <h3 className="vsp-text-lg vsp-font-bold text-gray-900 mb-1">{title}</h3>
    {description && <p className="vsp-text-sm vsp-font-regular text-gray-500 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ============================================
// BADGE COMPONENT - Shoply Style
// ============================================

/**
 * @deprecated Use StatusBadge from components/StatusBadge.tsx.
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'indigo';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md', dot = false, className = '' }) => {
  const variantStyles: Record<string, string> = {
    default: 'bg-gray-100 text-gray-600 border-gray-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };

  const dotColors: Record<string, string> = {
    default: 'bg-gray-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full vsp-text-xs vsp-font-semibold tracking-wide border ${
        variantStyles[variant] || ''
      } ${size === 'sm' ? 'vsp-text-xs px-2 py-0.5' : ''} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColors[variant] || ''
          } animate-pulse-soft`}
        />
      )}
      {children}
    </span>
  );
};

// ============================================
// LOADING SPINNER
// ============================================

/**
 * @deprecated Use LoadingState from components/LoadingState.tsx for full-state blocks, or a local
 *             CSS spinner for inline usage.
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses: Record<string, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return <Loader2 className={`${sizeClasses[size] || ''} animate-spin text-purple-600 ${className}`} />;
};

// ============================================
// SUCCESS ANIMATION
// ============================================

/**
 * @deprecated No direct replacement. Keep as-is or replace with a future illustration component.
 */
interface SuccessAnimationProps {
  size?: number;
  className?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ size = 80, className = '' }) => (
  <div className={`relative ${className}`} style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="4" opacity="0.2" />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#10b981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="283"
        strokeDashoffset="283"
        className="animate-draw-circle"
      />
      <path
        d="M30 50 L45 65 L70 35"
        fill="none"
        stroke="#10b981"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="60"
        strokeDashoffset="60"
        className="animate-draw-check"
      />
    </svg>
  </div>
);

// ============================================
// PULSE DOT
// ============================================

/**
 * @deprecated No direct replacement. Use StatusBadge dot variant if applicable.
 */
interface PulseDotProps {
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const PulseDot: React.FC<PulseDotProps> = ({ color = 'primary', className = '' }) => {
  const colors: Record<string, string> = {
    primary: 'bg-purple-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500'
  };

  return (
    <span className={`relative flex h-3 w-3 ${className}`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color] || ''} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[color] || ''}`} />
    </span>
  );
};

// ============================================
// INPUT COMPONENT - Shoply Style
// ============================================

/**
 * @deprecated Use TextInput from components/TextInput.tsx.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'success' | 'error';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ variant = 'default', leftIcon, rightIcon, className = '', ...props }) => {
  const variantClasses: Record<string, string> = {
    default: 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10',
    success: 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10',
    error: 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 animate-shake'
  };

  return (
    <div className={`relative ${className}`}>
      {leftIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>
      )}
      <input
        className={`w-full px-3.5 py-2.5 bg-white rounded-lg vsp-text-sm vsp-font-regular text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 ${
          variantClasses[variant] || ''
        } ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>
      )}
    </div>
  );
};

// ============================================
// SELECT COMPONENT - Shoply Style
// ============================================

/**
 * @deprecated Use SelectInput from components/SelectInput.tsx.
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'success' | 'error';
  leftIcon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ variant = 'default', leftIcon, className = '', children, ...props }) => {
  const variantClasses: Record<string, string> = {
    default: 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10',
    success: 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10',
    error: 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 animate-shake'
  };

  return (
    <div className={`relative ${className}`}>
      {leftIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {leftIcon}
        </div>
      )}
      <select
        className={`w-full px-3.5 py-2.5 bg-white rounded-lg vsp-text-sm vsp-font-regular text-gray-800 outline-none transition-all duration-200 hover:border-gray-300 ${
          variantClasses[variant] || ''
        } ${leftIcon ? 'pl-10' : ''} appearance-none bg-no-repeat bg-right-3.5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgNkwyIDEwSDYiIGZpbGw9IiM4M0MzQ0MiLz4KPC9zdmc+')]`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};