# MASTER_ACTION_BUTTON_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Button, Action Button và Workflow Action trong hệ thống POS.

Áp dụng cho:

* Page
* Modal
* Form
* Table
* Dashboard
* Toolbar
* Dropdown Action
* Context Menu

Mọi nút bấm trong hệ thống phải tuân thủ tài liệu này.

---

# I. TRIẾT LÝ THIẾT KẾ

Button là điểm bắt đầu của hành động.

Người dùng phải nhận biết được:

* Đây là hành động chính
* Đây là hành động phụ
* Đây là hành động nguy hiểm

trong vòng:

1 giây

---

# II. BUTTON HIERARCHY

Primary

↓

Secondary

↓

Ghost

↓

Danger

↓

Icon

---

Không được tạo loại Button khác.

---

# III. MASTER BUTTON SIZE

SM

36px

---

MD

44px

(Default)

---

LG

52px

---

# IV. BORDER RADIUS

SM

10px

---

MD

12px

---

LG

14px

---

Không dùng Radius khác.

---

# V. TYPOGRAPHY

Font Family

Inter

---

Font Size

14px

---

Weight

600

---

Line Height

20px

---

# VI. PRIMARY BUTTON

Purpose

Hành động chính.

---

Ví dụ

Lưu

Tạo mới

Xác nhận

Thanh toán

Hoàn tất

---

Background

#5B3DF5

---

Text

#FFFFFF

---

Border

none

---

Hover

#4C32D9

---

Disabled

#C4B5FD

---

# VII. SECONDARY BUTTON

Purpose

Hành động phụ.

---

Ví dụ

Lưu nháp

Xem chi tiết

In tạm

---

Background

#F5F3FF

---

Text

#5B3DF5

---

Border

1px solid #DDD6FE

---

Hover

#EDE9FE

---

# VIII. GHOST BUTTON

Purpose

Hành động trung tính.

---

Ví dụ

Hủy

Đóng

Quay lại

Bỏ chọn

---

Background

Transparent

---

Border

1px solid #E2E8F0

---

Text

#475569

---

Hover

#F8FAFC

---

# IX. DANGER BUTTON

Purpose

Hành động nguy hiểm.

---

Ví dụ

Xóa

Hủy phiếu

Khôi phục dữ liệu

Reset

---

Background

#EF4444

---

Text

#FFFFFF

---

Hover

#DC2626

---

Disabled

#FCA5A5

---

# X. SUCCESS BUTTON

Purpose

Hoàn thành nghiệp vụ.

---

Ví dụ

Duyệt

Hoàn tất

Đối soát

---

Background

#10B981

---

Text

#FFFFFF

---

Hover

#059669

---

# XI. ICON BUTTON

Size

40x40

---

Radius

12px

---

Background

#FFFFFF

---

Border

1px solid #E2E8F0

---

Hover

#F8FAFC

---

# XII. BUTTON WIDTH RULE

Không dùng:

width:100%

---

Ngoại trừ:

Mobile

---

Desktop

min-width:120px

---

# XIII. BUTTON ICON RULE

Position

Left

---

Size

16px

---

Gap

8px

---

# XIV. LOADING STATE

Button Disabled

---

Spinner Left

---

Giữ nguyên Width

---

Không thay đổi kích thước Button.

---

# XV. DISABLED STATE

Cursor

not-allowed

---

Opacity

0.6

---

Không dùng opacity thấp hơn.

---

# XVI. FORM FOOTER RULE

Thứ tự chuẩn:

Ghost

↓

Secondary

↓

Primary

---

Ví dụ

[Hủy]

[Lưu nháp]

[Lưu]

---

# XVII. CONFIRM MODAL RULE

Chỉ tối đa:

2 nút

---

Ví dụ

[Hủy]

[Xác nhận]

---

# XVIII. DELETE MODAL RULE

Chỉ dùng:

Ghost

*

Danger

---

Ví dụ

[Hủy]

[Xóa]

---

# XIX. TABLE ACTION BUTTON

Không dùng Text.

---

Chỉ dùng Icon.

---

Ví dụ

👁

✏

🖨

🗑

---

# XX. TABLE ACTION SIZE

40x40

---

Radius

12px

---

Gap

8px

---

# XXI. TABLE ACTION ORDER

View

↓

Edit

↓

Print

↓

Delete

---

Không thay đổi thứ tự.

---

# XXII. PAGE ACTION BAR

Position

Top Right

---

Maximum

5 Buttons

---

Ví dụ

[Tạo mới]

[Nhập Excel]

[Xuất Excel]

---

# XXIII. DASHBOARD QUICK ACTION

Size

52px

---

Icon + Label

---

Maximum

6 Actions

---

# XXIV. DROPDOWN ACTION RULE

Khi vượt quá:

4 Actions

---

Chuyển sang:

Dropdown Menu

---

# XXV. BUTTON COLOR SEMANTIC

Primary

#5B3DF5

---

Success

#10B981

---

Warning

#F59E0B

---

Danger

#EF4444

---

Neutral

#64748B

---

# XXVI. BUSINESS ACTION MAPPING

Tạo mới

Primary

---

Lưu

Primary

---

Cập nhật

Primary

---

Duyệt

Success

---

Thanh toán

Success

---

In

Secondary

---

Xuất Excel

Secondary

---

Quay lại

Ghost

---

Đóng

Ghost

---

Xóa

Danger

---

Hủy phiếu

Danger

---

# XXVII. ACTION NAMING STANDARD

Luôn dùng:

Lưu

Không dùng:

Xác nhận lưu

---

Luôn dùng:

Cập nhật

Không dùng:

Sửa

---

Luôn dùng:

Tạo mới

Không dùng:

Thêm

---

Luôn dùng:

Xóa

Không dùng:

Xóa dữ liệu

---

# XXVIII. PERMISSION INTEGRATION

Button phải hỗ trợ:

Permission Guard

---

Ví dụ

product.create

↓

Hiển thị nút Tạo mới

---

Không có quyền

↓

Ẩn Button

---

# XXIX. RESPONSIVE RULE

Desktop

Min Width 120px

---

Tablet

Auto Width

---

Mobile

Width 100%

---

Stack Vertical

---

# XXX. ACCESSIBILITY

Focus Ring

Bắt buộc

---

Keyboard Navigation

Bắt buộc

---

ARIA Label

Bắt buộc với Icon Button

---

# XXXI. COMPONENT STANDARD

Bắt buộc sử dụng:

Button.tsx

PrimaryButton.tsx

SecondaryButton.tsx

GhostButton.tsx

DangerButton.tsx

IconButton.tsx

---

# XXXII. FILE STRUCTURE

/components/button

Button.tsx

PrimaryButton.tsx

SecondaryButton.tsx

GhostButton.tsx

DangerButton.tsx

IconButton.tsx

---

# XXXIII. MASTER BUTTON MATRIX

PRIMARY

Lưu

Tạo mới

Cập nhật

Thanh toán

---

SECONDARY

In

Xuất Excel

Lưu nháp

---

GHOST

Hủy

Đóng

Quay lại

---

SUCCESS

Duyệt

Hoàn tất

Đối soát

---

DANGER

Xóa

Hủy phiếu

Reset

---

ICON

Xem

Sửa

In

Xóa

---

# XXXIV. BẮT BUỘC TUÂN THỦ

Không được:

* Random màu nút
* Random chiều cao
* Random radius
* Random icon size
* Random tên hành động

Mọi Button phải kế thừa từ:

Button Framework Standard

và tuân thủ tuyệt đối tài liệu này.

Button là điểm khởi đầu của mọi nghiệp vụ trong hệ thống POS.
