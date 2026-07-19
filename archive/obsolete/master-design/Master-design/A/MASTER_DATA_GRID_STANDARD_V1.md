# MASTER_DATA_GRID_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Data Grid trong hệ thống POS Enterprise.

Áp dụng cho:

* Đơn hàng
* Nhập hàng
* Xuất hủy
* Kiểm kê
* Tồn kho
* Khách hàng
* Nhà cung cấp
* Công nợ
* Thu chi
* Báo cáo

Mọi bảng dữ liệu nghiệp vụ phải sử dụng Data Grid Framework.

---

# I. TRIẾT LÝ THIẾT KẾ

Data Grid là trung tâm vận hành của hệ thống POS.

Người dùng dành hơn:

70%

thời gian làm việc trên Data Grid.

---

Data Grid phải:

* Dễ đọc
* Dễ tìm kiếm
* Dễ lọc
* Dễ thao tác
* Không gây mệt mắt

---

# II. DATA GRID ARCHITECTURE

DataGrid

↓

GridToolbar

↓

GridTable

↓

GridPagination

---

# III. MASTER STRUCTURE

<DataGrid>

```
<GridToolbar />

<GridTable />

<GridPagination />
```

</DataGrid>

---

# IV. GRID CONTAINER

Background

#FFFFFF

---

Border

1px solid #F1F5F9

---

Radius

20px

---

Overflow

hidden

---

Shadow

0 2px 8px rgba(15,23,42,0.03)

---

# V. GRID TOOLBAR

Purpose

Tìm kiếm và thao tác dữ liệu.

---

Height

72px

---

Padding

16px 24px

---

Border Bottom

1px solid #F1F5F9

---

Display

flex

justify-content:space-between

align-items:center

---

# VI. TOOLBAR LEFT

Chứa:

Search

Filter

Quick Filter

---

# VII. TOOLBAR RIGHT

Chứa:

Refresh

Export

Import

Column Settings

Create New

---

Maximum

5 Actions

---

# VIII. SEARCH BOX STANDARD

Width

320px

---

Height

44px

---

Icon

Search

---

Placeholder

"Tìm kiếm..."

---

Debounce

300ms

---

# IX. FILTER STANDARD

Không lọc trực tiếp trên Header.

---

Filter nằm trong Toolbar.

---

Ví dụ:

Trạng thái

Chi nhánh

Nhân viên

Khoảng thời gian

---

# X. QUICK FILTER CHIP

Height

36px

---

Radius

999px

---

Padding

0 16px

---

Active

Primary Color

---

Inactive

#F8FAFC

---

# XI. TABLE WRAPPER

Width

100%

---

Overflow X

Auto

---

Overflow Y

Visible

---

# XII. TABLE HEADER

Height

52px

---

Background

#F8FAFC

---

Border Bottom

1px solid #E2E8F0

---

Position

Sticky

---

Top

0

---

Z-index

2

---

# XIII. HEADER CELL

Font

13px

---

Weight

600

---

Color

#475569

---

Text Transform

None

---

Không dùng:

UPPERCASE

---

# XIV. TABLE ROW

Height

56px

---

Border Bottom

1px solid #F8FAFC

---

Transition

150ms

---

# XV. ROW HOVER

Background

#FAFAFF

---

Cursor

Pointer

---

# XVI. ROW SELECTED

Background

#F5F3FF

---

Border Left

4px solid #5B3DF5

---

# XVII. CELL STANDARD

Font

14px

---

Weight

500

---

Color

#0F172A

---

Padding

12px 16px

---

Vertical Align

Middle

---

# XVIII. COLUMN ALIGNMENT

Text

Left

---

Number

Right

---

Currency

Right

---

Date

Center

---

Status

Center

---

Action

Center

---

# XIX. COLUMN WIDTH STANDARD

Checkbox

60px

---

STT

80px

---

Code

140px

---

Name

240px

---

Status

140px

---

Date

160px

---

Amount

180px

---

Action

160px

---

# XX. ROW SELECTION

Checkbox

Bắt buộc

---

Select All

Header Checkbox

---

# XXI. BULK ACTION BAR

Hiển thị khi:

Có ít nhất 1 dòng được chọn.

---

Structure

Đã chọn: X dòng

↓

Bulk Actions

---

Height

56px

---

Background

#F5F3FF

---

# XXII. BULK ACTIONS

Cho phép:

Xóa

Xuất Excel

In

Gán trạng thái

---

Không cho phép:

Hành động nguy hiểm không xác nhận

---

# XXIII. SORTING STANDARD

Sort Icon

Header Right

---

