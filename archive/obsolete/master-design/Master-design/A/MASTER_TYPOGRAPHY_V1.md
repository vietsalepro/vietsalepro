# MASTER_TYPOGRAPHY_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ hệ thống Typography cho POS Enterprise.

Typography là hệ thống kiểm soát:

* Font Family
* Font Size
* Font Weight
* Line Height
* Text Hierarchy
* Text Usage Rules
* Readability Standards

Tất cả màn hình phải tuân thủ tài liệu này.

---

# I. TRIẾT LÝ THIẾT KẾ

Typography phải:

* Dễ đọc
* Đồng nhất
* Chuyên nghiệp
* Tối ưu tiếng Việt
* Tối ưu Desktop POS

---

Không được:

* Random Font Size
* Random Font Weight
* Random Line Height

---

Typography là hệ thống phân cấp thông tin.

---

# II. FONT FAMILY STANDARD

Primary Font

```css
Inter,
"Noto Sans",
Roboto,
sans-serif
```

---

Fallback Font

```css
"Noto Sans"
```

---

# III. VIETNAMESE SUPPORT RULE

Font bắt buộc hỗ trợ:

* Tiếng Việt có dấu
* Unicode UTF-8
* Ký tự tiền tệ
* Ký tự đặc biệt

---

Không dùng:

* Arial
* Tahoma
* Times New Roman

cho hệ thống chính.

---

# IV. FONT WEIGHT STANDARD

Regular

400

---

Medium

500

---

SemiBold

600

---

Bold

700

---

Không dùng:

800

900

trong POS V1.

---

# V. FONT SIZE SCALE

xs

12px

---

sm

13px

---

md

14px

(Default)

---

lg

16px

---

xl

18px

---

2xl

20px

---

3xl

24px

---

4xl

30px

---

# VI. LINE HEIGHT SCALE

Compact

1.2

---

Normal

1.5

(Default)

---

Relaxed

1.7

---

# VII. LETTER SPACING

Default

0

---

Heading

-0.01em

---

Không tự chỉnh tracking.

---

# VIII. TEXT COLOR STANDARD

Text Primary

#0F172A

---

Text Secondary

#64748B

---

Text Muted

#94A3B8

---

Text Disabled

#CBD5E1

---

Text Inverse

#FFFFFF

---

# IX. TYPOGRAPHY HIERARCHY

Level 1

Page Title

---

Level 2

Section Title

---

Level 3

Card Title

---

Level 4

Form Group Title

---

Level 5

Body Text

---

Level 6

Caption

---

# X. PAGE TITLE

Purpose

Tiêu đề trang

---

Size

30px

---

Weight

700

---

Line Height

1.2

---

Color

Primary Text

---

Ví dụ

Quản lý nhập hàng

---

# XI. SECTION TITLE

Purpose

Tiêu đề khu vực

---

Size

24px

---

Weight

600

---

Line Height

1.3

---

Ví dụ

Thông tin đơn hàng

---

# XII. CARD TITLE

Purpose

Tiêu đề Card

---

Size

18px

---

Weight

600

---

Ví dụ

Tổng doanh thu

---

# XIII. BOX TITLE

Purpose

Tiêu đề Section Box

---

Size

16px

---

Weight

600

---

Ví dụ

Thông tin khách hàng

---

# XIV. BODY TEXT

Purpose

Nội dung chính

---

Size

14px

---

Weight

400

---

Line Height

1.5

---

Đây là cỡ chữ mặc định toàn hệ thống.

---

# XV. SMALL TEXT

Purpose

Thông tin phụ

---

Size

13px

---

Weight

400

---

# XVI. CAPTION TEXT

Purpose

Ghi chú

---

Size

12px

---

Weight

400

---

# XVII. MODAL TITLE

Purpose

Tiêu đề Modal

---

Size

20px

---

Weight

600

---

Line Height

1.3

---

Ví dụ

Chi tiết đơn hàng

---

# XVIII. MODAL DESCRIPTION

Purpose

Mô tả Modal

---

Size

14px

---

Weight

400

---

Color

Text Secondary

---

# XIX. FORM LABEL

Purpose

Tên trường dữ liệu

---

Size

14px

---

Weight

500

---

Color

Primary Text

---

# XX. REQUIRED LABEL

Dấu *

---

Color

Danger

---

Weight

600

---

# XXI. INPUT TEXT

Purpose

Dữ liệu nhập

---

Size

14px

---

Weight

400

---

# XXII. PLACEHOLDER TEXT

