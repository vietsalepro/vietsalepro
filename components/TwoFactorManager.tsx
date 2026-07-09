import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import {
  enrollTotp,
  verifyTotpEnrollment,
  generateBackupCodes,
  getTwoFactorStatus,
  disableTwoFactor,
  overrideAdmin2FA,
  TwoFactorStatus,
  TotpEnrollment,
} from '../services/twoFactorService';
import { useAuth } from '../contexts/AuthContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useToast } from './ToastContainer';

export default function TwoFactorManager() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();
  const { addToast } = useToast();

  // Enroll flow
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [enrollStep, setEnrollStep] = useState<'qr' | 'backup' | 'verify'>('qr');

  // Disable flow
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  // Manual override
  const [targetUserId, setTargetUserId] = useState('');
  const [approverUserId, setApproverUserId] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getTwoFactorStatus();
      setStatus(s);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải trạng thái 2FA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const startEnroll = async () => {
    setError(null);
    setLoading(true);
    try {
      const e = await enrollTotp();
      const codes = await generateBackupCodes(10);
      setEnrollment(e);
      setBackupCodes(codes);
      setEnrollStep('qr');
      setSavedConfirmed(false);
      setVerifyCode('');
    } catch (err: any) {
      setError(err?.message || 'Bắt đầu bật 2FA thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    if (!backupCodes) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
    } catch {
      setError('Không thể sao chép backup codes.');
    }
  };

  const downloadBackupCodes = () => {
    if (!backupCodes) return;
    const blob = new Blob([backupCodes.join('\r\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;
    if (!savedConfirmed) {
      setError('Vui lòng xác nhận đã lưu backup codes.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyTotpEnrollment(enrollment.factorId, verifyCode);
      await loadStatus();
      setEnrollment(null);
      setBackupCodes(null);
      setSavedConfirmed(false);
      setVerifyCode('');
    } catch (err: any) {
      setError(err?.message || 'Mã xác minh không đúng.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status?.factorId) return;
    setDisableLoading(true);
    setError(null);
    try {
      await verifyTotpEnrollment(status.factorId, disableCode);
      await disableTwoFactor(status.factorId);
      setDisableCode('');
      await loadStatus();
    } catch (err: any) {
      setError(err?.message || 'Tắt 2FA thất bại.');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !approverUserId.trim()) {
      setError('Vui lòng nhập đầy đủ target user ID và approver user ID.');
      return;
    }
    setOverrideLoading(true);
    setError(null);
    try {
      await overrideAdmin2FA(targetUserId.trim(), approverUserId.trim());
      setTargetUserId('');
      setApproverUserId('');
      addToast({ type: 'success', message: 'Đã override 2FA thành công.' });
    } catch (err: any) {
      setError(err?.message || 'Override 2FA thất bại.');
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Xác thực 2 lớp (2FA)
        </h2>
        <button
          onClick={loadStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Status card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {loading && !status ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : (
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${status?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {status?.enabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldOff className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-800">
                {status?.enabled ? '2FA đang bật' : '2FA đang tắt'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {status?.enabled
                  ? `Bạn đã bật xác thực 2 lớp. Còn ${status.backupCodesRemaining} backup code chưa dùng.`
                  : 'Bật 2FA để bảo vệ tài khoản admin bằng Google Authenticator.'}
              </p>
              {!status?.enabled && !enrollment && (
                <button
                  onClick={startEnroll}
                  disabled={loading}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Bật 2FA
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enroll flow */}
      {enrollment && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          {enrollStep === 'qr' && (
            <>
              <h3 className="text-base font-semibold text-gray-800">Bước 1: Quét mã QR</h3>
              <p className="text-sm text-gray-600">
                Mở Google Authenticator và quét mã QR bên dưới. Nếu không quét được, nhập thủ công secret:
              </p>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <img
                  src={enrollment.qrCode}
                  alt="Mã QR 2FA"
                  className="w-48 h-48 border border-gray-200 rounded-lg"
                />
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret</label>
                  <input
                    readOnly
                    value={enrollment.secret}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => setEnrollStep('backup')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tiếp theo
              </button>
            </>
          )}

          {enrollStep === 'backup' && backupCodes && (
            <>
              <h3 className="text-base font-semibold text-gray-800">Bước 2: Lưu backup codes</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Lưu các mã này ở nơi an toàn. Mỗi mã chỉ dùng được 1 lần. Sau khi rời khỏi trang này bạn sẽ
                  <strong> không thể</strong> xem lại các mã gốc.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {backupCodes.map((c, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-center tracking-wider"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyBackupCodes}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Copy className="w-4 h-4" />
                  Sao chép
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Download className="w-4 h-4" />
                  Tải xuống
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={savedConfirmed}
                  onChange={(e) => setSavedConfirmed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Tôi đã lưu backup codes ở nơi an toàn
              </label>
              <button
                onClick={() => setEnrollStep('verify')}
                disabled={!savedConfirmed}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Tiếp theo
              </button>
            </>
          )}

          {enrollStep === 'verify' && (
            <form onSubmit={handleVerifyAndEnable} className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800">Bước 3: Nhập mã 6 chữ số</h3>
              <p className="text-sm text-gray-600">
                Nhập mã từ Google Authenticator để hoàn tất bật 2FA.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 text-lg tracking-widest text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEnrollment(null);
                    setBackupCodes(null);
                    setEnrollStep('qr');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || verifyCode.length !== 6}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Xác nhận bật 2FA
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Disable flow */}
      {status?.enabled && !enrollment && (
        <form onSubmit={handleDisable} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <ShieldOff className="w-4 h-4" />
            Tắt 2FA
          </h3>
          <p className="text-sm text-gray-600">
            Nhập mã 6 chữ số hiện tại từ Google Authenticator để xác nhận tắt 2FA.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full md:w-1/2 px-4 py-2 text-lg tracking-widest text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={disableLoading || disableCode.length !== 6}
            className="block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
          >
            {disableLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tắt 2FA'}
          </button>
        </form>
      )}

      {/* Manual override */}
      <form onSubmit={handleOverride} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <UserX className="w-4 h-4" />
          Manual override 2FA (system admin)
        </h3>
        <p className="text-sm text-gray-600">
          Yêu cầu 2 system admin: người thực hiện (bạn) và người phê duyệt. Thao tác sẽ unenroll TOTP factor
          và xóa backup codes của admin được chỉ định.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target user ID</label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="uuid của admin cần override"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approved by user ID</label>
            <input
              type="text"
              value={approverUserId}
              onChange={(e) => setApproverUserId(e.target.value)}
              placeholder="uuid của system admin phê duyệt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={overrideLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60"
        >
          {overrideLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
          Override 2FA
        </button>
      </form>
      {confirmDialog}
    </div>
  );
}
