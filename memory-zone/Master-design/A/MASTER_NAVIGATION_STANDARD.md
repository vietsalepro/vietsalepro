# MASTER_NAVIGATION_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Navigation System của POS.

Áp dụng cho:

* Sidebar
* Menu
* Submenu
* Breadcrumb
* Quick Action
* Route Structure
* Permission Navigation

Mọi màn hình phải tuân thủ tiêu chuẩn này.

---

# I. TRIẾT LÝ THIẾT KẾ

Navigation không phải danh sách chức năng.

Navigation là bản đồ vận hành của doanh nghiệp.

Nguyên tắc:

* Dễ tìm
* Dễ nhớ
* Dễ mở rộng
* Ít click nhất

Người dùng phải truy cập được chức năng chính trong tối đa:

3 click

---

# II. NAVIGATION HIERARCHY

Level 1

Module

↓

Level 2

Menu

↓

Level 3

Sub Menu

↓

Level 4

Screen

---

Không cho phép sâu hơn 4 cấp.

---

# III. SIDEBAR STANDARD

Purpose

Điều hướng chính toàn hệ thống.

---

Position

Left

---

Height

100vh

---

Desktop Width

280px

---

Collapsed Width

80px

---

Background

#FFFFFF

---

Border Right

1px solid #F1F5F9

---

Overflow

auto

---

# IV. SIDEBAR HEADER

Purpose

Hiển thị:

Logo

Tên doanh nghiệp

Phiên bản

---

Height

72px

---

Padding

16px 20px

---

Border Bottom

1px solid #F1F5F9

---

# V. SIDEBAR CONTENT

Layout

flex-column

---

Gap

4px

---

Padding

12px

---

# VI. MENU ITEM STANDARD

Height

44px

---

Padding

0 12px

---

Radius

12px

---

Gap

12px

---

Font

14px

Weight

500

---

Color

#334155

---

Icon Size

20px

---

# VII. MENU HOVER

Background

#F8FAFC

---

Color

#0F172A

---

Transition

150ms

---

# VIII. ACTIVE MENU

Background

#F5F3FF

---

Color

#5B3DF5

---

Font Weight

600

---

Indicator

4px solid #5B3DF5

ở cạnh trái

---

# IX. DISABLED MENU

Background

transparent

---

Color

#CBD5E1

---

Cursor

not-allowed

---

# X. SUBMENU STANDARD

Padding Left

44px

---

Gap

4px

---

Height

40px

---

Radius

10px

---

Font

13px

---

Weight

500

---

# XI. COLLAPSED MODE

Width

80px

---

Ẩn Label

---

Chỉ hiển thị Icon

---

Hover

Hiển thị Tooltip

---

Không hiển thị Submenu

---

# XII. MENU GROUP STANDARD

Purpose

Nhóm các menu liên quan.

---

Ví dụ

BÁN HÀNG

* POS
* Đơn hàng

---

KHO

* Sản phẩm
* Nhập hàng
* Kiểm kê

---

TÀI CHÍNH

* Thu chi
* Công nợ

---

# XIII. GROUP TITLE

Font

11px

---

Weight

600

---

Letter Spacing

1px

---

Color

#94A3B8

---

Text Transform

uppercase

---

# XIV. MENU BADGE STANDARD

Purpose

Thông báo số lượng.

---

Ví dụ

Đơn hàng mới

Thông báo

Yêu cầu duyệt

---

Height

20px

---

Min Width

20px

---

Radius

999px

---

Font

11px

---

Weight

600

---

# XV. BADGE COLORS

Success

#10B981

---

Warning

#F59E0B

---

Error

#EF4444

---

Info

#3B82F6

---

# XVI. BREADCRUMB STANDARD

Purpose

Hiển thị vị trí hiện tại.

---

Position

Page Header

---

Font

13px

---

Color

#64748B

---

Separator

/

---

Ví dụ

Trang chủ

/

Kho

/

Nhập hàng

---

