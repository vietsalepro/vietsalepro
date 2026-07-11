import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Overview from '../../pages/admin/Overview';

vi.mock('../../pages/admin/AdminDashboardInner', () => ({
  default: ({ activeTab }: { activeTab: string }) => (
    <div data-testid="admin-dashboard-inner">{activeTab}</div>
  ),
}));

describe('Overview page', () => {
  it('renders AdminDashboardInner with overview tab', () => {
    render(<Overview />);

    expect(screen.getByTestId('admin-dashboard-inner')).toHaveTextContent('overview');
  });
});
