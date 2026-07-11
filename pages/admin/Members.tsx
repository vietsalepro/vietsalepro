import React, { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { useAdminList } from '../../hooks/useAdminList';
import { MemberManagement } from '../../components/MemberManagement';
import { listAccounts } from '../../services/admin/tenantAdminService';
import { Tenant } from '../../types/tenant';

export default function Members() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  const {
    data: tenants,
    isLoading: tenantsLoading,
    searchTerm: tenantSearch,
    setSearchTerm: setTenantSearch,
    page,
    pageSize,
    setPage,
    totalCount,
  } = useAdminList<Tenant>(
    async (params) => {
      const result = await listAccounts({
        search: params.search,
        page: params.page,
        pageSize: params.pageSize,
      });
      return { items: result.accounts, totalCount: result.totalCount };
    },
    {
      initialPageSize: 20,
      debounceMs: 300,
    },
  );

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Quản lý thành viên
        </h1>
        <p className="text-sm text-gray-600 mt-1">Chọn cửa hàng để xem và quản lý thành viên.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Cửa hàng</label>
        <div className="relative">
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            disabled={tenantsLoading && tenants.length === 0}
            className="w-full md:w-96 appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- Chọn cửa hàng --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subdomain})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={tenantSearch}
            onChange={(e) => {
              setTenantSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm cửa hàng..."
            className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {totalCount > pageSize && (
            <p className="text-sm text-gray-600 self-center">
              Trang {page} · {totalCount} kết quả
            </p>
          )}
        </div>
      </div>

      {selectedTenant ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Thành viên của <span className="text-blue-600">{selectedTenant.name}</span>
            </h2>
          </div>
          <MemberManagement tenantId={selectedTenantId} />
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center text-gray-600">
          Vui lòng chọn một cửa hàng để xem danh sách thành viên.
        </div>
      )}
    </div>
  );
}
