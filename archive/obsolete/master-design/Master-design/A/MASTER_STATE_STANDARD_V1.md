# MASTER_STATE_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ UI State Management cho POS Enterprise.

Mọi màn hình, modal, data grid, form, dashboard và báo cáo phải tuân thủ tài liệu này.

State không phải component.

State là trạng thái vận hành của giao diện.

---

# I. TRIẾT LÝ THIẾT KẾ

Mọi màn hình phải luôn ở một trong các trạng thái:

Loading

↓

Ready

↓

Empty

↓

Error

↓

Success

↓

Refreshing

---

Không được:

* Màn hình trắng
* Màn hình đứng im khi đang tải
* Không có phản hồi khi lỗi

---

# II. STATE HIERARCHY

Application State

↓

Page State

↓

Section State

↓

Component State

---

# III. STATE PRIORITY

Priority 1

System Blocking

---

Priority 2

Permission

---

Priority 3

Loading

---

Priority 4

Error

---

Priority 5

Empty

---

Priority 6

Ready

---

# IV. STATE TYPES

Loading State

---

Empty State

---

Error State

---

Success State

---

Refreshing State

---

Permission State

---

Offline State

---

Partial Data State

---

# V. PAGE STATE MACHINE

Loading

↓

Success

↓

Ready

↓

Refresh

↓

Ready

---

Loading

↓

Error

---

Loading

↓

Empty

---

# VI. LOADING STATE

Purpose

Dữ liệu chưa sẵn sàng.

---

Hiển thị:

Skeleton

---

Không dùng:

Spinner toàn màn hình

(Default)

---

# VII. LOADING RULE

Nếu thời gian tải:

<300ms

↓

Không hiển thị Loading

---

300ms - 1000ms

↓

Skeleton

---

> 1000ms

↓

Skeleton + Message

---

# VIII. PAGE LOADING

Hiển thị:

Page Skeleton

---

Không hiển thị:

Blank Screen

---

# IX. TABLE LOADING

Hiển thị:

Skeleton Rows

---

Theo:

MASTER_LOADING_SKELETON_STANDARD_V1

---

# X. FORM LOADING

Hiển thị:

Skeleton Fields

---

# XI. MODAL LOADING

Giữ nguyên Modal

↓

Skeleton Content

---

Không đóng Modal

---

# XII. DASHBOARD LOADING

KPI Skeleton

↓

Chart Skeleton

↓

Table Skeleton

---

# XIII. REFRESHING STATE

Purpose

Đang cập nhật dữ liệu.

---

Dữ liệu cũ vẫn hiển thị.

---

# XIV. REFRESH INDICATOR

Position

Top Right

---

Text

Đang cập nhật...

---

# XV. BACKGROUND REFRESH

Không khóa giao diện.

---

Không hiển thị Overlay.

---

# XVI. EMPTY STATE

Purpose

Không có dữ liệu.

---

Ví dụ

Chưa có sản phẩm

Chưa có đơn hàng

Chưa có giao dịch

---

# XVII. EMPTY STATE COMPONENT

Icon

↓

Title

↓

Description

↓

Action

---

# XVIII. EMPTY STATE ACTION

Bắt buộc có CTA.

---

Ví dụ

[Tạo sản phẩm]

[Tạo đơn hàng]

---

# XIX. EMPTY FILTER RESULT

Purpose

Có dữ liệu nhưng filter không khớp.

---

Message

Không tìm thấy dữ liệu phù hợp

---

CTA

Xóa bộ lọc

---

# XX. EMPTY SEARCH RESULT

Purpose

Không có kết quả tìm kiếm.

---

Message

Không tìm thấy kết quả

---

# XXI. ERROR STATE

Purpose

Không thể tải dữ liệu.

---

# XXII. ERROR TYPES

Network Error

---

Server Error

---

Validation Error

---

Permission Error

---

Unknown Error

---

# XXIII. ERROR PAGE

Structure

Icon

↓

Title

↓

Description

↓

Retry Button

---

# XXIV. RETRY BUTTON

Required

---

Text

Thử lại

---

# XXV. NETWORK ERROR

Message

Không thể kết nối máy chủ

---

# XXVI. SERVER ERROR

Message

Có lỗi xảy ra từ hệ thống

---

# XXVII. UNKNOWN ERROR

