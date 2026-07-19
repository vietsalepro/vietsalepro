# MASTER_TABS_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ hệ thống Tabs, Segmented Control và Content Navigation trong POS Enterprise.

Tabs là cơ chế chuyển đổi nội dung trong cùng một màn hình mà không thay đổi route.

Tất cả màn hình sử dụng Tabs phải tuân thủ tài liệu này.

---

# I. TRIẾT LÝ THIẾT KẾ

Tabs dùng để:

* Phân nhóm thông tin
* Giảm chiều dài màn hình
* Tăng khả năng đọc
* Không thay đổi ngữ cảnh người dùng

---

Không dùng Tabs cho:

* Navigation chính
* Menu hệ thống
* Sidebar

---

# II. TAB ARCHITECTURE

Tab Container

↓

Tab Header

↓

Tab List

↓

Tab Item

↓

Tab Content

---

# III. TAB HIERARCHY

Level 1

Primary Tabs

---

Level 2

Secondary Tabs

---

Không hỗ trợ sâu hơn 2 cấp.

---

# IV. TAB TYPES

Underline Tabs

(Default)

---

Segmented Tabs

---

Pill Tabs

---

Vertical Tabs

---

# V. DEFAULT TAB TYPE

Toàn bộ POS V1 sử dụng:

Underline Tabs

---

Lý do:

* Gọn
* Chuyên nghiệp
* Phù hợp Desktop
* Ít chiếm diện tích

---

# VI. UNDERLINE TAB LAYOUT

```txt
[Tổng quan] [Tồn kho] [Lịch sử nhập] [Audit Log]
────────────────────────────────────────
```

---

# VII. TAB CONTAINER

Width

100%

---

Background

Transparent

---

Margin Bottom

16px

---

# VIII. TAB HEADER

Height

48px

---

Display

Flex

---

Align

Center

---

Gap

8px

---

# IX. TAB ITEM

Height

48px

---

Padding Horizontal

16px

---

Padding Vertical

0

---

Border

None

---

Background

Transparent

---

Cursor

Pointer

---

# X. TAB TYPOGRAPHY

Size

14px

---

Weight

500

---

Color

Text Secondary

---

# XI. TAB HOVER

Background

Transparent

---

Color

Primary 600

---

Transition

150ms

---

# XII. ACTIVE TAB

Color

Primary 600

---

Weight

600

---

Underline

2px

Primary Color

---

# XIII. ACTIVE INDICATOR

Height

2px

---

Color

Primary

---

Radius

2px

---

Animation

150ms

---

# XIV. TAB CONTENT AREA

Background

White

---

Padding Top

16px

---

Width

100%

---

# XV. CONTENT SPACING

Tab Header

↓

16px

↓

Content

---

# XVI. TAB ICON SUPPORT

Cho phép:

Icon + Text

---

Ví dụ:

📦 Tồn kho

📈 Báo cáo

📝 Audit Log

---

# XVII. ICON SIZE

18px

---

Gap

8px

---

# XVIII. TAB BADGE SUPPORT

Cho phép hiển thị:

Count Badge

---

Ví dụ

Đơn hàng (12)

---

# XIX. BADGE STYLE

Size

18px

---

Radius

999px

---

Background

Primary 100

---

Text

Primary 700

---

# XX. DISABLED TAB

Color

Text Disabled

---

Cursor

Not Allowed

---

Không cho click.

---

# XXI. LOADING TAB

Hiển thị:

Skeleton Header

↓

Skeleton Content

---

# XXII. EMPTY TAB

Nếu không có dữ liệu:

Empty State Standard

---

# XXIII. TAB CONTENT RULE

Không load tất cả tab cùng lúc.

---

Khuyến nghị:

Lazy Load

---

# XXIV. TAB STATE

Persist State

---

Khi đổi tab:

Không reset filter nếu không cần.

---

# XXV. URL INTEGRATION

Khuyến nghị:

Query Param

---

Ví dụ

/product/123?tab=inventory

---

