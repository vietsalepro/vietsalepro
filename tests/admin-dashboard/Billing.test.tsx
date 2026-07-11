import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../../components/ToastContainer';
import Billing from '../../pages/admin/Billing';
import { BankAccount, CompanyInfo } from '../../services/admin/billingAdminService';

const mockedGetBankAccounts = vi.fn();
const mockedCreateBankAccount = vi.fn();
const mockedUpdateBankAccount = vi.fn();
const mockedDeleteBankAccount = vi.fn();
const mockedGetCompanyInfo = vi.fn();
const mockedSetCompanyInfo = vi.fn();
const mockedGetTenantSubscription = vi.fn();
const mockedGetTenantsAdmin = vi.fn();
const mockedGetPlans = vi.fn();

vi.mock('../../services/admin/billingAdminService', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin/billingAdminService')>(
    '../../services/admin/billingAdminService',
  );
  return {
    ...actual,
    getBankAccounts: (...args: any[]) => mockedGetBankAccounts(...args),
    createBankAccount: (...args: any[]) => mockedCreateBankAccount(...args),
    updateBankAccount: (...args: any[]) => mockedUpdateBankAccount(...args),
    deleteBankAccount: (...args: any[]) => mockedDeleteBankAccount(...args),
    getCompanyInfo: (...args: any[]) => mockedGetCompanyInfo(...args),
    setCompanyInfo: (...args: any[]) => mockedSetCompanyInfo(...args),
    getTenantSubscription: (...args: any[]) => mockedGetTenantSubscription(...args),
    upgradeDowngradeSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    renewSubscription: vi.fn(),
  };
});

vi.mock('../../services/tenantService', async () => {
  const actual = await vi.importActual<typeof import('../../services/tenantService')>(
    '../../services/tenantService',
  );
  return {
    ...actual,
    getTenantsAdmin: (...args: any[]) => mockedGetTenantsAdmin(...args),
  };
});

vi.mock('../../services/planService', async () => {
  const actual = await vi.importActual<typeof import('../../services/planService')>(
    '../../services/planService',
  );
  return {
    ...actual,
    getPlans: (...args: any[]) => mockedGetPlans(...args),
  };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

const mockCompany: CompanyInfo = {
  companyName: 'Công ty TNHH Test',
  brandName: 'VietSale Test',
  taxCode: '0123456789',
  address: '123 Test Street',
  phone: '0901234567',
  email: 'test@example.com',
};

const mockAccounts: BankAccount[] = [
  { id: 'b1', accountName: 'NGUYEN VAN A', accountNumber: '123456789', bankName: 'Vietcombank', transferContent: 'Thanh toan', isDefault: true, displayOrder: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'b2', accountName: 'NGUYEN VAN B', accountNumber: '987654321', bankName: 'Techcombank', transferContent: 'Chuyen tien', isDefault: false, displayOrder: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

describe('Billing page', () => {
  beforeEach(() => {
    mockedGetCompanyInfo.mockResolvedValue(mockCompany);
    mockedGetBankAccounts.mockResolvedValue(mockAccounts);
    mockedGetTenantSubscription.mockResolvedValue({
      id: 'sub1',
      tenantId: 't1',
      plan: 'vip',
      status: 'active',
      maxUsers: 999,
      maxProducts: 999999,
      maxOrdersPerMonth: 999999,
      currentMonthOrders: 120,
      currentMonthStart: '2026-07-01',
      billingPeriod: 'month',
      billingPeriodStart: '2026-07-01',
      billingPeriodEnd: '2026-07-31',
    });
    mockedGetTenantsAdmin.mockResolvedValue({ items: [{ id: 't1', name: 'Cửa hàng A', subdomain: 'cuahanga', status: 'active', plan: 'vip' }], total: 1 });
    mockedGetPlans.mockResolvedValue([
      { key: 'free', name: 'Free', description: 'Gói miễn phí', maxUsers: 1, maxProducts: 50, maxOrdersPerMonth: 300, monthlyPrice: 0, yearlyPrice: 0, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { key: 'vip', name: 'VIP', description: 'Gói trả phí', maxUsers: 999, maxProducts: 999999, maxOrdersPerMonth: 999999, monthlyPrice: 69000, yearlyPrice: 59000, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders subscription info and billing history', async () => {
    render(<Billing />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Thông tin công ty / thương hiệu')).toBeInTheDocument();
    });

    expect(screen.getByText('Tài khoản ngân hàng')).toBeInTheDocument();
    expect(screen.getByText('NGUYEN VAN A')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('Vietcombank')).toBeInTheDocument();
  });

  it('displays payment methods', async () => {
    render(<Billing />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('NGUYEN VAN A')).toBeInTheDocument();
    });

    expect(screen.getByText('NGUYEN VAN B')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument();
    expect(screen.getByText('Techcombank')).toBeInTheDocument();
  });
});
