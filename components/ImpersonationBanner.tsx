import React, { useState } from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../contexts/AuthContext';
import { endImpersonation } from '../services/tenantService';
import { getAdminUrl } from '../lib/tenant';

export const ImpersonationBanner: React.FC = () => {
  const { tenant, isImpersonating } = useTenant();
  const { user } = useAuth();
  const [exiting, setExiting] = useState(false);

  if (!isImpersonating || !tenant) return null;

  const handleExit = async () => {
    if (exiting) return;
    setExiting(true);
    try {
      await endImpersonation();
    } catch (err) {
      // ponytail: vẫn redirect về admin để user thoát khỏi tenant view.
    }
    window.location.href = getAdminUrl();
  };

  return (
    <div className="bg-rose-50 border-b border-rose-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-rose-800 text-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="font-medium">
            Bạn đang đăng nhập với tư cách admin của tenant <strong>{tenant.name}</strong>
            {user?.email ? ` (${user.email})` : ''}. Đây là phiên impersonate.
          </span>
        </div>
        <button
          onClick={handleExit}
          disabled={exiting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg disabled:opacity-60 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          {exiting ? 'Đang thoát...' : 'Thoát impersonation'}
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
