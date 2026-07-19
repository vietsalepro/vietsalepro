# MASTER_INVENTORY_LEDGER_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ cơ chế quản lý tồn kho, sổ cái tồn kho (Inventory Ledger), giao dịch kho (Inventory Transactions) và luồng cộng/trừ tồn trong hệ thống POS Enterprise.

Inventory Ledger là nguồn sự thật duy nhất (Single Source of Truth) cho tồn kho.

---

# I. TRIẾT LÝ THIẾT KẾ

Không lưu tồn kho bằng cách:

CurrentStock = CurrentStock + Quantity

---

Không cập nhật trực tiếp số lượng tồn.

---

Mọi thay đổi tồn kho phải tạo:

Inventory Transaction

↓

Inventory Ledger Entry

↓

Balance Calculation

---

# II. INVENTORY ARCHITECTURE

Document

↓

Inventory Transaction

↓

Inventory Ledger Entry

↓

Stock Balance

↓

Inventory Report

---

# III. SINGLE SOURCE OF TRUTH

Nguồn sự thật duy nhất:

Inventory Ledger

---

Không phải:

Product Table

Không phải:

Warehouse Table

---

# IV. INVENTORY ENTITIES

Product

Warehouse

InventoryTransaction

InventoryLedger

StockBalance

InventorySnapshot

---

# V. INVENTORY TRANSACTION TYPES

IMPORT

EXPORT

DAMAGE

ADJUSTMENT_INCREASE

ADJUSTMENT_DECREASE

STOCK_CHECK_GAIN

STOCK_CHECK_LOSS

TRANSFER_OUT

TRANSFER_IN

RETURN_IN

RETURN_OUT

OPENING_BALANCE

---

Không được tạo loại khác ngoài Registry.

---

# VI. TRANSACTION DIRECTION

IN

Tăng tồn

---

OUT

Giảm tồn

---

# VII. INVENTORY LEDGER STRUCTURE

LedgerId

TransactionId

DocumentId

ProductId

WarehouseId

TransactionType

Direction

Quantity

UnitCost

Amount

BalanceBefore

BalanceAfter

CreatedAt

CreatedBy

---

# VIII. IMMUTABLE RULE

Ledger Entry

Không được sửa.

---

Không được xóa.

---

Không được cập nhật.

---

Nếu sai:

Tạo giao dịch điều chỉnh mới.

---

# IX. INVENTORY TRANSACTION STRUCTURE

TransactionId

DocumentId

DocumentCode

TransactionType

WarehouseId

Status

CreatedAt

CreatedBy

---

# X. INVENTORY BALANCE FORMULA

BalanceAfter

=

BalanceBefore

*

IN

*

OUT

---

# XI. STOCK BALANCE TABLE

Purpose

Tăng tốc truy vấn.

---

Không phải nguồn dữ liệu gốc.

---

Fields

ProductId

WarehouseId

CurrentQuantity

LastLedgerId

UpdatedAt

---

# XII. STOCK BALANCE REBUILD

Có thể rebuild từ Ledger.

---

Ledger

↓

Replay

↓

Balance

---

# XIII. DOCUMENT IMPACT MATRIX

IMPORT_GOODS

*

Stock

---

EXPORT_DAMAGE

*

Stock

---

STOCK_CHECK

±

Stock

---

STOCK_ADJUSTMENT

±

Stock

---

TRANSFER_OUT

*

Kho nguồn

---

TRANSFER_IN

*

Kho đích

---

# XIV. IMPORT GOODS RULE

Completed

↓

Create Ledger

↓

Increase Stock

---

Approved chưa Completed

↓

Không cộng tồn

---

# XV. DAMAGE GOODS RULE

Completed

↓

Create Ledger

↓

Decrease Stock

---

# XVI. STOCK CHECK RULE

Kiểm kê không cộng/trừ tồn ngay.

---

Sau khi:

Approve

↓

Create Adjustment

↓

Ledger Entry

↓

Update Balance

---

# XVII. STOCK ADJUSTMENT RULE

Nếu thực tế lớn hơn hệ thống

↓

Adjustment Increase

---

Nếu thực tế nhỏ hơn hệ thống

↓

Adjustment Decrease

---

# XVIII. TRANSFER RULE

Transfer Out

↓

Kho nguồn -

---

Transfer In

↓

Kho đích +

---

Phải tạo 2 Ledger Entries.

---

# XIX. RETURN RULE

Trả hàng nhập

↓

OUT

---

Trả hàng bán

↓

IN

---

# XX. OPENING BALANCE RULE

Chỉ dùng:

Khởi tạo hệ thống

---

Type

OPENING_BALANCE

---

# XXI. NEGATIVE STOCK RULE

Default

Không cho phép âm kho

---

Current Stock < Requested Quantity

↓

Block Transaction

---

# XXII. OVERRIDE NEGATIVE STOCK

Permission Required

inventory.allow_negative_stock

