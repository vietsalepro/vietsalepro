# MASTER_SECTION_BOX_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Box Container, Section Container, Surface Container và Card Container trong hệ thống POS.

Áp dụng cho:

* Filter Area
* Search Area
* Form Area
* Summary Area
* KPI Area
* Table Area
* Dashboard Widget
* Detail Information
* Statistics Area
* Report Area

Mọi vùng nội dung phải nằm bên trong Section Box.

---

# I. TRIẾT LÝ THIẾT KẾ

Section Box là đơn vị giao diện cơ bản nhất.

Không đặt dữ liệu trực tiếp lên Page.

Không đặt dữ liệu trực tiếp lên Modal.

Mọi nội dung phải nằm trong Surface Container.

---

# II. DESIGN LANGUAGE

Modern SaaS POS

*

White Surface Design

*

Soft Shadow

*

Enterprise Layout

---

# III. SECTION HIERARCHY

Page

↓

Section Box

↓

Section Header

↓

Section Content

↓

Component

---

# IV. MASTER STRUCTURE

<SectionBox>

```
<SectionHeader />

<SectionContent />
```

</SectionBox>

---

# V. SECTION BOX STANDARD

Background

#FFFFFF

---

Border

1px solid #F1F5F9

---

Radius

20px

---

Shadow

0 2px 8px rgba(15,23,42,0.03)

---

Display

flex

flex-direction:column

---

Overflow

hidden

---

Transition

150ms

---

# VI. SECTION BOX PADDING

Default

24px

---

Compact

16px

---

Large

32px

---

Không được dùng giá trị khác.

---

# VII. SECTION BOX GAP

Default

24px

---

Compact

16px

---

Large

32px

---

# VIII. SECTION HEADER STANDARD

Purpose

Hiển thị:

Title

Description

Action

---

Display

flex

justify-content:space-between

align-items:flex-start

---

Gap

16px

---

# IX. SECTION TITLE

Font

18px

---

Weight

600

---

Line Height

28px

---

Color

#0F172A

---

# X. SECTION DESCRIPTION

Font

13px

---

Weight

400

---

Line Height

20px

---

Color

#64748B

---

# XI. SECTION ACTION AREA

Position

Top Right

---

Purpose

Button

Filter

Export

Refresh

---

Maximum

3 Actions

---

# XII. SECTION CONTENT

Display

flex

flex-direction:column

---

Gap

24px

---

Width

100%

---

# XIII. FILTER BOX STANDARD

Purpose

Bộ lọc dữ liệu

---

Height

Auto

---

Padding

24px

---

Radius

20px

---

Structure

Title

↓

Filter Row

↓

Action Row

---

# XIV. FILTER GRID

Desktop

4 Columns

---

Tablet

2 Columns

---

Mobile

1 Column

---

Gap

16px

---

# XV. SUMMARY BOX STANDARD

Purpose

Hiển thị KPI nhanh

---

Background

#FFFFFF

---

Radius

20px

---

Padding

24px

---

# XVI. SUMMARY CARD

Height

96px

---

Radius

16px

---

Display

flex

align-items:center

---

Padding

16px

---

# XVII. KPI BOX STANDARD

Purpose

Dashboard Metrics

---

Layout

4 Cards

---

Gap

16px

---

# XVIII. FORM BOX STANDARD

Purpose

Nhóm thông tin nhập liệu

---

Structure

Section Header

↓

Form Grid

↓

Helper Area

---

Padding

24px

---

Radius

20px

---

# XIX. FORM GRID

Desktop

2 Columns

---

Large Form

3 Columns

---

Mobile

1 Column

---

Gap

24px

---

# XX. TABLE BOX STANDARD

Đây là Box quan trọng nhất.

---

Structure

Section Header

↓

Table Toolbar

↓

Table

↓

Pagination

---

Không được đặt Table trực tiếp lên Page.

---

# XXI. TABLE BOX PADDING

Header

24px

---

Toolbar

24px

---

Table

0

---

Pagination

24px

---

# XXII. TABLE TOOLBAR

Height

56px

---

Display

flex

justify-content:space-between

---

Gap

16px

---

# XXIII. DETAIL BOX STANDARD

Purpose

Thông tin chi tiết

