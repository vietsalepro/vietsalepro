import React, { useState, useMemo } from 'react';
import { Globe, Check, AlertCircle, Loader2, Copy } from 'lucide-react';
import { Tenant } from '../../types/tenant';
import {
  requestCustomDomainVerification,
  verifyCustomDomain,
  isValidCustomDomain,
} from '../../services/admin/tenantAdminService';

interface CustomDomainPanelProps {
  tenant: Tenant;
  onUpdated?: (tenant: Tenant) => void;
}

interface StatusMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

export default function CustomDomainPanel({ tenant, onUpdated }: CustomDomainPanelProps) {
  const [token, setToken] = useState('');
  const [txtRecord, setTxtRecord] = useState('');
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const domain = (tenant.customDomain || '').trim().toLowerCase();
  const isValid = useMemo(() => isValidCustomDomain(domain), [domain]);
  const isVerified = !!tenant.customDomainVerifiedAt;

  const handleGenerateToken = async () => {
    if (!isValid) {
      setStatus({ type: 'error', text: 'Domain không hợp lệ.' });
      return;
    }
    setGenerating(true);
    setStatus(null);
    try {
      const result = await requestCustomDomainVerification(tenant.id);
      setToken(result.token);
      setTxtRecord(result.txtRecord);
      setStatus({ type: 'info', text: 'Đã tạo token. Thêm TXT record như hướng dẫn bên dưới.' });
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Không thể tạo token xác minh.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleVerify = async () => {
    if (!isValid) {
      setStatus({ type: 'error', text: 'Domain không hợp lệ.' });
      return;
    }
    setVerifying(true);
    setStatus(null);
    try {
      const result = await verifyCustomDomain(tenant.id, domain);
      if (result.verified) {
        setStatus({ type: 'success', text: result.message || 'Domain đã được xác minh.' });
        onUpdated?.({ ...tenant, customDomainVerifiedAt: new Date().toISOString() });
      } else {
        setStatus({ type: 'error', text: result.message || 'Không tìm thấy TXT record hợp lệ.' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Xác minh domain thất bại.' });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus({ type: 'info', text: 'Đã sao chép vào clipboard.' });
    } catch {
      setStatus({ type: 'info', text: 'Không thể sao chép tự động.' });
    }
  };

  if (!tenant.customDomain) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Xác minh custom domain
        </h2>
        <p className="text-sm text-gray-500 mt-2">Tenant này chưa có custom domain. Vui lòng cấu hình domain trước.</p>
      </div>
    );
  }

  const statusColor =
    status?.type === 'success'
      ? 'text-green-600'
      : status?.type === 'error'
      ? 'text-red-600'
      : 'text-blue-600';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Xác minh custom domain
        </h2>
        {isVerified && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <Check className="w-3 h-3" />
            Đã xác minh
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="custom-domain" className="block text-sm font-medium text-gray-700 mb-1">
            Custom domain đã cấu hình
          </label>
          <input
            id="custom-domain"
            type="text"
            value={tenant.customDomain}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Domain phải trỏ về ứng dụng và có TXT record chứa token để xác minh.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerateToken}
            disabled={!isValid || generating || verifying}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Tạo token xác minh
          </button>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!isValid || !token || verifying || generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Xác minh ngay
          </button>
        </div>

        {token && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <p className="text-sm font-medium text-gray-700">Thêm TXT record sau:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 block px-3 py-2 bg-white border border-gray-200 rounded text-sm break-all">
                {txtRecord}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(txtRecord)}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                aria-label="Sao chép TXT record"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Chờ DNS propagate (thường vài phút) rồi nhấn Xác minh ngay.</p>
          </div>
        )}

        {status && (
          <div className={`flex items-center gap-2 text-sm ${statusColor}`}>
            {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {status.text}
          </div>
        )}
      </div>
    </div>
  );
}
