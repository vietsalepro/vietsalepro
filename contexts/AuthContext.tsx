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

  // ponytail: kiểm tra MFA không được chặn render; nếu MFA check chậm/hang, app vẫn hiện
  // ngay thay vì màn trắng, sau đó chuyển sang MFA challenge nếu cần.
  const checkMfaAsync = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setMfaPending(false);
      return;
    }
    try {
      const { required } = await isMfaRequired();
      if (required) setMfaPending(true);
    } catch {
      // Bỏ qua lỗi MFA check; để app tự xử lý khi cần.
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        checkMfaAsync(currentSession);
      } catch {
        // ponytail: nếu getSession() lỗi (VD: cấu hình Supabase sai), vẫn thoát loading
        // để app render chứ không để màn hình trắng vĩnh viễn.
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeSession();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
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

      checkMfaAsync(newSession);

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
        Promise.resolve(
          supabase.rpc('activate_pending_memberships', { p_user_id: newSession.user.id })
        ).catch(() => {});
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
