MASTER_NOTIFICATION_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Notification System, Toast System, Alert System và User Feedback System trong POS.

Áp dụng cho:

Page
Modal
Form
Table
Dashboard
API Response
Validation
Workflow
I. TRIẾT LÝ THIẾT KẾ

Notification có nhiệm vụ:

Thông báo
Cảnh báo
Xác nhận
Hướng dẫn

Không được làm gián đoạn luồng làm việc nếu không cần thiết.

II. FEEDBACK HIERARCHY
Toast
↓
Inline Message
↓
Banner
↓
Dialog
↓
Blocking Dialog

Chỉ dùng cấp cao hơn khi thật sự cần.

III. NOTIFICATION TYPES

Hệ thống chỉ sử dụng:

Success
Info
Warning
Error
Loading

Không tạo thêm loại khác.

IV. SUCCESS STANDARD

Purpose:

Thông báo thao tác thành công.

Ví dụ:

Lưu thành công
Tạo mới thành công
Cập nhật thành công
Thanh toán thành công

Color:

Background: #ECFDF5
Border: #A7F3D0
Text: #065F46
Icon: #10B981

Icon:

CheckCircle2
V. INFO STANDARD

Purpose:

Thông tin hệ thống.

Ví dụ:

Đang đồng bộ dữ liệu
Có phiên bản mới

Color:

Background: #EFF6FF
Border: #BFDBFE
Text: #1E40AF
Icon: #3B82F6

Icon:

Info
VI. WARNING STANDARD

Purpose:

Thông báo cần chú ý.

Ví dụ:

Sản phẩm sắp hết hàng
Công nợ sắp đến hạn

Color:

Background: #FFFBEB
Border: #FDE68A
Text: #92400E
Icon: #F59E0B

Icon:

AlertTriangle
VII. ERROR STANDARD

Purpose:

Thông báo lỗi.

Ví dụ:

Không thể lưu dữ liệu
Kết nối thất bại
Không đủ quyền truy cập

Color:

Background: #FEF2F2
Border: #FECACA
Text: #991B1B
Icon: #EF4444

Icon:

CircleAlert
VIII. TOAST STANDARD

Toast là loại mặc định.

Position:

Top Right

Width:

380px

Min Height:

56px

Radius:

14px

Padding:

16px

Shadow:

0 8px 24px rgba(15,23,42,0.08)
IX. TOAST STRUCTURE
┌───────────────────────────┐

[Icon]

Title

Description

[X]

└───────────────────────────┘
X. TOAST TITLE

Font:

14px
600

Color:

#0F172A
XI. TOAST DESCRIPTION

Font:

13px
400

Color:

#64748B
XII. TOAST AUTO CLOSE

Success:

3 giây

Info:

4 giây

Warning:

5 giây

Error:

Không tự đóng
XIII. TOAST STACK RULE

Maximum:

5 Toast

Toast mới xuất hiện trên cùng.

XIV. INLINE VALIDATION MESSAGE

Purpose:

Hiển thị lỗi ngay dưới field.

Structure:

Input

Lỗi hiển thị bên dưới

Font:

12px
500

Color:

#EF4444

Icon:

CircleAlert
XV. FORM VALIDATION STANDARD

Không dùng Toast cho lỗi nhập liệu.

Sai:

Email không hợp lệ
→ Toast

Đúng:

Email không hợp lệ
→ Error dưới field
XVI. BANNER NOTIFICATION

Purpose:

Thông báo quan trọng.

Ví dụ:

Hệ thống bảo trì
Đồng bộ dữ liệu thất bại

Position:

Top Page

Height:

Auto

Radius:

16px

Padding:

16px

XVII. WARNING BANNER

Color:

Background: #FFFBEB
Border: #FDE68A
XVIII. ERROR BANNER

Color:

Background: #FEF2F2
Border: #FECACA
XIX. CONFIRM DIALOG

Purpose:

Xác nhận hành động.

Ví dụ:

Xóa sản phẩm

Hủy phiếu

Duyệt nhập hàng

Structure:

Icon

Title

Description

Action Buttons
XX. CONFIRM BUTTON RULE
[Hủy]

[Xác nhận]

Chỉ tối đa:

2 Buttons
XXI. DELETE DIALOG

Icon:

Trash2

Color:

Danger

Buttons:

[Hủy]

[Xóa]
XXII. SUCCESS DIALOG

Purpose:

Hoàn tất workflow lớn.

Ví dụ:

Thanh toán hoàn tất

Icon:

CheckCircle2

Color:

Success

XXIII. LOADING OVERLAY

Purpose:

Chặn thao tác khi xử lý.

Background:

rgba(255,255,255,0.8)

Blur:

2px
XXIV. LOADING CONTENT
Spinner

Đang xử lý...
XXV. API ERROR MAPPING

400

Dữ liệu không hợp lệ

401

Phiên đăng nhập đã hết hạn

403

Bạn không có quyền thực hiện thao tác này

404

Không tìm thấy dữ liệu

500

Lỗi hệ thống, vui lòng thử lại
XXVI. NETWORK ERROR

Message:

Không thể kết nối máy chủ
Vui lòng kiểm tra Internet
XXVII. EMPTY STATE MESSAGE

Không phải Notification.

Structure:

Icon

Title

Description

Action
XXVIII. AUDIT MESSAGE STANDARD

Create:

Tạo mới thành công

Update:

Cập nhật thành công

Delete:

Xóa thành công

Restore:

Khôi phục thành công

Approve:

Duyệt thành công
XXIX. MESSAGE NAMING RULE

Luôn dùng:

Thành công

Không dùng:

Done
Success
OK
Completed
XXX. COMPONENT STANDARD

Bắt buộc sử dụng:

Toast.tsx
ToastContainer.tsx

AlertBanner.tsx

ConfirmDialog.tsx
DeleteDialog.tsx

LoadingOverlay.tsx

InlineError.tsx
XXXI. FILE STRUCTURE
/components/notification

Toast.tsx
ToastContainer.tsx

AlertBanner.tsx

ConfirmDialog.tsx
DeleteDialog.tsx

LoadingOverlay.tsx

InlineError.tsx
XXXII. ACCESSIBILITY

Toast:

role="status"

Error:

role="alert"

Dialog:

aria-modal="true"
XXXIII. RESPONSIVE RULE

Desktop:

Top Right

Tablet:

Top Right

Mobile:

Bottom Center
Width: 100%
XXXIV. BẮT BUỘC TUÂN THỦ

Không được:

Random màu thông báo
Random icon
Random vị trí toast
Random wording
Random thời gian tự đóng

Toàn bộ hệ thống phải sử dụng:

Notification Framework Standard

và tuân thủ tuyệt đối tài liệu này.

Notification là tiếng nói chính thức của toàn bộ hệ thống POS.