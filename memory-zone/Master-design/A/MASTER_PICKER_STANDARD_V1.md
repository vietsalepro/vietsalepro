# MASTER_PICKER_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ hệ thống Picker Components trong POS Enterprise.

Picker là component chuyên dụng để tìm kiếm, lọc và chọn dữ liệu nghiệp vụ.

Picker không phải Select.

Picker là một Modal Workflow.

---

# I. TRIẾT LÝ THIẾT KẾ

Picker phải:

* Tìm kiếm nhanh
* Chọn chính xác
* Hiển thị dữ liệu đầy đủ
* Hỗ trợ dữ liệu lớn

---

Không dùng Select cho:

* Sản phẩm
* Khách hàng
* Nhà cung cấp
* Lô hàng
* Đơn hàng

---

# II. PICKER ARCHITECTURE

Trigger Field

↓

Open Picker

↓

Search

↓

Filter

↓

Data Grid

↓

Select

↓

Return Value

---

# III. PICKER TYPES

Single Picker

---

Multi Picker

---

Quick Picker

---

Advanced Picker

---

# IV. SUPPORTED PICKERS

Product Picker

---

Customer Picker

---

Supplier Picker

---

Employee Picker

---

Warehouse Picker

---

Lot Picker

---

Order Picker

---

Import Voucher Picker

---

Export Voucher Picker

---

# V. DEFAULT PICKER TYPE

Modal Picker

---

Sử dụng:

MASTER_MODAL_BLUEPRINT_V1

---

# VI. PICKER SIZE

Small

700px

---

Medium

900px

(Default)

---

Large

1200px

---

# VII. PICKER STRUCTURE

Header

↓

Search Area

↓

Filter Area

↓

Data Grid

↓

Selection Summary

↓

Footer

---

# VIII. PICKER HEADER

Title

↓

Description

(Optional)

↓

Close Button

---

# IX. SEARCH AREA

Height

40px

---

Position

Top

---

Margin Bottom

16px

---

# X. SEARCH INPUT

Sử dụng:

MASTER_INPUT_STANDARD_V1

↓

Search Input

---

# XI. FILTER AREA

Optional

---

Gap

12px

---

Wrap

Allowed

---

# XII. DATA GRID

Sử dụng:

MASTER_DATA_GRID_STANDARD_V1

---

# XIII. ROW HEIGHT

44px

---

# XIV. PAGE SIZE

Default

20 Rows

---

Options

20

50

100

---

# XV. EMPTY STATE

Sử dụng:

MASTER_EMPTY_STATE_STANDARD_V1

---

# XVI. LOADING STATE

Sử dụng:

MASTER_LOADING_SKELETON_STANDARD_V1

---

# XVII. SINGLE PICKER

Purpose

Chọn 1 đối tượng

---

Ví dụ

Khách hàng

---

Double Click

Select

---

Enter

Select

---

# XVIII. MULTI PICKER

Purpose

Chọn nhiều đối tượng

---

Checkbox

Required

---

# XIX. SELECTION SUMMARY

Position

Bottom

---

Example

Đã chọn: 5 sản phẩm

---

# XX. QUICK PICKER

Purpose

Tìm nhanh

---

Không mở Modal

---

Dropdown Popup

---

Ví dụ

POS Bán hàng

---

# XXI. ADVANCED PICKER

Purpose

Tìm kiếm nâng cao

---

Modal Required

---

# XXII. PRODUCT PICKER

Columns

SKU

Tên sản phẩm

ĐVT

Tồn kho

Giá bán

---

Search Fields

SKU

Barcode

Tên

---

# XXIII. PRODUCT PICKER HOTKEYS

Barcode Scan

Supported

---

Enter

Select Product

---

# XXIV. CUSTOMER PICKER

Columns

Mã KH

Tên KH

SĐT

Điểm

Công nợ

---

Search Fields

Tên

SĐT

Mã KH

---

# XXV. CUSTOMER QUICK CREATE

Cho phép

[Tạo khách hàng]

---

