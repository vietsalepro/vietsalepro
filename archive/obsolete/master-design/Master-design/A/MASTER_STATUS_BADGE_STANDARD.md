# MASTER_STATUS_BADGE_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Status Badge trong hệ thống POS.

Áp dụng cho:

* Đơn hàng
* Thanh toán
* Giao hàng
* Nhập hàng
* Xuất hủy
* Kiểm kê
* Công nợ
* Thu chi
* Người dùng
* Phê duyệt

Mọi trạng thái phải sử dụng chung một hệ thống màu sắc.

Không được tự tạo màu trạng thái mới.

---

# I. TRIẾT LÝ THIẾT KẾ

Status Badge phải giúp người dùng:

* Nhìn là hiểu
* Không cần đọc kỹ
* Phân biệt trạng thái trong 1 giây

Nguyên tắc:

Một ý nghĩa

↓

Một màu

↓

Toàn hệ thống

---

# II. STATUS SYSTEM ARCHITECTURE

Status Type

↓

Color Token

↓

Badge Component

↓

Business Status

---

Ví dụ

SUCCESS

↓

Green

↓

StatusBadge

↓

Đã thanh toán

---

# III. BADGE SIZE STANDARD

Default Height

28px

---

Compact

24px

---

Large

32px

---

Radius

999px

---

Padding

0 12px

---

Display

inline-flex

align-items:center

justify-content:center

---

Gap

6px

---

# IV. TYPOGRAPHY STANDARD

Font Size

12px

---

Weight

600

---

Line Height

1

---

White Space

nowrap

---

# V. ICON STANDARD

Optional

---

Size

14px

---

Position

Left

---

Gap

6px

---

# VI. SUCCESS STATUS

Ý nghĩa

Hoàn thành

Thành công

Đã xử lý

Đã thanh toán

---

Background

#ECFDF5

---

Text

#059669

---

Border

#A7F3D0

---

Business Mapping

Đã thanh toán

Hoàn thành

Đã duyệt

Đã nhận hàng

Đã đối soát

Đã đóng

---

# VII. WARNING STATUS

Ý nghĩa

Đang xử lý

Đang chờ

Cần chú ý

---

Background

#FFF7ED

---

Text

#EA580C

---

Border

#FED7AA

---

Business Mapping

Chờ thanh toán

Chờ duyệt

Chờ xác nhận

Chờ nhập kho

Chờ xử lý

---

# VIII. ERROR STATUS

Ý nghĩa

Lỗi

Hủy

Từ chối

Thất bại

---

Background

#FEF2F2

---

Text

#DC2626

---

Border

#FECACA

---

Business Mapping

Đã hủy

Từ chối

Thanh toán lỗi

Giao hàng thất bại

Ngừng hoạt động

---

# IX. INFO STATUS

Ý nghĩa

Thông tin

Mới tạo

Đang mở

---

Background

#EFF6FF

---

Text

#2563EB

---

Border

#BFDBFE

---

Business Mapping

Mới tạo

Mới phát sinh

Đang mở

Đang hoạt động

---

# X. NEUTRAL STATUS

Ý nghĩa

Trung tính

Không hoạt động

Tạm thời

---

Background

#F8FAFC

---

Text

#64748B

---

Border

#CBD5E1

---

Business Mapping

Bản nháp

Tạm khóa

Không xác định

Chưa cập nhật

---

# XI. PURPLE STATUS

Ý nghĩa

Đang thực hiện

Đang tiến hành

Đang xử lý nâng cao

---

Background

#F5F3FF

---

Text

#6D4AFF

---

Border

#DDD6FE

---

Business Mapping

Đang kiểm kê

Đang đồng bộ

Đang tính toán

Đang tổng hợp

---

# XII. BADGE APPEARANCE RULE

Không dùng:

Gradient

---

Không dùng:

Shadow

---

Không dùng:

Animation

---

Không dùng:

Viền dày

---

Chỉ dùng:

Flat Badge

---

# XIII. ORDER STATUS MAPPING

Mới tạo

INFO

---

Xác nhận

PURPLE

---

Đang xử lý

WARNING

---

Hoàn thành

SUCCESS

---

Hủy

ERROR

---

# XIV. PAYMENT STATUS MAPPING

Chưa thanh toán

WARNING

---

Thanh toán một phần

INFO

---

Đã thanh toán

SUCCESS

---

Thanh toán thất bại

ERROR

---

Hoàn tiền

PURPLE

---

# XV. DELIVERY STATUS MAPPING

Chờ giao

WARNING

---

Đang giao

PURPLE

---

Giao thành công

SUCCESS

---

Giao thất bại

ERROR

---

# XVI. INVENTORY STATUS MAPPING

Còn hàng

SUCCESS

---

Sắp hết hàng

WARNING

---

Hết hàng

ERROR

---

Đang kiểm kê

PURPLE

---

# XVII. USER STATUS MAPPING

Hoạt động

SUCCESS

---

Tạm khóa

WARNING

---

Bị khóa

ERROR

---

Mới tạo

INFO

---

# XVIII. DEBT STATUS MAPPING

Đã thanh toán

SUCCESS

---

Còn nợ

WARNING

---

Quá hạn

ERROR

---

Đang đối soát

PURPLE

---

# XIX. BADGE POSITION RULE

Table Cell

Center

---

Detail Page

Left

---

Card

Right

---

Không đặt badge lẫn với button action.

---

# XX. TABLE RULE

Một dòng dữ liệu

Tối đa:

3 badge

---

Nếu nhiều hơn

Hiển thị:

+N

---

# XXI. FILTER RULE

Filter Status

Phải dùng:

Color tương ứng Badge

---

Giúp nhận diện nhanh.

---

# XXII. SEARCH RULE

Search Status

Hỗ trợ:

Tên trạng thái

Mã trạng thái

---

# XXIII. ACCESSIBILITY

Contrast Ratio

> = 4.5

---

Badge phải đọc được ở chế độ sáng.

---

# XXIV. COMPONENT STANDARD

Toàn bộ hệ thống phải sử dụng:

StatusBadge.tsx

---

Không được tạo:

OrderBadge.tsx

PaymentBadge.tsx

InventoryBadge.tsx

riêng biệt.

---

Tất cả kế thừa:

Base StatusBadge

---

# XXV. TYPESCRIPT ENUM STANDARD

enum StatusType {

SUCCESS,

WARNING,

ERROR,

INFO,

NEUTRAL,

PURPLE

}

---

# XXVI. MASTER STRUCTURE

<StatusBadge

```
type="SUCCESS"

label="Đã thanh toán"
```

/>

---

<StatusBadge

```
type="WARNING"

label="Chờ xử lý"
```

/>

---

# XXVII. BẮT BUỘC TUÂN THỦ

Không được:

* Random màu trạng thái
* Random border
* Random icon
* Random kích thước

Một trạng thái

=

Một màu

=

Toàn hệ thống.

Mọi Badge phải kế thừa từ:

StatusBadge.tsx

và tuân thủ tuyệt đối tiêu chuẩn này.
