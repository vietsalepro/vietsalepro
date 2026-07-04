# MASTER_PAGE_LAYOUT_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ bố cục (Layout) của hệ thống POS.

Mọi màn hình mới phải kế thừa từ BasePageLayout.tsx.

Không được tự ý tạo layout riêng.

---

# I. TRIẾT LÝ THIẾT KẾ

POS không phải Website.

POS không phải Landing Page.

POS là công cụ vận hành.

Ưu tiên:

1. Tốc độ thao tác
2. Dễ đọc dữ liệu
3. Tính nhất quán
4. Hiệu suất làm việc

Không ưu tiên:

* Hiệu ứng phức tạp
* Animation thừa
* Màu sắc sặc sỡ
* Khoảng trắng quá mức

---

# II. PAGE HIERARCHY

Application

↓

Sidebar

↓

Page Container

↓

Page Header

↓

Filter Area

↓

Statistics Area

↓

Content Area

↓

Table/Form Area

↓

Footer Area (nếu có)

---

# III. APPLICATION LAYOUT

Structure

Sidebar

*

Main Content

---

Sidebar Width

280px

Collapsed

80px

---

Main Content

flex:1

overflow:hidden

---

Background

#F8FAFC

---

Height

100vh

---

# IV. PAGE CONTAINER

Purpose

Vùng chứa toàn bộ nội dung màn hình.

---

Max Width

100%

---

Padding Desktop

24px

---

Padding Tablet

20px

---

Padding Mobile

16px

---

Display

flex

flex-direction:column

gap:24px

---

# V. PAGE HEADER

Purpose

Hiển thị:

* Tên màn hình
* Breadcrumb
* Action Button

---

Height

Auto

---

Structure

Left

Breadcrumb

Title

Description

---

Right

Action Buttons

---

Gap

16px

---

# VI. BREADCRUMB STANDARD

Font

13px

Weight

400

---

Color

#64748B

---

Ví dụ

Trang chủ

/

Kho

/

Kiểm kê

---

# VII. PAGE TITLE

Font Size

28px

Weight

700

Color

#0F172A

---

Ví dụ

Quản lý sản phẩm

Nhập hàng

Kiểm kê kho

Lịch sử đơn hàng

---

# VIII. PAGE DESCRIPTION

Font

14px

Weight

400

Color

#64748B

---

Ví dụ

Quản lý toàn bộ sản phẩm trong hệ thống.

---

# IX. HEADER ACTION AREA

Purpose

Chứa:

* Tạo mới
* Import
* Export
* Đồng bộ

---

Layout

display:flex

gap:12px

---

Primary Button luôn nằm ngoài cùng bên phải.

---

# X. FILTER AREA

Purpose

Khu vực tìm kiếm và lọc dữ liệu.

---

Container

Background

#FFFFFF

---

Border

1px solid #F1F5F9

---

Radius

24px

---

Padding

24px

---

Gap

16px

---

Layout

flex-wrap

---

# XI. FILTER FIELD RULE

Không quá:

6 filter trên một hàng.

---

Nếu nhiều hơn:

Sử dụng

Bộ lọc nâng cao

(Advanced Filter)

---

# XII. STATISTICS AREA

Purpose

Hiển thị KPI nhanh.

---

Ví dụ

Tổng đơn hàng

Doanh thu

Khách hàng

Sản phẩm

---

Layout

Grid

---

Desktop

4 cột

---

Tablet

2 cột

---

Mobile

1 cột

---

Gap

16px

---

# XIII. STATISTIC CARD

Height

96px

---

Background

#FFFFFF

---

Border

1px solid #F1F5F9

---

Radius

20px

---

Padding

20px

---

Structure

Icon

Label

Value

Trend

---

# XIV. CONTENT AREA

Purpose

Chứa nội dung chính.

---

Layout

display:flex

flex-direction:column

gap:24px

---

# XV. TABLE PAGE STANDARD

Structure

Page Header

↓

Filter Area

↓

Statistics Area

↓

Table Area

---

Ví dụ

Đơn hàng

Khách hàng

Nhà cung cấp

Thu chi

---

# XVI. FORM PAGE STANDARD

Structure

Page Header

↓

Form Section

↓

Form Section

↓

Form Section

↓

Footer Action

---

Ví dụ

Cấu hình hệ thống

Thông tin doanh nghiệp

---

# XVII. DETAIL PAGE STANDARD

Structure

