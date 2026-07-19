# MASTER_MODAL_BLUEPRINT_V1

Version: 1.0

Purpose:

Định nghĩa kiến trúc chuẩn cho toàn bộ Modal trong hệ thống POS.

Áp dụng cho:

* Đơn hàng
* Nhập hàng
* Xuất hủy
* Kiểm kê
* Khách hàng
* Nhà cung cấp
* Công nợ
* Thu chi
* Báo cáo

Mọi modal phải kế thừa từ MasterModal Framework.

---

# I. TRIẾT LÝ THIẾT KẾ

Modal không phải Popup.

Modal là một Workspace thu nhỏ.

Người dùng phải:

* Đọc dễ
* Nhập liệu dễ
* Không bị rối
* Không phải scroll toàn màn hình

---

# II. MODAL ARCHITECTURE

MasterModal

↓

ModalContainer

↓

ModalHeader

↓

ModalBody

↓

ModalFooter

---

Mọi Modal phải sử dụng kiến trúc này.

---

# III. COMPONENT TREE

<MasterModal>

```
<ModalContainer>

    <ModalHeader />

    <ModalBody>

        Sections...

    </ModalBody>

    <ModalFooter />

</ModalContainer>
```

</MasterModal>

---

# IV. OVERLAY STANDARD

Position

fixed

---

Inset

0

---

Background

rgba(15,23,42,0.45)

---

Backdrop Blur

4px

---

Z-index

9999

---

Display

flex

align-items:center

justify-content:center

---

# V. MODAL CONTAINER

Background

#FFFFFF

---

Radius

24px

---

Border

1px solid #F1F5F9

---

Shadow

0 24px 48px rgba(15,23,42,0.12)

---

Display

flex

flex-direction:column

---

Overflow

hidden

---

# VI. MODAL SIZE MATRIX

SMALL

640px

---

MEDIUM

960px

---

LARGE

1200px

---

WORKSPACE

1400px

---

FULLSCREEN

100vw

100vh

Radius = 0

---

# VII. MODAL HEIGHT RULE

Không set fixed height.

---

Sử dụng

max-height: 90vh

---

Body tự scroll.

---

Header luôn cố định.

---

Footer luôn cố định.

---

# VIII. MASTER MODAL LAYOUT

┌───────────────────────────────┐

HEADER

├───────────────────────────────┤

BODY

├───────────────────────────────┤

FOOTER

└───────────────────────────────┘

---

# IX. HEADER STANDARD

Height

88px

---

Padding

24px 32px

---

Border Bottom

1px solid #F1F5F9

---

Background

#FFFFFF

---

Display

flex

justify-content:space-between

align-items:center

---

# X. HEADER STRUCTURE

┌───────────────────────────────┐

[ICON]

Title

Description

[X]

└───────────────────────────────┘

---

# XI. HEADER ICON

48x48

---

Radius

14px

---

Background

#F5F3FF

---

Icon Size

24px

---

Primary Color

#5B3DF5

---

# XII. HEADER TITLE

Font

24px

---

Weight

700

---

Color

#0F172A

---

Line Height

32px

---

# XIII. HEADER DESCRIPTION

Font

14px

---

Weight

400

---

Color

#64748B

---

# XIV. CLOSE BUTTON

40x40

---

Radius

12px

---

Background

transparent

---

Hover

#F8FAFC

---

Icon

20px

---

# XV. BODY STANDARD

Display

flex

flex-direction:column

---

Gap

24px

---

Padding

24px

---

Overflow-y:auto

---

Background

#F8FAFC

---

# XVI. SECTION SYSTEM

Body không chứa Input trực tiếp.

---

Body phải chứa Section.

---

Structure

Body

↓

Section

↓

Content

---

# XVII. SECTION BOX STANDARD

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

Shadow

0 2px 8px rgba(15,23,42,0.03)

---

Display

flex

flex-direction:column

---

Gap

24px

---

# XVIII. SECTION HEADER

Title

Description

Action

---

Height

auto

---

Gap

8px

---

# XIX. SECTION TITLE

Font

18px

---

Weight

600

---

Color

#0F172A

---

# XX. SECTION DESCRIPTION

Font

13px

---

Weight

400

---

Color

#64748B

---

# XXI. SECTION CONTENT

Chứa:

Form

Table

Summary

Card

Statistics

Grid

---

# XXII. FORM SECTION LAYOUT

Desktop

2 Columns

---

Gap

24px

---

Responsive

1 Column

---

Structure

