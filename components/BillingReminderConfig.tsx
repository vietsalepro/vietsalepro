import React, { useEffect, useState } from 'react';
import { Bell, Clock, Send, AlertCircle } from 'lucide-react';
import {
  BillingReminderConfig as BillingReminderConfigType,
  PendingReminder,
  BillingReminderLog,
} from '../types/billing';
import {
  getBillingReminderConfig,
  setBillingReminderConfig,
  getPendingBillingReminders,
  sendBillingReminders,
  getBillingReminderLogs,
} from '../services/billingReminderService';

const DEFAULT_MILESTONES = [7, 3, 1];

export default function BillingReminderConfig() {
  const [config, setConfig] = useState<BillingReminderConfigType>({
    enabled: true,
    milestones: DEFAULT_MILESTONES,
    sendTime: '09:00',
    functionUrl: '',
    serviceRoleKey: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<PendingReminder[]>([]);
  const [logs, setLogs] = useState<BillingReminderLog[]>([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p, l] = await Promise.all([
        getBillingReminderConfig(),
        getPendingBillingReminders(),
        getBillingReminderLogs(),
      ]);
      setConfig(c);
      setPending(p);
      setLogs(l);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải cấu hình reminder.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setRunResult(null);
    try {
      await setBillingReminderConfig(config);
      setRunResult('Đã lưu cấu hình reminder.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Lưu cấu hình reminder thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setError(null);
    setRunResult(null);
    try {
      const res = await sendBillingReminders();
      if (res.error) {
        setRunResult(`Chạy thủ công: ${res.error} (sent=${res.sent}, skipped=${res.skipped})`);
      } else {
        setRunResult(`Đã lập lịch ${res.sent} reminder gửi đi.`);
      }
      await load();
    } catch (err: any) {
      setError(err?.message || 'Chạy reminder thất bại.');
    } finally {
      setRunning(false);
    }
  };

  const toggleMilestone = (days: number) => {
    const exists = config.milestones.includes(days);
    const next = exists
      ? config.milestones.filter(d => d !== days)
      : [...config.milestones, days].sort((a, b) => a - b);
    setConfig(prev => ({ ...prev, milestones: next }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Lịch nhắc thanh toán (T-7 / T-3 / T-1)</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {runResult && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100">
          {runResult}
        </div>
      )}

      {loading && !config ? (
        <p className="text-gray-600">Đang tải...</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-3">
            <input
              id="reminder-enabled"
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="reminder-enabled" className="text-gray-700">
              Bật lịch nhắc thanh toán tự động
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mốc nhắc (trước ngày đến hạn)</label>
            <div className="flex flex-wrap gap-3">
              {[1, 3, 7].map(days => (
                <label
                  key={days}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    config.milestones.includes(days)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config.milestones.includes(days)}
                    onChange={() => toggleMilestone(days)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">T-{days}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Giờ gửi mỗi ngày
              </label>
              <input
                type="time"
                value={config.sendTime}
                onChange={(e) => setConfig(prev => ({ ...prev, sendTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">URL Edge Function send-billing-email</label>
              <input
                type="text"
                value={config.functionUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, functionUrl: e.target.value }))}
                placeholder="https://<project-ref>.supabase.co/functions/v1/send-billing-email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cần cấu hình để cron có thể gọi Edge Function gửi email.
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Service role key (dùng cho cron)</label>
              <input
                type="password"
                value={config.serviceRoleKey}
                onChange={(e) => setConfig(prev => ({ ...prev, serviceRoleKey: e.target.value }))}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Chỉ lưu trong system_settings, chỉ system admin mới đọc được.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
            <button
              type="button"
              onClick={handleRunNow}
              disabled={running}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {running ? 'Đang chạy...' : 'Chạy ngay'}
            </button>
          </div>
        </form>
      )}

      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-medium text-gray-800 mb-3">Reminder sắp gửi ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-500">Không có hóa đơn nào cần nhắc vào các mốc hiện tại.</p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {pending.map((p, idx) => (
              <li key={`${p.invoiceId}-${p.milestone}-${idx}`} className="px-4 py-3 flex justify-between items-center text-sm">
                <span className="text-gray-700">
                  Hóa đơn <span className="font-medium">{p.invoiceId}</span>
                </span>
                <span className="text-gray-500">
                  {p.milestone} · đến hạn {new Date(p.dueDate).toLocaleDateString('vi-VN')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-medium text-gray-800 mb-3">Lịch sử gửi ({logs.length})</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có reminder nào được ghi nhận.</p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {logs.slice(0, 20).map((log) => (
              <li key={log.id} className="px-4 py-3 flex justify-between items-center text-sm">
                <span className="text-gray-700">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    log.status === 'sent' ? 'bg-green-100 text-green-700' :
                    log.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {log.status}
                  </span>
                  <span className="ml-2">{log.milestone}</span>
                </span>
                <span className="text-gray-500">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
