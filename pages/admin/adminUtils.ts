// ponytail: minimal shared helpers reused by admin pages and re-exported from the legacy SystemAdminDashboard entry point.

const MONTHLY_PRICE_VIP = 69000;

export const planLabel = (plan: string) => plan === 'free' ? 'Free' : plan === 'vip' ? 'VIP' : plan.toUpperCase();

export const calculateProration = (
  currentPlan: string,
  newPlan: string,
  expiresAt?: string | null
) => {
  if (currentPlan === newPlan) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = expiresAt ? new Date(expiresAt) : null;
  if (!end || end.getTime() <= today.getTime()) return null;
  const remainingDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  const currentMonthly = currentPlan === 'vip' ? MONTHLY_PRICE_VIP : 0;
  const newMonthly = newPlan === 'vip' ? MONTHLY_PRICE_VIP : 0;
  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const credit = Math.round((currentMonthly * remainingDays) / daysInCurrentMonth);
  const charge = Math.round((newMonthly * remainingDays) / daysInCurrentMonth);
  const net = charge - credit;
  return {
    remainingDays,
    credit,
    charge,
    net,
    isRefund: net < 0,
  };
};
