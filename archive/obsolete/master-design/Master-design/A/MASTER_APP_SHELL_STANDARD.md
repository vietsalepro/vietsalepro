# MASTER_APP_SHELL_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ khung ứng dụng (Application Shell) cho POS Enterprise.

App Shell là cấu trúc cố định bao bọc toàn bộ hệ thống.

Tất cả màn hình phải kế thừa từ App Shell.

Không được tự xây dựng layout riêng.

---

# I. TRIẾT LÝ THIẾT KẾ

App Shell là bộ khung xương của hệ thống.

Mọi module:

* Bán hàng
* Kho
* Nhập hàng
* Xuất hủy
* Công nợ
* Báo cáo
* Quản trị

đều phải chạy bên trong cùng một App Shell.

---

# II. APP SHELL ARCHITECTURE

Application

↓

App Shell

├── Sidebar

├── Topbar

├── Breadcrumb

├── Content Area

└── Footer

↓

Pages

↓

Components

---

# III. DESKTOP REFERENCE SIZE

Target Resolution

1920x1080

---

Minimum Supported

1366x768

---

Optimal

1920x1080

---

# IV. APP LAYOUT STRUCTURE

```txt
┌───────────────────────────────────────────────┐
│                    TOPBAR                     │
├─────────────┬─────────────────────────────────┤
│             │                                 │
│             │                                 │
│   SIDEBAR   │          CONTENT AREA           │
│             │                                 │
│             │                                 │
├─────────────┴─────────────────────────────────┤
│                   FOOTER                      │
└───────────────────────────────────────────────┘
```

---

# V. SIDEBAR STANDARD

Purpose

Navigation chính của hệ thống.

---

Position

Left Fixed

---

Height

100vh

---

Background

White

---

Border Right

1px

Border Primary

---

Shadow

None

---

# VI. SIDEBAR WIDTH

Expanded

280px

---

Collapsed

72px

---

Không được dùng kích thước khác.

---

# VII. SIDEBAR COLLAPSE BEHAVIOR

Expanded

Hiển thị:

Icon + Label

---

Collapsed

Chỉ hiển thị:

Icon

---

Tooltip bắt buộc.

---

# VIII. SIDEBAR MENU LEVELS

Level 1

Menu chính

---

Level 2

Submenu

---

Không hỗ trợ sâu hơn 2 cấp.

---

# IX. SIDEBAR ITEM HEIGHT

48px

---

Padding Horizontal

16px

---

Icon Gap

12px

---

# X. SIDEBAR ACTIVE ITEM

Background

Primary 50

---

Text

Primary 600

---

Icon

Primary 600

---

Border Left

4px Primary

---

# XI. TOPBAR STANDARD

Purpose

Global Actions

---

Position

Fixed

---

Top

0

---

Width

100%

---

# XII. TOPBAR HEIGHT

64px

---

Không thay đổi.

---

# XIII. TOPBAR CONTENT

Left

Sidebar Toggle

---

Center

Page Context

(Optional)

---

Right

Search

Notifications

User Profile

---

# XIV. TOPBAR PADDING

Horizontal

24px

---

Vertical

0

---

# XV. USER PROFILE AREA

Avatar

40px

---

User Name

14px

Medium

---

Role

12px

Regular

---

# XVI. NOTIFICATION ICON

Size

20px

---

Badge

12px

---

# XVII. CONTENT AREA

Purpose

Hiển thị dữ liệu chính.

---

Background

#F8FAFC

---

Height

100vh

---

Overflow

Auto

---

# XVIII. CONTENT PADDING

Desktop

24px

---

Tablet

16px

---

Mobile

12px

---

# XIX. CONTENT MAX WIDTH

100%

---

Không giới hạn.

---

# XX. SCROLL STRATEGY

Only Content Area Scroll

---

Sidebar

Fixed

---

Topbar

Fixed

---

Footer

Fixed (Optional)

---

# XXI. FORBIDDEN SCROLL

Không cho phép:

Body Scroll

*

Content Scroll

cùng lúc.

---

# XXII. BREADCRUMB STANDARD

Position

Dưới Topbar

---

Margin Bottom

16px

---

# XXIII. BREADCRUMB STRUCTURE

Home

