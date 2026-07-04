# MASTER_WORKFLOW_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ luồng nghiệp vụ (Workflow Lifecycle) trong hệ thống POS Enterprise.

Áp dụng cho:

* Đơn hàng
* Nhập hàng
* Xuất hủy
* Kiểm kê
* Điều chỉnh tồn kho
* Công nợ
* Thu chi
* Phiếu nội bộ
* Chứng từ hệ thống

Mọi nghiệp vụ phải kế thừa Workflow Framework này.

---

# I. TRIẾT LÝ THIẾT KẾ

Mọi chứng từ trong hệ thống phải có vòng đời rõ ràng.

---

Không được:

* Random Status
* Random Workflow
* Random Transition

---

Workflow là nguồn sự thật duy nhất.

---

# II. WORKFLOW LIFECYCLE

Draft

↓

Pending Approval

↓

Approved

↓

Completed

↓

Archived

---

Có thể:

Cancel

ở bất kỳ giai đoạn phù hợp.

---

# III. MASTER STATUS CATALOG

DRAFT

PENDING

APPROVED

COMPLETED

CANCELLED

ARCHIVED

---

Toàn hệ thống chỉ sử dụng bộ trạng thái này.

---

# IV. STATUS DEFINITIONS

DRAFT

Đang soạn

---

PENDING

Chờ duyệt

---

APPROVED

Đã duyệt

---

COMPLETED

Hoàn tất nghiệp vụ

---

CANCELLED

Đã hủy

---

ARCHIVED

Lưu trữ

---

# V. STATUS COLOR MAPPING

DRAFT

Gray

---

PENDING

Warning

---

APPROVED

Primary

---

COMPLETED

Success

---

CANCELLED

Danger

---

ARCHIVED

Neutral

---

Sử dụng:

MASTER_STATUS_BADGE_STANDARD_V1

---

# VI. MASTER WORKFLOW

DRAFT

↓

PENDING

↓

APPROVED

↓

COMPLETED

↓

ARCHIVED

---

# VII. ALLOWED TRANSITIONS

DRAFT

→ PENDING

→ CANCELLED

---

PENDING

→ APPROVED

→ CANCELLED

---

APPROVED

→ COMPLETED

→ CANCELLED

---

COMPLETED

→ ARCHIVED

---

ARCHIVED

Không thay đổi

---

# VIII. FORBIDDEN TRANSITIONS

COMPLETED

→ DRAFT

---

ARCHIVED

→ APPROVED

---

CANCELLED

→ COMPLETED

---

Không cho phép.

---

# IX. ACTION MAPPING

DRAFT

↓

Lưu nháp

---

PENDING

↓

Gửi duyệt

---

APPROVED

↓

Duyệt

---

COMPLETED

↓

Hoàn tất

---

CANCELLED

↓

Hủy

---

ARCHIVED

↓

Lưu trữ

---

# X. WORKFLOW BUTTON MATRIX

DRAFT

[Hủy]

[Lưu nháp]

[Gửi duyệt]

---

PENDING

[Từ chối]

[Duyệt]

---

APPROVED

[Hoàn tất]

---

COMPLETED

[Lưu trữ]

---

# XI. PERMISSION MAPPING

DRAFT

create

update

---

PENDING

approve

---

APPROVED

approve

---

COMPLETED

view

---

ARCHIVED

view

---

# XII. CREATOR RULE

Người tạo

không được tự duyệt.

---

Ví dụ:

Nguyễn A tạo phiếu.

↓

Nguyễn A không được nhấn Duyệt.

---

# XIII. APPROVER RULE

Người duyệt phải có:

approve permission

---

Ví dụ:

inventory.approve

order.approve

---

# XIV. AUDIT REQUIREMENT

Mọi thay đổi trạng thái phải ghi log.

---

Bắt buộc lưu:

User

Action

Status Old

Status New

Timestamp

Reason

---

# XV. WORKFLOW HISTORY

Mỗi chứng từ phải có:

Workflow Timeline

---

Ví dụ

09:00

Tạo phiếu

---

09:15

Gửi duyệt

---

09:18

Duyệt

---

09:25

Hoàn tất

---

# XVI. TIMELINE STRUCTURE

User

↓

Action

↓

Timestamp

↓

Comment

---

# XVII. COMMENT REQUIREMENT

Bắt buộc comment khi:

Từ chối

Hủy

Khôi phục

---

Không bắt buộc khi:

Lưu

Duyệt

Hoàn tất

---

# XVIII. REJECTION WORKFLOW

PENDING

↓

REJECTED

↓

DRAFT

---

Lưu ý:

