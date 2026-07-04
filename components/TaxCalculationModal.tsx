import React, { useState, useMemo } from 'react';
import { X, Calculator, Info, CheckCircle2, FileSpreadsheet, Download } from 'lucide-react';
import { Order, AppSettings } from '../types';
import * as XLSX from 'xlsx';
import { useRefactoredTaxModal } from '../features';
import './TaxCalculationModal.css';
import { MasterModal } from './MasterModal';
import { SectionBox, SectionHeader, SectionContent } from './SectionBox';
import { TextInput } from './TextInput';
import { SelectInput } from './SelectInput';
import { ActionButton } from './ActionButton';
import { SummaryRow } from './SummaryRow';

const TAX_THRESHOLD = 1_000_000_000;

type TaxMethod = 'percentage' | 'declaration';

interface IndustryRate {
  id: string;
  name: string;
  vat: number;
  pit: number;
}

const INDUSTRY_RATES: IndustryRate[] = [
  { id: 'distribution', name: '1. Phân phối, cung cấp hàng hóa (Bán buôn, bán lẻ...)', vat: 0.01, pit: 0.005 },
  { id: 'production', name: '2. Sản xuất, vận tải, dịch vụ gắn hàng hóa', vat: 0.03, pit: 0.015 },
  { id: 'service_no_material', name: '3. Dịch vụ, xây dựng không bao thầu NVL', vat: 0.05, pit: 0.02 },
  { id: 'entertainment', name: '4. Kinh doanh giải trí, nội dung số', vat: 0.05, pit: 0.05 },
  { id: 'real_estate', name: '5. Cho thuê bất động sản', vat: 0.05, pit: 0.05 },
  { id: 'others', name: '6. Các ngành nghề còn lại', vat: 0.02, pit: 0.01 },
];

const getDeclarationPitRate = (profit: number): number => {
  if (profit <= 3_000_000_000) return 0.15;
  if (profit <= 50_000_000_000) return 0.17;
  return 0.20;
};

interface TaxCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  settings: AppSettings | null;
  selectedYear: number;
}

interface TaxCalculationContentProps {
  orders: Order[];
  settings: AppSettings | null;
  selectedYear: number;
}

