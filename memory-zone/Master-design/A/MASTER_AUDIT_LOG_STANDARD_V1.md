# MASTER_AUDIT_LOG_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ cơ chế Audit Log, Activity Tracking, Data Change Tracking và System Traceability trong hệ thống POS Enterprise.

Audit Log là nguồn sự thật duy nhất về lịch sử hoạt động của hệ thống.

---

# I. TRIẾT LÝ THIẾT KẾ

Audit Log không phải tính năng.

Audit Log là hạ tầng bắt buộc.

---

Mọi hành động phải có khả năng truy vết.

---

Nguyên tắc:

Không ai được phép thay đổi dữ liệu mà không để lại dấu vết.

---

# II. AUDIT ARCHITECTURE

User Action

↓

Application Event

↓

Audit Event

↓

Audit Log Entry

↓

Audit Repository

↓

Audit Reports

---

# III. SINGLE SOURCE OF TRUTH

Nguồn lịch sử duy nhất:

Audit Log

---

Không lấy dữ liệu từ:

UI

Cache

Notification

Session

---

# IV. AUDIT LEVELS

SYSTEM

SECURITY

BUSINESS

DATA

---

# V. SYSTEM AUDIT

Theo dõi:

Login

Logout

Session

Settings

Configuration

---

# VI. SECURITY AUDIT

Theo dõi:

Permission Change

Role Change

Password Reset

Account Lock

Failed Login

---

# VII. BUSINESS AUDIT

Theo dõi:

Tạo phiếu

Sửa phiếu

Duyệt phiếu

Hoàn tất phiếu

Hủy phiếu

Khôi phục phiếu

---

# VIII. DATA AUDIT

Theo dõi:

Insert

Update

Delete

Restore

Import

Export

---

# IX. AUDIT EVENT STRUCTURE

Audit Event

↓

Audit Entry

↓

Storage

---

# X. AUDIT LOG STRUCTURE

AuditId

EventId

Timestamp

UserId

Username

Action

EntityType

EntityId

EntityCode

OldValue

NewValue

Reason

IP Address

Device

Browser

Module

Screen

Status

---

# XI. REQUIRED FIELDS

AuditId

Timestamp

UserId

Action

EntityType

EntityId

---

Không được NULL.

---

# XII. AUDIT ACTION CATALOG

CREATE

UPDATE

DELETE

RESTORE

APPROVE

COMPLETE

CANCEL

SUBMIT

LOGIN

LOGOUT

IMPORT

EXPORT

VIEW

PRINT

---

Không được tự tạo Action mới ngoài Registry.

---

# XIII. ENTITY TYPES

DOCUMENT

PRODUCT

CUSTOMER

SUPPLIER

INVENTORY

PAYMENT

DEBT

USER

ROLE

SETTING

---

# XIV. TIMESTAMP STANDARD

UTC

Bắt buộc

---

Display:

Local Time

---

Format:

YYYY-MM-DD HH:mm:ss

---

# XV. USER INFORMATION

Lưu:

UserId

Username

Role

Branch

---

# XVI. DEVICE INFORMATION

Device Type

OS

Browser

User Agent

---

# XVII. NETWORK INFORMATION

IP Address

Session Id

Request Id

---

# XVIII. BEFORE-AFTER SNAPSHOT

Mọi UPDATE phải lưu:

Old Value

New Value

---

Ví dụ:

Old

{
price:100000
}

New

{
price:120000
}

---

# XIX. JSON STORAGE STANDARD

OldValue

JSON

---

NewValue

JSON

---

Không lưu dạng Text.

---

# XX. FIELD LEVEL TRACKING

Ví dụ:

Tên sản phẩm đổi

↓

Log Field Name

---

Giá bán đổi

↓

Log Price

---

Không chỉ log "Updated".

---

# XXI. DOCUMENT AUDIT

Log:

Create

Submit

Approve

Complete

Cancel

Restore

Archive

---

# XXII. WORKFLOW AUDIT

Log:

Old Status

New Status

Reason

Approver

---

# XXIII. INVENTORY AUDIT

Log:

Product

Warehouse

Quantity Before

Quantity After

Difference

Document

---

# XXIV. FINANCIAL AUDIT

Log:

Account

Balance Before

Balance After

Amount

Document

---

# XXV. LOGIN AUDIT

Log:

Login Time

Logout Time

IP

Device

Browser

Success

Failed

---

# XXVI. FAILED LOGIN AUDIT

Lưu:

Username

IP

Timestamp

Reason

---

# XXVII. PERMISSION AUDIT

Log:

Role Before

Role After

Permission Before

