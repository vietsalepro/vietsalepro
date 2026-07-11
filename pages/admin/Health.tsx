// Sub-Phase 7.1: Health tab now includes cron job status via SystemHealthPanel.
import AdminDashboardInner from './AdminDashboardInner';

export default function Health() {
  return <AdminDashboardInner activeTab="health" />;
}
