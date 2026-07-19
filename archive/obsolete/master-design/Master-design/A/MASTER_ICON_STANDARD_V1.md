# MASTER_ICON_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ hệ thống Icon cho POS Enterprise.

Áp dụng cho:

* Sidebar
* Header
* Dashboard
* Table
* Form
* Modal
* Status Badge
* Action Button
* Empty State
* Error State

Toàn bộ hệ thống chỉ sử dụng một Icon Framework duy nhất.

---

# I. TRIẾT LÝ THIẾT KẾ

Icon có nhiệm vụ:

* Hỗ trợ nhận diện
* Hỗ trợ thao tác
* Hỗ trợ điều hướng

Icon không được dùng để trang trí.

---

# II. ICON FRAMEWORK STANDARD

Chỉ sử dụng:

Lucide React

---

Package

lucide-react

---

Không sử dụng:

Heroicons

Font Awesome

Ant Design Icons

Material Icons

SVG ngẫu nhiên

---

# III. DESIGN LANGUAGE

Modern SaaS

*

Minimal

*

Outline Style

*

Enterprise POS

---

# IV. ICON STYLE

Style

Outline

---

Stroke Width

2

---

Line Cap

Round

---

Line Join

Round

---

Không dùng:

Filled Icon

3D Icon

Gradient Icon

---

# V. MASTER ICON SIZE

XS

14px

---

SM

16px

---

MD

18px

---

LG

20px

---

XL

24px

---

XXL

32px

---

Không dùng kích thước khác.

---

# VI. SIZE MAPPING

Table Action

16px

---

Input Prefix

16px

---

Input Suffix

16px

---

Button Icon

16px

---

Menu Icon

20px

---

Card Icon

24px

---

Dashboard KPI

24px

---

Empty State

32px

---

Error State

32px

---

# VII. ICON COLOR SYSTEM

Primary

#5B3DF5

---

Neutral

#64748B

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

White

#FFFFFF

---

# VIII. COLOR MAPPING

Sidebar Active

Primary

---

Sidebar Inactive

Neutral

---

Primary Button

White

---

Danger Button

White

---

Success Badge

Success

---

Warning Badge

Warning

---

Error Badge

Danger

---

# IX. SIDEBAR ICON STANDARD

Size

20px

---

Position

Left

---

Gap

12px

---

Vertical Align

Center

---

# X. SIDEBAR ACTIVE STATE

Icon Color

#5B3DF5

---

Background

#F5F3FF

---

# XI. SIDEBAR INACTIVE STATE

Icon Color

#64748B

---

Background

Transparent

---

# XII. HEADER ICON STANDARD

Size

20px

---

Color

#64748B

---

# XIII. MODAL HEADER ICON

Container

48x48

---

Radius

14px

---

Background

#F5F3FF

---

Icon

24px

---

Color

#5B3DF5

---

# XIV. BUTTON ICON STANDARD

Size

16px

---

Position

Left

---

Gap

8px

---

Align

Center

---

# XV. ICON BUTTON STANDARD

Button Size

40x40

---

Radius

12px

---

Icon Size

18px

---

# XVI. TABLE ACTION ICON

View

Eye

---

Edit

Pencil

---

Print

Printer

---

Delete

Trash2

---

Restore

RotateCcw

---

Size

16px

---

# XVII. TABLE ACTION ORDER

Eye

↓

Pencil

↓

Printer

↓

Trash2

---

Không thay đổi thứ tự.

---

# XVIII. FORM ICON STANDARD

Search

Search

---

Customer

User

---

Phone

Phone

---

Email

Mail

---

Address

MapPin

---

Date

Calendar

---

Money

BadgeDollarSign

---

Quantity

Hash

---

Barcode

ScanLine

---

# XIX. FILTER AREA ICON

Search

Search

---

Refresh

RefreshCw

---

Filter

Filter

---

Reset

RotateCcw

---

Export

Download

---

Import

Upload

---

# XX. DASHBOARD KPI ICON

Revenue

BadgeDollarSign

---

Order

FileText

---

Customer

Users

---

Inventory

Package

---

Supplier

Truck

---

Expense

Wallet

---

Profit

TrendingUp

---

# XXI. SALES MODULE ICON

Order

ShoppingCart

