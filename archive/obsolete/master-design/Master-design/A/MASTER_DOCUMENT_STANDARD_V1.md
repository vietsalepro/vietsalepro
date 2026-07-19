# MASTER_DOCUMENT_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ chứng từ nghiệp vụ (Business Documents) trong hệ thống POS Enterprise.

Áp dụng cho:

* Đơn hàng
* Phiếu nhập hàng
* Phiếu xuất hủy
* Phiếu kiểm kê
* Phiếu điều chỉnh tồn kho
* Phiếu thu
* Phiếu chi
* Công nợ
* Chứng từ nội bộ

Tất cả phải kế thừa Document Framework Standard.

---

# I. TRIẾT LÝ THIẾT KẾ

Mọi nghiệp vụ trong hệ thống đều được biểu diễn dưới dạng Chứng từ.

---

Document là nguồn dữ liệu gốc.

---

Không được:

* Tạo dữ liệu không có chứng từ
* Thao tác trực tiếp trên tồn kho
* Thao tác trực tiếp trên công nợ

---

Mọi thay đổi phải thông qua chứng từ.

---

# II. DOCUMENT ARCHITECTURE

Document

↓

Document Header

↓

Document Detail

↓

Document Workflow

↓

Document Audit

↓

Document Attachment

---

# III. MASTER DOCUMENT STRUCTURE

Document

├── Header

├── Details

├── Workflow

├── Audit Logs

├── Attachments

└── Metadata

---

# IV. DOCUMENT HEADER

Lưu thông tin tổng quan.

---

Fields:

Document Id

Document Code

Document Type

Branch

Warehouse

Status

Created By

Created At

Updated By

Updated At

---

# V. DOCUMENT DETAIL

Lưu dữ liệu nghiệp vụ.

---

Ví dụ:

Danh sách sản phẩm

Danh sách dịch vụ

Danh sách dòng hàng

---

# VI. DOCUMENT METADATA

Purpose

Thông tin hệ thống.

---

Fields

Source Module

Source Screen

Version

Device

IP Address

User Agent

---

# VII. DOCUMENT TYPES

ORDER

IMPORT_GOODS

EXPORT_DAMAGE

STOCK_CHECK

STOCK_ADJUSTMENT

PAYMENT_RECEIPT

PAYMENT_VOUCHER

DEBT

TRANSFER

CUSTOM

---

Không được tạo Type tùy ý ngoài Registry.

---

# VIII. DOCUMENT NUMBERING STANDARD

Mọi chứng từ phải có mã riêng.

---

Format

PREFIX-YYYYMM-000001

---

Ví dụ

SO-202607-000001

IG-202607-000001

DG-202607-000001

SC-202607-000001

---

# IX. DOCUMENT PREFIX REGISTRY

SO

Sales Order

---

IG

Import Goods

---

DG

Damage Goods

---

SC

Stock Check

---

SA

Stock Adjustment

---

PR

Payment Receipt

---

PV

Payment Voucher

---

DB

Debt

---

TF

Transfer

---

# X. DOCUMENT CODE RULE

Unique

Bắt buộc

---

Không được sửa sau khi tạo.

---

# XI. DOCUMENT DATE STANDARD

Created Date

Ngày tạo

---

Document Date

Ngày chứng từ

---

Posting Date

Ngày ghi nhận

---

Approved Date

Ngày duyệt

---

Completed Date

Ngày hoàn tất

---

# XII. DOCUMENT STATUS

Sử dụng:

MASTER_WORKFLOW_STANDARD_V1

---

DRAFT

PENDING

APPROVED

COMPLETED

CANCELLED

ARCHIVED

---

# XIII. DOCUMENT OWNER

Created By

Bắt buộc

---

Không được NULL.

---

# XIV. DOCUMENT BRANCH

Mọi chứng từ phải thuộc:

1 Chi nhánh

---

# XV. DOCUMENT WAREHOUSE

Các chứng từ kho phải thuộc:

1 Kho

---

Ví dụ

Nhập hàng

Kiểm kê

Xuất hủy

Điều chỉnh

---

# XVI. DOCUMENT DETAIL STANDARD

Structure

Line Number

Item Id

Item Code

Item Name

Unit

Quantity

Unit Price

Discount

Tax

Amount

Note

---

# XVII. LINE NUMBER RULE

Bắt đầu từ:

1

---

Tăng tuần tự.

---

Không được bỏ số.

---

# XVIII. MONEY STANDARD

Decimal

2

---

Currency

VND

(Default)

---

Hỗ trợ đa tiền tệ V2.

---

# XIX. QUANTITY STANDARD

Decimal

3

---

Ví dụ

1.250

2.500

---

# XX. ATTACHMENT STANDARD

Cho phép:

Image

PDF

Excel

Word

---

# XXI. ATTACHMENT LIMIT

Maximum

20 Files

---

Maximum Size

20MB/File

---

# XXII. COMMENT STANDARD

Cho phép comment nội bộ.

---

Fields

User

Content

Created At

---

# XXIII. DOCUMENT HISTORY

Mọi thay đổi phải được ghi nhận.

---

Ví dụ

Tạo chứng từ

Cập nhật

Gửi duyệt

Duyệt