Message

Đã xảy ra lỗi không xác định

---

# XXVIII. FORM VALIDATION ERROR

Hiển thị:

Field Level

---

Không dùng:

Page Error

---

# XXIX. SUCCESS STATE

Purpose

Hoàn thành hành động

---

# XXX. SUCCESS DISPLAY

Preferred

Toast

---

# XXXI. SUCCESS MESSAGE

Ví dụ

Lưu thành công

Cập nhật thành công

Xóa thành công

---

# XXXII. SUCCESS PAGE

Chỉ dùng cho:

Workflow hoàn tất

---

Ví dụ

Hoàn tất nhập hàng

Hoàn tất kiểm kho

---

# XXXIII. PERMISSION DENIED STATE

Purpose

Không đủ quyền

---

# XXXIV. STRUCTURE

Lock Icon

↓

Title

↓

Description

---

# XXXV. MESSAGE

Bạn không có quyền truy cập chức năng này

---

# XXXVI. ACTIONS

Quay lại

---

Liên hệ quản trị viên

---

# XXXVII. OFFLINE STATE

Purpose

Mất kết nối

---

# XXXVIII. MESSAGE

Bạn đang ngoại tuyến

---

# XXXIX. ACTION

Thử kết nối lại

---

# XL. PARTIAL DATA STATE

Purpose

Một phần dữ liệu lỗi

---

Ví dụ

Dashboard

↓

KPI tải được

↓

Chart lỗi

---

# XLI. RULE

Không được chặn toàn bộ màn hình.

---

Chỉ hiển thị lỗi tại section lỗi.

---

# XLII. DATA GRID STATE

Priority

Loading

↓

Error

↓

Empty

↓

Ready

---

# XLIII. FORM STATE

Idle

↓

Editing

↓

Validating

↓

Saving

↓

Success

---

# XLIV. SAVE STATE

Button

↓

Loading

↓

Disabled

---

Không cho submit nhiều lần.

---

# XLV. DELETE STATE

Delete Confirm

↓

Deleting

↓

Success

---

# XLVI. BULK ACTION STATE

Select Items

↓

Processing

↓

Completed

---

# XLVII. MODAL STATE

Loading

↓

Ready

↓

Saving

↓

Success

↓

Close

---

# XLVIII. DASHBOARD STATE

Loading KPI

↓

Loading Charts

↓

Loading Tables

↓

Ready

---

Cho phép tải độc lập.

---

# XLIX. REPORT STATE

Generating

↓

Ready

↓

Export

---

# L. STATE TRANSITIONS

Theo:

MASTER_MOTION_ANIMATION_STANDARD_V1

---

# LI. ACCESSIBILITY

Loading phải có:

aria-busy

---

Error phải có:

role="alert"

---

# LII. FILE STRUCTURE

/state

LoadingState.tsx

EmptyState.tsx

ErrorState.tsx

PermissionState.tsx

OfflineState.tsx

SuccessState.tsx

---

# LIII. REACT PATTERN

if (loading)

↓

LoadingState

---

if (error)

↓

ErrorState

---

if (empty)

↓

EmptyState

---

else

↓

Content

---

# LIV. STATE DECISION MATRIX

API Loading

↓

Loading State

---

API Error

↓

Error State

---

No Data

↓

Empty State

---

No Permission

↓

Permission State

---

Offline

↓

Offline State

---

Data Ready

↓

Ready State

---

# LV. FORBIDDEN

Không được:

* Blank Screen
* Infinite Spinner
* Không có Retry
* Error không có mô tả
* Empty State không có CTA
* Chặn toàn bộ page khi chỉ lỗi một section

---

# LVI. DESIGN DEPENDENCIES

MASTER_NOTIFICATION_STANDARD_V1

↓

MASTER_LOADING_SKELETON_STANDARD_V1

↓

MASTER_EMPTY_STATE_STANDARD_V1

↓

MASTER_ALERT_STANDARD_V1

↓

MASTER_STATE_STANDARD_V1

---

# LVII. BẮT BUỘC TUÂN THỦ

Mọi Page, Modal, Table, Form, Dashboard phải triển khai:

Loading

↓

Error

↓

Empty

↓

Ready

State không phải lựa chọn.

State là yêu cầu bắt buộc của mọi giao diện nghiệp vụ.