---

Layout

2 Columns

---

Gap

24px

---

# XXIV. INFORMATION CARD

Background

#F8FAFC

---

Radius

16px

---

Padding

16px

---

Border

1px solid #F1F5F9

---

# XXV. STATISTICS BOX STANDARD

Giống hình Lịch sử đơn hàng.

---

Structure

Statistics Container

↓

Statistics Card

↓

Statistics Card

↓

Statistics Card

↓

Statistics Card

---

# XXVI. STATISTICS CONTAINER

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

24px

---

Display

Grid

---

Columns

4

---

Gap

24px

---

# XXVII. STATISTICS CARD

Height

96px

---

Display

flex

align-items:center

---

Gap

16px

---

Border Right

1px solid #F1F5F9

---

Card cuối cùng

Không có Border Right

---

# XXVIII. ICON BOX STANDARD

Size

56x56

---

Radius

16px

---

Background

#F8FAFC

---

Display

flex

align-items:center

justify-content:center

---

# XXIX. CONTENT BOX STANDARD

Label

↓

Value

↓

Sub Text

---

Gap

4px

---

# XXX. LABEL STANDARD

Font

13px

---

Weight

500

---

Color

#64748B

---

# XXXI. VALUE STANDARD

Font

28px

---

Weight

700

---

Color

#0F172A

---

# XXXII. SUB TEXT STANDARD

Font

12px

---

Weight

400

---

Color

#94A3B8

---

# XXXIII. HOVER RULE

Section Box

Hover nhẹ

---

Transform

translateY(-1px)

---

Shadow

0 6px 18px rgba(15,23,42,0.05)

---

Không dùng animation mạnh.

---

# XXXIV. LOADING STATE

Skeleton Header

---

Skeleton Content

---

Skeleton Table

---

Không Spinner toàn Box.

---

# XXXV. EMPTY STATE

Icon

Title

Description

Action

---

Center Alignment

---

Min Height

240px

---

# XXXVI. ERROR STATE

Error Icon

Message

Retry

---

Min Height

240px

---

# XXXVII. RESPONSIVE RULE

Desktop

24px Padding

---

Tablet

20px Padding

---

Mobile

16px Padding

---

Radius

Giữ nguyên 20px

---

# XXXVIII. DARK MODE RULE

Hiện tại:

Không hỗ trợ

---

Toàn hệ thống sử dụng:

Light Theme

---

# XXXIX. COMPONENT STANDARD

Bắt buộc sử dụng:

SectionBox.tsx

SectionHeader.tsx

SectionContent.tsx

StatisticsBox.tsx

StatisticsCard.tsx

TableSection.tsx

FormSection.tsx

DetailSection.tsx

---

# XL. FILE STRUCTURE

/components/section

SectionBox.tsx

SectionHeader.tsx

SectionContent.tsx

StatisticsBox.tsx

StatisticsCard.tsx

FormSection.tsx

TableSection.tsx

DetailSection.tsx

---

# XLI. PAGE COMPOSITION STANDARD

Page

↓

Filter Section

↓

Statistics Section

↓

Table Section

↓

Pagination Section

---

Giống màn hình:

Lịch sử đơn hàng

---

# XLII. MODAL COMPOSITION STANDARD

Modal

↓

Summary Section

↓

Form Section

↓

Table Section

↓

Detail Section

---

# XLIII. DESIGN TOKEN MAPPING

Background

#FFFFFF

---

Border

#F1F5F9

---

Text Primary

#0F172A

---

Text Secondary

#64748B

---

Primary

#5B3DF5

---

Success

#10B981

---

Warning

#F59E0B

---

Error

#EF4444

---

# XLIV. BẮT BUỘC TUÂN THỦ

Không được:

* Đặt nội dung trực tiếp lên Page
* Đặt Table trực tiếp lên Page
* Đặt Form trực tiếp lên Page
* Tạo Box khác chuẩn
* Tạo Radius khác chuẩn
* Tạo Padding khác chuẩn

Mọi vùng nội dung trong hệ thống phải kế thừa từ:

SectionBox.tsx

và tuân thủ tuyệt đối tài liệu này.

Section Box là đơn vị giao diện nền tảng của toàn bộ POS Framework.
