import React, { useEffect, useState } from 'react';
import { Shield, Lock, Clock, Globe, Unlock, Loader2 } from 'lucide-react';
import TwoFactorManager from '../../components/TwoFactorManager';
import { useToast } from '../../components/ToastContainer';
import { listAccounts } from '../../services/admin/tenantAdminService';
import {
  getTenantSecuritySettings,
  updateTenantIpAllowlist,
  updateTenantSessionTimeout,
  getLockedEmails,
  unlockLoginAttempts,
  SecuritySettings,
  LockedEmail,
} from '../../services/admin/systemAdminService';
import { Tenant } from '../../types/tenant';

export default function Security() {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [ipInput, setIpInput] = useState('');
  const [ips, setIps] = useState<string[]>([]);
  const [timeoutInput, setTimeoutInput] = useState(60);
  const [saving, setSaving] = useState(false);

  const [lockedEmails, setLockedEmails] = useState<LockedEmail[]>([]);
  const [lockedLoading, setLockedLoading] = useState(false);
  const [unlockingEmail, setUnlockingEmail] = useState<string | null>(null);

  useEffect(() => {
    setTenantsLoading(true);
    listAccounts({ pageSize: 1000 })
      .then((result) => setTenants(result.accounts))
      .catch(() => addToast({ type: 'error', message: 'Không thể tải danh sách cửa hàng.' }))
      .finally(() => setTenantsLoading(false));
  }, [addToast]);

  useEffect(() => {
    if (!selectedTenantId) {
      setSettings(null);
      setIps([]);
      setTimeoutInput(60);
      return;
    }
    setSettingsLoading(true);
    getTenantSecuritySettings(selectedTenantId)
      .then((s) => {
        setSettings(s);
        setIps(s.allowedIps);
        setTimeoutInput(s.sessionTimeoutMinutes);
      })
      .catch(() => addToast({ type: 'error', message: 'Không thể tải cấu hình bảo mật.' }))
      .finally(() => setSettingsLoading(false));
  }, [selectedTenantId, addToast]);

  useEffect(() => {
    loadLockedEmails();
  }, []);

  function loadLockedEmails() {
    setLockedLoading(true);
    getLockedEmails()
      .then(setLockedEmails)
      .catch(() => addToast({ type: 'error', message: 'Không thể tải danh sách bị khóa.' }))
      .finally(() => setLockedLoading(false));
  }

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ipInput.trim();
    if (!trimmed) return;
    if (ips.includes(trimmed)) {
      addToast({ type: 'error', message: 'IP đã tồn tại trong danh sách.' });
      return;
    }
    setIps((prev) => [...prev, trimmed]);
    setIpInput('');
  };

  const handleRemoveIp = (ip: string) => {
    setIps((prev) => prev.filter((i) => i !== ip));
  };

  const handleSaveSettings = async () => {
    if (!selectedTenantId || !settings) return;
    setSaving(true);
    try {
      await updateTenantIpAllowlist(selectedTenantId, ips);
      await updateTenantSessionTimeout(selectedTenantId, timeoutInput);
      addToast({ type: 'success', message: 'Đã lưu cấu hình bảo mật.' });
      setSettings({ ...settings, allowedIps: ips, sessionTimeoutMinutes: timeoutInput });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Lưu cấu hình thất bại.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async (email: string) => {
    setUnlockingEmail(email);
    try {
      await unlockLoginAttempts(email);
      addToast({ type: 'success', message: `Đã mở khóa đăng nhập cho ${email}.` });
      loadLockedEmails();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Mở khóa thất bại.' });
    } finally {
      setUnlockingEmail(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Cài đặt bảo mật
        </h1>
        <p className="text-sm text-gray-600 mt-1">Quản lý 2FA, IP allowlist, thời gian phiên và mở khóa đăng nhập.</p>
      </div>

      <TwoFactorManager />

      {/* Tenant security settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Cấu hình bảo mật theo cửa hàng
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cửa hàng</label>
          {tenantsLoading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải…
            </div>
          ) : (
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn cửa hàng</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subdomain})
                </option>
              ))}
            </select>
          )}
        </div>

        {settingsLoading && (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải cấu hình…
          </div>
        )}

        {selectedTenantId && !settingsLoading && settings && (
          <div className="space-y-6">
            {/* IP allowlist */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                IP Allowlist
              </h3>
              <p className="text-sm text-gray-600">
                Chỉ các IP trong danh sách mới được truy cập dashboard admin của cửa hàng. Để trống để cho phép tất cả.
              </p>
              <form onSubmit={handleAddIp} className="flex gap-2">
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder="192.168.1.1"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Thêm IP
                </button>
              </form>
              <div className="flex flex-wrap gap-2">
                {ips.length === 0 && <span className="text-sm text-gray-500 italic">Chưa có IP nào.</span>}
                {ips.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                  >
                    {ip}
                    <button
                      onClick={() => handleRemoveIp(ip)}
                      className="text-gray-500 hover:text-red-600"
                      aria-label={`Xóa ${ip}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Session timeout */}
            <div className="space-y-3">
              <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Thời gian hết phiên
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={timeoutInput}
                  onChange={(e) => setTimeoutInput(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">phút</span>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Lưu cấu hình
            </button>
          </div>
        )}
      </div>

      {/* Brute-force unlock */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Unlock className="w-5 h-5" />
          Mở khóa đăng nhập (brute-force)
        </h2>
        <p className="text-sm text-gray-600">
          Tài khoản bị khóa sau 5 lần đăng nhập sai trong 15 phút. Tự động mở khóa sau 15 phút, hoặc mở khóa thủ công ở đây.
        </p>

        {lockedLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải…
          </div>
        ) : lockedEmails.length === 0 ? (
          <p className="text-sm text-gray-500">Không có tài khoản nào đang bị khóa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Số lần sai</th>
                  <th className="px-4 py-3 text-left font-medium">Lần cuối</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lockedEmails.map((item) => (
                  <tr key={item.email}>
                    <td className="px-4 py-3 text-gray-700">{item.email}</td>
                    <td className="px-4 py-3 text-gray-700">{item.failedCount}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(item.lastAttempt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleUnlock(item.email)}
                        disabled={unlockingEmail === item.email}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg disabled:opacity-60"
                      >
                        {unlockingEmail === item.email && <Loader2 className="w-3 h-3 animate-spin" />}
                        Mở khóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
