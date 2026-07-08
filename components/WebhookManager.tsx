import React, { useEffect, useState } from 'react';
import {
  Webhook, Plus, RefreshCw, Trash2, Edit2, Send, RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Tenant, TenantWebhook, WebhookDelivery } from '../types/tenant';
import { getAllTenants } from '../services/tenantService';
import {
  createTenantWebhook,
  deleteTenantWebhook,
  getTenantWebhooks,
  getWebhookDeliveries,
  retryWebhookDelivery,
  triggerWebhookEvent,
  updateTenantWebhook,
} from '../services/webhookService';

const statusLabel = (status: TenantWebhook['status']) => {
  switch (status) {
    case 'active': return 'Đang hoạt động';
    case 'paused': return 'Tạm dừng';
    default: return status;
  }
};

const deliveryStatusLabel = (status: WebhookDelivery['status']) => {
  switch (status) {
    case 'pending': return 'Chờ gửi';
    case 'delivered': return 'Thành công';
    case 'failed': return 'Thất bại';
    case 'exhausted': return 'Hết lần thử';
    default: return status;
  }
};

const deliveryStatusClass = (status: WebhookDelivery['status']) => {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700';
    case 'delivered': return 'bg-green-100 text-green-700';
    case 'failed': return 'bg-red-100 text-red-700';
    case 'exhausted': return 'bg-gray-200 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
};

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('vi-VN');
}

const EVENT_OPTIONS = ['*', 'order.created', 'order.paid', 'product.created', 'product.updated', 'inventory.low_stock', 'tenant.subscription_changed'];

