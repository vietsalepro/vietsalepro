import React, { useEffect, useState } from 'react';
import { ChevronDown, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAccounts, AccountWithRole } from '../../services/admin/tenantAdminService';
import { Tenant } from '../../types/tenant';

export interface AccountSelectorProps {
  /** Currently selected account (optional controlled value) */
  currentAccount?: Tenant | null;
  /** Called when user selects an account */
  onSelect?: (account: Tenant) => void;
  /** Optional label for the trigger */
  label?: string;
}

export function AccountSelector({ currentAccount, onSelect, label }: AccountSelectorProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getUserAccounts(user.id)
      .then((data) => {
        if (cancelled) return;
        setAccounts(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Không thể tải danh sách tài khoản');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  const activeAccount = currentAccount || accounts[0]?.account;

  const handleSelect = (account: Tenant) => {
    setOpen(false);
    if (onSelect) {
      onSelect(account);
      return;
    }
    // ponytail: default behavior navigates to the account subdomain if we can derive the host.
    try {
      const host = window.location.host;
      const parts = host.split('.');
      if (parts.length >= 2) {
        const domain = parts.slice(-2).join('.');
        window.location.href = `${window.location.protocol}//${account.subdomain}.${domain}`;
      }
    } catch {
      // ignore navigation errors in non-browser environments
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500">
        <Building2 size={16} />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600" title={error}>
        <AlertCircle size={16} />
        <span>Lỗi tài khoản</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500">
        <Building2 size={16} />
        <span>Chưa có tài khoản</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {label && <span className="sr-only">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 size={16} className="text-gray-500 shrink-0" />
        <span className="font-medium text-gray-700 max-w-[160px] truncate">
          {activeAccount?.name || 'Chọn tài khoản'}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <ul role="listbox" aria-label="Chọn tài khoản">
            {accounts.map(({ account, role }) => (
              <li key={account.id} role="option" aria-selected={account.id === activeAccount?.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(account)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${
                    account.id === activeAccount?.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{account.name}</div>
                    <div className="text-xs text-gray-500 truncate">{account.subdomain}</div>
                  </div>
                  <span className="text-xs text-gray-400 capitalize whitespace-nowrap ml-2">{role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
