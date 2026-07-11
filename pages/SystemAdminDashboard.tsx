import { Navigate } from 'react-router-dom';

export default function SystemAdminDashboard() {
  return <Navigate to="/admin/overview" replace />;
}

export { planLabel, calculateProration } from './admin/adminUtils';