States

ASC

DESC

NONE

---

Multi Sort

Không hỗ trợ V1

---

# XXIV. COLUMN VISIBILITY

Cho phép:

Ẩn/Hiện cột

---

Lưu theo User Preference

---

# XXV. COLUMN RESIZE

Cho phép

---

Min Width

80px

---

Max Width

600px

---

# XXVI. PIN COLUMN

Cho phép:

Pin Left

Pin Right

---

Mặc định:

STT

Checkbox

Action

---

# XXVII. ACTION COLUMN

Luôn nằm cuối bảng.

---

Sticky Right

---

Width

160px

---

# XXVIII. ACTION BUTTONS

View

↓

Edit

↓

Print

↓

Delete

---

Sử dụng:

MASTER_ACTION_BUTTON_STANDARD_V1

---

# XXIX. STATUS COLUMN

Sử dụng:

MASTER_STATUS_BADGE_STANDARD_V1

---

Không dùng text màu.

---

# XXX. PAGINATION STANDARD

Position

Bottom

---

Height

64px

---

Border Top

1px solid #F1F5F9

---

Padding

16px 24px

---

# XXXI. PAGINATION STRUCTURE

Rows Per Page

↓

Page Info

↓

Navigation

---

# XXXII. PAGE SIZE OPTIONS

10

20

50

100

200

---

Default

20

---

# XXXIII. EMPTY STATE

Không có dữ liệu.

---

Structure

Icon

Title

Description

Action

---

Min Height

320px

---

# XXXIV. LOADING STATE

Skeleton Row

---

Row Count

10

---

Không dùng:

Spinner giữa bảng

---

# XXXV. ERROR STATE

Hiển thị trong Table Area.

---

Không dùng Popup.

---

# XXXVI. EXPORT STANDARD

Formats

Excel

CSV

PDF

---

Permission Required

export

---

# XXXVII. IMPORT STANDARD

Formats

Excel

CSV

---

Permission Required

import

---

# XXXVIII. RESPONSIVE RULE

Desktop

Full Data Grid

---

Tablet

Horizontal Scroll

---

Mobile

Card Mode

---

Không hiển thị Data Grid Desktop trên Mobile.

---

# XXXIX. MOBILE CARD MODE

Structure

Record Card

↓

Key Information

↓

Actions

---

# XL. PERFORMANCE RULE

Server Side Pagination

Bắt buộc

---

Server Side Search

Bắt buộc

---

Server Side Filter

Bắt buộc

---

# XLI. LARGE DATA RULE

> 10.000 records

---

Không load toàn bộ dữ liệu.

---

Bắt buộc phân trang API.

---

# XLII. ACCESSIBILITY

Keyboard Navigation

Bắt buộc

---

ARIA Labels

Bắt buộc

---

Focus Ring

Bắt buộc

---

# XLIII. AUDIT COLUMN STANDARD

Created By

Created At

Updated By

Updated At

---

Ẩn mặc định.

---

# XLIV. COMPONENT STANDARD

Bắt buộc sử dụng:

DataGrid.tsx

GridToolbar.tsx

GridTable.tsx

GridPagination.tsx

GridSearch.tsx

GridFilter.tsx

GridBulkActionBar.tsx

GridColumnSettings.tsx

---

# XLV. FILE STRUCTURE

/components/datagrid

DataGrid.tsx

GridToolbar.tsx

GridTable.tsx

GridPagination.tsx

GridSearch.tsx

GridFilter.tsx

GridBulkActionBar.tsx

GridColumnSettings.tsx

---

# XLVI. BUSINESS MODULE MAPPING

OrdersGrid

ImportGoodsGrid

InventoryGrid

StockCheckGrid

SupplierGrid

CustomerGrid

DebtGrid

ExpenseGrid

ReportGrid

---

Tất cả phải kế thừa:

DataGrid Framework

---

# XLVII. DESIGN TOKEN MAPPING

Background

#FFFFFF

---

Header

#F8FAFC

---

Border

#F1F5F9

---

Primary

#5B3DF5

---

Text Primary

#0F172A

---

Text Secondary

#64748B

---

# XLVIII. BẮT BUỘC TUÂN THỦ

Không được:

* Tạo bảng riêng cho từng màn hình
* Tạo Toolbar riêng
* Tạo Pagination riêng
* Tạo Search riêng
* Tạo Action Column riêng

Mọi bảng nghiệp vụ phải kế thừa:

DataGrid Framework Standard

và tuân thủ tuyệt đối tài liệu này.

Data Grid là trái tim của toàn bộ hệ thống POS Enterprise.
