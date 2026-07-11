import { useParams } from 'react-router-dom';

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-800">Tenant Detail: {id}</h1>
        <p className="text-gray-600 mt-2">ponytail: placeholder page for tenant {id}.</p>
      </div>
    </div>
  );
}
