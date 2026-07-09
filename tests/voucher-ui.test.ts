import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/supabase', async () => {
  const { mockSupabase } = await import('./mocks/supabase');
  return { supabase: mockSupabase };
});

import { getPromoExpiryStatus } from '../components/VoucherManager';
import { calculateProration } from '../pages/SystemAdminDashboard';

const addDays = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

describe('VoucherManager expiry badges', () => {
  it('marks expired voucher', () => {
    const status = getPromoExpiryStatus(addDays(-1));
    expect(status.label).toContain('Đã hết hạn');
    expect(status.className).toContain('bg-red-100');
  });

  it('marks voucher expiring within 7 days', () => {
    const status = getPromoExpiryStatus(addDays(3));
    expect(status.label).toContain('Sắp hết hạn');
    expect(status.className).toContain('bg-amber-100');
  });

  it('marks active voucher', () => {
    const status = getPromoExpiryStatus(addDays(30));
    expect(status.label).toContain('Còn hiệu lực');
    expect(status.className).toContain('bg-green-100');
  });
});

const daysInCurrentMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

describe('Proration review', () => {
  it('returns null when plan is unchanged', () => {
    expect(calculateProration('vip', 'vip', '2100-01-01')).toBeNull();
  });

  it('returns null when current cycle already expired', () => {
    expect(calculateProration('vip', 'free', '2000-01-01')).toBeNull();
  });

  it('calculates amount due when upgrading from free to vip', () => {
    const future = addDays(30);
    const result = calculateProration('free', 'vip', future);
    const days = daysInCurrentMonth();
    expect(result).not.toBeNull();
    expect(result!.remainingDays).toBe(30);
    expect(result!.net).toBe(Math.round((69000 * 30) / days)); // prorated by actual month days
    expect(result!.isRefund).toBe(false);
  });

  it('calculates credit when downgrading from vip to free', () => {
    const future = addDays(15);
    const result = calculateProration('vip', 'free', future);
    const days = daysInCurrentMonth();
    expect(result).not.toBeNull();
    expect(result!.net).toBe(-Math.round((69000 * 15) / days)); // prorated by actual month days
    expect(result!.isRefund).toBe(true);
  });
});