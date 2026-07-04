import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, Package, Users, Download, Calendar,
  ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag,
  ChevronRight, Filter, Loader2, Wallet, BarChart3,
  Clock, Target, Award
} from 'lucide-react';
import { Product, Customer } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Card, StatCard, Button, Skeleton, Badge } from '../components/ui';
import { PageHeader } from '../components/PageHeader';
import { SectionBox, SectionHeader, SectionContent } from '../components/SectionBox';
import { StatusBadge } from '../components/StatusBadge';
import { useNewDashboard } from '../features';
import { PageLayout } from '../components/shared/PageLayout';
import * as XLSX from 'xlsx';
import './Dashboard.css';

interface DashboardProps {
  products?: Product[];
  onViewDebtCustomers?: () => void;
}

type ReportTab = 'REVENUE' | 'PRODUCTS' | 'CUSTOMERS';

const StatCardSkeleton = () => (
  <Skeleton variant="rect" width="100%" height={200} className="rounded-lg" />
);

/* ── V2 Dashboard KPI Card ───────────────────────── */
interface DashboardV2KPIProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant: 'primary' | 'success' | 'warning';
  subtitle?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
}

const DashboardV2KPI: React.FC<DashboardV2KPIProps> = ({
  title,
  value,
  icon,
  variant,
  subtitle,
  trend,
}) => (
  <SectionBox className={`dashboard-v2__kpi dashboard-v2__kpi--${variant}`}>
    <SectionContent className="dashboard-v2__kpi-content">
      <div className="dashboard-v2__kpi-top">
        <div className="dashboard-v2__kpi-icon">{icon}</div>
        {trend && (
          <span className={`dashboard-v2__kpi-trend dashboard-v2__kpi-trend--${trend.direction}`}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="dashboard-v2__kpi-label">{title}</div>
      <div className="dashboard-v2__kpi-value">{value}</div>
      {subtitle && <div className="dashboard-v2__kpi-subtitle">{subtitle}</div>}
    </SectionContent>
  </SectionBox>
);

/* ── V2 Dashboard Content ────────────────────────── */
interface DashboardV2Props {
  isLoading: boolean;
  revenueData: { date: string; revenue: number; profit: number; orders: number }[];
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  inventoryValue: number;
  inventoryRetailValue: number;
  debtCustomers: Customer[];
  topCustomers: (Customer & { orderCount?: number; totalSpent: number })[];
  totalDebtAmount: number;
  activeTab: ReportTab;
  onViewDebtCustomers?: () => void;
}

const DashboardV2: React.FC<DashboardV2Props> = ({
  revenueData,
  totalRevenue,
  totalProfit,
  totalOrders,
  topProducts,
  inventoryValue,
  inventoryRetailValue,
  debtCustomers,
  topCustomers,
  totalDebtAmount,
  activeTab,
  onViewDebtCustomers,
}) => {
  return (
    <div className="dashboard-v2">
      {activeTab === 'REVENUE' && (
        <>
          <div className="dashboard-v2__grid">
            <DashboardV2KPI
              title="Tổng doanh thu"
              value={`${totalRevenue.toLocaleString('vi-VN')} ₫`}
              icon={<DollarSign className="w-6 h-6" />}
              variant="primary"
              subtitle="So với kỳ trước"
              trend={{ value: '+12%', direction: 'up' }}
            />
            <DashboardV2KPI
              title="Lợi nhuận ước tính"
              value={`${totalProfit.toLocaleString('vi-VN')} ₫`}
              icon={<TrendingUp className="w-6 h-6" />}
              variant="success"
              subtitle={`Biên: ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%`}
              trend={{ value: '+8%', direction: 'up' }}
            />
            <DashboardV2KPI
              title="Số đơn hàng"
              value={totalOrders}
              icon={<ShoppingBag className="w-6 h-6" />}
              variant="warning"
              subtitle={`Trung bình: ${totalOrders > 0 ? (totalRevenue / totalOrders).toLocaleString('vi-VN') : 0} ₫/đơn`}
            />
          </div>

          <SectionBox>
            <SectionHeader title="Biểu đồ doanh thu & lợi nhuận" />
            <SectionContent>
              <div className="dashboard-v2__legend">
                <span className="dashboard-v2__legend-item dashboard-v2__legend-item--revenue">Doanh thu</span>
                <span className="dashboard-v2__legend-item dashboard-v2__legend-item--profit">Lợi nhuận</span>
              </div>
              <div className="dashboard-v2__chart dashboard-v2__chart--lg">
                <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc', radius: 8 }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
                      formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} ₫`]}
                    />
                    <Bar name="Doanh thu" dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
                    <Bar name="Lợi nhuận" dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionContent>
          </SectionBox>
        </>
      )}

      {activeTab === 'PRODUCTS' && (
        <div className="dashboard-v2__grid-2">
          <SectionBox>
            <SectionHeader title="Top 10 bán chạy" action={<StatusBadge label="Sản phẩm" type="info" size="sm" />} />
            <SectionContent className="dashboard-v2__list">
              {topProducts.length > 0 ? topProducts.map((p, idx) => (
                <div key={idx} className="dashboard-v2__list-item">
                  <div className="flex items-center gap-3">
                    <span className={`dashboard-v2__rank ${idx === 0 ? 'dashboard-v2__rank--1' : idx === 1 ? 'dashboard-v2__rank--2' : idx === 2 ? 'dashboard-v2__rank--3' : 'dashboard-v2__rank--other'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="dashboard-v2__list-title">{p.name}</p>
                      <p className="dashboard-v2__list-meta">Đã bán: {p.quantity}</p>
                    </div>
                  </div>
                  <p className="dashboard-v2__list-value">{p.revenue.toLocaleString('vi-VN')} ₫</p>
                </div>
              )) : (
                <div className="dashboard-v2__empty">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Chưa có dữ liệu bán hàng</p>
                </div>
              )}
            </SectionContent>
          </SectionBox>

          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-xl shadow-indigo-300/30 group hover:shadow-2xl hover:shadow-indigo-400/30 transition-all duration-300">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-2xl" />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="badge bg-white/20 text-white border-white/20 text-[11px]">Kho hàng</span>
                </div>
                <h4 className="text-indigo-100 text-sm font-medium mb-1">Giá trị kho hàng (Giá vốn)</h4>
                <h3 className="text-3xl font-extrabold mb-4 tracking-tight">{inventoryValue.toLocaleString('vi-VN')} ₫</h3>
                <div className="flex justify-between text-sm border-t border-white/20 pt-4">
                  <span className="text-indigo-100">Giá bán lẻ dự kiến:</span>
                  <span className="font-bold text-white">{inventoryRetailValue.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>

            <SectionBox>
              <SectionHeader title="Phân bổ danh mục" />
              <SectionContent>
                <div className="dashboard-v2__chart dashboard-v2__chart--md">
                  <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Sữa bột', value: 400 },
                          { name: 'Bỉm tã', value: 300 },
                          { name: 'Đồ chơi', value: 200 },
                          { name: 'Khác', value: 100 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.15)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionContent>
            </SectionBox>
          </div>
        </div>
      )}

      {activeTab === 'CUSTOMERS' && (
        <div className="dashboard-v2__grid-2">
          {debtCustomers.length > 0 && (
            <div
              onClick={onViewDebtCustomers}
              className="col-span-1 lg:col-span-2 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-lg hover:shadow-red-200/30 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-red-100 rounded-2xl text-red-600 group-hover:bg-white group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 text-lg flex items-center gap-2">
                    Khách hàng đang nợ
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-soft" />
                  </h3>
                  <p className="text-red-500 text-sm">
                    Có <span className="font-bold text-red-700">{debtCustomers.length}</span> khách hàng có công nợ cần thu hồi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-red-400 uppercase font-semibold tracking-wider">Tổng nợ</p>
                  <p className="text-2xl font-extrabold text-red-700">{totalDebtAmount.toLocaleString('vi-VN')} ₫</p>
                </div>
                <ChevronRight className="w-6 h-6 text-red-400 group-hover:translate-x-2 transition-all duration-300" />
              </div>
            </div>
          )}

          <SectionBox>
            <SectionHeader title="Top khách hàng thân thiết" action={<StatusBadge label="VIP" type="info" size="sm" />} />
            <SectionContent className="dashboard-v2__list">
              {topCustomers.length > 0 ? topCustomers.map((c, idx) => (
                <div key={idx} className="dashboard-v2__list-item">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="dashboard-v2__avatar">
                        {c.name.charAt(0)}
                      </div>
                      {idx < 3 && (
                        <span className="dashboard-v2__avatar-star">★</span>
                      )}
                    </div>
                    <div>
                      <p className="dashboard-v2__list-title">{c.name}</p>
                      <p className="dashboard-v2__list-meta">{c.orderCount} đơn hàng</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="dashboard-v2__list-value text-slate-900">{c.totalSpent.toLocaleString('vi-VN')} ₫</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                      {idx === 0 ? 'TOP 1' : `#${idx + 1}`}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="dashboard-v2__empty">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Chưa có dữ liệu khách hàng</p>
                </div>
              )}
            </SectionContent>
          </SectionBox>

          <div className="space-y-6">
            <SectionBox>
              <SectionHeader title="Tần suất mua hàng" />
              <SectionContent>
                <div className="dashboard-v2__chart dashboard-v2__chart--md">
                  <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.15)', padding: '12px 16px' }} />
                      <Line type="monotone" name="Số đơn" dataKey="orders" stroke="#6366f1" strokeWidth={3}
                        dot={{ r: 5, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SectionContent>
            </SectionBox>

            <div className="dashboard-v2__mini-grid">
              <SectionBox className="dashboard-v2__insight-card dashboard-v2__insight-card--blue">
                <SectionContent className="dashboard-v2__insight-content">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <StatusBadge label="Khách mới" type="info" size="sm" />
                  </div>
                  <h4 className="text-2xl font-extrabold text-blue-900">24</h4>
                  <p className="text-xs text-blue-500 mt-2 font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> +5% so với tháng trước
                  </p>
                </SectionContent>
              </SectionBox>

              <SectionBox className="dashboard-v2__insight-card dashboard-v2__insight-card--purple">
                <SectionContent className="dashboard-v2__insight-content">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                    <StatusBadge label="Giữ chân" type="info" size="sm" />
                  </div>
                  <h4 className="text-2xl font-extrabold text-purple-900">76%</h4>
                  <p className="text-xs text-purple-500 mt-2 font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Tỷ lệ quay lại cao
                  </p>
                </SectionContent>
              </SectionBox>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── V2 Dashboard Loading ────────────────────────── */
const DashboardV2Loading: React.FC = () => (
  <div className="dashboard-v2 animate-fade-in">
    <div className="page-header">
      <div>
        <Skeleton variant="text" width={200} height={32} className="mb-2" />
        <Skeleton variant="text" width={300} height={20} />
      </div>
    </div>
    <div className="dashboard-v2__loading-grid">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <SectionBox>
      <SectionHeader title="Đang tải dữ liệu..." />
      <SectionContent>
        <Skeleton variant="rect" width="100%" height={320} className="rounded-lg" />
      </SectionContent>
    </SectionBox>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ onViewDebtCustomers }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('REVENUE');
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [summary, setSummary] = useState<{
    revenueData: { date: string; revenue: number; profit: number; orders: number }[];
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
    inventoryValue: number;
    inventoryRetailValue: number;
    debtCustomers: Customer[];
    topCustomers: (Customer & { orderCount?: number; totalSpent: number })[];
    totalDebtAmount: number;
  }>({
    revenueData: [],
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0,
    topProducts: [],
    inventoryValue: 0,
    inventoryRetailValue: 0,
    debtCustomers: [],
    topCustomers: [],
    totalDebtAmount: 0
  });

  const getDateRange = (range: typeof dateRange): { from?: string; to?: string } => {
    if (range === 'all') return {};
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const days = range === '7d' ? 7 : 30;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { from, to };
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { from, to } = getDateRange(dateRange);
        const data = await supabaseService.getDashboardSummary(from, to);
        const totalRevenue = data.revenueData.reduce((sum, d) => sum + d.revenue, 0);
        const totalProfit = data.revenueData.reduce((sum, d) => sum + d.profit, 0);
        const totalOrders = data.revenueData.reduce((sum, d) => sum + d.orders, 0);
        const totalDebtAmount = data.debtCustomers.reduce((sum, c) => sum + (c.debt || 0), 0);
        setSummary({
          ...data,
          totalRevenue,
          totalProfit,
          totalOrders,
          totalDebtAmount
        });
      } catch (error) {
        console.error("Error fetching dashboard summary:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const {
    revenueData,
    totalRevenue,
    totalProfit,
    totalOrders,
    topProducts,
    inventoryValue,
    inventoryRetailValue,
    debtCustomers,
    topCustomers,
    totalDebtAmount
  } = summary;

  const exportToExcel = () => {
    let dataToExport: any[] = [];
    let fileName = '';

    if (activeTab === 'REVENUE') {
      dataToExport = revenueData.map(d => ({
        'Ngày': d.date,
        'Doanh thu': d.revenue,
        'Lợi nhuận': d.profit,
        'Số đơn hàng': d.orders
      }));
      fileName = `Bao_cao_doanh_thu_${dateRange}.xlsx`;
    } else if (activeTab === 'PRODUCTS') {
      dataToExport = topProducts.map(p => ({
        'Sản phẩm': p.name,
        'Số lượng bán': p.quantity,
        'Doanh thu': p.revenue
      }));
      fileName = `Bao_cao_hang_hoa_${dateRange}.xlsx`;
    } else {
      dataToExport = topCustomers.map(c => ({
        'Khách hàng': c.name,
        'Tổng chi tiêu': c.totalSpent,
        'Số đơn hàng': c.orderCount
      }));
      fileName = `Bao_cao_khach_hang_${dateRange}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo");
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading) {
    if (useNewDashboard) {
      return <DashboardV2Loading />;
    }
    return (
      <PageLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="page-header">
          <div>
            <Skeleton variant="text" width={200} height={32} className="mb-2" />
            <Skeleton variant="text" width={300} height={20} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Card>
          <div className="p-6">
            <Skeleton variant="text" width={200} height={24} className="mb-6" />
            <Skeleton variant="rect" width="100%" height={320} className="rounded-lg" />
          </div>
        </Card>
      </div>
      </PageLayout>
    );
  }

  const tabs = [
    { key: 'REVENUE' as ReportTab, label: 'Doanh thu', icon: DollarSign, color: 'indigo' },
    { key: 'PRODUCTS' as ReportTab, label: 'Hàng hoá', icon: Package, color: 'emerald' },
    { key: 'CUSTOMERS' as ReportTab, label: 'Khách hàng', icon: Users, color: 'purple' },
  ];

  if (useNewDashboard) {
    return (
      <PageLayout className="pb-20 md:pb-6">
        <PageHeader
          title="Tổng quan"
          description="Theo dõi hiệu quả kinh doanh của cửa hàng"
          actions={
            <>
              <div className="dashboard-v2__date-range">
                {(['7d', '30d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={dateRange === range ? 'is-active' : ''}
                  >
                    {range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : 'Tất cả'}
                  </button>
                ))}
              </div>

              <button onClick={exportToExcel} className="dashboard-v2__export-btn">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>
            </>
          }
        />

        <div className="dashboard-v2__tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`dashboard-v2__tab ${isActive ? 'is-active' : ''}`}
              >
                <Icon className="dashboard-v2__tab-icon" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          <DashboardV2
            isLoading={isLoading}
            revenueData={revenueData}
            totalRevenue={totalRevenue}
            totalProfit={totalProfit}
            totalOrders={totalOrders}
            topProducts={topProducts}
            inventoryValue={inventoryValue}
            inventoryRetailValue={inventoryRetailValue}
            debtCustomers={debtCustomers}
            topCustomers={topCustomers}
            totalDebtAmount={totalDebtAmount}
            activeTab={activeTab}
            onViewDebtCustomers={onViewDebtCustomers}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="pb-20 md:pb-6">
      <PageHeader
        title="Tổng quan"
        description="Theo dõi hiệu quả kinh doanh của cửa hàng"
        actions={
          <>
            {/* Date Range Selector - Pill Style */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm shadow-slate-200/50">
              {(['7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    dateRange === range
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : 'Tất cả'}
                </button>
              ))}
            </div>

            <button
              onClick={exportToExcel}
              className="btn-outline btn-sm group"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
          </>
        }
      />

      {/* ============================================
          TABS - Smooth segmented control
          ============================================ */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200/40 scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================
          TAB CONTENT
          ============================================ */}
      <div className="space-y-6">
        {/* ---------- REVENUE TAB ---------- */}
        {activeTab === 'REVENUE' && (
          <>
             {/* Revenue Stats - 3 cards */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
               <StatCard
                 title="Tổng doanh thu"
                 value={`${totalRevenue.toLocaleString('vi-VN')} ₫`}
                 icon={<DollarSign className="w-6 h-6" />}
                 variant="primary"
                 trend="up"
                 trendValue="+12%"
                 subtitle="So với kỳ trước"
               />
               <StatCard
                 title="Lợi nhuận ước tính"
                 value={`${totalProfit.toLocaleString('vi-VN')} ₫`}
                 icon={<TrendingUp className="w-6 h-6" />}
                 variant="success"
                 trend="up"
                 trendValue="+8%"
                 subtitle={`Biên: ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%`}
               />
               <StatCard
                 title="Số đơn hàng"
                 value={totalOrders}
                 icon={<ShoppingBag className="w-6 h-6" />}
                 variant="warning"
                 subtitle={`Trung bình: ${totalOrders > 0 ? (totalRevenue / totalOrders).toLocaleString('vi-VN') : 0} ₫/đơn`}
               />
             </div>

             {/* Revenue Chart */}
             <Card variant="elevated" padding="lg">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                     <BarChart3 className="w-5 h-5 text-indigo-600" />
                   </div>
                   <h3 className="text-base font-bold text-slate-800">Biểu đồ doanh thu & lợi nhuận</h3>
                 </div>
                 <div className="flex items-center gap-4 text-xs font-medium">
                   <span className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-300" />
                     Doanh thu
                   </span>
                   <span className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300" />
                     Lợi nhuận
                   </span>
                 </div>
               </div>
              <div className="w-full dashboard-v2__chart dashboard-v2__chart--lg">
                <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    Tool<Tooltip 
                      cursor={{ fill: '#f8fafc', radius: 8 }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
                      formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} ₫`]}
                    />
                    <Bar name="Doanh thu" dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
                    <Bar name="Lợi nhuận" dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
               </div>
             </Card>
           </>
         )}

        {/* ---------- PRODUCTS TAB ---------- */}
        {activeTab === 'PRODUCTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Top Products List */}
             <Card variant="elevated" padding="none">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                     <Award className="w-5 h-5 text-indigo-600" />
                   </div>
                   <h3 className="font-bold text-slate-800">Top 10 bán chạy</h3>
                 </div>
                 <Badge variant="purple" size="sm">Sản phẩm</Badge>
               </div>
              <div className="divide-y divide-slate-50 stagger">
                {topProducts.length > 0 ? topProducts.map((p, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold shadow-sm
                        ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200' :
                          idx === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-slate-200' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-200' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name}</p>
                        <p className="text-xs text-slate-400">Đã bán: {p.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-indigo-600">{p.revenue.toLocaleString('vi-VN')} ₫</p>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Chưa có dữ liệu bán hàng</p>
                  </div>
                 )}
               </div>
             </Card>

             {/* Inventory Stats */}
            <div className="space-y-6">
              {/* Inventory Value Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-xl shadow-indigo-300/30 group hover:shadow-2xl hover:shadow-indigo-400/30 transition-all duration-300">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-2xl" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <span className="badge bg-white/20 text-white border-white/20 text-[11px]">Kho hàng</span>
                  </div>
                  <h4 className="text-indigo-100 text-sm font-medium mb-1">Giá trị kho hàng (Giá vốn)</h4>
                  <h3 className="text-3xl font-extrabold mb-4 tracking-tight">{inventoryValue.toLocaleString('vi-VN')} ₫</h3>
                  <div className="flex justify-between text-sm border-t border-white/20 pt-4">
                    <span className="text-indigo-100">Giá bán lẻ dự kiến:</span>
                    <span className="font-bold text-white">{inventoryRetailValue.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>

               {/* Category Pie Chart */}
               <Card variant="elevated" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-800">Phân bổ danh mục</h3>
                </div>
                <div className="w-full dashboard-v2__chart dashboard-v2__chart--md">
                  <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Sữa bột', value: 400 },
                          { name: 'Bỉm tã', value: 300 },
                          { name: 'Đồ chơi', value: 200 },
                          { name: 'Khác', value: 100 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      Tool<Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgb(0 0 0 / 0.15)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                 </div>
               </Card>
             </div>
           </div>
         )}

         {/* ---------- CUSTOMERS TAB ---------- */}
        {activeTab === 'CUSTOMERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Debt Customers Alert Card */}
            {debtCustomers.length > 0 && (
              <div 
                onClick={onViewDebtCustomers}
                className="col-span-1 lg:col-span-2 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-lg hover:shadow-red-200/30 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-red-100 rounded-2xl text-red-600 group-hover:bg-white group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 text-lg flex items-center gap-2">
                      Khách hàng đang nợ
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-soft" />
                    </h3>
                    <p className="text-red-500 text-sm">
                      Có <span className="font-bold text-red-700">{debtCustomers.length}</span> khách hàng có công nợ cần thu hồi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-red-400 uppercase font-semibold tracking-wider">Tổng nợ</p>
                    <p className="text-2xl font-extrabold text-red-700">{totalDebtAmount.toLocaleString('vi-VN')} ₫</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-red-400 group-hover:translate-x-2 transition-all duration-300" />
                </div>
              </div>
            )}

             {/* Top Customers List */}
             <Card variant="elevated" padding="none">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                     <Award className="w-5 h-5 text-purple-600" />
                   </div>
                   <h3 className="font-bold text-slate-800">Top khách hàng thân thiết</h3>
                 </div>
                 <Badge variant="purple" size="sm">VIP</Badge>
               </div>
              <div className="divide-y divide-slate-50 stagger">
                {topCustomers.length > 0 ? topCustomers.map((c, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-indigo-200 shadow-sm
                                      group-hover:scale-110 transition-transform duration-200">
                          {c.name.charAt(0)}
                        </div>
                        {idx < 3 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[8px]">★</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.orderCount} đơn hàng</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{c.totalSpent.toLocaleString('vi-VN')} ₫</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        idx === 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {idx === 0 ? 'TOP 1' : `#${idx + 1}`}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Chưa có dữ liệu khách hàng</p>
                  </div>
                 )}
               </div>
             </Card>

             {/* Customer Insights */}
            <div className="space-y-6">
               {/* Orders Frequency Chart */}
               <Card variant="elevated" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-800">Tần suất mua hàng</h3>
                </div>
                <div className="w-full dashboard-v2__chart dashboard-v2__chart--md">
                  <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} />
                      Tool<Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -12px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
                      />
                      <Line type="monotone" name="Số đơn" dataKey="orders" stroke="#6366f1" strokeWidth={3} 
                        dot={{ r: 5, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
               </Card>

               {/* Insight Mini Cards */}
             <div className="grid grid-cols-2 gap-4">
               <Card variant="default" padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/80">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                     <Users className="w-4 h-4 text-blue-600" />
                   </div>
                   <Badge variant="info" size="sm">Khách mới</Badge>
                 </div>
                 <h4 className="text-2xl font-extrabold text-blue-900">24</h4>
                 <p className="text-xs text-blue-500 mt-2 font-medium flex items-center gap-1">
                   <ArrowUpRight className="w-3 h-3" /> +5% so với tháng trước
                 </p>
               </Card>
               <Card variant="default" padding="md" className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/80">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                     <Target className="w-4 h-4 text-purple-600" />
                   </div>
                   <Badge variant="purple" size="sm">Giữ chân</Badge>
                 </div>
                 <h4 className="text-2xl font-extrabold text-purple-900">76%</h4>
                 <p className="text-xs text-purple-500 mt-2 font-medium flex items-center gap-1">
                   <ArrowUpRight className="w-3 h-3" /> Tỷ lệ quay lại cao
                 </p>
               </Card>
             </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};