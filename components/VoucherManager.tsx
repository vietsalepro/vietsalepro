import React, { useEffect, useMemo, useState } from 'react';
import {
  Tag, Gift, Calendar, Percent, AlertTriangle, Trash2, Edit2, Plus, Save, X, Search,
} from 'lucide-react';
import {
  PromoCode,
  PromotionRule,
  PromoCodeKind,
  PromotionRuleConditionType,
  PromotionRuleBenefitType,
  PromoCodeTargetConditions,
} from '../types/billing';
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromotionRules,
  createPromotionRule,
  updatePromotionRule,
  deletePromotionRule,
  getPromoCodeUsageCounts,
} from '../services/promotionService';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useToast } from './ToastContainer';

const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const formatDate = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('vi-VN') : 'Không';

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (d?: string) => {
  if (!d) return Infinity;
  const diff = new Date(d + 'T00:00:00').getTime() - new Date(todayStr() + 'T00:00:00').getTime();
  return Math.ceil(diff / 86400000);
};

export const getPromoExpiryStatus = (validUntil?: string) => {
  const days = daysFromNow(validUntil);
  if (days < 0) return { label: 'Đã hết hạn', className: 'bg-red-100 text-red-700', days };
  if (days <= 7) return { label: `Sắp hết hạn (${days} ngày)`, className: 'bg-amber-100 text-amber-700', days };
  return { label: 'Còn hiệu lực', className: 'bg-green-100 text-green-700', days };
};

const kindLabel = (kind: PromoCodeKind) => (kind === 'percentage' ? 'Phần trăm' : 'Cố định');
const conditionLabel = (type: PromotionRuleConditionType) => {
  switch (type) {
    case 'tenant_age_days': return 'Tuổi tenant';
    case 'plan': return 'Gói';
    case 'specific_tenant': return 'Tenant cụ thể';
    case 'cycle_type': return 'Chu kỳ';
    default: return 'Luôn áp dụng';
  }
};
const benefitLabel = (type: PromotionRuleBenefitType) => {
  switch (type) {
    case 'bonus_months': return 'Tháng tặng';
    case 'discount_percentage': return 'Giảm %';
    default: return 'Giảm cố định';
  }
};

const emptyPromoCode: Omit<PromoCode, 'id' | 'createdAt' | 'updatedAt'> = {
  code: '',
  description: '',
  kind: 'fixed_amount',
  discountValue: 0,
  minInvoiceAmount: 0,
  validFrom: todayStr(),
  isActive: true,
};

const emptyPromotionRule: Omit<PromotionRule, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  conditionType: 'always',
  conditionValue: {},
  benefitType: 'bonus_months',
  benefitValue: 0,
  priority: 0,
  validFrom: todayStr(),
  isActive: true,
};

