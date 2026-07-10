import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Search,
  UserPlus,
  RotateCcw,
  Trash2,
  Eye,
  Power,
  PowerOff,
  Store,
} from 'lucide-react';
import { DataGrid, DataGridColumn, SortDirection } from './DataGrid';
import { TextInput } from './TextInput';
import { SelectInput } from './SelectInput';
import { ActionButton, PrimaryButton } from './ActionButton';
import { StatusBadge, StatusBadgeType } from './StatusBadge';
import { useDebounce } from '../hooks/useDebounce';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useToast } from './ToastContainer';
import { Navigate } from 'react-router-dom';
import { useTenant } from '../hooks/useTenant';
import {
  MemberWithEmail,
  TenantRole,
  SearchMembersParams,
} from '../types/tenant';
import {
  searchTenantMembers,
  updateMemberRole,
  toggleMemberActive,
  removeMember,
  resetMemberPassword,
} from '../services/tenantService';
import { MemberInviteModal } from './MemberManagement/MemberInviteModal';
import { MemberBulkActions } from './MemberManagement/MemberBulkActions';
import { MemberDetailDrawer } from './MemberManagement/MemberDetailDrawer';

const ROLES: TenantRole[] = ['admin', 'cashier', 'inventory_manager', 'accountant'];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const SORTABLE_KEYS: SearchMembersParams['sortBy'][] = ['email', 'role', 'status', 'created_at'];

const roleLabel = (role: TenantRole) => {
  switch (role) {
    case 'admin': return 'Admin';
    case 'cashier': return 'Thu ngân';
    case 'inventory_manager': return 'Quản lý kho';
    case 'accountant': return 'Kế toán';
    default: return role;
  }
};