REJECTED không phải Status chính.

---

Chỉ là Event.

---

# XIX. REJECT EVENT

Lưu vào Audit Log.

---

Không tạo Status riêng.

---

# XX. CANCEL WORKFLOW

Cho phép:

DRAFT

PENDING

APPROVED

---

Không cho phép:

COMPLETED

ARCHIVED

---

# XXI. RESTORE WORKFLOW

Chỉ áp dụng:

CANCELLED

---

Permission

restore

---

# XXII. RESTORE TRANSITION

CANCELLED

↓

DRAFT

---

# XXIII. DELETE RULE

Không xóa vật lý.

---

Soft Delete Only.

---

Status

Deleted

---

Không hiển thị mặc định.

---

# XXIV. ARCHIVE RULE

Completed

↓

Archive

---

Dữ liệu vẫn tồn tại.

---

Không cho phép chỉnh sửa.

---

# XXV. DOCUMENT LOCK RULE

APPROVED

↓

Readonly

---

COMPLETED

↓

Readonly

---

ARCHIVED

↓

Readonly

---

# XXVI. FIELD LOCK RULE

DRAFT

Editable

---

PENDING

Readonly

---

APPROVED

Readonly

---

COMPLETED

Readonly

---

# XXVII. SYSTEM ACTIONS

Auto Complete

Auto Archive

Auto Expire

---

Phải được ghi log.

---

# XXVIII. ORDER WORKFLOW

Draft

↓

Pending

↓

Approved

↓

Completed

---

# XXIX. IMPORT GOODS WORKFLOW

Draft

↓

Pending

↓

Approved

↓

Completed

---

# XXX. STOCK CHECK WORKFLOW

Draft

↓

Pending

↓

Approved

↓

Completed

---

# XXXI. DAMAGE GOODS WORKFLOW

Draft

↓

Pending

↓

Approved

↓

Completed

---

# XXXII. DEBT WORKFLOW

Open

↓

Approved

↓

Completed

---

Mapping về:

Workflow Framework

---

# XXXIII. PAYMENT WORKFLOW

Draft

↓

Approved

↓

Completed

---

# XXXIV. APPROVAL DIALOG

Structure

Icon

↓

Title

↓

Reason

↓

Buttons

---

# XXXV. CANCEL DIALOG

Bắt buộc nhập:

Reason

---

Minimum

10 ký tự

---

# XXXVI. APPROVAL MATRIX

Level 1

Manager

---

Level 2

Admin

---

Level 3

Owner

---

Tùy cấu hình doanh nghiệp.

---

# XXXVII. WORKFLOW DASHBOARD

Hiển thị:

Draft Count

Pending Count

Approved Count

Completed Count

---

# XXXVIII. SLA TRACKING

Pending quá hạn

↓

Warning

---

Pending > 24h

↓

Escalation

---

# XXXIX. NOTIFICATION INTEGRATION

Gửi duyệt

↓

Toast Success

↓

Notification

---

Duyệt

↓

Toast Success

↓

Notification

---

# XL. EMAIL INTEGRATION

Optional

---

Approval Request

Approval Success

Approval Reject

---

# XLI. API STANDARD

POST /submit

↓

PENDING

---

POST /approve

↓

APPROVED

---

POST /complete

↓

COMPLETED

---

POST /cancel

↓

CANCELLED

---

POST /archive

↓

ARCHIVED

---

# XLII. TYPESCRIPT ENUM

enum WorkflowStatus {

DRAFT,

PENDING,

APPROVED,

COMPLETED,

CANCELLED,

ARCHIVED

}

---

# XLIII. COMPONENT STANDARD

WorkflowBadge.tsx

WorkflowTimeline.tsx

WorkflowHistory.tsx

WorkflowActions.tsx

ApprovalDialog.tsx

CancelDialog.tsx

---

# XLIV. FILE STRUCTURE

/components/workflow

WorkflowBadge.tsx

WorkflowTimeline.tsx

WorkflowHistory.tsx

WorkflowActions.tsx

ApprovalDialog.tsx

CancelDialog.tsx

---

# XLV. BẮT BUỘC TUÂN THỦ

Không được:

* Tự tạo Status mới
* Tự tạo Workflow riêng
* Tự tạo Transition riêng
* Hardcode trạng thái
* Hardcode quyền duyệt

Mọi nghiệp vụ phải kế thừa:

Workflow Framework Standard

và tuân thủ tuyệt đối tài liệu này.

Workflow là xương sống vận hành của toàn bộ POS Enterprise.

UI có thể thay đổi.

Workflow không được thay đổi tùy tiện.