# XVII. ROUTE NAMING STANDARD

Format

/module/action

---

Ví dụ

/orders

/orders/create

/orders/detail

---

/inventory

/inventory/import

/inventory/audit

---

Không dùng:

/page1

/page2

/test

/demo

---

# XVIII. QUICK ACTION STANDARD

Purpose

Chức năng thao tác nhanh.

---

Position

Top Right

---

Ví dụ

Tạo đơn hàng

Nhập hàng

Kiểm kê

Khách hàng mới

---

Maximum

5 actions

---

# XIX. FAVORITE MENU

Cho phép người dùng:

Pin menu yêu thích

---

Maximum

10 menu

---

Position

Top Sidebar

---

# XX. RECENT MENU

Hiển thị:

5 màn hình truy cập gần nhất

---

Position

Dưới Favorite

---

# XXI. SEARCH MENU STANDARD

Purpose

Tìm nhanh chức năng.

---

Position

Top Sidebar

---

Height

44px

---

Placeholder

Tìm chức năng...

---

Debounce

300ms

---

Search By

Tên menu

Tên màn hình

Mã màn hình

---

# XXII. NOTIFICATION ENTRY

Position

Header Right

---

Icon

Bell

---

Hiển thị:

Unread Count

---

Click

Open Notification Drawer

---

# XXIII. USER MENU STANDARD

Position

Header Right

---

Hiển thị

Avatar

Tên

Vai trò

---

Dropdown

Thông tin cá nhân

Đổi mật khẩu

Đăng xuất

---

# XXIV. PERMISSION VISIBILITY

Menu chỉ hiển thị khi:

User có quyền truy cập.

---

Không hiển thị menu bị cấm.

---

Không disable menu bị cấm.

---

Ẩn hoàn toàn.

---

# XXV. RESPONSIVE STANDARD

Desktop

Sidebar cố định

---

Tablet

Sidebar dạng Drawer

---

Mobile

Sidebar dạng Drawer

---

Overlay

rgba(15,23,42,0.45)

---

# XXVI. PERFORMANCE RULE

Menu Tree

Lazy Load

---

Permission

Cache

---

Không render toàn bộ menu nếu không cần.

---

# XXVII. MASTER STRUCTURE

<AppLayout>

```
<Sidebar>

    <SidebarHeader />

    <MenuSearch />

    <FavoriteMenu />

    <RecentMenu />

    <MenuGroups />

</Sidebar>

<MainContent>

    <PageHeader />

    <PageContent />

</MainContent>
```

</AppLayout>

---

# XXVIII. MENU CATALOG CHUẨN POS

DASHBOARD

* Tổng quan

---

BÁN HÀNG

* POS Bán hàng
* Đơn hàng
* Trả hàng

---

KHO

* Sản phẩm
* Danh mục
* Nhập hàng
* Xuất hủy
* Kiểm kê
* Tồn kho

---

KHÁCH HÀNG

* Khách hàng
* Nhóm khách hàng

---

NHÀ CUNG CẤP

* Nhà cung cấp

---

TÀI CHÍNH

* Thu chi
* Công nợ

---

BÁO CÁO

* Báo cáo bán hàng
* Báo cáo tồn kho
* Báo cáo tài chính

---

HỆ THỐNG

* Người dùng
* Vai trò
* Cấu hình

---

# XXIX. COMPONENT STANDARD

Toàn bộ hệ thống phải sử dụng:

Sidebar.tsx

SidebarMenu.tsx

SidebarGroup.tsx

Breadcrumb.tsx

QuickAction.tsx

MenuSearch.tsx

UserMenu.tsx

NotificationMenu.tsx

---

# XXX. BẮT BUỘC TUÂN THỦ

Không được:

* Tự tạo Sidebar khác
* Random menu style
* Random breadcrumb
* Random submenu
* Random icon size

Mọi Navigation trong hệ thống phải kế thừa từ:

Navigation Framework Standard

và tuân thủ 100% tài liệu này.
