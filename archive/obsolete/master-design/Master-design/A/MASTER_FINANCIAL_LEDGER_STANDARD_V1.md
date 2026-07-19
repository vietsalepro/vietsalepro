# MASTER_FINANCIAL_LEDGER_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ hệ thống tài chính, sổ cái tài chính (Financial Ledger), giao dịch tài chính (Financial Transactions), công nợ, thu chi và dòng tiền trong POS Enterprise.

Financial Ledger là nguồn sự thật duy nhất (Single Source of Truth) của mọi số dư tài chính.

---

# I. TRIẾT LÝ THIẾT KẾ

Không cập nhật số dư trực tiếp.

---

Sai:

CashBalance += Amount

DebtBalance -= Amount

---

Đúng:

Document

↓

Financial Transaction

↓

Financial Ledger Entry

↓

Balance Calculation

---

# II. FINANCIAL ARCHITECTURE

Document

↓

Financial Transaction

↓

Financial Ledger

↓

Account Balance

↓

Financial Reports

---

# III. SINGLE SOURCE OF TRUTH

Nguồn dữ liệu đúng nhất:

Financial Ledger

---

Không phải:

Cash Balance Table

Không phải:

Debt Table

Không phải:

Dashboard

---

# IV. FINANCIAL ENTITIES

Account

Cash Fund

Debt Account

Financial Transaction

Financial Ledger

Financial Balance

Financial Snapshot

---

# V. ACCOUNT TYPES

CASH

BANK

AR

AP

REVENUE

EXPENSE

ADJUSTMENT

---

# VI. ACCOUNT DEFINITIONS

CASH

Tiền mặt

---

BANK

Tài khoản ngân hàng

---

AR

Accounts Receivable

Công nợ phải thu

---

AP

Accounts Payable

Công nợ phải trả

---

REVENUE

Doanh thu

---

EXPENSE

Chi phí

---

ADJUSTMENT

Điều chỉnh

---

# VII. FINANCIAL TRANSACTION TYPES

SALE

PURCHASE

RECEIPT

PAYMENT

DEBT_CREATE

DEBT_COLLECTION

DEBT_PAYMENT

EXPENSE

INCOME

ADJUSTMENT

REFUND

OPENING_BALANCE

---

# VIII. TRANSACTION DIRECTION

IN

Tăng số dư

---

OUT

Giảm số dư

---

# IX. LEDGER ENTRY STRUCTURE

LedgerId

TransactionId

DocumentId

AccountId

AccountType

TransactionType

Direction

Amount

BalanceBefore

BalanceAfter

ReferenceCode

CreatedAt

CreatedBy

---

# X. IMMUTABLE RULE

Ledger Entry

Không được sửa

Không được xóa

Không được cập nhật

---

Nếu sai:

Tạo Reversal Entry

---

# XI. FINANCIAL TRANSACTION STRUCTURE

TransactionId

DocumentId

TransactionType

Status

Amount

AccountId

CreatedAt

CreatedBy

---

# XII. BALANCE FORMULA

BalanceAfter

=

BalanceBefore

*

IN

*

OUT

---

# XIII. ACCOUNT BALANCE TABLE

Purpose

Tăng tốc truy vấn

---

Không phải nguồn dữ liệu gốc

---

Fields

AccountId

CurrentBalance

LastLedgerId

UpdatedAt

---

# XIV. REBUILD RULE

Ledger

↓

Replay

↓

Balance

---

Có thể rebuild bất kỳ lúc nào.

---

# XV. CASH FUND STANDARD

Quỹ tiền mặt

---

Ví dụ

Quỹ cửa hàng

Quỹ chi nhánh

Quỹ tổng

---

# XVI. BANK ACCOUNT STANDARD

Ngân hàng

---

Ví dụ

VCB

ACB

BIDV

Techcombank

---

# XVII. DEBT ACCOUNT STANDARD

Customer Debt

Supplier Debt

---

# XVIII. SALES IMPACT RULE

Bán hàng

↓

Revenue +

AR +

---

Thanh toán ngay

↓

Cash +

AR -

---

# XIX. PURCHASE IMPACT RULE

Nhập hàng

↓

Inventory +

AP +

---

Thanh toán NCC

↓

Cash -

AP -

---

# XX. RECEIPT RULE

Phiếu thu

↓

Cash +

---

Ledger IN

---

# XXI. PAYMENT RULE

Phiếu chi

↓

Cash -

---

Ledger OUT

---

# XXII. CUSTOMER DEBT RULE

Khách nợ

↓

AR +

---

Thu nợ

↓

AR -

---

# XXIII. SUPPLIER DEBT RULE

Nợ NCC

↓

AP +

---

Trả NCC

↓

AP -

---

# XXIV. REFUND RULE

Hoàn tiền khách

↓

Cash -

---

Refund NCC

↓

Cash +

---

# XXV. EXPENSE RULE

Chi phí

↓

Expense +