Page Header

↓

Summary Card

↓

Detail Card

↓

History Card

---

Ví dụ

Chi tiết khách hàng

Chi tiết đơn hàng

---

# XVIII. CONTENT CARD

Background

#FFFFFF

---

Border

1px solid #F1F5F9

---

Radius

24px

---

Padding

24px

---

Shadow

0 2px 8px rgba(15,23,42,0.03)

---

# XIX. EMPTY STATE

Khi chưa có dữ liệu.

---

Hiển thị

Icon

Title

Description

Button

---

Ví dụ

Chưa có sản phẩm

[Tạo sản phẩm]

---

# XX. ERROR STATE

Hiển thị

Icon Warning

Message

Retry Button

---

Không dùng alert()

---

# XXI. LOADING STATE

Sử dụng

Skeleton

---

Không dùng Spinner toàn màn hình.

---

# XXII. SIDEBAR STANDARD

Background

#FFFFFF

---

Border Right

1px solid #F1F5F9

---

Menu Height

44px

---

Radius

12px

---

Active Menu

Background

#F5F3FF

Color

#5B3DF5

---

# XXIII. RESPONSIVE STANDARD

Desktop

> =1280px

---

Tablet

768 - 1279px

---

Mobile

<768px

---

# XXIV. MOBILE RULES

Sidebar

Drawer

---

Statistics

1 cột

---

Filter

1 cột

---

Table

Horizontal Scroll

hoặc

Card View

---

Padding

16px

---

# XXV. PAGE PERFORMANCE RULES

Pagination

Server Side

---

Search

Server Side

---

Filter

Server Side

---

Không load toàn bộ dữ liệu.

---

# XXVI. MASTER PAGE STRUCTURE

<BasePageLayout>

```
<PageHeader />

<FilterArea />

<StatisticsArea />

<ContentArea>

    <DataTable />

</ContentArea>
```

</BasePageLayout>

---

# XXVII. COMPONENT STANDARD

Toàn bộ hệ thống phải sử dụng:

BasePageLayout.tsx

PageHeader.tsx

PageTitle.tsx

FilterArea.tsx

StatisticsArea.tsx

StatisticCard.tsx

ContentCard.tsx

BasePageActions.tsx

---

# XXVIII. BẮT BUỘC TUÂN THỦ

Không được:

* Tự tạo layout mới
* Random spacing
* Random card style
* Random statistic card
* Random page header

Mọi màn hình phải kế thừa từ:

BasePageLayout.tsx

và tuân thủ 100% tài liệu này.

---

# XXIX. PAGE TEMPLATE CATALOG

TABLE PAGE

* Đơn hàng
* Nhập hàng
* Xuất hủy
* Kiểm kê
* Sản phẩm
* Tồn kho
* Khách hàng
* Nhà cung cấp

FORM PAGE

* Cấu hình
* Hồ sơ doanh nghiệp
* Thiết lập hệ thống

DETAIL PAGE

* Chi tiết đơn hàng
* Chi tiết khách hàng
* Chi tiết nhà cung cấp

DASHBOARD PAGE

* Tổng quan
* Báo cáo
* Thống kê

Chỉ được sử dụng các Template trên.

Không tạo loại Page mới nếu chưa được định nghĩa trong tiêu chuẩn.


# PHỤ LỤC BỔ SUNG

MASTER_PAGE_LAYOUT_STANDARD_V1

SECTION: SUMMARY / DETAIL CARD PATTERN

---

# LI. PURPOSE

Chuẩn hóa các màn hình chi tiết trong POS Enterprise.

Áp dụng cho:

* Chi tiết sản phẩm
* Chi tiết khách hàng
* Chi tiết nhà cung cấp
* Chi tiết phiếu nhập
* Chi tiết phiếu xuất
* Chi tiết đơn hàng
* Chi tiết công nợ
* Chi tiết lô hàng

---

# LII. DETAIL PAGE ARCHITECTURE

Page Header

↓

Summary Card

↓

Detail Card

↓

Related Data Cards

↓

Audit Card

---

# LIII. SUMMARY CARD

Purpose

Hiển thị thông tin quan trọng nhất.

Người dùng phải nắm được trạng thái đối tượng trong vòng 3 giây.

---

# LIV. SUMMARY CARD POSITION

Luôn nằm đầu tiên.

Ngay dưới Page Header.

---

# LV. SUMMARY CARD HEIGHT

