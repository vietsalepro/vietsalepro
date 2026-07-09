import React, { useState } from 'react';
import { Shield, Key, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  verifyLoginTotp,
  verifyBackupCode,
  getVerifiedTotpFactor,
} from '../services/twoFactorService';

export default function MfaChallenge() {
  const { setMfaPending } = useAuth();
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const clean = code.replace(/\s/g, '');
      if (mode === 'totp') {
        if (!/^\d{6}$/.test(clean)) {
          throw new Error('Mã TOTP phải gồm 6 chữ số');
        }
        const factor = await getVerifiedTotpFactor();
        if (!factor) {
          throw new Error('Không tìm thấy factor TOTP đã xác minh');
        }
        await verifyLoginTotp(factor.id, clean);
      } else {
        if (!/^[A-F0-9]{32}$/i.test(clean)) {
          throw new Error('Backup code phải gồm 32 ký tự chữ/số');
        }
        const valid = await verifyBackupCode(clean);
        if (!valid) {
          throw new Error('Backup code không hợp lệ hoặc đã được sử dụng');
        }
      }
      setMfaPending(false);
    } catch (err: any) {
      setError(err?.message || 'Xác minh thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mx-auto mb-4">
          <Shield className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-center text-gray-800 mb-2">
          Xác thực 2 lớp
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          Tài khoản của bạn đã bật 2FA. Vui lòng nhập mã từ Google Authenticator hoặc backup code.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'totp' ? 'Mã 6 chữ số' : 'Backup code'}
            </label>
            <input
              type="text"
              inputMode={mode === 'totp' ? 'numeric' : 'text'}
              autoComplete="off"
              maxLength={mode === 'totp' ? 6 : 32}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={mode === 'totp' ? '000000' : 'ABCD-1234'}
              className="w-full px-4 py-3 text-lg tracking-widest text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < (mode === 'totp' ? 6 : 32)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xác minh...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                Xác minh
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'totp' ? 'backup' : 'totp');
              setCode('');
              setError(null);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            {mode === 'totp' ? 'Dùng backup code' : 'Dùng mã Google Authenticator'}
          </button>
        </div>
      </div>
    </div>
  );
}
