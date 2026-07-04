import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator, Calendar, Info, AlertTriangle,
  CheckCircle2, Sparkles
} from 'lucide-react';
import { Order, AppSettings } from '../types';
import { supabaseService } from '../services/supabaseService';
import { TaxCalculationContentV2 } from '../components/TaxCalculationModal';
import { LoadingState } from '../components/LoadingState';
import { PageLayout } from '../components/shared/PageLayout';
import './TaxCalculation.css';

// Ngưỡng miễn thuế: Doanh thu năm từ 1 tỷ đồng trở xuống được miễn thuế.
const TAX_THRESHOLD = 1_000_000_000;

export const TaxCalculation: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ordersData, settingsData] = await Promise.all([
          supabaseService.getOrders(),
          supabaseService.getSettings()
        ]);
        setOrders(ordersData);
        setSettings(settingsData);
      } catch (error) {
        console.error("Error fetching data for tax calculation:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    orders.forEach(o => {
      yearsSet.add(new Date(o.date).getFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [orders]);

  const yearlyData = useMemo(() => {
    const filtered = orders.filter(o => new Date(o.date).getFullYear() === selectedYear);
    const totalRevenue = filtered.reduce((sum, o) => sum + o.totalAmount, 0);
    const isTaxable = totalRevenue > TAX_THRESHOLD;

    return {
      totalRevenue,
      isTaxable,
      orderCount: filtered.length,
      orders: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(b.date).getTime())
    };
  }, [orders, selectedYear]);

  const getNextTaxPeriod = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const quarter = Math.ceil(currentMonth / 3);
    const deadlineMonth = (quarter * 3) + 1;
    const deadlineDate = new Date(currentYear, deadlineMonth, 0);
    return `Quý ${quarter}/${currentYear} (Hạn nộp: ${deadlineDate.toLocaleDateString('vi-VN')})`;
  };

  if (isLoading) {
    return <LoadingState className="tax-page__loading" message="Đang tính toán dữ liệu thuế..." />;
  }

  return (
    <PageLayout>
      <div className="tax-page">
        <div className="tax-page__header-main">
          <span className="tax-page__icon">
            <Calculator className="w-6 h-6" />
          </span>
          <div>
            <h2 className="tax-page__title">Thuế doanh thu HKD {selectedYear}</h2>
            <div className="tax-page__status">
              <div className={`tax-page__status-dot ${yearlyData.isTaxable ? 'tax-page__status-dot--taxable' : 'tax-page__status-dot--exempt'}`} />
              <span className="tax-page__status-label">
                {yearlyData.isTaxable ? 'Diện kê khai nộp thuế' : 'Diện miễn thuế (< 1 tỷ)'}
              </span>
            </div>
          </div>
        </div>

        <div className="tax-page__actions">
          <div className="tax-page__year-picker">
            <Calendar className="tax-page__year-picker-icon" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="tax-page__year-select"
            >
              {years.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <TaxCalculationContentV2
        orders={orders}
        settings={settings}
        selectedYear={selectedYear}
      />
    </PageLayout>
  );
};