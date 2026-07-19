# MASTER_FORM_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Form nhập liệu trong hệ thống POS.

Mọi Form mới bắt buộc tuân thủ tài liệu này.

Không được tự ý thay đổi layout, khoảng cách hoặc kiểu hiển thị field.

---

# I. TRIẾT LÝ THIẾT KẾ FORM

Form phải:

* Dễ đọc
* Dễ nhập liệu
* Dễ kiểm tra lỗi
* Dễ mở rộng

Người dùng POS thao tác hàng trăm lần mỗi ngày.

Mỗi thao tác dư thừa đều làm giảm hiệu suất vận hành.

---

# II. FORM HIERARCHY

Level 1

Modal

↓

Level 2

Section

↓

Level 3

Form Group

↓

Level 4

Field

↓

Level 5

Control

---

# III. FORM LAYOUT SYSTEM

Không cho phép:

Random Layout

---

Chỉ được dùng:

1 Column

2 Column

3 Column

---

# IV. 1 COLUMN LAYOUT

Dùng cho:

* Ghi chú
* Mô tả dài
* Chính sách
* Nội dung văn bản

Width

100%

Gap

16px

---

# V. 2 COLUMN LAYOUT

Layout mặc định toàn hệ thống

Grid

2 cột

Desktop

1fr 1fr

Gap

24px

---

Dùng cho:

* Khách hàng
* Nhà cung cấp
* Thu chi
* Công nợ

---

# VI. 3 COLUMN LAYOUT

Dùng cho:

* Sản phẩm
* Nhập hàng
* Kiểm kê
* Xuất hủy

Grid

1fr 1fr 1fr

Gap

24px

---

# VII. SECTION STANDARD

Một Form có thể gồm nhiều Section.

Ví dụ:

Thông tin chung

Thông tin thanh toán

Thông tin giao hàng

Ghi chú

---

Section Container

Background

#FFFFFF

Border

1px solid #F1F5F9

Radius

20px

Padding

24px

---

Khoảng cách giữa các Section

24px

---

# VIII. SECTION TITLE

Font Size

18px

Weight

600

Color

#0F172A

Margin Bottom

20px

---

# IX. FIELD STRUCTURE

Mỗi Field phải có cấu trúc:

Label

↓

Control

↓

Helper Text

↓

Error Message

---

Không được đảo vị trí.

---

# X. LABEL STANDARD

Font Size

13px

Weight

500

Color

#334155

Margin Bottom

8px

---

Required Field

Hiển thị

*

Màu

#EF4444

Ví dụ

Tên khách hàng *

Số điện thoại *

---

# XI. INPUT STANDARD

Height

44px

---

Border

1px solid #E2E8F0

---

Radius

12px

---

Padding

0 14px

---

Font

14px

---

Placeholder

#94A3B8

---

Focus

Border

#5B3DF5

Shadow

0 0 0 3px rgba(91,61,245,0.15)

---

Disabled

Background

#F8FAFC

Cursor

not-allowed

---

# XII. TEXTAREA STANDARD

Min Height

120px

---

Radius

12px

---

Padding

12px 14px

---

Resize

vertical

---

# XIII. SELECT STANDARD

Height

44px

---

Radius

12px

---

Border

1px solid #E2E8F0

---

Dropdown Max Height

320px

---

Searchable

Mặc định bật

---

# XIV. DATEPICKER STANDARD

Height

44px

---

Format

dd/MM/yyyy

---

Icon Calendar

Bên phải

---

# XV. NUMBER INPUT STANDARD

Dùng cho:

Giá bán

Giá nhập

Công nợ

Chi phí

---

Canh phải

text-align:right

---

Tự format

1.000.000

---

# XVI. MONEY INPUT STANDARD

Hiển thị

đ

ở cuối field

---

Ví dụ

150.000 đ

---

Không lưu ký tự đ xuống database

---

# XVII. PHONE INPUT STANDARD

Format

0901 234 567

---

Chỉ nhận số

---

# XVIII. EMAIL INPUT STANDARD

Validate realtime

---

Ví dụ

[abc@gmail.com](mailto:abc@gmail.com)

---

# XIX. SEARCH FIELD STANDARD

Chiều cao

44px

---

Icon Search

Bên trái

---

Debounce

300ms

---

# XX. RADIO STANDARD

Size

18px

---

Gap

8px

---

# XXI. CHECKBOX STANDARD

Size

18px

---

Gap

8px

---

# XXII. HELPER TEXT

Ví dụ

Nhập số điện thoại khách hàng

---

Font

12px

---

Color

#64748B

---

Margin Top

4px

---

# XXIII. ERROR MESSAGE

Font

12px

---

Color

#EF4444

---

Margin Top

4px

---

Ví dụ

Số điện thoại không hợp lệ

---

# XXIV. VALIDATION STANDARD

Validate ngay khi:

Blur

Submit

---

Không validate khi user vừa gõ ký tự đầu tiên

---

# XXV. BUTTON POSITION

Form nhỏ

Footer

---

Form lớn

Footer

---

Không đặt nút Save giữa Form

---

# XXVI. FORM ACTION STANDARD

Thứ tự

Hủy

↓

Lưu nháp

↓

Lưu

↓

Xác nhận

---

Nút Primary luôn nằm ngoài cùng bên phải

---

# XXVII. FORM LOADING STATE

Disable toàn bộ field

---

Disable toàn bộ button

---

Hiển thị Skeleton

---

Không dùng alert()

---

# XXVIII. FORM READONLY MODE

Background

#F8FAFC

---

Không cho nhập

---

Vẫn cho copy dữ liệu

---

# XXIX. RESPONSIVE STANDARD

Desktop

> =1280px

3 cột

---

Tablet

768-1279px

2 cột

---

Mobile

<768px

1 cột

---

# XXX. MASTER FORM STRUCTURE

<FormSection>

```
<SectionTitle />

<FormGrid>

    <FormField>

        <Label />

        <Input />

        <HelperText />

        <ErrorMessage />

    </FormField>

</FormGrid>
```

</FormSection>

---

# XXXI. BẮT BUỘC TUÂN THỦ

Không được:

* Label bên trái
* Input cao thấp khác nhau
* Random spacing
* Random màu sắc
* Random border radius

Toàn bộ hệ thống phải sử dụng:

BaseForm.tsx

BaseField.tsx

BaseInput.tsx

BaseSelect.tsx

BaseTextarea.tsx

làm component chuẩn duy nhất.
