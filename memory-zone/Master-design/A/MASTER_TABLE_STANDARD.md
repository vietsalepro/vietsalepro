# MASTER_TABLE_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Data Table trong hệ thống POS.

Mọi màn hình:

* Đơn hàng
* Nhập hàng
* Xuất hủy
* Kiểm kê
* Sản phẩm
* Tồn kho
* Công nợ
* Thu chi
* Khách hàng
* Nhà cung cấp

đều phải sử dụng cùng một Data Table Standard.

Không được tự ý tạo Table mới với style khác.

---

# I. TRIẾT LÝ THIẾT KẾ

Table là nơi người dùng làm việc nhiều nhất.

Mục tiêu:

* Đọc nhanh
* Tìm nhanh
* Quét dữ liệu nhanh
* Không gây mỏi mắt

Nguyên tắc:

Information First

Visual Noise Last

---

# II. TABLE ARCHITECTURE

DataTable

↓

Toolbar

↓

Filter Area

↓

Table Container

↓

Header

↓

Body

↓

Pagination

---

# III. TABLE CONTAINER

Background

#FFFFFF

Border

1px solid #F1F5F9

Radius

24px

Overflow

hidden

Shadow

0 2px 8px rgba(15,23,42,0.03)

---

# IV. TABLE TOOLBAR

Purpose

Chứa:

* Search
* Filter
* Action Button
* Export

---

Height

72px

Padding

16px 24px

---

Layout

display:flex

justify-content:space-between

align-items:center

---

# V. FILTER AREA

Purpose

Chứa:

* Date Range
* Status
* Customer
* Keyword

---

Container

Background

#FFFFFF

Border

1px solid #F1F5F9

Radius

20px

Padding

20px

---

Gap

16px

---

# VI. TABLE HEADER

Height

52px

Background

#FFFFFF

Border Bottom

1px solid #F1F5F9

---

Font

13px

Weight

600

Color

#334155

---

Text Transform

uppercase

---

Letter Spacing

0.2px

---

# VII. HEADER CELL

Padding

16px 20px

---

Align

Left

---

Không căn giữa tiêu đề cột.

---

# VIII. TABLE BODY

Background

#FFFFFF

---

Row Height

56px

---

Cell Padding

16px 20px

---

Font

14px

Weight

500

Color

#0F172A

---

# IX. ROW HOVER

Background

#FAFBFC

Cursor

pointer

Transition

150ms

---

# X. ROW SELECTED

Background

#F5F3FF

Border Left

4px solid #5B3DF5

---

# XI. ROW BORDER

Border Bottom

1px solid #F8FAFC

---

Không dùng border đậm.

---

# XII. COLUMN ALIGNMENT

Text

Left

---

Name

Left

---

Date

Center

---

Quantity

Right

---

Money

Right

---

Status

Center

---

Action

Center

---

# XIII. MONEY COLUMN STANDARD

Ví dụ

150.000 đ

1.250.000 đ

15.000.000 đ

---

Align

Right

---

Weight

600

---

Color

#0F172A

---

Không dùng màu đỏ hoặc xanh cho giá trị tiền.

---

# XIV. DATE COLUMN STANDARD

Format

dd/MM/yyyy

---

DateTime

dd/MM/yyyy HH:mm

---

Align

Center

---

# XV. STATUS COLUMN STANDARD

Height

28px

---

Padding

0 12px

---

Radius

999px

---

Font

12px

Weight

500

---

SUCCESS

Background

#ECFDF5

Color

#059669

---

WARNING

Background

#FFF7ED

Color

#EA580C

---

ERROR

Background

#FEF2F2

Color

#DC2626

---

INFO

Background

#EFF6FF

Color

#2563EB

---

# XVI. ACTION COLUMN STANDARD

Purpose

Xem

Sửa

In

Xóa

---

Button Size

40x40

---

Radius

12px

---

Border

1px solid #E2E8F0

---

Gap

8px

---

Maximum Visible Actions

3

---

Nếu >3 action

Hiển thị menu ...

---

# XVII. SEARCH BAR STANDARD

Height

44px

---

Radius

12px

---

Icon Search

Bên trái

---

Debounce

300ms

---

# XVIII. SORT STANDARD

Click Header

Ascending

↓

Descending

↓

None

---

Icon

Chevron Up/Down

---

Không dùng text ASC/DESC

---

# XIX. PAGINATION STANDARD

Position

Bottom Right

---

Height

56px

---

Button

40x40

---

Radius

12px

---

Active

Background

#5B3DF5

Color

#FFFFFF

---

Inactive

Background

#FFFFFF

Border

1px solid #E2E8F0

---

# XX. PAGE SIZE STANDARD

Default

20 rows

---

Options

10

20

50

100

---

# XXI. STICKY HEADER

Required

YES

---

Header luôn hiển thị khi scroll.

---

# XXII. LOADING STATE

Không dùng Spinner giữa bảng.

---

Hiển thị:

Skeleton Row

---

Số lượng

10 rows

---

# XXIII. EMPTY STATE

Khi không có dữ liệu.

Hiển thị:

Icon

Title

Description

Action

---

Ví dụ

Chưa có đơn hàng

[Tạo đơn hàng]

---

# XXIV. ERROR STATE

Khi API lỗi.

Hiển thị:

Icon Warning

Thông báo lỗi

Nút tải lại

---

Không dùng alert()

---

# XXV. BULK ACTION STANDARD

Khi chọn nhiều dòng.

Hiển thị:

Toolbar nổi phía trên

---

Ví dụ

Đã chọn 15 dòng

[Xuất Excel]

[Xóa]

[Cập nhật]

---

# XXVI. RESPONSIVE STANDARD

Desktop

Full Table

---

Tablet

Horizontal Scroll

---

Mobile

Card View

---

Không hiển thị Table đầy đủ trên Mobile.

---

# XXVII. TABLE PERFORMANCE STANDARD

Pagination Server Side

Required

---

Search Server Side

Required

---

Filter Server Side

Required

---

Không load toàn bộ dữ liệu.

---

# XXVIII. COLUMN PRIORITY

Priority 1

Luôn hiển thị

Mã

Tên

Trạng thái

---

Priority 2

Ngày

Số lượng

Giá trị

---

Priority 3

Ghi chú

Người tạo

Mô tả

---

# XXIX. MASTER TABLE STRUCTURE

<DataTable>

```
<TableToolbar />

<FilterArea />

<TableHeader />

<TableBody />

<Pagination />
```

</DataTable>

---

# XXX. COMPONENT STANDARD

Toàn bộ hệ thống phải sử dụng:

BaseTable.tsx

BaseTableHeader.tsx

BaseTableRow.tsx

BaseTableCell.tsx

BasePagination.tsx

BaseStatusBadge.tsx

BaseTableAction.tsx

làm component chuẩn duy nhất.

---

# XXXI. BẮT BUỘC TUÂN THỦ

Không được:

* Random màu Header
* Random Row Height
* Random Pagination
* Random Status Badge
* Random Action Button

Mọi màn hình trong hệ thống phải kế thừa từ:

BaseTable.tsx

và tuân thủ 100% tiêu chuẩn này.
