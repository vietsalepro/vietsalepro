# STAT_CARD_RETURN.md — MODAL-MASTER-STYLE

## 4 Stat Cards — Danh sách phiếu trả hàng (Return Orders List)

Version: 1.0
Scope: **Modal only** (bộ 4 cards này được thiết kế để hiển thị trong `MasterModal` body). Có thể tái sử dụng trên page nếu cần.
Source: `REPORT_DESIGN_RETURN.md` § I.[B] + `pages/ReturnOrders.tsx` lines 2002–2071.

---

## 1. Purpose

Quy chuẩn bộ **4 thẻ thống kê (Stat Cards)** hiển thị KPI nhanh của danh sách phiếu trả hàng trong modal:

- Tổng phiếu trả
- Đã hoàn tất
- Đã hủy
- Tổng tiền hoàn

Mỗi card mang một màu semantic riêng, có icon và đường sparkline trang trí góc dưới phải.

---

## 2. Master Structure

```text
<MasterModal>
  <ModalBody>
    <StatCardGrid>
      ├─ StatCard (purple)
      ├─ StatCard (emerald)
      ├─ StatCard (red)
      └─ StatCard (amber)
    </StatCardGrid>
  </ModalBody>
</MasterModal>
```

```text
StatCard
├── Left content
│     ├─ IconBox (semantic-50 + semantic-500)
│     └─ Text stack
│           ├─ Label (uppercase, small)
│           ├─ Value (2xl, bold)
│           └─ Unit (caption)
└── Decorative SVG sparkline (absolute bottom-right)
```

---

## 3. Visual Tokens

| Token | Value | Tailwind / CSS |
|-------|-------|----------------|
| **Grid** | 1 col mobile, 2 col tablet, 4 col desktop, gap 16px | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` |
| **Card** | bg white, radius 20px, padding 20px, flex between, overflow hidden | `bg-white rounded-2xl p-5 flex items-center justify-between relative overflow-hidden` |
| **Shadow** | soft — per MASTER_SECTION_BOX_STANDARD_V1 | `shadow-[0_2px_8px_rgba(15,23,42,0.03)]` |
| **Border** | 1px solid #F1F5F9 — per MASTER_SECTION_BOX_STANDARD_V1 | `border border-slate-100` |
| **Icon box** | 48×48, radius 12px, semantic-50 bg, semantic-500 icon | `w-12 h-12 rounded-xl flex items-center justify-center bg-{semantic}-50 text-{semantic}-500 flex-shrink-0` |
| **Icon size** | 20px | `w-5 h-5` |
| **Label** | 13px, medium, slate-400, uppercase, mb 4px | `block text-[13px] font-medium text-slate-400 mb-1` |
| **Value** | 24px, bold, slate-800 | `block text-2xl font-bold text-slate-800` |
| **Value (currency)** | 20px, bold, slate-800 (card 4) | `block text-xl font-bold text-slate-800` |
| **Unit** | 12px, slate-400 (minimum per MASTER_TYPOGRAPHY_V1) | `text-xs text-slate-400` |
| **Sparkline** | absolute right-0 bottom-0, w-24 h-12, semantic-100, opacity 60% | `absolute right-0 bottom-0 w-24 h-12 text-{semantic}-100 opacity-60` |

Semantic color mapping (Return Orders):

| Card | Semantic | Tailwind bg | Tailwind text | Tailwind sparkline | Icon |
|------|----------|-------------|---------------|--------------------|------|
| Tổng phiếu trả | Primary | `bg-purple-50` | `text-purple-600` | `text-purple-100` | `FileText` |
| Đã hoàn tất | Success | `bg-emerald-50` | `text-emerald-500` | `text-emerald-100` | `CheckCircle` |
| Đã hủy | Danger | `bg-red-50` | `text-red-500` | `text-red-100` | `XCircle` |
| Tổng tiền hoàn | Warning | `bg-amber-50` | `text-amber-500` | `text-amber-100` | `Wallet` |

Hex values (from `MASTER_DESIGN_TOKENS_V1`):

- Primary 50: `#F5F3FF` | Primary 100: `#EDE9FE` | Primary 600: `#7C3AED`
- Success 50: `#ECFDF5` | Success 100: `#D1FAE5` | Success 500: `#10B981`
- Danger 50: `#FEF2F2` | Danger 100: `#FFE4E6` | Danger 500: `#EF4444`
- Warning 50: `#FFFBEB` | Warning 100: `#FEF3C7` | Warning 500: `#F59E0B`
- Slate 400: `#94A3B8` | Slate 800: `#1E293B`

