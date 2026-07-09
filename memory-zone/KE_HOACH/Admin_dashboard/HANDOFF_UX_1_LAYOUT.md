# HANDOFF UX-1 — Layout Foundation: Sidebar + KPI Cards + Tab System

> **Handoff type:** AI Session (aisess)
> **From:** HANDOFF_UX_MASTER.md
> **To:** HANDOFF_UX_2_TABLE.md (next session)
> **Ngày:** 2026-07-09

---

## Context

Session này tạo nền tảng layout chuyên nghiệp cho System Admin Dashboard. Hiện tại `pages/SystemAdminDashboard.tsx` đang render trực tiếp các section (tenant list, subscription management, billing, analytics...) mà không có layout wrapper. Nhiệm vụ của session này là tạo AdminShell + AdminSidebar + AdminKpiCards + AdminTabs để bọc toàn bộ dashboard.

### Files cần đọc trước khi bắt đầu

| File | Mục đích | Priority |
|------|----------|----------|
| `design-system-tokens.css` | Đọc CSS custom properties (màu, spacing, radius, shadow) | **BẮT BUỘC** |
| `pages/SystemAdminDashboard.tsx` | Hiểu cấu trúc hiện tại, các section, navigation | **BẮT BUỘC** |
| `components/AppShell.tsx` + `.css` | Tham khảo pattern layout hiện có | Optional |
| `components/PageHeader.tsx` + `.css` | Tham khảo header pattern | Optional |
| `components/SectionBox.tsx` + `.css` | Tham khảo card/box pattern | Optional |

### Files sẽ tạo mới (8 files)

| File | Mô tả |
|------|-------|
| `components/AdminShell.tsx` | Layout wrapper chính: sidebar + main content area + topbar |
| `components/AdminShell.css` | CSS cho AdminShell (grid layout, responsive) |
| `components/AdminSidebar.tsx` | Sidebar navigation với menu items, collapse, tenant selector |
| `components/AdminSidebar.css` | CSS sidebar (width, collapse, hover, active states) |
| `components/AdminKpiCards.tsx` | 4-6 KPI cards: tổng tenants, active subscriptions, revenue, pending tickets |
| `components/AdminKpiCards.css` | CSS grid 4 cột, responsive xuống 2/1, card style |
| `components/AdminTabs.tsx` | Tab system điều hướng giữa các section dashboard |
| `components/AdminTabs.css` | CSS tabs (underline style, scrollable trên mobile) |

### File sẽ sửa (1 file)

| File | Mô tả |
|------|-------|
| `pages/SystemAdminDashboard.tsx` | Wrap toàn bộ nội dung vào `<AdminShell>`, dùng `<AdminTabs>` để phân section |

---

## Current Status

- `pages/SystemAdminDashboard.tsx` hiện tại render trực tiếp các section: TenantListPanel, SubscriptionManager, BillingAutomationDashboard, VoucherManager, TicketInbox, AnnouncementManager, EmailTemplateManager, InvoiceManager, ComplianceManager...
- Không có layout wrapper chung — mỗi section tự quản lý spacing/heading riêng
- Không có sidebar navigation — người dùng scroll dọc để tìm section
- `design-system-tokens.css` đã có sẵn tokens: `--color-bg`, `--color-surface`, `--color-border`, `--color-primary`, `--shadow-sm/md/lg`, `--radius-sm/md/lg`, `--space-xs` đến `--space-3xl`

---

## Steps to Execute

