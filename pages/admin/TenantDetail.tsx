import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SubdomainManagerPanel from '../../components/admin/SubdomainManagerPanel';
import CustomDomainPanel from '../../components/admin/CustomDomainPanel';
import { getAccount } from '../../services/admin/tenantAdminService';
import { Tenant } from '../../types/tenant';

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Thiếu ID tenant.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getAccount(id)
      .then((t) => {
        if (cancelled) return;
        if (!t) {
          setError('Không tìm thấy tenant.');
        } else {
          setTenant(t);
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Không thể tải tenant.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const handleUpdated = (updated: Tenant) => {
    setTenant(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải tenant...
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => navigate('/admin/tenants')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </button>
          </div>
          <p className="text-red-600">{error || 'Không tìm thấy tenant.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/tenants"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">{tenant.name}</h1>
        </div>
      </div>

      <SubdomainManagerPanel tenant={tenant} onUpdated={handleUpdated} />

      {tenant.plan === 'vip' && <CustomDomainPanel tenant={tenant} onUpdated={handleUpdated} />}
    </div>
  );
}