↓

Cash -

---

# XXVI. INCOME RULE

Thu nhập khác

↓

Income +

↓

Cash +

---

# XXVII. OPENING BALANCE RULE

Chỉ dùng khi:

Khởi tạo hệ thống

---

Type

OPENING_BALANCE

---

# XXVIII. FINANCIAL SNAPSHOT

Purpose

Lưu số dư theo ngày

---

Fields

SnapshotDate

AccountId

Balance

---

# XXIX. SNAPSHOT SCHEDULE

Daily

23:59

---

# XXX. FINANCIAL AUDIT

Mọi thay đổi tài chính phải ghi log.

---

Fields

OldBalance

NewBalance

Difference

Reason

User

Timestamp

---

# XXXI. DOCUMENT IMPACT MATRIX

Sales Order

↓

Revenue

↓

Cash / AR

---

Import Goods

↓

Inventory

↓

AP

---

Receipt Voucher

↓

Cash

---

Payment Voucher

↓

Cash

---

Debt Collection

↓

AR

↓

Cash

---

# XXXII. REVERSAL RULE

Sai giao dịch

↓

Không sửa Ledger

↓

Tạo Reversal

---

Ví dụ

Thu +1.000.000

↓

Reversal -1.000.000

---

# XXXIII. ACCOUNT LOCK RULE

Completed

↓

Readonly

---

Archived

↓

Readonly

---

# XXXIV. FINANCIAL TIMELINE

Create

↓

Approve

↓

Complete

↓

Settlement

↓

Archive

---

# XXXV. CASH FLOW REPORT

Thu

↓

Chi

↓

Dòng tiền thuần

---

Nguồn dữ liệu:

Financial Ledger

---

# XXXVI. REVENUE REPORT

Revenue

↓

Refund

↓

Net Revenue

---

# XXXVII. DEBT REPORT

Receivable

Payable

Overdue

Collected

Outstanding

---

# XXXVIII. ACCOUNT STATEMENT

Ngày

↓

Chứng từ

↓

Thu

↓

Chi

↓

Số dư

---

Nguồn dữ liệu:

Financial Ledger

---

# XXXIX. FINANCIAL DASHBOARD

Cash Balance

Bank Balance

AR Balance

AP Balance

Revenue

Expense

Profit

---

# XL. FINANCIAL API STANDARD

POST /financial/transactions

---

GET /financial/ledger

---

GET /financial/balance

---

GET /financial/statement

---

GET /financial/snapshot

---

# XLI. TYPESCRIPT ENUM

enum FinancialTransactionType {

SALE,

PURCHASE,

RECEIPT,

PAYMENT,

DEBT_CREATE,

DEBT_COLLECTION,

DEBT_PAYMENT,

EXPENSE,

INCOME,

ADJUSTMENT,

REFUND,

OPENING_BALANCE

}

---

# XLII. COMPONENT STANDARD

FinancialLedgerGrid.tsx

AccountStatementGrid.tsx

CashBalanceCard.tsx

DebtSummaryCard.tsx

FinancialTimeline.tsx

---

# XLIII. FILE STRUCTURE

/modules/finance

ledger/

accounts/

balances/

snapshots/

transactions/

reports/

---

# XLIV. DATABASE TABLES

financial_transactions

financial_ledger

financial_balances

financial_snapshots

financial_accounts

financial_audit_logs

---

# XLV. PERFORMANCE RULE

Không đọc số dư từ Ledger trực tiếp.

---

Ledger

↓

Update Balance

↓

Read Balance

---

# XLVI. DATA RECOVERY RULE

Nếu Balance lỗi

↓

Delete Balance

↓

Replay Ledger

↓

Rebuild Balance

---

# XLVII. INTEGRATION MATRIX

Document

↓

Workflow

↓

Financial Transaction

↓

Financial Ledger

↓

Balance

↓

Report

---

# XLVIII. DOUBLE ENTRY READY

Kiến trúc phải hỗ trợ nâng cấp:

Single Entry (V1)

↓

Double Entry Accounting (V2)

---

Không thiết kế khóa cứng.

---

# XLIX. PROFIT FORMULA

Revenue

*

COGS

*

Expense

=

Profit

---

COGS lấy từ:

Inventory Ledger

---

# L. BẮT BUỘC TUÂN THỦ

Không được:

* Cộng tiền trực tiếp
* Trừ tiền trực tiếp
* Sửa Ledger
* Xóa Ledger
* Hardcode số dư
* Tính công nợ từ Dashboard

Mọi thay đổi tài chính phải đi qua:

Document

↓

Financial Transaction

↓

Financial Ledger

↓

Account Balance

---

Financial Ledger là sổ cái tài chính.

Account Balance chỉ là số dư hiện tại.

Nếu có xung đột dữ liệu:

Financial Ledger luôn đúng.

Financial Ledger là Single Source of Truth của toàn bộ hệ thống tài chính POS Enterprise.