### Step 1: Đọc design-system-tokens.css
Đọc `design-system-tokens.css` để nắm tất cả CSS variables có sẵn. Ghi nhớ:
- Màu: `--color-bg`, `--color-surface`, `--color-border`, `--color-primary`, `--color-primary-hover`, `--color-text`, `--color-text-secondary`, `--color-error`, `--color-success`, `--color-warning`, `--color-info`
- Spacing: `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (24px), `--space-xl` (32px), `--space-2xl` (48px), `--space-3xl` (64px)
- Radius: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px)
- Shadow: `--shadow-sm`, `--shadow-md`, `--shadow-lg`

Tất cả component CSS mới PHẢI dùng các variables này, không hardcode giá trị.

### Step 2: Tạo AdminSidebar.tsx + AdminSidebar.css

**AdminSidebar.tsx** props:
```ts
interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}
```

Menu items (dùng Lucide icons):
- `dashboard` → "Tổng quan" (LayoutDashboard)
- `tenants` → "Quản lý tenants" (Building2)
- `subscriptions` → "Gói cước" (CreditCard)
- `billing` → "Thanh toán & Hóa đơn" (Receipt)
- `vouchers` → "Khuyến mãi & Voucher" (TicketPercent)
- `support` → "Hỗ trợ & Tickets" (MessageSquare)
- `announcements` → "Thông báo" (Megaphone)
- `email` → "Email Templates" (Mail)
- `compliance` → "Bảo mật & Tuân thủ" (ShieldCheck)
- `settings` → "Cài đặt hệ thống" (Settings)

**AdminSidebar.css** spec:
- Width: `260px` expanded, `64px` collapsed
- Transition: `width 200ms ease` (tôn trọng prefers-reduced-motion)
- Background: `--color-surface`, border-right: `1px solid --color-border`
- Menu item: `padding: --space-sm --space-md`, `border-radius: --radius-md`, `margin: 2px --space-sm`
- Active item: background `--color-primary` opacity 0.1, border-left 3px `--color-primary`
- Hover: background `--color-bg`
- Icon + label: icon 20px, gap `--space-sm`
- Collapsed mode: chỉ hiện icon, label ẩn, tooltip hiện trên hover (CSS-only)
- Scroll: overflow-y auto nếu menu dài hơn viewport
- Mobile (<768px): sidebar là overlay drawer, backdrop, transform slide-in từ trái

### Step 3: Tạo AdminShell.tsx + AdminShell.css

**AdminShell.tsx** props:
```ts
interface AdminShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;       // nhận <AdminSidebar />
  topbar?: React.ReactNode;        // optional admin topbar
  kpiCards?: React.ReactNode;      // nhận <AdminKpiCards />
}
```

Layout structure:
```
┌──────────┬────────────────────────────────┐
│          │  Topbar (optional)              │
│ Sidebar  ├────────────────────────────────┤
│          │  KPI Cards (optional)           │
│ 260px    ├────────────────────────────────┤
│          │  Main Content (children)        │
│          │  - Scrollable                   │
└──────────┴────────────────────────────────┘
```

**AdminShell.css** spec:
- Display: `grid`, template: `auto 1fr / auto 1fr` (sidebar column + main column)
- Sidebar column: width controlled by AdminSidebar (260px → 64px khi collapse)
- Main area: `overflow-y: auto`, `padding: --space-xl`
- KPI cards area: full width trong main column
- Responsive:
  - ≥1280px: sidebar visible, grid layout
  - 1024-1279px: sidebar auto-collapse
  - 768-1023px: sidebar toggle button trên topbar
  - <768px: sidebar overlay drawer, main full-width, padding `--space-md`

### Step 4: Tạo AdminKpiCards.tsx + AdminKpiCards.css

**AdminKpiCards.tsx** props:
```ts
interface AdminKpiCardsProps {
  cards: KpiCardData[];
}
interface KpiCardData {
  label: string;        // "Tổng Tenants"
  value: string | number; // "156"
  trend?: number;       // +12 (percent change)
  trendLabel?: string;  // "so với tháng trước"
  icon: LucideIcon;     // Building2, Users, CreditCard...
  color?: string;       // CSS variable name, default --color-primary
}
```

Layout: CSS Grid `repeat(4, 1fr)` → responsive xuống 2 cột (768-1023px) → 1 cột (<768px)

Mỗi card style:
- Background: `--color-surface`, border-radius: `--radius-lg`, padding: `--space-lg`
- Box-shadow: `--shadow-sm`, hover: `--shadow-md`
- Layout trong card: icon (top-left, 24px, màu theo `color` prop) → value (font-size 28px, bold) → label (14px, `--color-text-secondary`) → trend badge (nếu có)
- Trend badge: màu xanh (`--color-success`) nếu dương, đỏ (`--color-error`) nếu âm, kèm arrow icon

### Step 5: Tạo AdminTabs.tsx + AdminTabs.css

**AdminTabs.tsx** props:
```ts
interface AdminTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode; // render children của tab active
}
interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;       // số notification trên tab
}
```

Style: underline tabs (giống Google Material Tabs 2.0)
- Tab list: horizontal scroll nếu overflow, `border-bottom: 2px solid --color-border`
- Tab item: `padding: --space-sm --space-md`, `font-size: 14px`, `font-weight: 500`
- Active tab: `border-bottom: 2px solid --color-primary`, `color: --color-primary`
- Inactive: `color: --color-text-secondary`, hover → `color: --color-text`
- Badge: pill nhỏ, background `--color-error`, white text, positioned top-right
- Animation: transition color/border 150ms
- Content area: `padding-top: --space-lg`

### Step 6: Sửa pages/SystemAdminDashboard.tsx

Thay đổi cấu trúc hiện tại:

**Before** (hiện tại): Render trực tiếp tất cả section
```tsx
export default function SystemAdminDashboard() {
  // ... state, hooks
  return (
    <div className="system-admin-dashboard">
      <h1>System Admin Dashboard</h1>
      <TenantListPanel ... />
      <SubscriptionManager ... />
      <BillingAutomationDashboard ... />
      {/* ... more sections */}
    </div>
  );
}
```

**After** (sau upgrade):
```tsx
import AdminShell from '../components/AdminShell';
import AdminSidebar from '../components/AdminSidebar';
import AdminKpiCards from '../components/AdminKpiCards';
import AdminTabs from '../components/AdminTabs';