Purpose

Gợi ý nhập liệu

---

Size

14px

---

Weight

400

---

Color

Text Secondary

---

# XXIII. HELPER TEXT

Purpose

Mô tả trường dữ liệu

---

Size

12px

---

Weight

400

---

Color

Text Secondary

---

# XXIV. ERROR TEXT

Purpose

Thông báo lỗi

---

Size

12px

---

Weight

500

---

Color

Danger

---

# XXV. BUTTON TEXT

Button Small

13px

500

---

Button Medium

14px

500

---

Button Large

16px

600

---

# XXVI. TABLE HEADER

Purpose

Tiêu đề cột

---

Size

13px

---

Weight

600

---

Uppercase

Không

---

# XXVII. TABLE CELL

Purpose

Dữ liệu bảng

---

Size

14px

---

Weight

400

---

# XXVIII. TABLE NUMBER

Purpose

Số lượng

Tiền tệ

Tồn kho

---

Size

14px

---

Weight

500

---

Text Align

Right

---

# XXIX. TABLE TOTAL

Purpose

Tổng cộng

---

Size

14px

---

Weight

600

---

# XXX. STATUS BADGE TEXT

Purpose

Trạng thái

---

Size

12px

---

Weight

600

---

Uppercase

Không

---

# XXXI. DASHBOARD KPI VALUE

Purpose

Số liệu chính

---

Size

30px

---

Weight

700

---

Ví dụ

12.500.000

---

# XXXII. DASHBOARD KPI LABEL

Purpose

Tên chỉ số

---

Size

14px

---

Weight

500

---

# XXXIII. SIDEBAR MENU

Level 1

14px

500

---

Level 2

13px

400

---

# XXXIV. TOPBAR TEXT

User Name

14px

500

---

Role

12px

400

---

# XXXV. BREADCRUMB

Size

13px

---

Weight

400

---

# XXXVI. TOOLTIP TEXT

Size

12px

---

Weight

400

---

# XXXVII. NOTIFICATION TITLE

Size

14px

---

Weight

600

---

# XXXVIII. NOTIFICATION CONTENT

Size

13px

---

Weight

400

---

# XXXIX. PRINT TYPOGRAPHY

Body

12pt

---

Heading

16pt

---

Table

11pt

---

# XL. NUMBER DISPLAY STANDARD

Quantity

1,250

---

Money

1.250.000 đ

---

Percent

12.50%

---

Không dùng định dạng lẫn lộn.

---

# XLI. DATE DISPLAY STANDARD

dd/MM/yyyy

---

Ví dụ

15/07/2026

---

# XLII. DATETIME DISPLAY STANDARD

dd/MM/yyyy HH:mm

---

Ví dụ

15/07/2026 14:35

---

# XLIII. READABILITY RULE

Không dùng:

11px

10px

9px

---

Ngoại trừ:

Chart

Micro Label

---

# XLIV. TEXT ALIGNMENT RULE

Text

Left

---

Number

Right

---

Status

Center

---

Action

Center

---

# XLV. ACCESSIBILITY RULE

Minimum Contrast

4.5:1

---

Không dùng:

Text màu nhạt trên nền sáng.

---

# XLVI. DARK MODE READY

Typography phải hoạt động:

Light

↓

Dark

---

Thông qua Semantic Color Tokens.

---

# XLVII. CSS TOKEN MAPPING

--font-family-primary

--font-size-md

--font-size-lg

--font-weight-medium

--font-weight-semibold

---

Không hardcode.

---

# XLVIII. TAILWIND MAPPING

text-xs

12px

---

text-sm

14px

---

text-base

16px

---

Tùy chỉnh theo Design Tokens.

---

# XLIX. COMPONENT INTEGRATION

Button

↓

Typography Standard

---

Input

↓

Typography Standard

---

Modal

↓

Typography Standard

---

Table

↓

Typography Standard

---

Dashboard

↓

Typography Standard

---

# L. BẮT BUỘC TUÂN THỦ

Không được:

* Hardcode Font Size
* Hardcode Font Weight
* Hardcode Line Height
* Dùng nhiều Font Family

Mọi Typography phải đi theo:

MASTER_DESIGN_TOKENS_V1

↓

MASTER_TYPOGRAPHY_V1

↓

Component Standards

↓

Application

---

Typography là hệ thống phân cấp thông tin của toàn bộ POS Enterprise.

Nếu Design Tokens là DNA

thì Typography là Ngôn ngữ thị giác của hệ thống.