---

POS

Monitor

---

Invoice

Receipt

---

Payment

CreditCard

---

Return

Undo2

---

# XXII. INVENTORY MODULE ICON

Inventory

Boxes

---

Import Goods

PackagePlus

---

Export Goods

PackageMinus

---

Stock Check

ClipboardCheck

---

Stock Transfer

ArrowLeftRight

---

Adjustment

Settings2

---

# XXIII. CUSTOMER MODULE ICON

Customer

Users

---

Customer Detail

UserRound

---

Customer Group

UsersRound

---

Debt

WalletCards

---

# XXIV. SUPPLIER MODULE ICON

Supplier

Truck

---

Purchase Order

FilePlus2

---

Import Receipt

PackageCheck

---

# XXV. FINANCE MODULE ICON

Revenue

CircleDollarSign

---

Expense

Wallet

---

Cashbook

BookOpen

---

Debt Collection

Banknote

---

# XXVI. REPORT MODULE ICON

Report

BarChart3

---

Analytics

LineChart

---

Statistics

PieChart

---

Export Report

FileSpreadsheet

---

# XXVII. SYSTEM MODULE ICON

Setting

Settings

---

Permission

ShieldCheck

---

Role

UserCog

---

Audit Log

History

---

Database

Database

---

# XXVIII. STATUS BADGE ICON

Success

CheckCircle2

---

Pending

Clock3

---

Cancelled

XCircle

---

Warning

AlertTriangle

---

Draft

FileClock

---

# XXIX. EMPTY STATE ICON

No Data

Inbox

---

No Result

SearchX

---

No Product

PackageSearch

---

No Customer

UserX

---

# XXX. ERROR STATE ICON

General Error

CircleAlert

---

Network Error

WifiOff

---

Permission Error

ShieldX

---

Server Error

ServerCrash

---

# XXXI. LOADING ICON

LoaderCircle

---

Animation

Spin

---

Duration

1s

---

Linear

Infinite

---

# XXXII. ICON CONTAINER STANDARD

XS

28x28

---

SM

32x32

---

MD

40x40

---

LG

48x48

---

XL

56x56

---

# XXXIII. ICON SURFACE STANDARD

Background

#F8FAFC

---

Radius

12px

---

Display

flex

align-items:center

justify-content:center

---

# XXXIV. ICON + TEXT RULE

Gap

8px

---

Vertical Align

Center

---

Không dùng:

margin-left ngẫu nhiên

---

# XXXV. HOVER RULE

Color Change

Allowed

---

Scale

Không dùng

---

Rotate

Không dùng

---

Bounce

Không dùng

---

# XXXVI. DARK MODE RULE

Hiện tại:

Không hỗ trợ

---

Light Theme Only

---

# XXXVII. ACCESSIBILITY

Icon Button

Bắt buộc có:

aria-label

---

Decorative Icon

aria-hidden=true

---

# XXXVIII. COMPONENT STANDARD

Bắt buộc sử dụng:

AppIcon.tsx

IconWrapper.tsx

ModuleIcon.tsx

StatusIcon.tsx

ActionIcon.tsx

---

# XXXIX. FILE STRUCTURE

/components/icon

AppIcon.tsx

IconWrapper.tsx

ModuleIcon.tsx

StatusIcon.tsx

ActionIcon.tsx

---

# XL. MASTER ICON REGISTRY

Mọi icon phải được khai báo tập trung.

---

Ví dụ:

ICONS = {

order: ShoppingCart,

customer: Users,

inventory: Boxes,

report: BarChart3,

setting: Settings

}

---

Không import icon trực tiếp trong từng màn hình.

---

# XLI. PERFORMANCE RULE

Import theo tên.

---

Không import toàn bộ thư viện.

---

Ví dụ:

import { ShoppingCart } from "lucide-react"

---

Không dùng:

import * as Icons

---

# XLII. BẮT BUỘC TUÂN THỦ

Không được:

* Dùng nhiều thư viện icon
* Random icon
* Random kích thước
* Random màu
* Random stroke

Toàn bộ hệ thống phải sử dụng:

Lucide React

và tuân thủ tuyệt đối tài liệu này.

Icon là ngôn ngữ thị giác thống nhất của toàn bộ POS Framework.