export default function SystemAdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('tenants');
  
  // ... keep ALL existing state, hooks, data fetching logic (KHÔNG sửa)
  
  // Compute KPI data từ existing data
  const kpiCards = useMemo(() => [
    { label: 'Tổng Tenants', value: tenants.length, icon: Building2, color: '--color-primary' },
    { label: 'Active Subscriptions', value: activeSubsCount, icon: CreditCard, color: '--color-success' },
    { label: 'Revenue (tháng)', value: formatCurrency(monthlyRevenue), icon: DollarSign, color: '--color-info' },
    { label: 'Pending Tickets', value: pendingTickets, icon: MessageSquare, color: '--color-warning' },
  ], [tenants, activeSubsCount, monthlyRevenue, pendingTickets]);
  
  // Define tabs mapping to sections
  const tabs = [
    { id: 'tenants', label: 'Tenants', icon: Building2 },
    { id: 'subscriptions', label: 'Gói cước', icon: CreditCard },
    { id: 'billing', label: 'Thanh toán', icon: Receipt },
    // ... map tất cả section hiện có
  ];
  
  return (
    <AdminShell
      sidebar={
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      }
      kpiCards={<AdminKpiCards cards={kpiCards} />}
    >
      <AdminTabs tabs={tabs} activeTab={activeSection} onTabChange={setActiveSection}>
        {activeSection === 'tenants' && <TenantListPanel ... />}
        {activeSection === 'subscriptions' && <SubscriptionManager ... />}
        {activeSection === 'billing' && <BillingAutomationDashboard ... />}
        {/* ... render section tương ứng với activeSection */}
      </AdminTabs>
    </AdminShell>
  );
}
```

**LƯU Ý QUAN TRỌNG:** Giữ nguyên TẤT CẢ logic business, data fetching, hooks, state management. Chỉ thay đổi phần render/return.

### Step 7: Style section containers

Thêm class wrapper cho mỗi section để consistent spacing:
```css
.admin-section {
  padding: var(--space-lg) 0;
}
.admin-section + .admin-section {
  border-top: 1px solid var(--color-border);
  margin-top: var(--space-lg);
}
```

---

## Verification Checklist

Sau khi hoàn thành tất cả steps, chạy các lệnh sau:

- [ ] `npm run lint` — PASS (không lỗi ESLint/TypeScript)
- [ ] `npm run build` — PASS (Vite build thành công)
- [ ] Manual visual check:
  - [ ] Sidebar hiển thị đủ 10 menu items với icon + label
  - [ ] Click menu item → active state (border-left primary) + section hiển thị đúng
  - [ ] Toggle collapse → sidebar 64px, chỉ hiện icon, hover có tooltip
  - [ ] KPI cards hiển thị 4 cột trên desktop, 2 cột tablet, 1 cột mobile
  - [ ] Tabs underline style, active tab có border-bottom primary
  - [ ] Responsive: màn hình <768px → sidebar overlay drawer
  - [ ] Scroll mượt trên main content area

---

## Handoff cho session tiếp theo

Session **UX-2** (`HANDOFF_UX_2_TABLE.md`) cần:
- `AdminShell` đã hoạt động (là layout wrapper)
- `AdminSidebar` đã hoàn chỉnh (để DataGrid biết sidebar width khi tính sticky columns)
- DataGrid nằm trong tenant section của AdminTabs

**Files UX-2 cần đọc thêm:** `components/DataGrid.tsx`, `components/DataGrid.css`, `components/AdvancedFilterPanel.tsx`, `components/AdvancedFilterPanel.css`, `components/BatchActionsBar.tsx`