>

Module

>

Screen

---

Ví dụ

Trang chủ

>

Kho hàng

>

Nhập hàng

---

# XXIV. BREADCRUMB TYPOGRAPHY

Size

13px

---

Weight

400

---

Color

Text Secondary

---

Current Page

500

Primary Text

---

# XXV. PAGE TEMPLATE

Mọi page phải theo cấu trúc:

PageHeader

↓

Filter Section

↓

Action Section

↓

Content Section

↓

Pagination

---

# XXVI. PAGE HEADER

Purpose

Tiêu đề màn hình

---

Height

Auto

---

Margin Bottom

24px

---

# XXVII. PAGE HEADER CONTENT

Title

↓

Description

(Optional)

↓

Action Buttons

---

# XXVIII. PAGE TITLE

Size

30px

---

Weight

700

---

# XXIX. FILTER SECTION

Purpose

Tìm kiếm dữ liệu

---

Margin Bottom

16px

---

# XXX. FILTER LAYOUT

Desktop

Max 4 cột

---

Tablet

2 cột

---

Mobile

1 cột

---

# XXXI. ACTION SECTION

Purpose

Thao tác chính

---

Ví dụ

Thêm mới

Xuất Excel

Import

---

# XXXII. ACTION BAR HEIGHT

56px

---

Gap

12px

---

# XXXIII. CONTENT SECTION

Purpose

Data Grid

Cards

Charts

Forms

---

# XXXIV. SECTION SPACING

Section → Section

24px

---

Box → Box

16px

---

Field → Field

16px

---

# XXXV. FOOTER STANDARD

Optional

---

Height

40px

---

Text Size

12px

---

Color

Text Secondary

---

# XXXVI. RESPONSIVE BREAKPOINTS

Desktop

≥ 1280px

---

Laptop

1024px - 1279px

---

Tablet

768px - 1023px

---

Mobile

<768px

---

# XXXVII. DESKTOP BEHAVIOR

Sidebar Expanded

280px

---

# XXXVIII. LAPTOP BEHAVIOR

Sidebar Expanded

240px

(Optional)

---

# XXXIX. TABLET BEHAVIOR

Sidebar Overlay

---

Default Closed

---

# XL. MOBILE BEHAVIOR

Sidebar Drawer

---

Full Height

---

# XLI. LOADING STATE

Content Skeleton

---

Không được để trắng màn hình.

---

# XLII. EMPTY STATE

Icon

↓

Title

↓

Description

↓

Action Button

---

# XLIII. ERROR STATE

Error Illustration

↓

Message

↓

Retry Button

---

# XLIV. GLOBAL SEARCH

Topbar

Right Side

---

Width

320px

---

# XLV. GLOBAL SHORTCUTS

Ctrl + K

↓

Search

---

Esc

↓

Close Modal

---

# XLVI. Z-INDEX STANDARD

Topbar

500

---

Sidebar

600

---

Dropdown

700

---

Modal

1000

---

Toast

1100

---

Tooltip

1200

---

# XLVII. APP SHELL FILE STRUCTURE

/src/layout

AppShell.tsx

Sidebar.tsx

Topbar.tsx

Breadcrumb.tsx

ContentArea.tsx

Footer.tsx

---

# XLVIII. REACT STRUCTURE

<AppShell>

<Sidebar />

<Topbar />

<ContentArea>

<Page />

</ContentArea>

</AppShell>

---

# XLIX. FORBIDDEN

Không được:

* Mỗi module tự tạo Sidebar
* Mỗi page tự tạo Header
* Hardcode chiều rộng
* Hardcode khoảng cách
* Hardcode Scroll

---

# L. BẮT BUỘC TUÂN THỦ

Tất cả màn hình phải kế thừa:

MASTER_DESIGN_TOKENS_V1

↓

MASTER_TYPOGRAPHY_V1

↓

MASTER_APP_SHELL_STANDARD_V1

↓

MASTER_PAGE_LAYOUT_STANDARD_V1

↓

Components

↓

Pages

---

App Shell là bộ khung vận hành của toàn bộ POS Enterprise.

Nếu Design Tokens là DNA

và Typography là ngôn ngữ

thì App Shell chính là bộ xương của hệ thống.
