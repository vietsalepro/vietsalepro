import React, { useEffect, useRef, useState } from 'react';
import { X, Mail, Send, RotateCcw, Power, PowerOff, UserCog, Trash2 } from 'lucide-react';
import { ActionButton } from '../ActionButton';
import { SelectInput } from '../SelectInput';
import { StatusBadge } from '../StatusBadge';
import { SkeletonLoader } from '../SkeletonLoader';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../ToastContainer';
import { MemberWithEmail, TenantRole } from '../../types/tenant';
import {
  resendMemberInvite,
  resetMemberPassword,
  toggleMemberActive,
  updateMemberRole,
  removeMember,
} from '../../services/tenantService';

interface MemberDetailDrawerProps {
  member: MemberWithEmail;
  tenantId: string;
  onClose: () => void;
  onChanged?: () => void;
  loading?: boolean;
}

const ROLES: { value: TenantRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'inventory_manager', label: 'Quản lý kho' },
  { value: 'accountant', label: 'Kế toán' },
];

const roleLabel = (role: TenantRole) => ROLES.find((r) => r.value === role)?.label || role;
const roleBadgeType = (role: TenantRole) => {
  switch (role) {
    case 'admin': return 'danger';
    case 'cashier': return 'success';
    case 'inventory_manager': return 'info';
    case 'accountant': return 'warning';
    default: return 'default';
  }
};

const statusLabel = (status?: string) => {
  switch (status) {
    case 'pending': return 'Chờ xác nhận';
    case 'active': return 'Hoạt động';
    case 'inactive': return 'Ngừng';
    default: return status || '-';
  }
};

const statusBadgeType = (status?: string) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'active': return 'success';
    case 'inactive': return 'default';
    default: return 'default';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  member,
  tenantId,
  onClose,
  onChanged,
  loading,
}) => {
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<TenantRole>(member.role);
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();
  const { addToast } = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setRole(member.role);
  }, [member.role]);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const run = async <T,>(fn: () => Promise<T>, successMessage: string) => {
    setBusy(true);
    try {
      const res = await fn();
      addToast({ type: 'success', message: successMessage });
      onChanged?.();
      return res;
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Thao tác thất bại.' });
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const handleResendInvite = () => {
    openConfirmDialog({
      title: 'Gửi lại lời mời',
      message: `Gửi lại email mời tham gia cho ${member.email || member.userId}?`,
      variant: 'info',
      onConfirm: () => run(
        () => resendMemberInvite(tenantId, member.userId),
        'Đã gửi lại lời mời.',
      ).then(() => undefined),
    });
  };

  const handleResetPassword = () => {
    openConfirmDialog({
      title: 'Đặt lại mật khẩu',
      message: `Gửi email đặt lại mật khẩu cho ${member.email || member.userId}?`,
      variant: 'warning',
      onConfirm: () => run(
        () => resetMemberPassword(tenantId, member.userId),
        'Đã gửi yêu cầu đặt lại mật khẩu.',
      ).then(() => undefined),
    });
  };

  const handleToggleActive = () => {
    const next = !member.isActive;
    openConfirmDialog({
      title: next ? 'Kích hoạt thành viên' : 'Vô hiệu hóa thành viên',
      message: `${next ? 'Kích hoạt' : 'Vô hiệu hóa'} thành viên ${member.email || member.userId}?`,
      variant: next ? 'info' : 'warning',
      onConfirm: () => run(
        () => toggleMemberActive(tenantId, member.userId, next),
        `Đã ${next ? 'kích hoạt' : 'vô hiệu hóa'} thành viên.`,
      ).then(() => undefined),
    });
  };

  const handleChangeRole = () => {
    openConfirmDialog({
      title: 'Đổi vai trò',
      message: `Đổi vai trò thành viên ${member.email || member.userId} thành "${roleLabel(role)}"?`,
      variant: 'warning',
      onConfirm: () => run(
        () => updateMemberRole(tenantId, member.userId, role),
        'Đã cập nhật vai trò.',
      ).then(() => undefined),
    });
  };

  const handleRemove = () => {
    openConfirmDialog({
      title: 'Xóa thành viên',
      message: `Xóa thành viên ${member.email || member.userId} khỏi cửa hàng? Thao tác này không thể hoàn tác.`,
      variant: 'danger',
      onConfirm: () => run(
        () => removeMember(tenantId, member.userId).then(() => undefined),
        'Đã xóa thành viên.',
      ).then(() => onClose()),
    });
  };

  const info = [
    { label: 'Email', value: member.email || member.userId },
    { label: 'Vai trò', value: <StatusBadge label={roleLabel(member.role)} type={roleBadgeType(member.role)} size="sm" /> },
    { label: 'Trạng thái', value: <StatusBadge label={statusLabel(member.status)} type={statusBadgeType(member.status)} size="sm" /> },
    { label: 'Kích hoạt', value: member.isActive ? 'Có' : 'Không' },
    { label: 'Mời bởi', value: member.invitedByEmail || member.invitedBy || '-' },
    { label: 'Ngày mời', value: formatDate(member.invitedAt || member.createdAt) },
    { label: 'Chấp nhận', value: formatDate(member.acceptedAt) },
    { label: 'Đăng nhập cuối', value: formatDate(member.lastSignInAt) },
    { label: 'Xác nhận email', value: formatDate(member.confirmedAt) },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-detail-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-blue-600" />
            <h2 id="member-detail-title" className="text-lg font-semibold text-gray-900">Chi tiết thành viên</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-3">
            {loading ? (
              <SkeletonLoader variant="text" lines={6} />
            ) : (
              info.map((item, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="col-span-2 text-gray-900">{item.value}</span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-700">Thao tác</h3>

            <div className="space-y-3">
              {member.status === 'pending' && (
                <ActionButton
                  fullWidth
                  variant="secondary"
                  icon={<Send size={16} />}
                  onClick={handleResendInvite}
                  disabled={busy}
                  loading={busy}
                >
                  Gửi lại lời mời
                </ActionButton>
              )}

              <ActionButton
                fullWidth
                variant="secondary"
                icon={<RotateCcw size={16} />}
                onClick={handleResetPassword}
                disabled={busy}
                loading={busy}
              >
                Đặt lại mật khẩu
              </ActionButton>

              <div className="flex gap-2">
                <ActionButton
                  className="flex-1"
                  variant={member.isActive ? 'secondary' : 'primary'}
                  icon={member.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                  onClick={handleToggleActive}
                  disabled={busy}
                  loading={busy}
                >
                  {member.isActive ? 'Khóa' : 'Kích hoạt'}
                </ActionButton>
                <ActionButton
                  className="flex-1"
                  variant="secondary"
                  icon={<UserCog size={16} />}
                  onClick={handleChangeRole}
                  disabled={busy || role === member.role}
                  loading={busy}
                >
                  Đổi vai trò
                </ActionButton>
              </div>

              <SelectInput
                label="Vai trò"
                options={ROLES}
                value={role}
                onChange={(e) => setRole(e.target.value as TenantRole)}
                disabled={busy}
                fullWidth
              />

              <ActionButton
                fullWidth
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={handleRemove}
                disabled={busy || member.isOwner}
                loading={busy}
                title={member.isOwner ? 'Không thể xóa chủ sở hữu' : undefined}
              >
                Xóa thành viên
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
      {confirmDialog}
    </>
  );
};