---

## 4. Master Code Template (React + Tailwind)

```tsx
import { FileText, CheckCircle, XCircle, Wallet } from 'lucide-react';

export type StatCardData = {
  label: string;
  value: string | number;
  unit?: string;
  semantic: 'primary' | 'success' | 'danger' | 'warning';
  icon: React.ElementType;
  sparklinePath: string;
  isCurrency?: boolean;
};

const SEMANTIC_MAP = {
  primary: { bg: 'bg-purple-50', text: 'text-purple-600', spark: 'text-purple-100' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-500', spark: 'text-emerald-100' },
  danger: { bg: 'bg-red-50', text: 'text-red-500', spark: 'text-red-100' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-500', spark: 'text-amber-100' },
};

export function StatCard({ data }: { data: StatCardData }) {
  const tone = SEMANTIC_MAP[data.semantic];
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-[0_2px_8px_rgba(15,23,42,0.03)] border border-slate-100 relative overflow-hidden">
      <div className="flex items-center gap-4 z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tone.bg} ${tone.text} flex-shrink-0`}>
          <data.icon className="w-5 h-5" />
        </div>
        <div>
          <span className="block text-[13px] font-medium text-slate-400 mb-1">{data.label}</span>
          <span className={`block ${data.isCurrency ? 'text-xl' : 'text-2xl'} font-bold text-slate-800`}>
            {data.value}
          </span>
          {data.unit && <span className="text-xs text-slate-400">{data.unit}</span>}
        </div>
      </div>
      <svg className={`absolute right-0 bottom-0 w-24 h-12 ${tone.spark} opacity-60`} viewBox="0 0 100 30" preserveAspectRatio="none">
        <path d={data.sparklinePath} fill="currentColor" />
      </svg>
    </div>
  );
}

export function StatCardGrid({ cards }: { cards: StatCardData[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <StatCard key={idx} data={card} />
      ))}
    </div>
  );
}
```

### Sample usage for Return Orders

```tsx
const returnCards: StatCardData[] = [
  {
    label: 'TỔNG PHIẾU TRẢ',
    value: stats.total,
    unit: 'phiếu',
    semantic: 'primary',
    icon: FileText,
    sparklinePath: 'M0,25 Q15,15 30,20 T60,10 T90,18 T100,5 L100,30 L0,30 Z',
  },
  {
    label: 'ĐÃ HOÀN TẤT',
    value: stats.completed,
    unit: 'phiếu',
    semantic: 'success',
    icon: CheckCircle,
    sparklinePath: 'M0,28 Q20,22 40,25 T70,12 T100,2 L100,30 L0,30 Z',
  },
  {
    label: 'ĐÃ HỦY',
    value: stats.cancelled,
    unit: 'phiếu',
    semantic: 'danger',
    icon: XCircle,
    sparklinePath: 'M0,20 Q10,25 25,15 T50,22 T75,5 T100,18 L100,30 L0,30 Z',
  },
  {
    label: 'TỔNG TIỀN HOÀN',
    value: formatCurrency(stats.totalRefund),
    unit: 'Tổng tiền hoàn',
    semantic: 'warning',
    icon: Wallet,
    sparklinePath: 'M0,25 Q30,10 60,18 T100,8 L100,30 L0,30 Z',
    isCurrency: true,
  },
];

