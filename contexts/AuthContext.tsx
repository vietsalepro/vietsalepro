import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { writeAuditLog } from '../services/auditService';
import { recordAdminLogin } from '../services/loginHistoryService';
import { isMfaRequired } from '../services/twoFactorService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  mfaPending: boolean;
  setMfaPending: (pending: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // ponytail: nếu session tồn tại nhưng chưa đạt AAL2, giữ user ở trạng thái chờ MFA.
      if (session?.user) {
        try {
          const { required } = await isMfaRequired();
          if (required) setMfaPending(true);
        } catch {
          // Bỏ qua lỗi MFA check; để app tự xử lý khi cần.
        }
      }

      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      // IMPORTANT: Keep the same `user` object reference when the logged-in
      // user hasn't actually changed. Supabase fires this callback on events
      // like TOKEN_REFRESHED / SIGNED_IN whenever the browser tab regains
      // focus. If we always create a new user object, every component that
      // depends on `user` (e.g. the data-fetching effect in App.tsx) will
      // re-run and reload the whole app, wiping out unsaved work.
      setUser(prevUser => {
        const nextUser = newSession?.user ?? null;
        if (prevUser?.id === nextUser?.id) {
          return prevUser;
        }
        return nextUser;
      });

      if (newSession?.user) {
        try {
          const { required } = await isMfaRequired();
          if (required) setMfaPending(true);
        } catch {
          // Bỏ qua; MFA challenge sẽ được xử lý khi app yêu cầu.
        }
      }

      // Ghi audit log LOGIN khi đăng nhập thành công (bỏ qua INITIAL_SESSION khi reload).
      if (event === 'SIGNED_IN' && newSession?.user) {
        writeAuditLog('LOGIN', 'auth', {
          recordId: newSession.user.id,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        }).catch(() => {});
        recordAdminLogin({
          userId: newSession.user.id,
          email: newSession.user.email,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          status: 'success',
        }).catch(() => {});
      }
      setLoading(false);
    });


    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await writeAuditLog('LOGOUT', 'auth', {
        recordId: user?.id ?? null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
    } catch (err) {

    }
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    signOut,
    loading,
    mfaPending,
    setMfaPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