# XXVI. REFRESH RULE

Refresh Page

↓

Giữ nguyên Tab hiện tại

---

# XXVII. TAB ORDER RULE

Thông tin quan trọng nhất ở bên trái.

---

Ví dụ:

Tổng quan

↓

Tồn kho

↓

Lịch sử

↓

Audit

---

# XXVIII. MAX TAB COUNT

Khuyến nghị

≤ 7 Tabs

---

Nếu >7

↓

Dùng Dropdown Tab

---

# XXIX. TAB OVERFLOW

Nếu không đủ chiều ngang:

Scrollable Tabs

---

Không xuống dòng.

---

# XXX. SEGMENTED CONTROL

Purpose

Chuyển đổi chế độ hiển thị.

---

Ví dụ:

[Ngày]

[Tuần]

[Tháng]

---

# XXXI. SEGMENTED CONTROL SIZE

Height

40px

---

Radius

12px

---

Background

Background Secondary

---

# XXXII. SEGMENTED ACTIVE

Background

White

---

Text

Primary

---

Shadow

Shadow SM

---

# XXXIII. PILL TABS

Purpose

Filter nhanh.

---

Ví dụ

[Tất cả]

[Chờ duyệt]

[Hoàn tất]

[Đã hủy]

---

# XXXIV. PILL STYLE

Height

36px

---

Radius

999px

---

Padding

0 16px

---

# XXXV. VERTICAL TABS

Purpose

Trang cấu hình.

---

Layout

```txt
┌──────────────┬─────────────────┐
│ Cài đặt      │                 │
│ Quyền        │ Nội dung        │
│ Người dùng   │                 │
└──────────────┴─────────────────┘
```

---

# XXXVI. VERTICAL TAB WIDTH

240px

---

Fixed

---

# XXXVII. VERTICAL ACTIVE

Background

Primary 50

---

Text

Primary 600

---

Border Left

4px Primary

---

# XXXVIII. RESPONSIVE RULE

Desktop

Horizontal Tabs

---

Tablet

Scrollable Tabs

---

Mobile

Segmented Tabs

---

# XXXIX. ACCESSIBILITY

Keyboard Navigation

Required

---

Arrow Left

Previous Tab

---

Arrow Right

Next Tab

---

Enter

Select Tab

---

# XL. FOCUS STATE

Outline

2px Primary

---

Border Radius

8px

---

# XLI. ANIMATION

Transition

150ms

---

Không dùng animation phức tạp.

---

# XLII. TAB STANDARD USE CASES

Product Detail

---

Customer Detail

---

Supplier Detail

---

Inventory Detail

---

Import Goods Detail

---

Export Goods Detail

---

Audit Detail

---

# XLIII. FILE STRUCTURE

/components/tabs

Tabs.tsx

TabItem.tsx

TabContent.tsx

SegmentedControl.tsx

VerticalTabs.tsx

---

# XLIV. REACT STRUCTURE

<Tabs>

<TabList>

<Tab />

<Tab />

</TabList>

<TabContent />

</Tabs>

---

# XLV. DESIGN TOKEN MAPPING

Height

48px

↓

Token

tab-height-md

---

Indicator

2px

↓

tab-indicator-height

---

Padding

↓

space-16

---

# XLVI. FORBIDDEN

Không được:

* Mỗi module tự thiết kế Tabs
* Dùng nhiều style Tabs khác nhau
* Tab xuống nhiều dòng
* Hardcode màu
* Hardcode spacing

---

# XLVII. BẮT BUỘC TUÂN THỦ

Tabs phải kế thừa:

MASTER_DESIGN_TOKENS_V1

↓

MASTER_TYPOGRAPHY_V1

↓

MASTER_APP_SHELL_STANDARD_V1

↓

MASTER_TABS_STANDARD_V1

↓

Application

---

Tabs là cơ chế tổ chức thông tin trong cùng một màn hình.

Nếu Sidebar là Navigation cấp hệ thống

thì Tabs là Navigation cấp màn hình.