---

# XXIII. RESERVATION STOCK

Available

=

Current

*

Reserved

---

# XXIV. RESERVED STOCK

Tạo đơn hàng

↓

Reserve

---

Hủy đơn

↓

Release

---

# XXV. INVENTORY SNAPSHOT

Purpose

Chụp tồn kho theo thời điểm.

---

Fields

SnapshotDate

ProductId

WarehouseId

Quantity

Value

---

# XXVI. SNAPSHOT SCHEDULE

Daily

23:59

---

# XXVII. INVENTORY VALUATION METHODS

FIFO

(Default)

---

LIFO

Không hỗ trợ V1

---

Average Cost

V2

---

# XXVIII. FIFO RULE

Nhập trước

↓

Xuất trước

---

# XXIX. COST LAYER STRUCTURE

LayerId

ProductId

WarehouseId

Quantity

RemainingQuantity

UnitCost

DocumentId

CreatedAt

---

# XXX. FIFO CONSUMPTION

Xuất hàng

↓

Consume Layer Cũ Nhất

↓

Tính Giá Vốn

---

# XXXI. COST OF GOODS SOLD

COGS

=

FIFO Layers Consumed

---

# XXXII. INVENTORY AUDIT

Mọi thay đổi tồn kho phải ghi log.

---

Fields

OldQty

NewQty

Difference

Reason

User

Timestamp

---

# XXXIII. INVENTORY TIMELINE

Import

↓

Transfer

↓

Adjustment

↓

Damage

↓

Check

↓

Return

---

# XXXIV. STOCK RECONCILIATION

System Stock

↓

Physical Stock

↓

Variance

---

# XXXV. VARIANCE RULE

Variance > 0

↓

Gain

---

Variance < 0

↓

Loss

---

# XXXVI. INVENTORY LOCK RULE

Completed Document

↓

Readonly

---

Ledger Created

↓

Readonly

---

# XXXVII. CANCEL DOCUMENT RULE

Nếu Ledger chưa tạo

↓

Cancel Allowed

---

Nếu Ledger đã tạo

↓

Create Reversal Transaction

---

Không xóa Ledger.

---

# XXXVIII. REVERSAL TRANSACTION

Import +100

↓

Reversal -100

---

Damage -20

↓

Reversal +20

---

# XXXIX. INVENTORY REPORTING

Current Stock

Stock Movement

Inventory Valuation

Inventory Aging

Inventory Variance

Stock Card

---

# XL. STOCK CARD REPORT

Ngày

↓

Chứng từ

↓

Nhập

↓

Xuất

↓

Tồn

---

Nguồn dữ liệu:

Inventory Ledger

---

# XLI. INVENTORY API STANDARD

POST /inventory/transactions

---

GET /inventory/ledger

---

GET /inventory/balance

---

GET /inventory/stock-card

---

GET /inventory/snapshot

---

# XLII. TYPESCRIPT ENUM

enum InventoryTransactionType {

IMPORT,

EXPORT,

DAMAGE,

ADJUSTMENT_INCREASE,

ADJUSTMENT_DECREASE,

TRANSFER_OUT,

TRANSFER_IN,

RETURN_IN,

RETURN_OUT,

OPENING_BALANCE

}

---

# XLIII. COMPONENT STANDARD

InventoryLedgerGrid.tsx

StockCardGrid.tsx

InventoryTimeline.tsx

InventoryBalanceCard.tsx

InventoryAdjustmentDialog.tsx

---

# XLIV. FILE STRUCTURE

/modules/inventory

ledger/

balance/

snapshot/

transactions/

reports/

---

# XLV. DATABASE TABLES

inventory_transactions

inventory_ledger

inventory_balances

inventory_snapshots

inventory_cost_layers

inventory_audit_logs

---

# XLVI. PERFORMANCE RULE

Không query tồn kho từ Ledger trực tiếp.

---

Ledger

↓

Update Balance

↓

Read Balance

---

# XLVII. DATA RECOVERY RULE

Nếu Balance lỗi

↓

Delete Balance

↓

Replay Ledger

↓

Rebuild Balance

---

# XLVIII. INTEGRATION MATRIX

Document Framework

↓

Inventory Transaction

↓

Ledger

↓

Balance

↓

Report

---

# XLIX. BẮT BUỘC TUÂN THỦ

Không được:

* Cộng tồn trực tiếp
* Trừ tồn trực tiếp
* Sửa Ledger
* Xóa Ledger
* Hardcode tồn kho

Mọi thay đổi tồn kho phải đi qua:

Document

↓

Inventory Transaction

↓

Inventory Ledger

↓

Stock Balance

---

Inventory Ledger là sổ cái tồn kho.

Stock Balance chỉ là số dư hiện tại.

Nếu có xung đột dữ liệu:

Inventory Ledger luôn đúng.

Inventory Ledger là Single Source of Truth của toàn bộ hệ thống kho.
