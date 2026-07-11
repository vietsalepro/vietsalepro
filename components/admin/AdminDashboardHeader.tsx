import React from 'react';
import { AccountSelector } from './AccountSelector';
import { UserAccountButton } from './UserAccountButton';
import AdminNotificationBell from '../AdminNotificationBell';

export interface AdminDashboardHeaderProps {
  /** Page title shown in the header */
  title: string;
  /** Optional page description */
  description?: string;
  /** Currently selected account name passed to the user button */
  currentAccountName?: string;
}

export function AdminDashboardHeader({ title, description, currentAccountName }: AdminDashboardHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-gray-900 truncate">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <AdminNotificationBell />
        <AccountSelector />
        <UserAccountButton currentAccountName={currentAccountName} />
      </div>
    </header>
  );
}
