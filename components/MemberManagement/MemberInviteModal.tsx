import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { MasterModal } from '../MasterModal';
import { TextInput } from '../TextInput';
import { SelectInput } from '../SelectInput';
import { ActionButton } from '../ActionButton';
import { TenantRole } from '../../types/tenant';
import { inviteMemberByEmail } from '../../services/tenantService';

// ponytail: minimal single-email invite modal so P7 compiles and works.
// P8 will replace this with the full bulk-invite modal per HANDOFF_F33_P8.
interface MemberInviteModalProps {
  tenantId: string;
  onClose: () => void;
  onInvited?: () => void;
}

const ROLES: { value: TenantRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'inventory_manager', label: 'Quản lý kho' },
  { value: 'accountant', label: 'Kế toán' },
];

export const MemberInviteModal: React.FC<MemberInviteModalProps> = ({
  tenantId,
  onClose,
  onInvited,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TenantRole>('cashier');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      await inviteMemberByEmail(tenantId, trimmed, role);
      setEmail('');
      onInvited?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Mời thành viên thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MasterModal
      isOpen
      onClose={onClose}
      title="Mời thành viên"
      icon={<UserPlus size={20} />}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <ActionButton variant="ghost" onClick={onClose} disabled={submitting}>
            Hủy
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!email.trim()}
          >
            Mời
          </ActionButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <SelectInput
          label="Vai trò"
          options={ROLES}
          value={role}
          onChange={(e) => setRole(e.target.value as TenantRole)}
          fullWidth
        />
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
            {error}
          </p>
        )}
      </form>
    </MasterModal>
  );
};
