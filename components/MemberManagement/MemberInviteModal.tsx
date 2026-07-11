import React, { useEffect, useMemo, useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle, Mail, Users } from 'lucide-react';
import { MasterModal } from '../MasterModal';
import { SelectInput } from '../SelectInput';
import { ActionButton } from '../ActionButton';
import { TenantRole, MemberWithEmail, UsageSummary } from '../../types/tenant';
import { bulkInviteMembers } from '../../services/admin/memberAdminService';
import { getUsageSummary } from '../../services/tenantService';

interface MemberInviteModalProps {
  tenantId: string;
  existingMembers?: MemberWithEmail[];
  onClose: () => void;
  onInvited?: () => void;
}

// FIX [6.4]: Add 'viewer' role
const ROLES: { value: TenantRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'inventory_manager', label: 'Quản lý kho' },
  { value: 'accountant', label: 'Kế toán' },
  { value: 'viewer', label: 'Người xem' },
];

const MAX_EMAILS = 50;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseEmails = (text: string): string[] =>
  text
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const MemberInviteModal: React.FC<MemberInviteModalProps> = ({
  tenantId,
  existingMembers = [],
  onClose,
  onInvited,
}) => {
  const [rawText, setRawText] = useState('');
  const [role, setRole] = useState<TenantRole>('cashier');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof bulkInviteMembers>> | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsageSummary(tenantId)
      .then((u) => { if (!cancelled) setUsage(u); })
      .catch((err) => { if (!cancelled) setUsageError(err?.message || 'Không tải được quota'); });
    return () => { cancelled = true; };
  }, [tenantId]);

  const parsed = useMemo(() => parseEmails(rawText), [rawText]);
  const allValid = useMemo(() => parsed.filter((e) => EMAIL_RE.test(e)), [parsed]);
  const invalid = useMemo(() => parsed.filter((e) => !EMAIL_RE.test(e)), [parsed]);
  const uniqueValid = useMemo(() => [...new Set(allValid)], [allValid]);
  const existingEmails = useMemo(
    () => new Set(existingMembers.map((m) => m.email?.toLowerCase()).filter(Boolean) as string[]),
    [existingMembers],
  );
  const alreadyMemberEmails = useMemo(
    () => uniqueValid.filter((e) => existingEmails.has(e)),
    [uniqueValid, existingEmails],
  );
  const newEmails = useMemo(
    () => uniqueValid.filter((e) => !existingEmails.has(e)),
    [uniqueValid, existingEmails],
  );

  const currentCount = usage?.users?.current ?? 0;
  const maxUsers = usage?.users?.max ?? 0;
  const overLimit = maxUsers > 0 && currentCount + newEmails.length > maxUsers;
  const overMaxEmails = uniqueValid.length > MAX_EMAILS;
  const canSubmit = newEmails.length > 0 && !overLimit && !overMaxEmails && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);
    try {
      const summary = await bulkInviteMembers(tenantId, newEmails, role);
      setResult(summary);
    } catch (err: any) {
      setResult({
        succeeded: 0,
        failed: newEmails.length,
        alreadyMember: 0,
        emailProviderNotConfigured: 0,
        errors: [{ email: '', message: err?.message || 'Mời thành viên thất bại' }],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (result && result.failed === 0) {
      onInvited?.();
    }
    onClose();
  };

  return (
    <MasterModal
      isOpen
      onClose={handleClose}
      title="Mời thành viên"
      icon={<UserPlus size={20} />}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <ActionButton variant="ghost" onClick={handleClose} disabled={submitting}>
            {result ? 'Đóng' : 'Hủy'}
          </ActionButton>
          {!result && (
            <ActionButton
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
            >
              Mời ({newEmails.length})
            </ActionButton>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {!result ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh sách email
                {' '}
                <span className="text-gray-400 font-normal">
                  (tối đa 50, phân cách bằng dấu phẩy, chấm phẩy, xuống dòng hoặc khoảng trắng)
                </span>
              </label>
              <textarea
                className="w-full min-h-[120px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                placeholder="email1@example.com, email2@example.com"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                disabled={submitting}
              />
            </div>
            <SelectInput
              label="Vai trò mặc định"
              options={ROLES}
              value={role}
              onChange={(e) => setRole(e.target.value as TenantRole)}
              fullWidth
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-green-50 text-green-700 px-3 py-2 rounded">
                <span className="font-medium">{uniqueValid.length}</span> email hợp lệ
                {alreadyMemberEmails.length > 0 && (
                  <span className="block text-xs mt-1">
                    {alreadyMemberEmails.length} đã là thành viên
                  </span>
                )}
              </div>
              {invalid.length > 0 && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded">
                  <span className="font-medium">{invalid.length}</span> email không hợp lệ
                </div>
              )}
            </div>
            {invalid.length > 0 && (
              <p className="text-xs text-red-600">
                {invalid.slice(0, 10).join(', ')}
                {invalid.length > 10 ? '...' : ''}
              </p>
            )}
            <div className="text-sm text-gray-600">
              Quota:
              {' '}
              <span className="font-medium">{currentCount}</span>
              {' / '}
              {maxUsers} thành viên
              {newEmails.length > 0 && (
                <span className="ml-2">
                  → sau khi mời:
                  {' '}
                  <span className={overLimit ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}>
                    {currentCount + newEmails.length}
                  </span>
                </span>
              )}
            </div>
            {overLimit && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
                Vượt quá giới hạn thành viên ({maxUsers}). Vui lòng nâng cấp gói hoặc xóa thành viên cũ.
              </p>
            )}
            {overMaxEmails && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
                Tối đa 50 email mỗi lần.
              </p>
            )}
            {usageError && (
              <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded" role="alert">
                Không kiểm tra được quota: {usageError}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded text-sm">
                <CheckCircle size={16} />
                <span>Thành công: <span className="font-medium">{result.succeeded}</span></span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded text-sm">
                <Mail size={16} />
                <span>Đã là thành viên: <span className="font-medium">{result.alreadyMember}</span></span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
                <AlertCircle size={16} />
                <span>Lỗi: <span className="font-medium">{result.failed}</span></span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm">
                <Users size={16} />
                <span>Chưa cấu hình email: <span className="font-medium">{result.emailProviderNotConfigured}</span></span>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <tbody>
                    {result.errors.map((err, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2 text-gray-900">{err.email || '-'}</td>
                        <td className="px-3 py-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </MasterModal>
  );
};
