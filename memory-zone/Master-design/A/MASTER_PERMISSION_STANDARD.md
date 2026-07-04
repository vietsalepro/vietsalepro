# MASTER_PERMISSION_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ hệ thống phân quyền (RBAC - Role Based Access Control) cho POS.

Áp dụng cho:

* Menu
* Screen
* Button
* Action
* API
* Report
* Dashboard
* Data Scope

Mọi tính năng mới bắt buộc phải tích hợp Permission Framework.

---

# I. TRIẾT LÝ PHÂN QUYỀN

Không phân quyền theo User.

Phân quyền theo:

Role

↓

Permission

↓

Action

---

User chỉ được gán Role.

Role chứa Permission.

Permission kiểm soát hành động.

---

# II. RBAC ARCHITECTURE

Company

↓

Role

↓

Permission

↓

Screen

↓

Action

↓

API

---

# III. PERMISSION LEVEL

Level 1

Module Permission

---

Level 2

Screen Permission

---

Level 3

Action Permission

---

Level 4

Field Permission

---

Level 5

Data Scope Permission

---

# IV. ROLE STANDARD

Không gán Permission trực tiếp cho User.

---

User

↓

Role

↓

Permission

---

Ví dụ

Admin

Manager

Cashier

Warehouse

Accountant

Owner

---

# V. ROLE CATALOG STANDARD

OWNER

Toàn quyền

---

ADMIN

Quản trị hệ thống

---

MANAGER

Quản lý vận hành

---

CASHIER

Nhân viên bán hàng

---

WAREHOUSE

Nhân viên kho

---

ACCOUNTANT

Kế toán

---

VIEWER

Chỉ xem

---

# VI. MODULE PERMISSION

Ví dụ

SALES

INVENTORY

CUSTOMER

SUPPLIER

FINANCE

REPORT

SYSTEM

---

Permission chỉ được cấp ở cấp Module.

---

# VII. SCREEN PERMISSION

Ví dụ

inventory.view

inventory.import

inventory.audit

inventory.destroy

---

customer.view

customer.create

customer.update

customer.delete

---

# VIII. ACTION PERMISSION

Các Action chuẩn

view

create

update

delete

approve

cancel

export

import

print

sync

restore

---

Không tự ý tạo action khác.

---

# IX. CRUD STANDARD

View

Được xem dữ liệu

---

Create

Được tạo dữ liệu

---

Update

Được chỉnh sửa

---

Delete

Được xóa

---

Approve

Được duyệt

---

# X. MENU VISIBILITY

Menu chỉ hiển thị khi:

User có quyền View.

---

Không hiển thị menu bị cấm.

---

Không disable menu.

---

Ẩn hoàn toàn.

---

# XI. PAGE ACCESS CONTROL

Không có quyền

↓

Không vào được màn hình.

---

Hiển thị

403 Forbidden

---

Không redirect về Dashboard.

---

# XII. BUTTON PERMISSION

Ví dụ

Tạo mới

↓

create

---

Sửa

↓

update

---

Xóa

↓

delete

---

Xuất Excel

↓

export

---

Duyệt

↓

approve

---

# XIII. ACTION COLUMN PERMISSION

Table Action phải tự động ẩn.

---

Ví dụ

User không có delete

↓

Không hiển thị nút Xóa

---

User không có update

↓

Không hiển thị nút Sửa

---

# XIV. API PERMISSION

UI Permission

không đủ.

---

Backend bắt buộc kiểm tra Permission.

---

Ví dụ

DELETE /products

↓

Permission

product.delete

---

# XV. DATA SCOPE STANDARD

Quan trọng nhất.

---

Không phải ai có View cũng xem toàn bộ dữ liệu.

---

Có 4 cấp:

SELF

BRANCH

DEPARTMENT

ALL

---

# XVI. SELF SCOPE

Chỉ xem dữ liệu do mình tạo.

---

Ví dụ

Nhân viên bán hàng.

---

# XVII. BRANCH SCOPE

Chỉ xem dữ liệu trong chi nhánh.

---

Ví dụ

Quản lý chi nhánh.

---

# XVIII. DEPARTMENT SCOPE

Chỉ xem dữ liệu trong phòng ban.

---

Ví dụ

Kế toán.

---

# XIX. ALL SCOPE

Xem toàn bộ dữ liệu.

---

Ví dụ

Owner

Admin

---

# XX. FIELD PERMISSION

Cho phép:

Ẩn field

Khóa field

Readonly field

---

Ví dụ

Giá nhập

↓

Chỉ Manager được xem.

---

Cashier

↓

Không thấy.

---

# XXI. REPORT PERMISSION

Report phải phân quyền riêng.

---

Ví dụ

sales.report.view

inventory.report.view

finance.report.view

---

# XXII. DASHBOARD PERMISSION

KPI cũng phải phân quyền.

---

Ví dụ

Doanh thu

↓

Manager

Owner

---

Cashier

↓

Không thấy KPI doanh thu.

---

# XXIII. EXPORT PERMISSION

Xuất Excel

PDF

CSV

---

Permission riêng.

---

Không gộp vào View.

---

# XXIV. IMPORT PERMISSION

Nhập Excel

CSV

---

Permission riêng.

---

# XXV. APPROVAL WORKFLOW

Dùng cho:

Nhập hàng

Xuất hủy

Điều chỉnh tồn kho

---

Permission

approve

---

Người tạo không được tự duyệt.

---

# XXVI. SOFT DELETE STANDARD

Không xóa vật lý.

---

Status

Deleted

---

Permission

restore

---

Khôi phục được.

---

# XXVII. AUDIT LOG PERMISSION

Ai tạo

Ai sửa

Ai xóa

Ai duyệt

---

Lưu bắt buộc.

---

Không cho phép tắt.

---

# XXVIII. ROLE INHERITANCE

OWNER

↓

ADMIN

↓

MANAGER

↓

STAFF

---

Role cấp cao kế thừa Role cấp thấp.

---

# XXIX. PERMISSION NAMING STANDARD

Format

module.action

---

Ví dụ

product.view

product.create

product.update

product.delete

---

inventory.import

inventory.audit

---

finance.export

---

Không dùng:

canEdit

canDelete

isAdmin

---

# XXX. TYPESCRIPT STANDARD

enum Permission {

PRODUCT_VIEW,

PRODUCT_CREATE,

PRODUCT_UPDATE,

PRODUCT_DELETE,

INVENTORY_IMPORT,

INVENTORY_AUDIT,

FINANCE_EXPORT

}

---

# XXXI. ROUTE GUARD STANDARD

<PageGuard

permission="inventory.view"

>

```
Page
```

</PageGuard>

---

Không có quyền

↓

403

---

# XXXII. BUTTON GUARD STANDARD

<PermissionGuard

permission="product.delete"

>

```
Delete Button
```

</PermissionGuard>

---

# XXXIII. MENU GUARD STANDARD

<MenuGuard

permission="inventory.view"

>

```
Inventory Menu
```

</MenuGuard>

---

# XXXIV. API SECURITY RULE

Frontend Permission

≠

Backend Permission

---

Backend luôn là nguồn xác thực cuối cùng.

---

# XXXV. AUDIT LOG STRUCTURE

User

Action

Entity

Old Value

New Value

Timestamp

IP

Device

---

Lưu tối thiểu:

365 ngày

---

# XXXVI. SUPER ADMIN RULE

Chỉ có:

Owner

System Admin

---

Được cấp ALL.

---

Không dùng tài khoản Super Admin để vận hành hàng ngày.

---

# XXXVII. MASTER STRUCTURE

User

↓

Role

↓

Permission

↓

Guard

↓

Screen

↓

API

---

# XXXVIII. COMPONENT STANDARD

Toàn bộ hệ thống phải sử dụng:

PermissionGuard.tsx

PageGuard.tsx

MenuGuard.tsx

RoleProvider.tsx

PermissionProvider.tsx

AccessDenied.tsx

---

# XXXIX. DEFAULT ROLE MATRIX

OWNER

ALL

---

ADMIN

ALL trừ OWNER SETTING

---

MANAGER

Sales

Inventory

Customer

Report

Approve

---

ACCOUNTANT

Finance

Debt

Report

---

WAREHOUSE

Inventory

Import

Audit

---

CASHIER

Sales

Customer

---

VIEWER

View Only

---

# XL. BẮT BUỘC TUÂN THỦ

Không được:

* Hardcode quyền trong UI
* Hardcode quyền trong API
* Kiểm tra quyền bằng tên User
* Dùng isAdmin boolean

Toàn bộ hệ thống phải sử dụng:

RBAC Framework

và tuân thủ tuyệt đối tài liệu này.

Permission là nguồn sự thật duy nhất (Single Source of Truth).
