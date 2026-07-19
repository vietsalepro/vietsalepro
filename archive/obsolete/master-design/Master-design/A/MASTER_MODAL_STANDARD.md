# MASTER_MODAL_STANDARD_V1

Version: 1.0

Purpose:

Tài liệu quy chuẩn kiến trúc cho toàn bộ Modal trong hệ thống POS.

Mọi modal mới được tạo trong dự án bắt buộc phải kế thừa từ MasterModal.tsx.

Không được tự ý tạo modal riêng với style khác.

---

# I. TRIẾT LÝ THIẾT KẾ MODAL

Modal là khu vực làm việc tập trung.

Người dùng phải có cảm giác:

* Dễ đọc
* Dễ thao tác
* Không bị rối
* Không bị quá nhiều màu sắc
* Nội dung là trung tâm

Modal phải tuân thủ:

* White First Design
* Soft Border Design
* Enterprise Layout
* Consistent Spacing
* Consistent Action Placement

---

# II. MODAL LAYER SYSTEM

Layer 1

Overlay

Layer 2

Modal Container

Layer 3

Modal Header

Layer 4

Modal Body

Layer 5

Modal Footer

Layer 6

Tooltip

Layer 7

Dropdown

Layer 8

Toast

---

# III. OVERLAY STANDARD

Background

rgba(15,23,42,0.45)

Backdrop Blur

8px

CSS

backdrop-filter: blur(8px);

Animation

fade-in 200ms ease

Z-Index

1000

---

# IV. MODAL SIZE STANDARD

## Small

Dùng cho:

* Confirm
* Delete
* Warning

Width

640px

Max Height

85vh

---

## Medium

Dùng cho:

* Khách hàng
* Nhà cung cấp
* Thu chi

Width

960px

Max Height

90vh

---

## Large

Dùng cho:

* Nhập hàng
* Kiểm kê
* Lịch sử đơn hàng
* Báo cáo

Width

1400px

Max Height

90vh

---

## Fullscreen

Width

95vw

Height

95vh

---

# V. MODAL CONTAINER STANDARD

Background

#FFFFFF

Border Radius

24px

Border

1px solid #F1F5F9

Shadow

0 20px 60px rgba(15,23,42,0.15)

Display

flex

Flex Direction

column

Overflow

hidden

---

# VI. MODAL HEADER STANDARD

Purpose

Hiển thị:

* Icon
* Tiêu đề
* Mô tả
* Nút đóng

Height

88px

Padding

24px 32px

Border Bottom

1px solid #F1F5F9

Background

#FFFFFF

---

Header Layout

Left Side

Icon

Title

Description

Right Side

Close Button

---

Title

Font Size

28px

Weight

700

Color

#0F172A

---

Description

Font Size

14px

Weight

400

Color

#64748B

---

Icon Box

48x48

Radius

14px

Background

#F5F3FF

---

Close Button

40x40

Radius

12px

Border

1px solid #E2E8F0

Hover

#F8FAFC

---

# VII. MODAL BODY STANDARD

Purpose

Hiển thị toàn bộ dữ liệu nghiệp vụ.

---

Padding

24px

Desktop

32px

---

Layout

display:flex

flex-direction:column

gap:24px

---

Body Background

#FFFFFF

---

Body Scroll

overflow-y:auto

overflow-x:hidden

---

Không cho phép:

Nested Scroll

---

Chỉ có duy nhất:

1 Scroll Container

là Modal Body

---

# VIII. MODAL FOOTER STANDARD

Purpose

Chứa toàn bộ Action Button.

---

Height

72px

Padding

16px 24px

Desktop

16px 32px

---

Border Top

1px solid #F1F5F9

---

Background

#FFFFFF

---

Layout

display:flex

justify-content:flex-end

gap:12px

---

Button Order

Trái → Phải

Secondary

Ghost

Primary

Danger

---

Ví dụ

[ Hủy ]

[ Lưu nháp ]

[ Lưu ]

[ Xác nhận ]

---

# IX. SCROLL BEHAVIOR

Header

Fixed

Footer

Fixed

Body

Scrollable

---

Structure

Header

always visible

Body

scroll

Footer

always visible

---

# X. LOADING STATE

Khi loading

Disable toàn bộ button

Hiển thị Skeleton

Không dùng Spinner giữa màn hình

---

Loading Area

Body Only

---

# XI. EMPTY STATE

Khi không có dữ liệu

Hiển thị:

Icon

Title

Description

Action Button

---

Ví dụ

Chưa có dữ liệu

Hãy tạo dữ liệu đầu tiên

[Tạo mới]

---

# XII. ERROR STATE

Khi API lỗi

Hiển thị:

Icon Warning

Thông báo

Nút thử lại

---

Không dùng:

alert()

---

# XIII. FORM MODAL STANDARD

Khoảng cách giữa các field

16px

---

Khoảng cách giữa section

24px

---

Khoảng cách giữa box

24px

---

Label nằm trên Input

Không đặt Label bên trái

---

# XIV. RESPONSIVE STANDARD

Desktop

> = 1280px

---

Tablet

768px - 1279px

---

Mobile

< 768px

---

Mobile Rules

Footer sticky bottom

Header compact

Padding giảm còn 16px

Width = 100vw

Height = 100vh

Radius = 0

---

# XV. MASTER MODAL STRUCTURE

<MasterModal>

```
<ModalHeader />

<ModalBody>

    Content

</ModalBody>

<ModalFooter />
```

</MasterModal>

---

# XVI. BẮT BUỘC TUÂN THỦ

Không được tự tạo modal mới.

Không được thay đổi:

* Border Radius
* Padding
* Header Height
* Footer Height
* Width Standard
* Scroll Behavior

Mọi modal trong hệ thống phải sử dụng:

MasterModal.tsx

làm component gốc duy nhất.