const roleBadgeType = (role: TenantRole): StatusBadgeType => {
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

const statusBadgeType = (status?: string): StatusBadgeType => {
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

export interface MemberManagementProps {
  tenantId?: string;
  isTenantAdmin?: boolean;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  tenantId: propTenantId,
  isTenantAdmin,
}) => {
  const { tenant } = useTenant();
  const tenantId = propTenantId ?? (isTenantAdmin ? tenant?.id : undefined);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<TenantRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'active' | 'inactive' | ''>('');
  const [activeFilter, setActiveFilter] = useState<'yes' | 'no' | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<SearchMembersParams['sortBy']>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [detailMember, setDetailMember] = useState<MemberWithEmail | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();
  const { addToast } = useToast();

  const loadMembers = useCallback(async () => {
    if (!tenantId) {
      setMembers([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await searchTenantMembers({
        tenantId,
        search: debouncedSearch || undefined,
        role: roleFilter || null,
        status: statusFilter || null,
        isActive: activeFilter === 'yes' ? true : activeFilter === 'no' ? false : null,
        sortBy,
        sortDir,
        page,
        pageSize,
      });
      setMembers(result.members);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách thành viên.');
      setMembers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [tenantId, debouncedSearch, roleFilter, statusFilter, activeFilter, sortBy, sortDir, page, pageSize]);

  // Reset page when filters/search change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, activeFilter, pageSize]);

  // Clear selection when query or tenant changes.
  useEffect(() => {
    setSelectedIds([]);
  }, [tenantId, debouncedSearch, roleFilter, statusFilter, activeFilter, pageSize]);

  // Load members whenever dependencies change.
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Keep the open detail drawer in sync with the latest loaded data.
  useEffect(() => {
    if (detailMember) {
      const updated = members.find((m) => m.id === detailMember.id);
      if (updated && updated !== detailMember) {
        setDetailMember(updated);
      }
    }
  }, [members, detailMember]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);

  const handleSortChange = (key: string, direction: SortDirection) => {
    if (!SORTABLE_KEYS.includes(key as SearchMembersParams['sortBy'])) return;
    if (direction === 'none') {
      setSortBy('created_at');
      setSortDir('desc');
    } else {
      setSortBy(key as SearchMembersParams['sortBy']);
      setSortDir(direction);
    }
  };

  const handleRoleChange = async (userId: string, role: TenantRole) => {
    if (!tenantId) return;
    setBusyUserId(userId);
    try {
      await updateMemberRole(tenantId, userId, role);
      addToast({ type: 'success', message: 'Đã cập nhật vai trò.' });
      await loadMembers();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Đổi vai trò thất bại.' });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    if (!tenantId) return;
    setBusyUserId(userId);
    try {
      await toggleMemberActive(tenantId, userId, isActive);
      addToast({ type: 'success', message: isActive ? 'Đã kích hoạt thành viên.' : 'Đã vô hiệu hóa thành viên.' });
      await loadMembers();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Thay đổi trạng thái thất bại.' });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!tenantId) return;
    setBusyUserId(userId);
    try {
      const res = await resetMemberPassword(tenantId, userId);
      addToast({
        type: 'success',
        message: res?.link
          ? `Link ${res.action}: ${res.link}`
          : `Đã gửi yêu cầu ${res?.action || 'reset'}.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Đặt lại mật khẩu thất bại.' });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemoveMember = useCallback((userId: string, email?: string) => {
    if (!tenantId) return;
    openConfirmDialog({
      title: 'Xóa thành viên',
      message: `Xóa thành viên "${email || userId}" khỏi cửa hàng?`,
      variant: 'danger',
      onConfirm: async () => {
        setBusyUserId(userId);
        try {
          await removeMember(tenantId, userId);
          addToast({ type: 'success', message: 'Đã xóa thành viên.' });
          await loadMembers();
        } catch (err: any) {
          addToast({ type: 'error', message: err?.message || 'Xóa thành viên thất bại.' });
        } finally {
          setBusyUserId(null);
        }
      },
    });
  }, [tenantId, openConfirmDialog, addToast, loadMembers]);

  const columns = useMemo<DataGridColumn<MemberWithEmail>[]>(() => [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (m) => (
        <span className="text-sm text-gray-900 truncate" title={m.email || m.userId}>
          {m.email || m.userId}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Vai trò',
      sortable: true,
      width: '150px',
      render: (m) => (
        <select
          value={m.role}
          onChange={(e) => handleRoleChange(m.userId, e.target.value as TenantRole)}
          disabled={busyUserId === m.userId}
          className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          onClick={(e) => e.stopPropagation()}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      sortable: true,
      width: '130px',
      render: (m) => <StatusBadge label={statusLabel(m.status)} type={statusBadgeType(m.status)} size="sm" />,
    },
    {
      key: 'isActive',
      label: 'Kích hoạt',
      width: '100px',
      align: 'center',
      render: (m) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(m.userId, !m.isActive);
          }}
          disabled={busyUserId === m.userId}
          className={[
            'inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors',
            m.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100',
          ].join(' ')}
          aria-label={m.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
        >
          {m.isActive ? <Power size={18} /> : <PowerOff size={18} />}
        </button>
      ),
    },
    {
      key: 'invitedBy',
      label: 'Mời bởi',
      width: '160px',
      render: (m) => <span className="text-sm text-gray-600">{m.invitedByEmail || m.invitedBy || '-'}</span>,
    },
    {
      key: 'invitedAt',
      label: 'Ngày mời',
      width: '120px',
      render: (m) => <span className="text-sm text-gray-600">{formatDate(m.invitedAt || m.createdAt)}</span>,
    },
    {
      key: 'lastSignInAt',
      label: 'Đăng nhập cuối',
      width: '140px',
      render: (m) => <span className="text-sm text-gray-600">{formatDate(m.lastSignInAt)}</span>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      width: '160px',
      align: 'right',
      sticky: 'right',
      render: (m) => {
        const isBusy = busyUserId === m.userId;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<Eye size={16} />}
              onClick={() => setDetailMember(m)}
              disabled={isBusy}
              aria-label="Chi tiết"
            />
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={16} />}
              onClick={() => handleResetPassword(m.userId)}
              loading={isBusy}
              disabled={isBusy}
              aria-label="Reset mật khẩu"
            />
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<Trash2 size={16} />}
              onClick={() => handleRemoveMember(m.userId, m.email)}
              disabled={isBusy}
              aria-label="Xóa"
            />
          </div>
        );
      },
    },
  ], [busyUserId, handleRoleChange, handleToggleActive, handleResetPassword, handleRemoveMember]);

  const roleOptions = useMemo(() => [
    { value: '', label: 'Tất cả vai trò' },
    { value: 'admin', label: 'Admin' },
    { value: 'cashier', label: 'Thu ngân' },
    { value: 'inventory_manager', label: 'Quản lý kho' },
    { value: 'accountant', label: 'Kế toán' },
  ], []);

  const statusOptions = useMemo(() => [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Ngừng' },
  ], []);

  const activeOptions = useMemo(() => [
    { value: '', label: 'Kích hoạt: Tất cả' },
    { value: 'yes', label: 'Đang kích hoạt' },
    { value: 'no', label: 'Đã vô hiệu' },
  ], []);

  const toolbar = useMemo(() => (
    <div className="flex flex-col xl:flex-row xl:items-center gap-3 p-3 bg-white border-b border-gray-100">
      <div className="flex flex-1 flex-col sm:flex-row gap-2">
        <div className="sm:w-64">
          <TextInput
            placeholder="Tìm theo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefixIcon={<Search size={18} />}
            size="md"
            fullWidth
          />
        </div>
        <div className="sm:w-44">
          <SelectInput
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as TenantRole | '')}
            size="md"
            fullWidth
          />
        </div>
        <div className="sm:w-44">
          <SelectInput
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'pending' | 'active' | 'inactive' | '')}
            size="md"
            fullWidth
          />
        </div>
        <div className="sm:w-44">
          <SelectInput
            options={activeOptions}
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'yes' | 'no' | '')}
            size="md"
            fullWidth
          />
        </div>
      </div>
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <MemberBulkActions
            tenantId={tenantId}
            selectedMembers={members.filter((m) => selectedIds.includes(m.id))}
            onAction={loadMembers}
            disabled={loading}
          />
          <PrimaryButton
            size="md"
            icon={<UserPlus size={18} />}
            onClick={() => setInviteOpen(true)}
            disabled={!tenantId}
          >
            Mời thành viên
          </PrimaryButton>
        </div>
      </div>
    </div>
  ), [search, roleFilter, statusFilter, activeFilter, tenantId, roleOptions, statusOptions, activeOptions]);

  if (isTenantAdmin && tenant?.plan !== 'vip') {
    return <Navigate to="/settings" replace />;
  }

  if (!tenantId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Store size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Chưa chọn cửa hàng</h3>
        <p className="text-sm text-gray-500">Vui lòng chọn một cửa hàng để quản lý thành viên.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <DataGrid
        embedded
        data={members}
        columns={columns}
        keyExtractor={(m) => m.id}
        loading={loading}
        error={error}
        onRetry={loadMembers}
        selectedRows={selectedIds}
        onSelectionChange={(ids) => setSelectedIds(ids as string[])}
        sortKey={sortBy}
        sortDirection={sortDir}
        onSortChange={handleSortChange}
        pagination={{
          currentPage: page,
          totalPages,
          totalCount,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showInfo: true,
        }}
        toolbar={toolbar}
        emptyTitle="Không có thành viên"
        emptyDescription="Chưa có thành viên nào trong cửa hàng này."
        ariaLabel="Danh sách thành viên"
      />
      {inviteOpen && (
        <MemberInviteModal
          tenantId={tenantId}
          existingMembers={members}
          onClose={() => setInviteOpen(false)}
          onInvited={loadMembers}
        />
      )}
      {detailMember && (
        <MemberDetailDrawer
          member={detailMember}
          tenantId={tenantId}
          onClose={() => setDetailMember(null)}
          onChanged={loadMembers}
        />
      )}
      {confirmDialog}
    </div>
  );
};
