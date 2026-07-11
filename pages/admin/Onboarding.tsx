import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { createAccount } from '../../services/admin/tenantAdminService';

const STEPS = [
  { id: 'welcome', label: 'Bắt đầu' },
  { id: 'account', label: 'Tài khoản' },
  { id: 'review', label: 'Xác nhận' },
  { id: 'done', label: 'Hoàn tất' },
];

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'vip', label: 'VIP' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    plan: 'free',
  });

  // ponytail: if user somehow revisits after success in the same session, redirect.
  if (step === STEPS.length - 1 && !loading && !error) {
    // Success state rendered below
  }

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập tên cửa hàng / tài khoản';
    if (!form.subdomain.trim()) return 'Vui lòng nhập subdomain';
    if (!/^[a-z0-9-]+$/.test(form.subdomain)) return 'Subdomain chỉ chứa chữ thường, số và dấu gạng ngang';
    return null;
  };

  const handleNext = () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createAccount({
        name: form.name.trim(),
        subdomain: form.subdomain.trim().toLowerCase(),
        plan: form.plan,
      });
      setStep(STEPS.length - 1);
    } catch (err: any) {
      setError(err?.message || 'Tạo tài khoản thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/admin/overview', { replace: true });
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="text-blue-600" size={28} />
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Khởi tạo tài khoản quản trị</h1>
            <p className="text-gray-600 text-sm">Hoàn thành các bước để bắt đầu sử dụng admin dashboard.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8" aria-label="Tiến trình onboarding">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  idx <= step ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {idx < step ? <CheckCircle size={16} /> : idx + 1}
              </div>
              <span
                className={`ml-2 text-xs hidden sm:block ${
                  idx <= step ? 'text-blue-700 font-medium' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${idx < step ? 'bg-blue-600' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-800">Chào mừng bạn đến với VietSale Pro Admin</h2>
            <p className="text-gray-600">
              Trình hướng dẫn này sẽ giúp bạn tạo tài khoản cửa hàng đầu tiên. Sau khi hoàn tất, bạn có thể quản lý
              sản phẩm, đơn hàng, thành viên và các cài đặt khác.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-800">Thông tin tài khoản</h2>
            <div>
              <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên cửa hàng / tài khoản
              </label>
              <input
                id="account-name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ví dụ: Sữa Cậu Ba"
              />
            </div>
            <div>
              <label htmlFor="account-subdomain" className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain
              </label>
              <div className="flex items-center">
                <input
                  id="account-subdomain"
                  type="text"
                  value={form.subdomain}
                  onChange={(e) => update('subdomain', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 lowercase"
                  placeholder="cua-hang"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 text-sm">
                  .vietsale.pro
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="account-plan" className="block text-sm font-medium text-gray-700 mb-1">
                Gói dịch vụ
              </label>
              <select
                id="account-plan"
                value={form.plan}
                onChange={(e) => update('plan', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLANS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-800">Xác nhận thông tin</h2>
            <dl className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              <div className="flex justify-between px-4 py-3">
                <dt className="text-sm text-gray-500">Tên tài khoản</dt>
                <dd className="text-sm font-medium text-gray-800">{form.name}</dd>
              </div>
              <div className="flex justify-between px-4 py-3">
                <dt className="text-sm text-gray-500">Subdomain</dt>
                <dd className="text-sm font-medium text-gray-800">{form.subdomain}.vietsale.pro</dd>
              </div>
              <div className="flex justify-between px-4 py-3">
                <dt className="text-sm text-gray-500">Gói dịch vụ</dt>
                <dd className="text-sm font-medium text-gray-800 uppercase">{form.plan}</dd>
              </div>
            </dl>
          </div>
        )}

        {isLastStep && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-lg font-medium text-gray-800">Tài khoản đã được tạo!</h2>
            <p className="text-gray-600">Bạn đã hoàn thành onboarding. Chuyển đến trang tổng quan để bắt đầu.</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0 || loading}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Quay lại
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Vào dashboard <ChevronRight size={16} />
            </button>
          ) : step === 2 ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Tạo tài khoản
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Tiếp theo <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