Auto

---

Min Height

120px

---

# LVI. SUMMARY CARD CONTENT

Entity Name

↓

Status

↓

Primary Metrics

↓

Quick Actions

---

# LVII. PRODUCT SUMMARY EXAMPLE

Tên sản phẩm

↓

SKU

↓

Tồn kho

↓

Giá bán

↓

Trạng thái

---

# LVIII. CUSTOMER SUMMARY EXAMPLE

Tên khách hàng

↓

SĐT

↓

Điểm tích lũy

↓

Công nợ

↓

Trạng thái

---

# LIX. ORDER SUMMARY EXAMPLE

Mã đơn

↓

Khách hàng

↓

Tổng tiền

↓

Thanh toán

↓

Trạng thái

---

# LX. SUMMARY KPI LAYOUT

Desktop

4 Columns

---

Tablet

2 Columns

---

Mobile

1 Column

---

# LXI. SUMMARY METRIC CARD

Background

White

---

Radius

12px

---

Padding

16px

---

Border

1px Solid Border Default

---

# LXII. DETAIL CARD

Purpose

Hiển thị đầy đủ thông tin nghiệp vụ.

---

# LXIII. DETAIL CARD POSITION

Ngay dưới Summary Card.

---

# LXIV. DETAIL CARD STRUCTURE

Card Header

↓

Information Grid

↓

Card Footer (Optional)

---

# LXV. INFORMATION GRID

Desktop

2 Columns

---

Large Screen

3 Columns

---

Tablet

2 Columns

---

Mobile

1 Column

---

# LXVI. INFORMATION ITEM

Label

↓

Value

---

# LXVII. LABEL STANDARD

Size

13px

---

Weight

500

---

Color

Text Secondary

---

# LXVIII. VALUE STANDARD

Size

14px

---

Weight

500

---

Color

Text Primary

---

# LXIX. LONG TEXT FIELD

Chiếm toàn bộ chiều ngang.

---

Ví dụ

Ghi chú

Mô tả

Diễn giải

---

# LXX. RELATED DATA CARD

Purpose

Hiển thị dữ liệu liên quan.

---

Ví dụ

Sản phẩm thuộc đơn hàng

Lịch sử giao dịch

Lịch sử nhập

Lịch sử xuất

---

# LXXI. RELATED DATA STRUCTURE

Card Header

↓

Toolbar

↓

Data Grid

↓

Pagination

---

# LXXII. MULTI CARD LAYOUT

Cho phép:

Summary Card

↓

Detail Card

↓

Inventory Card

↓

Financial Card

↓

Audit Card

---

# LXXIII. CARD SPACING

Card → Card

24px

---

Section → Section

24px

---

# LXXIV. AUDIT CARD

Luôn nằm cuối màn hình.

---

Bao gồm:

Ngày tạo

Người tạo

Ngày cập nhật

Người cập nhật

---

# LXXV. QUICK ACTIONS

Cho phép đặt trong Summary Card.

---

Ví dụ

Chỉnh sửa

In

Xuất PDF

Khóa

Hủy

---

# LXXVI. MASTER-DETAIL PATTERN

Áp dụng:

Phiếu nhập

Phiếu xuất

Đơn hàng

---

Structure

Summary Card

↓

Voucher Detail Card

↓

Item Data Grid

↓

Financial Summary Card

↓

Audit Card

---

# LXXVII. FINANCIAL SUMMARY CARD

Purpose

Tổng hợp số liệu tài chính.

---

Ví dụ

Tạm tính

Chiết khấu

VAT

Tổng cộng

Đã thanh toán

Còn nợ

---

# LXXVIII. INVENTORY SUMMARY CARD

Purpose

Thông tin tồn kho.

---

Ví dụ

Tồn hiện tại

Tồn khả dụng

Đang giữ

Tồn tối thiểu

---

# LXXIX. CARD COLLAPSE

Optional

---

Default

Expanded

---

# LXXX. DESIGN DEPENDENCIES

MASTER_SECTION_BOX_STANDARD_V1

↓

MASTER_CARD_STANDARD_V1

↓

MASTER_PAGE_LAYOUT_STANDARD_V1

---

# LXXXI. BẮT BUỘC TUÂN THỦ

Mọi màn hình Detail phải theo:

Page Header

↓

Summary Card

↓

Detail Card

↓

Related Data Card

↓

Audit Card

Không được tự tạo layout khác.
