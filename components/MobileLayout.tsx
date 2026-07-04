import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Package, Users, Truck, ArrowDownToLine, FileText,
  BarChart3, Settings, X, Receipt, Sparkles, ChevronRight,
  ClipboardList
} from 'lucide-react';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { section: 'Quản lý', items: [
      { path: '/products', label: 'Hàng hoá', icon: Package, color: 'bg-blue-100 text-blue-600' },
      { path: '/customers', label: 'Khách hàng', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
      { path: '/suppliers', label: 'Nhà cung cấp', icon: Truck, color: 'bg-cyan-100 text-cyan-600' },
    ]},
    { section: 'Giao dịch', items: [
      { path: '/import', label: 'Nhập hàng', icon: ArrowDownToLine, color: 'bg-indigo-100 text-indigo-600' },
      { path: '/orders', label: 'Đơn hàng', icon: FileText, color: 'bg-orange-100 text-orange-600' },
      { path: '/inventory-count', label: 'Kiểm kê', icon: ClipboardList, color: 'bg-purple-100 text-purple-600' },
    ]},
    { section: 'Báo cáo', items: [
      { path: '/reports', label: 'Báo cáo', icon: BarChart3, color: 'bg-pink-100 text-pink-600' },
      { path: '/tax', label: 'Thuế', icon: Receipt, color: 'bg-amber-100 text-amber-600' },
    ]},
  ];

  return (
    <div className="m-bg min-h-screen md:pb-0">
      {/* Main content — pages render their own top bar; this layout only provides drawer */}
      <div className="max-w-4xl mx-auto md:px-4 md:py-4">
        {children}
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Side drawer */}
      <aside
        className={
          'm-drawer fixed top-0 left-0 bottom-0 z-50 w-[82%] max-w-[320px] transform transition-transform duration-300 ' +
          (isMenuOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex flex-col h-full">
          {/* Drawer header — gradient avatar block */}
          <div className="relative p-5 pb-6 pt-[calc(1.25rem+env(safe-area-inset-top))]">
            <div
              className="absolute inset-x-0 top-0 h-32 -z-0 opacity-100 m-drawer-header-bg"
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="m-avatar w-12 h-12 text-base">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Việt Sale</p>
                  <p className="text-base font-bold text-slate-800 leading-tight">Cửa hàng</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl bg-white/70 backdrop-blur text-slate-500 active:scale-90 transition-transform"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Menu groups */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 no-scrollbar">
            {menuItems.map((group, gi) => (
              <div key={gi}>
                <p className="m-section-title px-1">{group.section}</p>
                <div className="space-y-1.5">
                  {group.items.map(item => {
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={
                          'flex items-center gap-3 p-2.5 rounded-2xl transition-all active:scale-[0.98] ' +
                          (isActive
                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50 ring-1 ring-purple-200/60'
                            : 'hover:bg-slate-50')
                        }
                      >
                        <div className={'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ' + item.color}>
                          <Icon className="w-4 h-4" strokeWidth={2.4} />
                        </div>
                        <span className={'flex-1 text-sm ' + (isActive ? 'font-bold text-purple-700' : 'font-medium text-slate-700')}>
                          {item.label}
                        </span>
                        <ChevronRight className={'w-4 h-4 ' + (isActive ? 'text-purple-500' : 'text-slate-300')} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Link
              to="/settings"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Settings className="w-4 h-4" strokeWidth={2.4} />
              </div>
              <span className="text-sm font-medium text-slate-700">Cài đặt</span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default MobileLayout;
