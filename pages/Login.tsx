import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Lock, Mail, Store, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { recordAdminLogin } from '../services/loginHistoryService';
import { isMfaRequired } from '../services/twoFactorService';
import './Login.css';

const isAdminLoginRoute = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.host.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  return host.startsWith('admin.') || pathname.startsWith('/admin');
};

export const Login = () => {
  const { setMfaPending } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Nếu user đã bật 2FA, chuyển sang bước xác minh MFA thay vì vào app luôn.
      const { required } = await isMfaRequired();
      if (required) {
        setMfaPending(true);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
      if (isAdminLoginRoute()) {
        recordAdminLogin({
          email,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          status: 'failed',
          failureReason: err.message || 'Đăng nhập thất bại',
        }).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-background">
        <div className="login-orb login-orb--primary" />
        <div className="login-orb login-orb--secondary" />
        <div className="login-orb login-orb--tertiary" />
        <div className="login-grid" />
        <div className="login-dots">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="login-dot" />
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card-wrapper">
        <div className="login-card-glow" />

        <div className="login-card">
          <div className="login-card-top-bar" />

          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <div className="login-logo-icon">
                <Store className="w-10 h-10" />
              </div>
              <div className="login-logo-ring" />
            </div>

            <h1 className="login-title">VietSales Pro</h1>
            <p className="login-subtitle">Hệ thống quản lý bán hàng chuyên nghiệp</p>
            <div className="login-version-badge">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phiên bản 2.0</span>
            </div>
          </div>

          {/* Divider */}
          <div className="login-divider" />

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            {/* Error Message */}
            {error && (
              <div className="login-error">
                <div className="login-error-dot" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="login-field">
              <label className="login-label">Email đăng nhập</label>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-field">
              <label className="login-label">Mật khẩu</label>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input login-input--password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-toggle"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xác thực...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  Đăng nhập hệ thống
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">
              Chưa có tài khoản? Vui lòng liên hệ quản trị viên
            </p>
            <div className="login-security-badge">
              <Lock className="w-3 h-3" />
              <span>Bảo mật SSL/TLS</span>
            </div>
          </div>
        </div>

        {/* Version & credit */}
        <p className="login-version">
          VietSales Pro v2.0 — Quản lý bán hàng thông minh
        </p>
      </div>
    </div>
  );
};