Hoàn tất

Hủy

Khôi phục

---

# XXIV. AUDIT LOG STRUCTURE

AuditId

DocumentId

Action

OldValue

NewValue

UserId

Timestamp

Reason

---

# XXV. SOFT DELETE RULE

Không được xóa vật lý.

---

DeletedAt

DeletedBy

---

# XXVI. VERSION CONTROL

Version

1

2

3

...

---

Tăng mỗi lần chỉnh sửa.

---

# XXVII. LOCK RULE

Status

APPROVED

↓

Readonly

---

Status

COMPLETED

↓

Readonly

---

Status

ARCHIVED

↓

Readonly

---

# XXVIII. EDIT RULE

Chỉ được sửa khi:

DRAFT

---

# XXIX. APPROVAL RULE

Sử dụng:

MASTER_WORKFLOW_STANDARD_V1

---

# XXX. DOCUMENT TIMELINE

Structure

Timestamp

↓

User

↓

Action

↓

Description

---

# XXXI. DOCUMENT RELATIONSHIP

Document có thể liên kết.

---

Ví dụ

PO

↓

Import Goods

↓

Inventory Transaction

---

# XXXII. REFERENCE DOCUMENT

Fields

Reference Type

Reference Code

Reference Id

---

# XXXIII. INVENTORY IMPACT RULE

Nhập hàng

*

Tồn kho

---

Xuất hủy

*

Tồn kho

---

Kiểm kê

±

Tồn kho

---

Điều chỉnh

±

Tồn kho

---

# XXXIV. FINANCIAL IMPACT RULE

Phiếu thu

*

Quỹ

---

Phiếu chi

*

Quỹ

---

Công nợ

*

Debt

---

Thanh toán công nợ

*

Debt

---

# XXXV. DOCUMENT SEARCH INDEX

Code

---

Customer

---

Supplier

---

Status

---

Branch

---

Warehouse

---

Created Date

---

# XXXVI. DOCUMENT FILTER STANDARD

Date Range

---

Status

---

Branch

---

Warehouse

---

Creator

---

# XXXVII. DOCUMENT EXPORT

Excel

PDF

CSV

---

# XXXVIII. DOCUMENT PRINT

Bắt buộc hỗ trợ:

Print Preview

---

PDF Export

---

# XXXIX. DOCUMENT TEMPLATE

Header

↓

Information

↓

Details Table

↓

Summary

↓

Workflow

↓

Signature

---

# XL. DOCUMENT SIGNATURE

Prepared By

---

Approved By

---

Completed By

---

# XLI. DOCUMENT SUMMARY

Total Quantity

---

Subtotal

---

Discount

---

Tax

---

Grand Total

---

# XLII. DOCUMENT API STANDARD

POST /documents

---

GET /documents

---

GET /documents/:id

---

PUT /documents/:id

---

POST /documents/:id/submit

---

POST /documents/:id/approve

---

POST /documents/:id/complete

---

POST /documents/:id/cancel

---

# XLIII. TYPESCRIPT INTERFACE

interface Document {

id: string;

code: string;

type: DocumentType;

status: WorkflowStatus;

header: DocumentHeader;

details: DocumentDetail[];

attachments: Attachment[];

auditLogs: AuditLog[];

}

---

# XLIV. COMPONENT STANDARD

DocumentHeader.tsx

DocumentDetailTable.tsx

DocumentSummary.tsx

DocumentTimeline.tsx

DocumentAttachment.tsx

DocumentAuditLog.tsx

---

# XLV. FILE STRUCTURE

/components/document

DocumentHeader.tsx

DocumentDetailTable.tsx

DocumentSummary.tsx

DocumentTimeline.tsx

DocumentAttachment.tsx

DocumentAuditLog.tsx

---

# XLVI. MODULE MAPPING

Sales Order

→ Document Framework

---

Import Goods

→ Document Framework

---

Damage Goods

→ Document Framework

---

Stock Check

→ Document Framework

---

Stock Adjustment

→ Document Framework

---

Receipt Voucher

→ Document Framework

---

Payment Voucher

→ Document Framework

---

Debt Voucher

→ Document Framework

---

# XLVII. DESIGN INTEGRATION

UI

MASTER_MODAL_BLUEPRINT_V1

---

Form

MASTER_FORM_STANDARD_V1

---

Grid

MASTER_DATA_GRID_STANDARD_V1

---

Workflow

MASTER_WORKFLOW_STANDARD_V1

---

Notification

MASTER_NOTIFICATION_STANDARD_V1

---

# XLVIII. BẮT BUỘC TUÂN THỦ

Không được:

* Tạo chứng từ riêng biệt ngoài Framework
* Tạo mã chứng từ riêng
* Tạo Workflow riêng
* Tạo Audit riêng
* Tạo Attachment riêng

Mọi nghiệp vụ phải kế thừa:

Document Framework Standard

và tuân thủ tuyệt đối tài liệu này.

Document là đơn vị nghiệp vụ cao nhất của toàn bộ POS Enterprise.

Tồn kho chỉ là hệ quả.

Công nợ chỉ là hệ quả.

Báo cáo chỉ là hệ quả.

Document mới là nguồn sự thật duy nhất (Single Source of Truth).
