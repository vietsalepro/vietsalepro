# MASTER_ELEVATION_ZINDEX_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ hệ thống Elevation, Layering, Overlay và Z-Index trong POS Enterprise.

Mọi component hiển thị nổi (Floating UI) phải tuân thủ tài liệu này.

Không được tự tạo z-index.

---

# I. TRIẾT LÝ THIẾT KẾ

Z-Index không phải số.

Z-Index là hệ thống phân tầng giao diện.

---

Sai

z-index:99999

---

Đúng

z-index:var(--z-modal)

---

# II. LAYER ARCHITECTURE

Application Layer

↓

Navigation Layer

↓

Overlay Layer

↓

Modal Layer

↓

Notification Layer

↓

Emergency Layer

---

# III. STACKING HIERARCHY

```txt
Loading Screen
↑
Tooltip
↑
Toast
↑
Modal
↑
Dropdown
↑
Sidebar
↑
Page Content
```

---

Không được thay đổi.

---

# IV. LAYER LEVELS

Level 0

Background

---

Level 1

Content

---

Level 2

Navigation

---

Level 3

Overlay

---

Level 4

Modal

---

Level 5

Notifications

---

Level 6

Emergency

---

# V. Z-INDEX TOKENS

z-background

0

---

z-content

1

---

z-navigation

100

---

z-overlay

500

---

z-modal

1000

---

z-notification

1100

---

z-tooltip

1200

---

z-emergency

9999

---

# VI. PAGE CONTENT

Purpose

Nội dung màn hình

---

Z-Index

1

---

# VII. STICKY TABLE HEADER

Purpose

Header Data Grid

---

Z-Index

50

---

Luôn dưới Navigation.

---

# VIII. TOPBAR

Purpose

Header ứng dụng

---

Z-Index

100

---

# IX. SIDEBAR

Purpose

Navigation

---

Z-Index

100

---

Cùng tầng Topbar.

---

# X. BREADCRUMB

Purpose

Điều hướng phụ

---

Z-Index

1

---

# XI. FILTER BAR STICKY

Purpose

Sticky Search Area

---

Z-Index

80

---

# XII. DROPDOWN

Purpose

Menu mở rộng

---

Z-Index

500

---

Ví dụ

Select

Autocomplete

Dropdown Menu

---

# XIII. CONTEXT MENU

Purpose

Right Click Menu

---

Z-Index

520

---

Luôn trên Dropdown.

---

# XIV. DATE PICKER

Purpose

Calendar Popup

---

Z-Index

550

---

# XV. COLOR PICKER

Purpose

Popup chọn màu

---

Z-Index

550

---

# XVI. POPOVER

Purpose

Thông tin mở rộng

---

Z-Index

600

---

# XVII. DRAWER

Purpose

Side Panel

---

Z-Index

900

---

Ví dụ

Chi tiết sản phẩm

Chi tiết khách hàng

---

# XVIII. DRAWER OVERLAY

Purpose

Lớp phủ nền

---

Z-Index

890

---

# XIX. MODAL OVERLAY

Purpose

Backdrop

---

Z-Index

990

---

# XX. MODAL

Purpose

Dialog

---

Z-Index

1000

---

# XXI. NESTED MODAL

Không khuyến khích.

---

Nếu bắt buộc:

Modal 2

↓

1010

---

Modal 3

↓

1020

---

Tối đa:

3 tầng

---

# XXII. MODAL DROPDOWN

Dropdown mở trong Modal

↓

1100

---

Luôn nổi trên Modal.

---

# XXIII. MODAL DATE PICKER

DatePicker trong Modal

↓

1110

---

# XXIV. MODAL POPOVER

Popover trong Modal

↓

1120

---

# XXV. TOAST NOTIFICATION

Purpose

Thông báo nổi

---

Z-Index

1100

---

Position

Top Right

---

# XXVI. GLOBAL NOTIFICATION CENTER

Purpose

Notification Panel

---

Z-Index

1150

---

# XXVII. TOOLTIP

Purpose

Thông tin ngắn

---

Z-Index

1200

---

Luôn trên tất cả UI.

---

# XXVIII. TOUR GUIDE

Purpose

Hướng dẫn người dùng

---

Z-Index

1300

---

# XXIX. COMMAND PALETTE

Purpose

Ctrl + K

---

Z-Index

1400

---

# XXX. GLOBAL SEARCH OVERLAY

Purpose

Tìm kiếm toàn hệ thống

---

Z-Index

1450

---

# XXXI. LOADING OVERLAY

Purpose

Khóa giao diện

---

Z-Index

1500

---

# XXXII. SYSTEM BLOCKER

Purpose

Bảo trì hệ thống

---

Z-Index

9999

---

Luôn cao nhất.

---

# XXXIII. ELEVATION SYSTEM

Không dùng z-index để tạo cảm giác nổi.

---

Dùng:

Shadow

---

# XXXIV. ELEVATION LEVELS

Level 0

Flat

---

Level 1

Dropdown

---

Level 2

Popover

---

Level 3

Drawer

---

Level 4

Modal

---

Level 5

Emergency

---

# XXXV. SHADOW MAPPING

Elevation 1

Shadow SM

---

Elevation 2

Shadow MD

---

Elevation 3

Shadow LG

---

Elevation 4

Shadow XL

---

# XXXVI. PORTAL RULE

Các component sau phải render bằng Portal:

Modal

Drawer

Tooltip

Dropdown

Toast

Popover

---

Không render trong DOM tree thông thường.

---

# XXXVII. OVERFLOW RULE

Không được:

overflow:hidden

chặn:

Dropdown

Tooltip

Popover

---

Bắt buộc dùng Portal.

---

# XXXVIII. STACKING CONTEXT RULE

Không dùng:

transform

filter

opacity

để vô tình tạo stacking context mới.

---

# XXXIX. REACT STRUCTURE

<App>

<AppShell />

<PortalRoot />

<ModalRoot />

<TooltipRoot />

<ToastRoot />

</App>

---

# XL. CSS VARIABLE STANDARD

:root {

--z-content:1;

--z-navigation:100;

--z-dropdown:500;

--z-modal:1000;

--z-toast:1100;

--z-tooltip:1200;

}

---

# XLI. TAILWIND MAPPING

z-content

↓

z-[1]

---

z-modal

↓

z-[1000]

---

z-tooltip

↓

z-[1200]

---

# XLII. DEBUG RULE

Dev Mode

↓

Hiển thị Layer Inspector

(Optional)

---

# XLIII. PERFORMANCE RULE

Không dùng:

z-index > 9999

---

Không dùng:

999999

9999999

99999999

---

# XLIV. FORBIDDEN

Không được:

* Hardcode z-index
* Tự tạo layer mới
* Nested Modal > 3
* Dropdown không dùng Portal
* Tooltip không dùng Portal

---

# XLV. BẮT BUỘC TUÂN THỦ

Tất cả Floating Components phải kế thừa:

MASTER_DESIGN_TOKENS_V1

↓

MASTER_MOTION_ANIMATION_STANDARD_V1

↓

MASTER_ELEVATION_ZINDEX_STANDARD_V1

↓

Components

↓

Application

---

Elevation quyết định cảm giác nổi.

Z-Index quyết định thứ tự hiển thị.

Nếu Motion là cách hệ thống chuyển động

thì Elevation là cách hệ thống tồn tại trong không gian.
