# MASTER_INPUT_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ hệ thống Input Controls trong POS Enterprise.

Tất cả:

* Search Box
* Input
* Select
* DatePicker
* Filter Controls
* Form Controls

phải tuân thủ tài liệu này.

---

# I. TRIẾT LÝ THIẾT KẾ

Input phải:

* Dễ đọc
* Dễ nhập liệu
* Đồng nhất
* Tối ưu Desktop POS
* Hỗ trợ thao tác nhanh bằng bàn phím

---

Không được:

* Mỗi module tự tạo Input
* Hardcode chiều cao
* Hardcode màu sắc
* Hardcode khoảng cách

---

# II. INPUT ARCHITECTURE

Field Container

↓

Label

↓

Input Control

↓

Helper Text

↓

Validation Message

---

# III. INPUT SIZE STANDARD

Small

36px

---

Medium (Default)

40px

---

Large

44px

---

Toàn bộ POS V1 sử dụng:

40px

---

# IV. INPUT WIDTH

Default

100%

---

Min Width

160px

---

Search Input

240px

---

Filter Input

200px

---

# V. INPUT BORDER

Width

1px

---

Color

Border Default

---

Radius

10px

---

# VI. INPUT BACKGROUND

White

---

# VII. INPUT PADDING

Horizontal

12px

---

Vertical

0

---

# VIII. INPUT TYPOGRAPHY

Size

14px

---

Weight

400

---

Color

Text Primary

---

# IX. PLACEHOLDER

Size

14px

---

Weight

400

---

Color

Text Secondary

---

# X. LABEL STANDARD

Size

14px

---

Weight

500

---

Margin Bottom

6px

---

# XI. REQUIRED FIELD

Hiển thị

*

---

Color

Danger

---

# XII. HELPER TEXT

Size

12px

---

Color

Text Secondary

---

Margin Top

4px

---

# XIII. ERROR MESSAGE

Size

12px

---

Color

Danger

---

Margin Top

4px

---

# XIV. INPUT STATES

Default

Hover

Focus

Disabled

Read Only

Error

Success

---

# XV. HOVER STATE

Border

Primary 300

---

Duration

150ms

---

# XVI. FOCUS STATE

Border

Primary 500

---

Ring

2px Primary 100

---

# XVII. ERROR STATE

Border

Danger

---

Ring

Danger Light

---

# XVIII. SUCCESS STATE

Border

Success

---

# XIX. DISABLED STATE

Background

Gray 100

---

Cursor

Not Allowed

---

Opacity

0.7

---

# XX. READONLY STATE

Background

Gray 50

---

Cursor

Default

---

# XXI. TEXT INPUT

Purpose

Nhập văn bản

---

Default Component

Input

---

# XXII. NUMBER INPUT

Purpose

Số lượng

Tồn kho

Điểm

---

Align

Right

---

Không cho phép ký tự chữ

---

# XXIII. CURRENCY INPUT

Purpose

Tiền tệ

---

Align

Right

---

Format

1.250.000

---

Không lưu format xuống DB

---

# XXIV. PERCENT INPUT

Purpose

Chiết khấu

---

Format

10%

---

# XXV. TEXTAREA

Min Height

100px

---

Default Height

120px

---

Radius

10px

---

Resize

Vertical Only

---

# XXVI. SEARCH INPUT

Purpose

Tìm kiếm dữ liệu

---

Height

40px

---

Min Width

280px

---

Icon

Search Left

---

Placeholder

Tìm kiếm...

---

# XXVII. SEARCH BEHAVIOR

Debounce

300ms

---

Enter

Search Immediately

---

# XXVIII. FILTER INPUT

Purpose

Lọc dữ liệu

---

Height

40px

---

Min Width

200px

---

# XXIX. SELECT STANDARD

Purpose

Chọn 1 giá trị

---

Height

40px

---

Icon

Chevron Down

---

# XXX. SELECT DROPDOWN

Max Height

320px

---

Overflow

Auto

---

Z-index

Theo MASTER_ELEVATION_ZINDEX_STANDARD_V1

---

# XXXI. MULTI SELECT

Purpose

Chọn nhiều giá trị

---

Display

Chip

---

Max Visible

3

---

Sau đó

+N

---

# XXXII. AUTOCOMPLETE

Purpose

Tìm kiếm dữ liệu lớn

---

Ví dụ

Khách hàng

Sản phẩm

Nhà cung cấp

---

# XXXIII. AUTOCOMPLETE RESULT

Max Height

320px

---

Virtual Scroll

Khuyến nghị

---

# XXXIV. DATE PICKER

Purpose

Chọn ngày

---

Height

40px

---

Format

dd/MM/yyyy

---

Icon

Calendar

---

# XXXV. DATE PICKER POPUP

Width

320px

---

Shadow

LG

---

Radius

12px

---

# XXXVI. DATE RANGE PICKER

Purpose

Khoảng thời gian

---

Format

01/01/2026 → 31/01/2026

---

# XXXVII. DEFAULT DATE FILTERS

Today

Yesterday

This Week

This Month

Last Month

Custom

---

# XXXVIII. TIME PICKER

Format

HH:mm

---

24 giờ

---

# XXXIX. DATETIME PICKER

Format

dd/MM/yyyy HH:mm

---

# XL. FILTER BAR STANDARD

Structure

Search

↓

Filters

↓

Actions

---

# XLI. FILTER BAR HEIGHT

Auto

---

Gap

12px

---

Wrap

Allowed

---

# XLII. FILTER BAR LAYOUT

Desktop

4-6 Controls / Row

---

Tablet

2 Controls / Row

---

Mobile

1 Control / Row

---

# XLIII. CLEAR FILTER

Position

Right

---

Button Type

Ghost

---

# XLIV. APPLY FILTER

Position

Right

---

Button Type

Primary

---

# XLV. VALIDATION RULE

Validate

On Blur

---

Revalidate

On Change

---

# XLVI. ERROR DISPLAY

Input

↓

Error Message

---

Không dùng Alert cho lỗi field

---

# XLVII. KEYBOARD SUPPORT

Tab

Next Field

---

Shift + Tab

Previous Field

---

Enter

Submit/Search

---

Esc

Close Dropdown

---

# XLVIII. ACCESSIBILITY

Label bắt buộc liên kết Input

---

Focus Visible

Required

---

# XLIX. FILE STRUCTURE

/components/forms

Input.tsx

SearchInput.tsx

NumberInput.tsx

CurrencyInput.tsx

Textarea.tsx

Select.tsx

MultiSelect.tsx

DatePicker.tsx

DateRangePicker.tsx

Autocomplete.tsx

---

# L. BẮT BUỘC TUÂN THỦ

Tất cả Input Controls phải kế thừa:

MASTER_DESIGN_TOKENS_V1

↓

MASTER_TYPOGRAPHY_V1

↓

MASTER_MOTION_ANIMATION_STANDARD_V1

↓

MASTER_ELEVATION_ZINDEX_STANDARD_V1

↓

MASTER_INPUT_STANDARD_V1

↓

Application

---

Input là điểm tiếp xúc trực tiếp giữa người dùng và dữ liệu.

Nếu Table là nơi hiển thị dữ liệu

thì Input là nơi dữ liệu được tạo ra.