export default function VoucherManager() {
  const [activeTab, setActiveTab] = useState<'promoCodes' | 'promotionRules'>('promoCodes');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [rules, setRules] = useState<PromotionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState(emptyPromoCode);
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoTargetJson, setPromoTargetJson] = useState('{}');

  const [editingRule, setEditingRule] = useState<PromotionRule | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState(emptyPromotionRule);
  const [ruleConditionJson, setRuleConditionJson] = useState('{}');
  const [ruleSubmitting, setRuleSubmitting] = useState(false);

  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const { openConfirmDialog, confirmDialog } = useConfirmDialog();
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [codes, r] = await Promise.all([getPromoCodes(), getPromotionRules()]);
      setPromoCodes(codes);
      setRules(r);
      const counts = await Promise.all(codes.map((c) => getPromoCodeUsageCounts(c.id)));
      const map: Record<string, number> = {};
      codes.forEach((c, i) => { map[c.id] = counts[i]?.total ?? 0; });
      setUsageMap(map);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu voucher/promotion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredPromoCodes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? promoCodes.filter(c => c.code.toLowerCase().includes(term) || (c.description || '').toLowerCase().includes(term))
      : promoCodes;
  }, [promoCodes, search]);

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? rules.filter(r => r.name.toLowerCase().includes(term) || (r.description || '').toLowerCase().includes(term))
      : rules;
  }, [rules, search]);

  const openPromoForm = (code?: PromoCode) => {
    setShowPromoForm(true);
    if (code) {
      setEditingPromo(code);
      setPromoForm({ ...code });
      setPromoTargetJson(JSON.stringify(code.targetConditions || {}, null, 2));
    } else {
      setEditingPromo(null);
      setPromoForm({ ...emptyPromoCode });
      setPromoTargetJson('{}');
    }
  };

  const closePromoForm = () => {
    setShowPromoForm(false);
    setEditingPromo(null);
    setPromoForm(emptyPromoCode);
    setPromoTargetJson('{}');
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetConditions: PromoCodeTargetConditions | undefined;
    try {
      const parsed = JSON.parse(promoTargetJson);
      targetConditions = Object.keys(parsed).length ? parsed : undefined;
    } catch {
      setError('Điều kiện đối tượng JSON không hợp lệ.');
      return;
    }
    setPromoSubmitting(true);
    setError(null);
    try {
      const payload = { ...promoForm, targetConditions };
      if (editingPromo) {
        await updatePromoCode(editingPromo.id, payload);
      } else {
        await createPromoCode(payload);
      }
      closePromoForm();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Lưu voucher thất bại.');
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handlePromoDelete = (id: string) => {
    openConfirmDialog({
      title: 'Xóa voucher',
      message: 'Xóa voucher này?',
      onConfirm: async () => {
        setError(null);
        try {
          await deletePromoCode(id);
          await load();
          addToast({ type: 'success', message: 'Đã xóa voucher.' });
        } catch (err: any) {
          setError(err?.message || 'Xóa voucher thất bại.');
        }
      },
    });
  };

  const openRuleForm = (rule?: PromotionRule) => {
    setShowRuleForm(true);
    if (rule) {
      setEditingRule(rule);
      setRuleForm({ ...rule });
      setRuleConditionJson(JSON.stringify(rule.conditionValue || {}, null, 2));
    } else {
      setEditingRule(null);
      setRuleForm({ ...emptyPromotionRule });
      setRuleConditionJson('{}');
    }
  };

  const closeRuleForm = () => {
    setShowRuleForm(false);
    setEditingRule(null);
    setRuleForm(emptyPromotionRule);
    setRuleConditionJson('{}');
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let conditionValue: Record<string, any>;
    try {
      conditionValue = JSON.parse(ruleConditionJson);
    } catch {
      setError('Điều kiện JSON không hợp lệ.');
      return;
    }
    setRuleSubmitting(true);
    setError(null);
    try {
      const payload = { ...ruleForm, conditionValue };
      if (editingRule) {
        await updatePromotionRule(editingRule.id, payload);
      } else {
        await createPromotionRule(payload);
      }
      closeRuleForm();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Lưu promotion rule thất bại.');
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleRuleDelete = (id: string) => {
    openConfirmDialog({
      title: 'Xóa promotion rule',
      message: 'Xóa promotion rule này?',
      onConfirm: async () => {
        setError(null);
        try {
          await deletePromotionRule(id);
          await load();
          addToast({ type: 'success', message: 'Đã xóa promotion rule.' });
        } catch (err: any) {
          setError(err?.message || 'Xóa promotion rule thất bại.');
        }
      },
    });
  };

  const renderPromoForm = () => {
    if (!showPromoForm) return null;
    return (
      <form onSubmit={handlePromoSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {editingPromo ? 'Sửa voucher' : 'Tạo voucher'}
          </h3>
          <button type="button" onClick={closePromoForm} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mã voucher</label>
            <input
              type="text"
              value={promoForm.code}
              onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Loại</label>
            <select
              value={promoForm.kind}
              onChange={(e) => setPromoForm({ ...promoForm, kind: e.target.value as PromoCodeKind })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="fixed_amount">Giảm cố định</option>
              <option value="percentage">Giảm %</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Giá trị giảm</label>
            <input
              type="number"
              min={0}
              step={promoForm.kind === 'percentage' ? 0.5 : 1000}
              value={promoForm.discountValue}
              onChange={(e) => setPromoForm({ ...promoForm, discountValue: Math.max(0, Number(e.target.value)) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Giảm tối đa (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={promoForm.maxDiscountAmount ?? ''}
              onChange={(e) => setPromoForm({ ...promoForm, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hóa đơn tối thiểu (VNĐ)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={promoForm.minInvoiceAmount ?? 0}
              onChange={(e) => setPromoForm({ ...promoForm, minInvoiceAmount: Math.max(0, Number(e.target.value)) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hiệu lực từ</label>
            <input
              type="date"
              value={promoForm.validFrom}
              onChange={(e) => setPromoForm({ ...promoForm, validFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hiệu lực đến</label>
            <input
              type="date"
              value={promoForm.validUntil ?? ''}
              onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Lượt tối đa toàn hệ thống</label>
            <input
              type="number"
              min={1}
              value={promoForm.maxUsesTotal ?? ''}
              onChange={(e) => setPromoForm({ ...promoForm, maxUsesTotal: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Lượt tối đa / tenant</label>
            <input
              type="number"
              min={1}
              value={promoForm.maxUsesPerTenant ?? ''}
              onChange={(e) => setPromoForm({ ...promoForm, maxUsesPerTenant: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Mô tả</label>
          <textarea
            value={promoForm.description ?? ''}
            onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Điều kiện đối tượng (JSON)</label>
          <textarea
            value={promoTargetJson}
            onChange={(e) => setPromoTargetJson(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder={`{ "tenantAgeDays": 30, "plan": "vip", "tenantIds": ["uuid"] }`}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="promo-active"
            type="checkbox"
            checked={promoForm.isActive}
            onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="promo-active" className="text-gray-700">Đang kích hoạt</label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closePromoForm}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={promoSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {promoSubmitting ? 'Đang lưu...' : editingPromo ? 'Lưu thay đổi' : 'Tạo voucher'}
          </button>
        </div>
      </form>
    );
  };

  const renderRuleForm = () => {
    if (!showRuleForm) return null;
    return (
      <form onSubmit={handleRuleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {editingRule ? 'Sửa promotion rule' : 'Tạo promotion rule'}
          </h3>
          <button type="button" onClick={closeRuleForm} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Tên</label>
            <input
              type="text"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Điều kiện</label>
            <select
              value={ruleForm.conditionType}
              onChange={(e) => setRuleForm({ ...ruleForm, conditionType: e.target.value as PromotionRuleConditionType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="always">Luôn áp dụng</option>
              <option value="tenant_age_days">Tuổi tenant</option>
              <option value="plan">Gói</option>
              <option value="specific_tenant">Tenant cụ thể</option>
              <option value="cycle_type">Chu kỳ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Lợi ích</label>
            <select
              value={ruleForm.benefitType}
              onChange={(e) => setRuleForm({ ...ruleForm, benefitType: e.target.value as PromotionRuleBenefitType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="bonus_months">Tháng tặng</option>
              <option value="discount_percentage">Giảm %</option>
              <option value="discount_fixed_amount">Giảm cố định</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Giá trị lợi ích</label>
            <input
              type="number"
              min={0}
              step={ruleForm.benefitType === 'discount_percentage' ? 0.5 : 1}
              value={ruleForm.benefitValue}
              onChange={(e) => setRuleForm({ ...ruleForm, benefitValue: Math.max(0, Number(e.target.value)) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ưu tiên</label>
            <input
              type="number"
              min={0}
              value={ruleForm.priority}
              onChange={(e) => setRuleForm({ ...ruleForm, priority: Math.max(0, Number(e.target.value)) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hiệu lực từ</label>
            <input
              type="date"
              value={ruleForm.validFrom}
              onChange={(e) => setRuleForm({ ...ruleForm, validFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hiệu lực đến</label>
            <input
              type="date"
              value={ruleForm.validUntil ?? ''}
              onChange={(e) => setRuleForm({ ...ruleForm, validUntil: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Mô tả</label>
          <textarea
            value={ruleForm.description ?? ''}
            onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Giá trị điều kiện (JSON)</label>
          <textarea
            value={ruleConditionJson}
            onChange={(e) => setRuleConditionJson(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder={`{ "age_days": 30, "plan": "vip", "tenant_id": "uuid", "cycle_type": "yearly" }`}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="rule-active"
            type="checkbox"
            checked={ruleForm.isActive}
            onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="rule-active" className="text-gray-700">Đang kích hoạt</label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeRuleForm}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={ruleSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {ruleSubmitting ? 'Đang lưu...' : editingRule ? 'Lưu thay đổi' : 'Tạo rule'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('promoCodes')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'promoCodes' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Tag className="w-4 h-4 inline-block mr-1" /> Voucher
            </button>
            <button
              onClick={() => setActiveTab('promotionRules')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${activeTab === 'promotionRules' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Gift className="w-4 h-4 inline-block mr-1" /> Promotion rules
            </button>
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm voucher / rule..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => activeTab === 'promoCodes' ? openPromoForm() : openRuleForm()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'promoCodes' ? 'Tạo voucher' : 'Tạo rule'}
          </button>
        </div>
      </div>

      {activeTab === 'promoCodes' ? renderPromoForm() : renderRuleForm()}

      {activeTab === 'promoCodes' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-gray-700">
              Voucher <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">sắp hết hạn</span> trong 7 ngày và
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 ml-1">đã hết hạn</span> được làm nổi bật.
            </p>
          </div>
          {loading ? (
            <p className="p-6 text-gray-600">Đang tải...</p>
          ) : filteredPromoCodes.length === 0 ? (
            <p className="p-6 text-gray-600">Không có voucher.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Mã</th>
                    <th className="text-left px-4 py-3">Loại</th>
                    <th className="text-left px-4 py-3">Giá trị</th>
                    <th className="text-left px-4 py-3">Hiệu lực</th>
                    <th className="text-left px-4 py-3">Trạng thái</th>
                    <th className="text-right px-4 py-3">Đã dùng</th>
                    <th className="text-center px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPromoCodes.map((code) => {
                    const expiry = getPromoExpiryStatus(code.validUntil);
                    return (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{code.code}</div>
                          <div className="text-xs text-gray-500">{code.description || 'Không mô tả'}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{kindLabel(code.kind)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {code.kind === 'percentage' ? `${code.discountValue}%` : formatCurrency(code.discountValue)}
                          {code.maxDiscountAmount ? <div className="text-xs text-gray-500">tối đa {formatCurrency(code.maxDiscountAmount)}</div> : null}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(code.validFrom)} → {formatDate(code.validUntil)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${expiry.className}`}>
                            {expiry.days < 0 && <AlertTriangle className="w-3 h-3" />}
                            {expiry.label}
                          </span>
                          {!code.isActive && <span className="ml-1 inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Tắt</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{usageMap[code.id] ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openPromoForm(code)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePromoDelete(code.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-600">Đang tải...</p>
          ) : filteredRules.length === 0 ? (
            <p className="p-6 text-gray-600">Không có promotion rule.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Tên</th>
                    <th className="text-left px-4 py-3">Điều kiện</th>
                    <th className="text-left px-4 py-3">Lợi ích</th>
                    <th className="text-left px-4 py-3">Hiệu lực</th>
                    <th className="text-right px-4 py-3">Ưu tiên</th>
                    <th className="text-center px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRules.map((rule) => {
                    const expiry = getPromoExpiryStatus(rule.validUntil);
                    return (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{rule.name}</div>
                          <div className="text-xs text-gray-500">{rule.description || 'Không mô tả'}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {conditionLabel(rule.conditionType)}
                          <div className="text-xs text-gray-500 font-mono truncate max-w-[160px]">{JSON.stringify(rule.conditionValue)}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {benefitLabel(rule.benefitType)}: {rule.benefitValue}
                          {rule.benefitType === 'discount_percentage' && '%'}
                          {rule.benefitType === 'discount_fixed_amount' && 'đ'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(rule.validFrom)} → {formatDate(rule.validUntil)}
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${expiry.className} mt-1`}>{expiry.label}</span>
                          {!rule.isActive && <span className="ml-1 inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Tắt</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{rule.priority}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openRuleForm(rule)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRuleDelete(rule.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
