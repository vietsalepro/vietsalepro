# HANDOFF UX MASTER — UI/UX Upgrade System Admin Dashboard VietsalePro V7

> **Plan version:** 2.0 — AI-Session Based
> **Ngày:** 2026-07-09
> **Mục tiêu:** Nâng cấp UI/UX Admin Dashboard thân thiện, dễ quản lý, đẹp hơn
> **Cách tiếp cận:** 4 AI Session độc lập, mỗi session 1 HANDOFF file riêng

---

## Tổng quan 4 Session

| Session | File HANDOFF | Mục tiêu | Files mới | Files sửa | ~Thời gian |
|---------|-------------|----------|-----------|-----------|------------|
| **UX-1** | `HANDOFF_UX_1_LAYOUT.md` | Layout Foundation: Sidebar + KPI + Tabs | 8 | 1 | 2-3 ngày |
| **UX-2** | `HANDOFF_UX_2_TABLE.md` | Data Table Polish + Filter Redesign | 2 | 5 | 2-3 ngày |
| **UX-3** | `HANDOFF_UX_3_MODALS.md` | Modals, Forms, Toast, Skeleton | 8 | 2 | 2-3 ngày |
| **UX-4** | `HANDOFF_UX_4_A11Y.md` | Accessibility, Responsive, Delight | 0 | 6+ | 1-2 ngày |

## Dependency Map

```
UX-1 (Layout Foundation)
  │  ── Tạo AdminShell, AdminSidebar, AdminKpiCards, AdminTabs
  │  ── Wrap SystemAdminDashboard vào AdminShell
  │
  ├──> UX-2 (Table + Filter)
  │      ── Nâng cấp DataGrid (density, sticky, column visibility)
  │      ── Redesign AdvancedFilterPanel (pills, saved filters)
  │      ── Tạo ConfirmDialog
  │
  ├──> UX-3 (Modals + Feedback)  ← CÓ THỂ CHẠY SONG SONG VỚI UX-2
  │      ── Nâng cấp MasterModal (animation, sizes, keyboard)
  │      ── Tạo ToastContainer, Toast, SkeletonLoader, FormField
  │
  └──> UX-4 (Accessibility + Delight)  ← BẮT BUỘC SAU UX-1,2,3
         ── Audit + fix a11y tất cả components
         ── Mobile card layout, stagger animation, empty/error states
```

## Nguyên tắc chung

1. **KHÔNG sửa** `services/`, `hooks/`, `supabase/`, `contexts/`, `lib/` — chỉ UI components
2. **Dùng CSS variables** từ `design-system-tokens.css` — không hardcode màu
3. **Dùng Lucide icons** — không custom SVG
4. **Mỗi session kết thúc với**: `npm run lint` PASS, `npm run build` PASS
5. **Responsive**: 4 breakpoints (≥1280, 1024-1279, 768-1023, <768)
6. **Animation**: tôn trọng `prefers-reduced-motion`

## File không đụng đến (READ ONLY)

- `services/tenantService.ts`, `subscriptionService.ts`, `auditService.ts`
- `hooks/useDebounce.ts`, `hooks/usePermissions.ts`, `hooks/useTenant.ts`
- `supabase/migrations/*`
- `contexts/AuthContext.tsx`, `contexts/TenantContext.tsx`
- `lib/supabase.ts`, `lib/tenant.ts`
- `design-system-tokens.css` (đọc tokens, không sửa)
- `constants.ts`, `types.ts`

## File sẽ được tạo/sửa (toàn bộ 4 session)

### Tạo mới (14 files)
- `components/AdminShell.tsx` + `.css`
- `components/AdminSidebar.tsx` + `.css`
- `components/AdminKpiCards.tsx` + `.css`
- `components/AdminTabs.tsx` + `.css`
- `components/ConfirmDialog.tsx` + `.css`
- `components/ToastContainer.tsx` + `.css`
- `components/Toast.tsx`
- `components/SkeletonLoader.tsx` + `.css`
- `components/FormField.tsx` + `.css`

### Sửa đổi (7 files)
- `pages/SystemAdminDashboard.tsx`
- `components/DataGrid.tsx` + `.css`
- `components/AdvancedFilterPanel.tsx` + `.css`
- `components/MasterModal.tsx` + `.css`
- `components/EmptyState.css`

---

## Cách dùng

1. **Human đọc file này** để hiểu tổng quan
2. **Đưa từng HANDOFF session file cho AI** theo thứ tự UX-1 → UX-2 → UX-3 → UX-4
3. Sau mỗi session, verify checklist trong HANDOFF file đó
4. Nếu session fail, đọc lại HANDOFF file + context file → retry