export const TaxCalculationContent: React.FC<TaxCalculationContentProps> = ({
  orders,
  settings,
  selectedYear,
}) => {
  const [taxMethod, setTaxMethod] = useState<TaxMethod>('percentage');
  const [industryId, setIndustryId] = useState<string>(INDUSTRY_RATES[0].id);
  const [totalCost, setTotalCost] = useState<number>(0);

  const selectedIndustry = useMemo(
    () => INDUSTRY_RATES.find(i => i.id === industryId) || INDUSTRY_RATES[0],
    [industryId]
  );

  const yearlyData = useMemo(() => {
    const filtered = orders.filter(o => new Date(o.date).getFullYear() === selectedYear);
    const totalRevenue = filtered.reduce((sum, o) => sum + o.totalAmount, 0);
    const isTaxable = totalRevenue > TAX_THRESHOLD;

    let vatAmount = 0;
    let pitAmount = 0;
    let profit = 0;
    let pitRate = 0;

    if (isTaxable) {
      vatAmount = totalRevenue * selectedIndustry.vat;
      if (taxMethod === 'percentage') {
        pitAmount = totalRevenue * selectedIndustry.pit;
      } else {
        profit = Math.max(0, totalRevenue - totalCost);
        pitRate = getDeclarationPitRate(profit);
        pitAmount = profit * pitRate;
      }
    }

    return {
      totalRevenue,
      isTaxable,
      vatAmount,
      pitAmount,
      profit,
      pitRate,
      totalTax: vatAmount + pitAmount,
      orderCount: filtered.length,
      orders: filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
  }, [orders, selectedYear, taxMethod, selectedIndustry, totalCost]);

  const exportExcel = (type: 'S1' | 'S2') => {
    const isS1 = type === 'S1';
    const header = [
      [isS1 ? 'Mẫu số S1-HKD' : 'Mẫu số S2-HKD'],
      ['Ban hành theo Thông tư 88/2021/TT-BTC'],
      [],
      [`Chủ hộ: ${settings?.storeName || ''}`],
      [`MST: ${settings?.taxCode || ''}`],
      [`Năm: ${selectedYear}`],
      [],
      [isS1 ? 'SỔ NHẬT KÝ CHUNG' : 'SỔ CHI TIẾT DOANH THU'],
      []
    ];

    const body = isS1 
      ? yearlyData.orders.map(o => [new Date(o.date).toLocaleDateString('vi-VN'), o.id, 'Doanh thu', o.totalAmount, 0])
      : yearlyData.orders.map(o => [new Date(o.date).toLocaleDateString('vi-VN'), o.id, 'Doanh thu', 1, o.totalAmount]);

    const ws = XLSX.utils.aoa_to_sheet([...header, body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `So_${type}_HKD_${selectedYear}.xlsx`);
  };

  return (
    <div className="w-full h-full space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Doanh thu năm" value={yearlyData.totalRevenue} sub={`${yearlyData.orderCount} đơn`} dark />
        <MetricCard label="Thuế GTGT" value={yearlyData.vatAmount} sub={`Mức ${(selectedIndustry.vat * 100)}%`} />
        <MetricCard label="Thuế TNCN" value={yearlyData.pitAmount} sub={taxMethod === 'percentage' ? `Mức ${(selectedIndustry.pit * 100)}%` : `Mức ${(yearlyData.pitRate * 100)}%`} />
        <MetricCard label="Tổng thuế nộp" value={yearlyData.totalTax} sub={`Năm ${selectedYear}`} primary />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Configuration */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h3 className="vsp-font-bold vsp-text-base text-slate-900">Cấu hình tính thuế</h3>
          </div>

          {!yearlyData.isTaxable ? (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <p className="vsp-text-sm vsp-font-regular text-emerald-800">
                Doanh thu <strong>dưới 1 tỷ/năm</strong>. Bạn thuộc diện miễn thuế GTGT & TNCN.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MethodBtn active={taxMethod === 'percentage'} onClick={() => setTaxMethod('percentage')} title="A. Khoán doanh thu" desc="Nhanh, không cần chi phí" />
                <MethodBtn active={taxMethod === 'declaration'} onClick={() => setTaxMethod('declaration')} title="B. Kê khai thực tế" desc="Tính trên lãi (cần hóa đơn)" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="vsp-text-xxxs vsp-font-bold uppercase tracking-widest text-slate-400 ml-1">Ngành nghề kinh doanh</label>
                  <select
                    value={industryId}
                    onChange={(e) => setIndustryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 vsp-text-sm vsp-font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  >
                    {INDUSTRY_RATES.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                  </select>
                </div>

                {taxMethod === 'declaration' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="vsp-text-xxxs vsp-font-bold uppercase tracking-widest text-slate-400 ml-1">Tổng chi phí hợp lệ (₫)</label>
                    <input
                      type="number"
                      value={totalCost}
                      onChange={(e) => setTotalCost(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 vsp-text-sm vsp-font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                      placeholder="Nhập chi phí có hóa đơn..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions & Notes */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
            <h3 className="vsp-font-bold vsp-text-base flex items-center gap-2 mb-4">
              <Download className="w-5 h-5" />
              Tải sổ sách (TT88)
            </h3>
            <div className="space-y-2">
              <button onClick={() => exportExcel('S1')} className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 p-4 rounded-2xl vsp-text-xs vsp-font-bold border border-white/10 transition-all">
                <span>Sổ nhật ký chung (S1)</span>
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button onClick={() => exportExcel('S2')} className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 p-4 rounded-2xl vsp-text-xs vsp-font-bold border border-white/10 transition-all">
                <span>Sổ chi tiết doanh thu (S2)</span>
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <h3 className="vsp-text-xs vsp-font-bold text-slate-900 flex items-center gap-2 mb-4 uppercase tracking-widest">
              <Info className="w-4 h-4 text-indigo-600" />
              Lưu ý kê khai
            </h3>
            <ul className="space-y-3 vsp-text-xxs text-slate-500 leading-relaxed vsp-font-medium">
              <li className="flex gap-2"><span className="text-indigo-600 vsp-font-bold">•</span> Hạn nộp: Cuối tháng đầu quý sau.</li>
              <li className="flex gap-2"><span className="text-indigo-600 vsp-font-bold">•</span> Kênh: eTax Mobile hoặc Dịch vụ công.</li>
              <li className="flex gap-2"><span className="text-indigo-600 vsp-font-bold">•</span> Chứng từ: Lưu trữ ít nhất 10 năm.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, sub, dark, primary }: { label: string, value: number, subTextText?: string, sub?: string, dark?: boolean, primary?: boolean }) => (
  <div className={`p-5 rounded-3xl shadow-sm transition-all hover:scale-[1.02] ${dark ? 'bg-slate-900 text-white' : primary ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>
    <p className={`vsp-text-xxxs vsp-font-bold uppercase tracking-widest ${dark ? 'text-slate-400' : primary ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</p>
    <div className="mt-2 vsp-text-2xl vsp-font-bold">{value.toLocaleString('vi-VN')} ₫</div>
    <p className={`mt-2 vsp-text-xxxs ${dark ? 'text-slate-500' : primary ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</p>
  </div>
);

const MethodBtn = ({ active, onClick, title, desc }: { active: boolean, onClick: () => void, title: string, desc: string }) => (
  <button
    onClick={onClick}
    className={`text-left p-4 rounded-2xl border-2 transition-all ${active ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
  >
    <p className="vsp-font-bold vsp-text-sm text-slate-900">{title}</p>
    <p className="vsp-text-xxxs text-slate-500 mt-1 leading-relaxed">{desc}</p>
  </button>
);

/* ═══════════════════════════════════════════════════════════════
 *  V2 — Design System Path
 *  Uses: MasterModal, SectionBox, TextInput, SelectInput,
 *        ActionButton, SummaryRow
 *  ═══════════════════════════════════════════════════════════════ */

const MetricCardV2 = ({ label, value, sub, dark, primary }: { label: string, value: number, sub?: string, dark?: boolean, primary?: boolean }) => (
  <div className={`tax-calc-metric-card ${dark ? 'tax-calc-metric-card--dark' : primary ? 'tax-calc-metric-card--primary' : 'tax-calc-metric-card--default'}`}>
    <p className="tax-calc-metric-label">{label}</p>
    <div className="tax-calc-metric-value">{value.toLocaleString('vi-VN')} ₫</div>
    <p className="tax-calc-metric-sub">{sub}</p>
  </div>
);

const MethodBtnV2 = ({ active, onClick, title, desc }: { active: boolean, onClick: () => void, title: string, desc: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`tax-calc-method-btn ${active ? 'tax-calc-method-btn--active' : ''}`}
  >
    <p className="tax-calc-method-title">{title}</p>
    <p className="tax-calc-method-desc">{desc}</p>
  </button>
);

export const TaxCalculationContentV2: React.FC<TaxCalculationContentProps> = ({
  orders,
  settings,
  selectedYear,
}) => {
  const [taxMethod, setTaxMethod] = useState<TaxMethod>('percentage');
  const [industryId, setIndustryId] = useState<string>(INDUSTRY_RATES[0].id);
  const [totalCost, setTotalCost] = useState<number>(0);

  const selectedIndustry = useMemo(
    () => INDUSTRY_RATES.find(i => i.id === industryId) || INDUSTRY_RATES[0],
    [industryId]
  );

  const yearlyData = useMemo(() => {
    const filtered = orders.filter(o => new Date(o.date).getFullYear() === selectedYear);
    const totalRevenue = filtered.reduce((sum, o) => sum + o.totalAmount, 0);
    const isTaxable = totalRevenue > TAX_THRESHOLD;

    let vatAmount = 0;
    let pitAmount = 0;
    let profit = 0;
    let pitRate = 0;

    if (isTaxable) {
      vatAmount = totalRevenue * selectedIndustry.vat;
      if (taxMethod === 'percentage') {
        pitAmount = totalRevenue * selectedIndustry.pit;
      } else {
        profit = Math.max(0, totalRevenue - totalCost);
        pitRate = getDeclarationPitRate(profit);
        pitAmount = profit * pitRate;
      }
    }

    return {
      totalRevenue,
      isTaxable,
      vatAmount,
      pitAmount,
      profit,
      pitRate,
      totalTax: vatAmount + pitAmount,
      orderCount: filtered.length,
      orders: filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
  }, [orders, selectedYear, taxMethod, selectedIndustry, totalCost]);

  const exportExcel = (type: 'S1' | 'S2') => {
    const isS1 = type === 'S1';
    const header = [
      [isS1 ? 'Mẫu số S1-HKD' : 'Mẫu số S2-HKD'],
      ['Ban hành theo Thông tư 88/2021/TT-BTC'],
      [],
      [`Chủ hộ: ${settings?.storeName || ''}`],
      [`MST: ${settings?.taxCode || ''}`],
      [`Năm: ${selectedYear}`],
      [],
      [isS1 ? 'SỔ NHẬT KÝ CHUNG' : 'SỔ CHI TIẾT DOANH THU'],
      []
    ];

    const body = isS1
      ? yearlyData.orders.map(o => [new Date(o.date).toLocaleDateString('vi-VN'), o.id, 'Doanh thu', o.totalAmount, 0])
      : yearlyData.orders.map(o => [new Date(o.date).toLocaleDateString('vi-VN'), o.id, 'Doanh thu', 1, o.totalAmount]);

    const ws = XLSX.utils.aoa_to_sheet([...header, body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, `So_${type}_HKD_${selectedYear}.xlsx`);
  };

  const industryOptions = INDUSTRY_RATES.map(ind => ({ value: ind.id, label: ind.name }));

  return (
    <div className="tax-calc-content">
      <div className="tax-calc-metrics">
        <MetricCardV2 label="Doanh thu năm" value={yearlyData.totalRevenue} sub={`${yearlyData.orderCount} đơn`} dark />
        <MetricCardV2 label="Thuế GTGT" value={yearlyData.vatAmount} sub={`Mức ${(selectedIndustry.vat * 100)}%`} />
        <MetricCardV2 label="Thuế TNCN" value={yearlyData.pitAmount} sub={taxMethod === 'percentage' ? `Mức ${(selectedIndustry.pit * 100)}%` : `Mức ${(yearlyData.pitRate * 100)}%`} />
        <MetricCardV2 label="Tổng thuế nộp" value={yearlyData.totalTax} sub={`Năm ${selectedYear}`} primary />
      </div>

      <div className="tax-calc-grid">
        <SectionBox>
          <SectionHeader title="Cấu hình tính thuế" subtitle="Chọn phương pháp và ngành nghề" />
          <SectionContent>
            {!yearlyData.isTaxable ? (
              <div className="tax-calc-exempt">
                <CheckCircle2 className="tax-calc-exempt-icon" />
                <p className="tax-calc-exempt-text">
                  Doanh thu <strong>dưới 1 tỷ/năm</strong>. Bạn thuộc diện miễn thuế GTGT & TNCN.
                </p>
              </div>
            ) : (
              <div className="tax-calc-form">
                <div className="tax-calc-methods">
                  <MethodBtnV2 active={taxMethod === 'percentage'} onClick={() => setTaxMethod('percentage')} title="A. Khoán doanh thu" desc="Nhanh, không cần chi phí" />
                  <MethodBtnV2 active={taxMethod === 'declaration'} onClick={() => setTaxMethod('declaration')} title="B. Kê khai thực tế" desc="Tính trên lãi (cần hóa đơn)" />
                </div>

                <SelectInput
                  label="Ngành nghề kinh doanh"
                  options={industryOptions}
                  value={industryId}
                  onChange={(e) => setIndustryId(e.target.value)}
                  fullWidth
                />

                {taxMethod === 'declaration' && (
                  <TextInput
                    label="Tổng chi phí hợp lệ (₫)"
                    type="number"
                    min={0}
                    value={totalCost}
                    onChange={(e) => setTotalCost(Math.max(0, Number(e.target.value)))}
                    placeholder="Nhập chi phí có hóa đơn..."
                    fullWidth
                  />
                )}

                <div className="tax-calc-summary">
                  <SummaryRow label="Thuế GTGT" value={`${yearlyData.vatAmount.toLocaleString('vi-VN')} ₫`} />
                  <SummaryRow label="Thuế TNCN" value={`${yearlyData.pitAmount.toLocaleString('vi-VN')} ₫`} />
                  <SummaryRow label="Tổng thuế nộp" value={`${yearlyData.totalTax.toLocaleString('vi-VN')} ₫`} bold />
                </div>
              </div>
            )}
          </SectionContent>
        </SectionBox>

        <div className="tax-calc-actions">
          <SectionBox className="tax-calc-export-panel">
            <SectionHeader title="Tải sổ sách (TT88)" />
            <SectionContent>
              <div className="tax-calc-export-list">
                <button type="button" onClick={() => exportExcel('S1')} className="tax-calc-export-btn">
                  <span>Sổ nhật ký chung (S1)</span>
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => exportExcel('S2')} className="tax-calc-export-btn">
                  <span>Sổ chi tiết doanh thu (S2)</span>
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>
            </SectionContent>
          </SectionBox>

          <SectionBox>
            <SectionHeader title="Lưu ý kê khai" />
            <SectionContent>
              <ul className="tax-calc-notes">
                <li className="tax-calc-note"><span className="tax-calc-note-bullet">•</span> Hạn nộp: Cuối tháng đầu quý sau.</li>
                <li className="tax-calc-note"><span className="tax-calc-note-bullet">•</span> Kênh: eTax Mobile hoặc Dịch vụ công.</li>
                <li className="tax-calc-note"><span className="tax-calc-note-bullet">•</span> Chứng từ: Lưu trữ ít nhất 10 năm.</li>
              </ul>
            </SectionContent>
          </SectionBox>
        </div>
      </div>
    </div>
  );
};

export const TaxCalculationModal: React.FC<TaxCalculationModalProps> = ({
  isOpen,
  onClose,
  orders,
  settings,
  selectedYear,
}) => {
  if (!isOpen) return null;

  /* ═══════════════════════════════════════════════════════════════
   *  V1 — Legacy Path (Flag OFF)
   *  ═══════════════════════════════════════════════════════════════ */
  if (!useRefactoredTaxModal) {
    return (
      <div className="vsp-modal-sync fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-50 w-full max-w-6xl rounded-[32px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-white/20">
          <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h3 className="vsp-text-xl vsp-font-bold text-slate-900">Tính thuế doanh thu {selectedYear}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <TaxCalculationContent orders={orders} settings={settings} selectedYear={selectedYear} />
          </div>

          <div className="px-8 py-4 bg-white border-t border-slate-100 flex justify-end">
            <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl vsp-text-xs vsp-font-bold shadow-lg transition-all active:scale-95">
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
   *  V2 — Refactored Path (Flag ON)
   *  ═══════════════════════════════════════════════════════════════ */
  return (
    <MasterModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={`Tính thuế doanh thu ${selectedYear}`}
      icon={<Calculator className="w-5 h-5" />}
      accentColor="#4f46e5"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Đóng
          </ActionButton>
          <ActionButton variant="primary" onClick={() => { /* Tính toán tự động theo state */ }}>
            Tính thuế
          </ActionButton>
        </>
      }
    >
      <TaxCalculationContentV2 orders={orders} settings={settings} selectedYear={selectedYear} />
    </MasterModal>
  );
};
