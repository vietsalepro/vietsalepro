import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Users, Truck, ArrowDownToLine,
  FileText, Receipt, RotateCcw, TrendingUp, ShoppingCart,
  Settings as SettingsIcon, X, Check, ClipboardList
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../hooks/useTenant';
import './FeaturePicker.css';

export interface FeatureItem {
  path: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
}

// All available features in the system
export const ALL_FEATURES: FeatureItem[] = [
  { path: '/tong-quan', label: 'Tổng quan', icon: LayoutDashboard, gradient: 'linear-gradient(135deg, #818CF8, #6366F1)' },
  { path: '/pos', label: 'Bán hàng', icon: ShoppingCart, gradient: 'linear-gradient(135deg, #A78BFA, #8B5CF6)' },
  { path: '/products', label: 'Hàng hoá', icon: Package, gradient: 'linear-gradient(135deg, #60A5FA, #3B82F6)' },
  { path: '/customers', label: 'Khách hàng', icon: Users, gradient: 'linear-gradient(135deg, #34D399, #10B981)' },
  { path: '/suppliers', label: 'Nhà cung cấp', icon: Truck, gradient: 'linear-gradient(135deg, #2DD4BF, #14B8A6)' },
  { path: '/orders', label: 'Đơn hàng', icon: FileText, gradient: 'linear-gradient(135deg, #FB923C, #F97316)' },
  { path: '/import', label: 'Nhập hàng', icon: ArrowDownToLine, gradient: 'linear-gradient(135deg, #22D3EE, #06B6D4)' },
  { path: '/inventory-count', label: 'Kiểm kê', icon: ClipboardList, gradient: 'linear-gradient(135deg, #C084FC, #8B5CF6)' },
  { path: '/tax', label: 'Tính thuế', icon: Receipt, gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)' },
  { path: '/return-orders', label: 'Trả hàng', icon: RotateCcw, gradient: 'linear-gradient(135deg, #F87171, #EF4444)' },
  { path: '/reports', label: 'Báo cáo', icon: TrendingUp, gradient: 'linear-gradient(135deg, #F472B6, #EC4899)' },
  { path: '/settings', label: 'Cài đặt', icon: SettingsIcon, gradient: 'linear-gradient(135deg, #94A3B8, #64748B)' },
  { path: '/members', label: 'Quản lý thành viên', icon: Users, gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
];

// Core features that cannot be removed from the home screen (always locked)
export const LOCKED_FEATURES: string[] = ['/pos', '/tong-quan'];

interface FeaturePickerProps {
  visible: boolean;
  onClose: () => void;
  currentFeatures: string[]; // paths currently on home
  onToggleFeature: (path: string) => void;
}

export function FeaturePicker({ visible, onClose, currentFeatures, onToggleFeature }: FeaturePickerProps) {
  const permissions = usePermissions();
  const { tenant } = useTenant();
  const canAccessMembers = permissions.canManageUsers && tenant?.plan === 'vip';
  const availableFeatures = ALL_FEATURES.filter(f => f.path !== '/members' || canAccessMembers);
  const selectedCount = currentFeatures.length;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">
                Thêm tính năng vào màn hình chính
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 active:scale-90 transition-all"
                aria-label="Đóng"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-3 gap-3">
                {availableFeatures.map((feature) => {
                  const Icon = feature.icon;
                  const isAdded = currentFeatures.includes(feature.path);
                  const isLocked = LOCKED_FEATURES.includes(feature.path);

                  return (
                    <motion.button
                      key={feature.path}
                      type="button"
                      disabled={isLocked}
                      whileTap={isLocked ? undefined : { scale: 0.9 }}
                      onClick={() => {
                        if (!isLocked) onToggleFeature(feature.path);
                      }}
                      className={
                        'relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ' +
                        (isLocked
                          ? 'bg-purple-50 border-purple-100 cursor-default opacity-60'
                          : isAdded
                            ? 'bg-purple-50 border-purple-200 shadow-sm'
                            : 'bg-white border-slate-100 shadow-sm hover:shadow-md')
                      }
                    >
                      <div
                        className="feature-picker__icon"
                        style={{ '--feature-gradient': feature.gradient } as React.CSSProperties}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2.3} />
                      </div>
                      <span
                        className={
                          'text-xs leading-tight text-center ' +
                          (isAdded ? 'font-bold text-slate-800' : 'font-semibold text-slate-600')
                        }
                      >
                        {feature.label}
                      </span>

                      {/* Tick badge */}
                      {(isAdded || isLocked) && (
                        <div
                          className={
                            'absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center ' +
                            (isLocked ? 'bg-slate-400' : 'bg-emerald-500')
                          }
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer button */}
            <div className="px-5 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-purple-200/50 active:scale-[0.98] transition-transform"
              >
                Xong ({selectedCount} tính năng)
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default FeaturePicker;
