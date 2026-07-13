import React, { useState, useCallback, useMemo } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Tenant } from '../../types/tenant';
import {
  checkSubdomainAvailability,
  setTenantSubdomain,
} from '../../services/admin/tenantAdminService';
import { isValidSubdomainFormat } from '../../utils/subdomain';

interface SubdomainManagerPanelProps {
  tenant: Tenant;
  onUpdated?: (tenant: Tenant) => void;
}

export default function SubdomainManagerPanel({ tenant, onUpdated }: SubdomainManagerPanelProps) {
  const [subdomain, setSubdomain] = useState(tenant.subdomain || '');
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{ available?: boolean; message?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const normalized = subdomain.trim().toLowerCase();
  const isDirty = normalized !== tenant.subdomain;
  const isValid = isValidSubdomainFormat(normalized);

  const handleCheck = useCallback(async () => {
    if (!isValid) {
      setAvailability({ available: false, message: 'Subdomain không hợp lệ.' });
      return;
    }
    setChecking(true);
    setAvailability(null);
    setSuccess(false);
    try {
      const result = await checkSubdomainAvailability(normalized);
      setAvailability({
        available: result.available,
        message: result.available
          ? 'Subdomain khả dụng.'
          : (result.error || 'Subdomain đã được sử dụng.'),
      });
    } catch (err: any) {
      setAvailability({ available: false, message: err?.message || 'Không thể kiểm tra subdomain.' });
    } finally {
      setChecking(false);
    }
  }, [normalized, isValid]);

  const handleSave = async () => {
    if (!isValid || !availability?.available || !isDirty) return;
    setSaving(true);
    setSuccess(false);
    try {
      const updated = await setTenantSubdomain(tenant.id, normalized);
      setSuccess(true);
      setAvailability({ available: true, message: 'Đã cập nhật subdomain.' });
      onUpdated?.(updated);
    } catch (err: any) {
      setAvailability({ available: false, message: err?.message || 'Cập nhật subdomain thất bại.' });
    } finally {
      setSaving(false);
    }
  };

  const availabilityColor = useMemo(() => {
    if (!availability) return 'text-gray-600';
    return availability.available ? 'text-green-600' : 'text-red-600';
  }, [availability]);

  const canSave = isValid && isDirty && availability?.available && !checking && !saving;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Quản lý subdomain</h2>
        <p className="text-sm text-gray-500 mt-1">
          Subdomain hiện tại: <span className="font-medium text-gray-700">{tenant.subdomain}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
            Subdomain
          </label>
          <div className="flex items-center gap-2">
            <input
              id="subdomain"
              type="text"
              value={subdomain}
              onChange={(e) => {
                setSubdomain(e.target.value.toLowerCase());
                setAvailability(null);
                setSuccess(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCheck();
                }
              }}
              placeholder="shop-name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
            />
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking || saving || !isValid}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Kiểm tra
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            3-63 ký tự, chỉ gồm chữ thường, số và dấu gạch ngang, không bắt đầu/kết thúc bằng gạch ngang.
          </p>
        </div>

        {availability && (
          <div className={`flex items-center gap-2 text-sm ${availabilityColor}`}>
            {availability.available ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {availability.message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Lưu subdomain
        </button>
      </div>
    </div>
  );
}