<StatCardGrid cards={returnCards} />
```

---

## 5. Preservation Rules

Khi áp dụng master style này cho modal/trang khác:

| Giữ nguyên | Ghi chú |
|------------|---------|
| `cards` array | Mỗi object `{ label, value, unit, semantic, icon, sparklinePath, isCurrency }` |
| Cách tính `value` | Ví dụ `stats.total`, `formatCurrency(stats.totalRefund)` — giữ logic tính toán |
| Số lượng card | 4 cards là chuẩn; nếu nghiệp vụ ít hơn có thể 2–3, nhưng tối đa 4 trong modal |
| Semantic mapping | Mỗi nghiệp vụ tự định nghĩa: primary / success / danger / warning |

Không được:

- Thay đổi hình dạng card (rounded-2xl, p-5, shadow `0 2px 8px rgba(15,23,42,0.03)`, border `1px solid #F1F5F9`).
- Bỏ sparkline hoặc thay bằng gradient.
- Dùng màu ngoài 4 semantic tone đã định nghĩa.
- Hiển thị quá 4 cards trong modal (tránh chiếm dụng body height).

---

## 6. Sparkline Rules

- Mỗi card có một SVG `path` duy nhất, fill `currentColor`.
- `viewBox="0 0 100 30"`, `preserveAspectRatio="none"`.
- Kích thước `w-24 h-12` (96×48px).
- Màu = semantic-100, opacity 60%.
- Path nên có độ dốc mượt, không quá nhiều điểm gấp khúc (tối đa 5–6 điểm).
- Không dùng stroke; chỉ dùng fill.

---

## 7. Responsive Behavior

| Viewport | Grid |
|----------|------|
| Mobile | 1 cột |
| Tablet (`sm+`) | 2 cột |
| Desktop (`lg+`) | 4 cột |

Trong modal size `LARGE` (max 960px), thực tế thường hiển thị 2 cột. Không ép thành 4 cột khi không đủ không gian.

---

## 8. Compliance with Master Standards

| Standard | Áp dụng |
|----------|---------|
| `MASTER_MODAL_STANDARD` | Cards nằm trong ModalBody, padding 24px. |
| `MASTER_DESIGN_TOKENS_V1` | Dùng semantic-50/100/500, white, slate-800/400. |
| `MASTER_PAGE_LAYOUT_STANDARD` | Statistics Area: 4 cards, gap 16px, responsive grid. |
| `MASTER_SECTION_BOX_STANDARD` | Mỗi card là một white surface với border + shadow nhẹ. |
| `MASTER_ICON_STANDARD_V1` | Icon Lucide 20px trong card. |
| `MASTER_TYPOGRAPHY_V1` | Label 13px, value 24px/20px, unit 11px. |

---

## 9. Do / Don't

### Do

- [ ] Luôn dùng 4 semantic tone: primary, success, danger, warning.
- [ ] Giữ label UPPERCASE cho KPI cards.
- [ ] Giữ sparkline đồ họa ở góc dưới phải.
- [ ] Dùng `text-xl` cho giá trị tiền tệ dài để tránh overflow.
- [ ] Đảm bảo card height đồng nhất trong grid (`min-h` không cần vì nội dung giống nhau).

### Don't

- [ ] Không dùng gradient cho card hoặc sparkline.
- [ ] Không thêm shadow quá đậm.
- [ ] Không đặt nút hành động trong card.
- [ ] Không hiển thị sparkline bằng stroke hoặc animation.

---

## 10. Appendix: Default Sparkline Paths

| Card | Path d (copy-ready) |
|------|---------------------|
| Tổng phiếu | `M0,25 Q15,15 30,20 T60,10 T90,18 T100,5 L100,30 L0,30 Z` |
| Đã hoàn tất | `M0,28 Q20,22 40,25 T70,12 T100,2 L100,30 L0,30 Z` |
| Đã hủy | `M0,20 Q10,25 25,15 T50,22 T75,5 T100,18 L100,30 L0,30 Z` |
| Tổng tiền hoàn | `M0,25 Q30,10 60,18 T100,8 L100,30 L0,30 Z` |

Khi tạo card cho nghiệp vụ khác, có thể vẽ path mới nhưng phải giữ cùng `viewBox`, `preserveAspectRatio`, size `w-24 h-12` và opacity 60%.
