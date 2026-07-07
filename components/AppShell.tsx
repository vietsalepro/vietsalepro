import React, { useState } from 'react';
import { AppTopbar } from './AppTopbar';
import { ReadOnlyBanner } from './ReadOnlyBanner';
import { ImpersonationBanner } from './ImpersonationBanner';
import './AppShell.css';

export interface AppShellProps {
  children: React.ReactNode;
  isLocked?: boolean;
  isPosView?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, isLocked, isPosView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <AppTopbar isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} isLocked={isLocked} />
      <ReadOnlyBanner />
      <ImpersonationBanner />
      <main className={`app-shell__content ${isPosView ? 'app-shell__content--pos' : ''}`}>
        {children}
      </main>
    </div>
  );
};