Không đóng Picker

---

# XXVI. SUPPLIER PICKER

Columns

Mã NCC

Tên NCC

SĐT

Email

---

# XXVII. EMPLOYEE PICKER

Columns

Mã NV

Tên NV

Vai trò

Trạng thái

---

# XXVIII. WAREHOUSE PICKER

Columns

Mã Kho

Tên Kho

Địa điểm

---

# XXIX. LOT PICKER

Purpose

Chọn lô hàng

---

Columns

Mã Lô

Ngày SX

HSD

Tồn

Kho

---

# XXX. LOT PICKER HIGHLIGHT

Lô gần hết hạn

↓

Warning Color

---

Lô hết hạn

↓

Danger Color

---

# XXXI. ORDER PICKER

Columns

Mã Đơn

Ngày

Khách Hàng

Tổng Tiền

Trạng Thái

---

# XXXII. FILTER STANDARD

Status

---

Warehouse

---

Category

---

Date Range

---

# XXXIII. SORTING

Supported

---

Single Column

Default

---

# XXXIV. RETURN VALUE

Single Picker

↓

Object

---

Multi Picker

↓

Array

---

# XXXV. RETURN STRUCTURE

Product

id

sku

name

---

Customer

id

code

name

phone

---

# XXXVI. DUPLICATE PREVENTION

Không cho phép:

Chọn trùng dữ liệu

---

# XXXVII. KEYBOARD SUPPORT

Arrow Up

---

Arrow Down

---

Enter

Select

---

Esc

Close

---

Ctrl + F

Focus Search

---

# XXXVIII. BARCODE SUPPORT

Product Picker

Required

---

Lot Picker

Optional

---

# XXXIX. AUTO FOCUS

Open Picker

↓

Focus Search

---

# XL. QUICK SELECT

Double Click

↓

Select Row

---

# XLI. PAGINATION

Required

Khi dữ liệu > 100 records

---

# XLII. VIRTUAL SCROLL

Khuyến nghị

Khi > 1000 records

---

# XLIII. SECURITY RULE

Chỉ hiển thị dữ liệu có quyền truy cập

---

Permission Driven

---

# XLIV. PERFORMANCE RULE

Search Response

<300ms

---

# XLV. FILE STRUCTURE

/components/pickers

BasePicker.tsx

ProductPicker.tsx

CustomerPicker.tsx

SupplierPicker.tsx

LotPicker.tsx

WarehousePicker.tsx

EmployeePicker.tsx

---

# XLVI. REACT ARCHITECTURE

<PickerModal>

<SearchBar />

<FilterBar />

<DataGrid />

<SelectionSummary />

<Footer />

</PickerModal>

---

# XLVII. DESIGN DEPENDENCIES

MASTER_MODAL_BLUEPRINT_V1

↓

MASTER_INPUT_STANDARD_V1

↓

MASTER_DATA_GRID_STANDARD_V1

↓

MASTER_PICKER_STANDARD_V1

---

# XLVIII. FORBIDDEN

Không được:

* Dùng Select cho Product
* Dùng Select cho Customer
* Hiển thị >100 records không phân trang
* Không có Search
* Không có Keyboard Navigation

---

# XLIX. BẮT BUỘC TUÂN THỦ

Tất cả Picker phải kế thừa:

MASTER_DESIGN_TOKENS_V1

↓

MASTER_TYPOGRAPHY_V1

↓

MASTER_MOTION_ANIMATION_STANDARD_V1

↓

MASTER_ELEVATION_ZINDEX_STANDARD_V1

↓

MASTER_MODAL_BLUEPRINT_V1

↓

MASTER_INPUT_STANDARD_V1

↓

MASTER_DATA_GRID_STANDARD_V1

↓

MASTER_PICKER_STANDARD_V1

↓

Application

---

Picker là cầu nối giữa người dùng và dữ liệu nghiệp vụ.

Nếu Select dùng cho dữ liệu nhỏ

thì Picker dùng cho dữ liệu doanh nghiệp.
