import React, { useEffect, useState } from 'react';
import { Building2, CreditCard, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useAdminList } from '../../hooks/useAdminList';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../components/ToastContainer';
import {
  BankAccount,
  CompanyInfo,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getCompanyInfo,
  setCompanyInfo,
} from '../../services/admin/billingAdminService';
import SubscriptionManager from '../../components/SubscriptionManager';

const PAGE_SIZE = 10;

const emptyAccount: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'> = {
  accountName: '',
  accountNumber: '',
  bankName: '',
  transferContent: '',
  isDefault: false,
  displayOrder: 0,
};

const emptyCompany: CompanyInfo = {
  companyName: '',
  brandName: '',
  taxCode: '',
  address: '',
  phone: '',
  email: '',
};

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <p className="text-sm text-gray-600">Trang {page} / {totalPages} · {total} kết quả</p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Trước
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

export default function Billing() {
  const [company, setCompany] = useState<CompanyInfo>(emptyCompany);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const {
    data: accounts,
    totalCount,
    isLoading,
    error,
    page,
    setPage,
    refresh,
  } = useAdminList<BankAccount>(
    async (params) => {
      // ponytail: getBankAccounts không hỗ trợ server-side pagination, nên paginate client-side.
      const all = await getBankAccounts();
      const start = (params.page - 1) * params.pageSize;
      return {
        items: all.slice(start, start + params.pageSize),
        totalCount: all.length,
      };
    },
    { initialPageSize: PAGE_SIZE },
  );

  const [form, setForm] = useState<Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>>(emptyAccount);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { openConfirmDialog, confirmDialog } = useConfirmDialog();
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setCompanyLoading(true);
    setCompanyError(null);
    getCompanyInfo()
      .then((c) => {
        if (!cancelled) setCompany(c);
      })
      .catch((err: any) => {
        if (!cancelled) setCompanyError(err?.message || 'Không thể tải thông tin công ty.');
      })
      .finally(() => {
        if (!cancelled) setCompanyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaving(true);
    setCompanyError(null);
    try {
      await setCompanyInfo(company);
      addToast({ type: 'success', message: 'Đã lưu thông tin công ty.' });
    } catch (err: any) {
      setCompanyError(err?.message || 'Lưu thông tin công ty thất bại.');
    } finally {
      setCompanySaving(false);
    }
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, displayOrder: editingId ? form.displayOrder : totalCount };
      if (editingId) {
        await updateBankAccount(editingId, payload);
      } else {
        await createBankAccount(payload);
      }
      setForm(emptyAccount);
      setEditingId(null);
      refresh();
      addToast({ type: 'success', message: editingId ? 'Đã cập nhật tài khoản.' : 'Đã thêm tài khoản.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Lưu tài khoản ngân hàng thất bại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (acc: BankAccount) => {
    setEditingId(acc.id);
    setForm({
      accountName: acc.accountName,
      accountNumber: acc.accountNumber,
      bankName: acc.bankName,
      transferContent: acc.transferContent,
      isDefault: acc.isDefault,
      displayOrder: acc.displayOrder,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyAccount);
  };

  const handleDelete = (id: string) => {
    openConfirmDialog({
      title: 'Xóa tài khoản ngân hàng',
      message: 'Xóa tài khoản ngân hàng này?',
      onConfirm: async () => {
        try {
          await deleteBankAccount(id);
          refresh();
          addToast({ type: 'success', message: 'Đã xóa tài khoản ngân hàng.' });
        } catch (err: any) {
          addToast({ type: 'error', message: err?.message || 'Xóa tài khoản ngân hàng thất bại.' });
        }
      },
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {companyError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {companyError}
        </div>
      )}

      <SubscriptionManager />

      {/* Company info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Thông tin công ty / thương hiệu</h2>
        </div>
        {companyLoading ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : (
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tên công ty</label>
                <input
                  type="text"
                  value={company.companyName}
                  onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                  placeholder="Công ty TNHH ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tên thương hiệu</label>
                <input
                  type="text"
                  value={company.brandName}
                  onChange={(e) => setCompany({ ...company, brandName: e.target.value })}
                  placeholder="VietSale Pro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mã số thuế (MST)</label>
                <input
                  type="text"
                  value={company.taxCode}
                  onChange={(e) => setCompany({ ...company, taxCode: e.target.value })}
                  placeholder="0123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  placeholder="Địa chỉ công ty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  placeholder="090xxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  placeholder="contact@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={companySaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {companySaving ? 'Đang lưu...' : 'Lưu thông tin công ty'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bank accounts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Tài khoản ngân hàng</h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitAccount} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tên chủ tài khoản</label>
              <input
                type="text"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                placeholder="NGUYEN VAN A"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Số tài khoản</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="1234567890"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ngân hàng</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="Vietcombank"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nội dung chuyển khoản</label>
              <input
                type="text"
                value={form.transferContent}
                onChange={(e) => setForm({ ...form, transferContent: e.target.value })}
                placeholder="Thanh toan hoa don {ma_hoa_don}"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              Tài khoản mặc định
            </label>
            <div className="flex-1" />
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm tài khoản'}
            </button>
          </div>
        </form>

        {isLoading && accounts.length === 0 ? (
          <p className="text-gray-600">Đang tải...</p>
        ) : accounts.length === 0 ? (
          <p className="text-gray-500 text-sm">Chưa có tài khoản ngân hàng nào.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Tên TK</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Số TK</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Ngân hàng</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Nội dung CK</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Mặc định</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td className="px-4 py-3 text-sm text-gray-800">{acc.accountName}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{acc.accountNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{acc.bankName}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{acc.transferContent}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{acc.isDefault ? 'Có' : 'Không'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(acc)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
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
            <Pagination page={page} pageSize={PAGE_SIZE} total={totalCount} onPageChange={setPage} />
          </>
        )}
      </div>

      {confirmDialog}
    </div>
  );
}