export default function WebhookManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string>('');

  const [webhooks, setWebhooks] = useState<TenantWebhook[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>(['*']);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [expandedDeliveries, setExpandedDeliveries] = useState<Record<string, boolean>>({});

  const loadTenants = async () => {
    setTenantsLoading(true);
    try {
      const data = await getAllTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách cửa hàng.');
    } finally {
      setTenantsLoading(false);
    }
  };

  const loadWebhooks = async (id: string) => {
    if (!id) {
      setWebhooks([]);
      return;
    }
    setWebhooksLoading(true);
    setError(null);
    try {
      const data = await getTenantWebhooks(id);
      setWebhooks(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách webhook.');
    } finally {
      setWebhooksLoading(false);
    }
  };

  const loadDeliveries = async (webhookId: string) => {
    setDeliveriesLoading(true);
    setError(null);
    try {
      const { data } = await getWebhookDeliveries(webhookId, { limit: 50 });
      setDeliveries(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải delivery log.');
    } finally {
      setDeliveriesLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    setSelectedWebhookId(null);
    setDeliveries([]);
    loadWebhooks(tenantId);
  }, [tenantId]);

  useEffect(() => {
    if (selectedWebhookId) {
      loadDeliveries(selectedWebhookId);
    } else {
      setDeliveries([]);
    }
  }, [selectedWebhookId]);

  const resetForm = () => {
    setName('');
    setUrl('');
    setSecret('');
    setEvents(['*']);
    setEditingId(null);
  };

  const startEdit = (wh: TenantWebhook) => {
    setEditingId(wh.id);
    setName(wh.name);
    setUrl(wh.url);
    setSecret(wh.secret || '');
    setEvents(wh.events?.length ? wh.events : ['*']);
  };

  const handleEventToggle = (event: string) => {
    if (event === '*') {
      setEvents(['*']);
      return;
    }
    setEvents((prev) => {
      const filtered = prev.filter((e) => e !== '*');
      if (filtered.includes(event)) {
        const next = filtered.filter((e) => e !== event);
        return next.length ? next : ['*'];
      }
      return [...filtered, event];
    });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError('Vui lòng chọn cửa hàng.');
      return;
    }
    if (!name.trim() || !url.trim()) {
      setError('Vui lòng nhập tên và URL webhook.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        await updateTenantWebhook(editingId, {
          name: name.trim(),
          url: url.trim(),
          events,
          secret: secret || undefined,
        });
      } else {
        await createTenantWebhook(tenantId, name.trim(), url.trim(), events, secret || undefined);
      }
      resetForm();
      await loadWebhooks(tenantId);
    } catch (err: any) {
      setError(err?.message || (editingId ? 'Cập nhật webhook thất bại.' : 'Tạo webhook thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!window.confirm('Xóa webhook này? Hành động này không thể hoàn tác.')) return;
    setError(null);
    try {
      await deleteTenantWebhook(webhookId);
      if (selectedWebhookId === webhookId) setSelectedWebhookId(null);
      await loadWebhooks(tenantId);
    } catch (err: any) {
      setError(err?.message || 'Xóa webhook thất bại.');
    }
  };

  const handleTest = async (wh: TenantWebhook) => {
    setError(null);
    try {
      await triggerWebhookEvent(wh.tenantId, 'webhook.test', {
        webhookId: wh.id,
        url: wh.url,
        message: 'Test event from VietSales Pro admin dashboard',
      });
      if (selectedWebhookId === wh.id) await loadDeliveries(wh.id);
      window.alert('Đã enqueue event test. Vui lòng chạy worker để gửi thực tế.');
    } catch (err: any) {
      setError(err?.message || 'Test webhook thất bại.');
    }
  };

  const handleRetry = async (delivery: WebhookDelivery) => {
    setError(null);
    try {
      await retryWebhookDelivery(delivery.id);
      if (selectedWebhookId) await loadDeliveries(selectedWebhookId);
    } catch (err: any) {
      setError(err?.message || 'Retry webhook thất bại.');
    }
  };

  const toggleDelivery = (id: string) => {
    setExpandedDeliveries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Webhooks</h2>
        <button
          onClick={() => loadWebhooks(tenantId)}
          disabled={webhooksLoading || tenantsLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${webhooksLoading || tenantsLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn cửa hàng</label>
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          disabled={tenantsLoading}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Chọn cửa hàng --</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
          ))}
        </select>
      </div>

      {tenantId && (
        <form onSubmit={handleCreateOrUpdate} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {editingId ? 'Cập nhật webhook' : 'Tạo webhook mới'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tên webhook</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ví dụ: Đồng bộ đơn hàng"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://partner.example.com/webhook"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Secret (tùy chọn)</label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="dùng để ký HMAC-SHA256"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Sự kiện</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map((event) => (
                <label
                  key={event}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border cursor-pointer ${
                    events.includes(event) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={events.includes(event)}
                    onChange={() => handleEventToggle(event)}
                  />
                  {event}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Tạo webhook')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Danh sách webhook</h3>
        {webhooksLoading ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : webhooks.length === 0 ? (
          <p className="text-sm text-gray-500">
            {tenantId ? 'Chưa có webhook nào.' : 'Vui lòng chọn cửa hàng.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Tên</th>
                  <th className="pb-2 font-medium">URL</th>
                  <th className="pb-2 font-medium">Sự kiện</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                  <th className="pb-2 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((wh) => (
                  <tr key={wh.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-medium text-gray-700">{wh.name}</td>
                    <td className="py-3 text-gray-600 truncate max-w-xs">{wh.url}</td>
                    <td className="py-3 text-gray-600">{wh.events?.join(', ') || '*'}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${wh.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {statusLabel(wh.status)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => startEdit(wh)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTest(wh)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Test enqueue"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedWebhookId(wh.id === selectedWebhookId ? null : wh.id)}
                          className={`p-1.5 rounded ${selectedWebhookId === wh.id ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                          title="Xem delivery log"
                        >
                          <Webhook className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(wh.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedWebhookId && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Delivery log</h3>
            <button
              onClick={() => selectedWebhookId && loadDeliveries(selectedWebhookId)}
              disabled={deliveriesLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${deliveriesLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
          {deliveriesLoading ? (
            <p className="text-gray-600">Đang tải...</p>
          ) : deliveries.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có delivery nào.</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => (
                <div key={d.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleDelivery(d.id)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${deliveryStatusClass(d.status)}`}>
                        {deliveryStatusLabel(d.status)}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{d.eventType}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(d.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(d.status === 'failed' || d.status === 'exhausted') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRetry(d); }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                      {expandedDeliveries[d.id] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </button>
                  {expandedDeliveries[d.id] && (
                    <div className="px-4 py-3 text-sm space-y-2">
                      <div><strong>HTTP status:</strong> {d.httpStatus ?? '-'}</div>
                      <div><strong>Attempts:</strong> {d.attemptCount} / {d.maxAttempts}</div>
                      {d.errorMessage && <div><strong>Lỗi:</strong> <span className="text-red-600">{d.errorMessage}</span></div>}
                      {d.responseBody && (
                        <div>
                          <strong>Response:</strong>
                          <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">{d.responseBody.slice(0, 500)}{d.responseBody.length > 500 ? '...' : ''}</pre>
                        </div>
                      )}
                      {d.attemptLog && d.attemptLog.length > 0 && (
                        <div>
                          <strong>Lịch sử thử:</strong>
                          <ul className="mt-1 space-y-1 text-xs text-gray-600">
                            {d.attemptLog.map((a, i) => (
                              <li key={i}>
                                {formatDateTime(a.attemptedAt)} — HTTP {a.httpStatus ?? '-'} {a.errorMessage ? `(${a.errorMessage})` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