┌────────────┬────────────┐

Field

Field

└────────────┴────────────┘

---

# XXIII. SUMMARY SECTION

Purpose

Hiển thị KPI nhanh.

---

Layout

4 Cards

---

Height

100px

---

Card Radius

18px

---

# XXIV. DETAIL SECTION

Purpose

Thông tin chi tiết nghiệp vụ.

---

Layout

Grid

---

Columns

2 hoặc 3

---

# XXV. TABLE SECTION

Purpose

Danh sách sản phẩm.

---

Không đặt table trực tiếp lên Body.

---

Bắt buộc nằm trong Section.

---

Structure

Section

↓

Table Toolbar

↓

Table

↓

Pagination

---

# XXVI. TABLE TOOLBAR

Search

Filter

Action

---

Height

56px

---

# XXVII. FOOTER STANDARD

Height

72px

---

Padding

16px 32px

---

Border Top

1px solid #F1F5F9

---

Background

#FFFFFF

---

Display

flex

justify-content:flex-end

align-items:center

---

Gap

12px

---

# XXVIII. FOOTER ACTION RULE

Thứ tự:

Secondary

↓

Neutral

↓

Primary

---

Ví dụ

[Hủy]

[Lưu nháp]

[Lưu]

---

Không đặt quá:

4 nút

---

# XXIX. FOOTER BUTTON SIZE

Height

44px

---

Min Width

120px

---

Radius

12px

---

# XXX. SCROLL RULE

Header

Fixed

---

Footer

Fixed

---

Body

Scrollable

---

Không cho phép:

Toàn bộ modal scroll.

---

# XXXI. WORKSPACE MODAL

Áp dụng:

Lịch sử đơn hàng

Nhập hàng

Kiểm kê

Xuất hủy

---

Width

1400px

---

Body

Nhiều Section

---

Có Table

---

Có Summary

---

Có Filter

---

# XXXII. WORKSPACE MODAL STRUCTURE

┌───────────────────────────────┐

Header

├───────────────────────────────┤

Filter Section

├───────────────────────────────┤

Summary Section

├───────────────────────────────┤

Table Section

├───────────────────────────────┤

Detail Section

├───────────────────────────────┤

Footer

└───────────────────────────────┘

---

# XXXIII. FORM MODAL STRUCTURE

┌───────────────────────────────┐

Header

├───────────────────────────────┤

General Information

├───────────────────────────────┤

Additional Information

├───────────────────────────────┤

Footer

└───────────────────────────────┘

---

# XXXIV. CONFIRM MODAL STRUCTURE

┌───────────────────────────────┐

Header

├───────────────────────────────┤

Message

├───────────────────────────────┤

Footer

└───────────────────────────────┘

---

# XXXV. RESPONSIVE RULE

Desktop

Theo Size Matrix

---

Tablet

95vw

---

Mobile

100vw

100vh

Radius = 0

---

# XXXVI. LOADING STATE

Skeleton Section

---

Skeleton Form

---

Skeleton Table

---

Không dùng:

Spinner toàn màn hình

---

# XXXVII. EMPTY STATE

Icon

Title

Description

Action

---

Center Alignment

---

# XXXVIII. ERROR STATE

Error Illustration

Message

Retry Button

---

# XXXIX. ACCESSIBILITY

ESC

Đóng Modal

---

TAB

Di chuyển Field

---

Focus Trap

Bắt buộc

---

ARIA

Bắt buộc

---

# XL. MASTER COMPONENT STANDARD

Bắt buộc sử dụng:

MasterModal.tsx

ModalHeader.tsx

ModalBody.tsx

ModalFooter.tsx

SectionBox.tsx

SectionHeader.tsx

SectionContent.tsx

---

# XLI. FILE STRUCTURE

/components/modal

MasterModal.tsx

ModalHeader.tsx

ModalBody.tsx

ModalFooter.tsx

SectionBox.tsx

SectionHeader.tsx

SectionContent.tsx

---

# XLII. DESIGN LANGUAGE

Modern SaaS POS

*

Soft UI

*

White Surface Design

*

Enterprise Workflow

---

# XLIII. BẮT BUỘC TUÂN THỦ

Không được:

* Đặt Input trực tiếp lên Modal Body
* Đặt Table trực tiếp lên Modal Body
* Tự tạo Modal Layout khác
* Tự tạo Footer khác
* Tự tạo Header khác

Mọi Modal phải kế thừa từ:

MasterModal.tsx

và tuân thủ tuyệt đối Blueprint này.