Permission After

---

# XXVIII. CONFIGURATION AUDIT

Log:

Setting Name

Old Value

New Value

User

Timestamp

---

# XXIX. IMPORT AUDIT

Log:

File Name

Rows Imported

Success Count

Failed Count

---

# XXX. EXPORT AUDIT

Log:

Module

Export Type

Record Count

User

Timestamp

---

# XXXI. PRINT AUDIT

Log:

Document

User

Print Time

---

# XXXII. VIEW AUDIT

Không bắt buộc V1.

---

Chỉ log:

Sensitive Data

---

Ví dụ:

Công nợ

Tài chính

Lương

---

# XXXIII. DELETE RULE

Không xóa Audit Log.

---

Bất kỳ trường hợp nào.

---

# XXXIV. IMMUTABLE RULE

Audit Log

Readonly

---

Không Update

Không Delete

---

# XXXV. RETENTION POLICY

Tối thiểu:

5 năm

---

Khuyến nghị:

10 năm

---

# XXXVI. AUDIT SEARCH

Cho phép tìm theo:

User

Action

Module

Entity

Date Range

---

# XXXVII. AUDIT FILTER

Date

User

Branch

Module

Action

Status

---

# XXXVIII. AUDIT TIMELINE

Hiển thị:

Thời gian

↓

Người thực hiện

↓

Hành động

↓

Chi tiết

---

# XXXIX. AUDIT DASHBOARD

Total Events

Today Events

Failed Login

Approval Actions

Delete Actions

---

# XL. RISK EVENT TRACKING

Đánh dấu mức độ:

LOW

MEDIUM

HIGH

CRITICAL

---

# XLI. CRITICAL EVENTS

Delete

Permission Change

Financial Adjustment

Inventory Adjustment

System Settings

---

# XLII. ALERT INTEGRATION

Critical Event

↓

Notification

↓

Admin Alert

---

# XLIII. AUDIT API STANDARD

GET /audit-logs

---

GET /audit-logs/:id

---

GET /audit-logs/entity/:entityId

---

GET /audit-logs/user/:userId

---

# XLIV. TYPESCRIPT INTERFACE

interface AuditLog {

id:string;

timestamp:string;

userId:string;

action:string;

entityType:string;

entityId:string;

oldValue?:object;

newValue?:object;

reason?:string;

}

---

# XLV. COMPONENT STANDARD

AuditLogGrid.tsx

AuditTimeline.tsx

AuditFilter.tsx

AuditDetailsModal.tsx

AuditDashboard.tsx

---

# XLVI. FILE STRUCTURE

/modules/audit

logs/

timeline/

dashboard/

reports/

---

# XLVII. DATABASE TABLES

audit_logs

audit_events

audit_sessions

audit_security_events

---

# XLVIII. PERFORMANCE RULE

Audit Log

Write Optimized

---

Read từ Indexes.

---

# XLIX. ARCHIVE RULE

Audit cũ

↓

Archive Storage

---

Không xóa.

---

# L. CORRELATION ID

Mỗi Request

↓

1 CorrelationId

---

Dùng để truy vết xuyên hệ thống.

---

# LI. EXAMPLE EVENT

User:

Nguyễn Văn A

↓

Action:

APPROVE

↓

Entity:

IG-202607-000123

↓

Timestamp:

2026-07-12 09:15:21

↓

Reason:

Đã kiểm tra đầy đủ hàng hóa

---

# LII. INTEGRATION MATRIX

Document Framework

↓

Workflow Framework

↓

Inventory Ledger

↓

Financial Ledger

↓

Audit Log

---

Mọi hành động đều phải ghi Audit.

---

# LIII. COMPLIANCE RULE

Nếu một hành động:

* Thay đổi dữ liệu
* Thay đổi trạng thái
* Thay đổi quyền
* Thay đổi số dư
* Thay đổi tồn kho

↓

Bắt buộc tạo Audit Log.

---

# LIV. BẮT BUỘC TUÂN THỦ

Không được:

* Xóa Audit Log
* Sửa Audit Log
* Hardcode Audit
* Log thiếu User
* Log thiếu Timestamp
* Log thiếu Entity

Mọi thay đổi trong hệ thống phải đi qua:

User Action

↓

Business Event

↓

Audit Event

↓

Audit Log

---

Audit Log là Camera Giám Sát của toàn bộ POS Enterprise.

Nếu dữ liệu là "Sự thật hiện tại"

thì Audit Log là:

"Sự thật lịch sử".

Trong trường hợp xảy ra tranh chấp dữ liệu:

Audit Log là bằng chứng cuối cùng.
