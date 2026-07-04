# BẢN ĐỒ NGHIỆP VỤ: VietSale Pro ↔ ERPNext

> **Mục đích:** Tài liệu tra cứu. Mỗi nghiệp vụ của VietSale Pro được ánh xạ sang đúng module/doctype của ERPNext để **tham chiếu QUY TẮC nghiệp vụ** (không sao chép code).
>
> **Nguyên tắc pháp lý:** ERPNext dùng giấy phép **GPLv3**. Chúng ta CHỈ đọc để hiểu *quy tắc nghiệp vụ* rồi tự viết lại bằng stack của mình (TypeScript + Supabase/PostgreSQL). **KHÔNG copy code Python của ERPNext.**
>
> **Hai nguồn ERPNext:**
> - ERPNext Core: https://github.com/frappe/erpnext
> - Frappe Framework: https://github.com/frappe/frappe

---

## 0. Nguyên tắc lõi của ERPNext (đọc trước khi sửa bất kỳ nghiệp vụ kho nào)

ERPNext xử lý MỌI biến động tồn kho theo một nguyên tắc duy nhất — hiểu cái này thì hiểu toàn bộ:

1. **Stock Ledger Entry (Sổ cái kho):** Mọi thay đổi tồn kho (bán, nhập, trả, hủy, đổi, kiểm kê) đều ghi thành một *bút toán kho*. Không bao giờ sửa thẳng con số tồn kho.
2. **Đảo giao dịch = bút toán ngược:** Khi hủy/xóa một chứng từ, ERPNext KHÔNG xóa lịch sử — nó ghi một bút toán đảo chiều để hoàn lại đúng số lượng và đúng lô.
3. **Một nguồn sự thật (Single Source of Truth):** Số tồn kho luôn được suy ra từ sổ cái, không lưu trùng ở nhiều nơi.
4. **Giá vốn (Valuation):** Tính theo FIFO / Bình quân gia quyền (Moving Average) — mỗi lần nhập cập nhật lại giá vốn; mỗi lần xuất ghi nhận giá vốn tại thời điểm đó.

> **Đối chiếu với VietSale Pro:** App dùng `products.quantity` + bảng `product_lots` + JSONB `products.lots`. Đây là điểm khác biệt kiến trúc lớn nhất (xem mục #6 — vấn đề "hai nguồn sự thật").

---

## 1. BÁN HÀNG & POS

| VietSale Pro | File chính | RPC/Service | Module ERPNext tham chiếu |
|---|---|---|---|
| POS Desktop | `pages/POS.tsx`, `components/desktop-pos/*`, `hooks/usePOS.ts` | `checkout`, `searchProducts`, `getProductByBarcode` | **POS Invoice**, **Sales Invoice** |
| POS Mobile | `components/MobilePOS.tsx` | `checkout`, `searchCustomers` | **POS Invoice** |
| Tìm/thêm nhanh KH trong POS | `components/desktop-pos/modals/*` | `searchCustomers`, `getCustomerOrders` | **Customer** |

**Quy tắc ERPNext cần học:** khi tạo hóa đơn bán → trừ tồn kho (ghi Stock Ledger Entry âm), ghi nhận giá vốn (COGS), cập nhật công nợ khách nếu bán nợ, tích điểm loyalty. Tham chiếu: `erpnext/accounts/doctype/sales_invoice/`, `erpnext/accounts/doctype/pos_invoice/`.

---

## 2. QUẢN LÝ ĐƠN HÀNG

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Danh sách / chi tiết đơn | `pages/Orders.tsx` | `getOrdersPaginated`, `deleteOrder`, `payDebt` | **Sales Invoice (list/cancel)** |
| Đơn hàng Mobile | `components/MobileOrders.tsx` | `getOrdersPaginated` | **Sales Invoice** |
| Import/Export Excel | `utils/excel/orderImporter.ts`, `orderExporter.ts` | (client-side) | **Data Import Tool** |

**Quy tắc ERPNext cần học:** Hủy đơn (`cancel`) phải ghi bút toán đảo để hoàn tồn kho + công nợ; không xóa cứng. Tham chiếu logic `on_cancel` của Sales Invoice.

---

## 3. NHẬP HÀNG

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Phiếu nhập hàng | `pages/ImportGoods.tsx` | `createImportReceipt` → `process_import_v2`, `updateImportReceipt` → `update_import_v2`, `deleteImportReceipt` → `delete_import_v2` | **Purchase Receipt** |
| Tìm SP khi nhập | `components/import-goods/ImportProductSearch.tsx` | `searchProducts` | **Item** |

**Quy tắc ERPNext cần học:** Nhập hàng → cộng tồn (Stock Ledger Entry dương) + **cập nhật lại giá vốn** sản phẩm theo lô nhập + tăng công nợ NCC. Tham chiếu: `erpnext/stock/doctype/purchase_receipt/`.

> **Phase 6 Business Cleanup (2026-06-30):**
> - File migration canonical SSOT: `supabase_migration_import_goods_v2.sql` (v2.3). Các file migration nhập hàng/lô cũ đã được đánh dấu `.OLD` và không được chạy lại.
> - Giá vốn lô/sản phẩm tính theo **bình quân gia quyền (moving average)**; chiết khấu dòng (`discount`) được trừ vào giá vốn trước khi phân bổ phí ship: `unit_cost = MAX(0, cost - discount) * (1 + shipping_factor)`.
> - Sửa phiếu nhập đã hoàn thành (`completed`) được hỗ trợ bằng `update_import_v2`: đảo ngược kho/lô/giá vốn/công nợ của phiếu cũ, sau đó nhập lại với thông tin mới trong cùng transaction.
> - Đồng bộ `products.quantity = SUM(product_lots.quantity)` cho sản phẩm `has_lots = TRUE` được thực hiện **tường minh** trong các RPC (không còn dùng trigger `trg_product_lots_sync_qty`).

---

## 4. TỒN KHO & LÔ (BATCH/LOT)

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Quản lý sản phẩm / tồn kho | `pages/Inventory.tsx` | `filterProductsPaginated`, `getProductStats` | **Item**, **Bin** |
| Kiểm kê tồn kho | `pages/Inventory.tsx` (tab counts) | `createInventoryCount`, `updateInventoryCount` | **Stock Reconciliation** |
| Quản lý lô / HSD | tích hợp trong POS/Import/Return/Disposal | `getProductLots`, `replaceProductLots` | **Batch**, **Serial and Batch Bundle** |
| Tồn kho Mobile | `components/MobileInventory.tsx` | `filterProductsPaginated` | **Item** |

**Quy tắc ERPNext cần học:**
- **Stock Reconciliation:** kiểm kê tạo bút toán điều chỉnh chênh lệch (tăng/giảm), không ghi đè mù.
- **Batch:** giá vốn và tồn kho theo từng lô; xuất theo FIFO/HSD.
- Tham chiếu valuation: `erpnext/stock/valuation.py` (FIFOValuation, LIFOValuation), `erpnext/stock/doctype/stock_ledger_entry/`.

> ⚠️ **Vấn đề kiến trúc #6:** VietSale Pro lưu lô ở 2 nơi — JSONB `products.lots` (client đọc/ghi) và bảng `product_lots` (RPC đọc/ghi). Đây là khác biệt căn bản với mô hình "một nguồn sự thật" của ERPNext.
> - Phase 6 Business Cleanup (2026-06-30) đã **xóa trigger đồng bộ tự động** (`trg_product_lots_sync_qty`) và chuyển sang **đồng bộ tường minh** trong các RPC thay đổi `product_lots`: mỗi RPC gọi `sync_product_quantity_from_lots(product_id)` để giữ `products.quantity = SUM(product_lots.quantity)`.
> - Vẫn cần kiểm soát việc đọc/ghi JSONB `products.lots` ở client để tránh drift với bảng `product_lots`.

---

## 5. TRẢ HÀNG & ĐỔI HÀNG

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Trả hàng khách | `pages/ReturnOrders.tsx` | `createReturnOrder`, `cancelReturnOrder` | **Sales Invoice (`is_return=1`)**, **Sales Return** |
| Đổi hàng (atomic) | `pages/ReturnOrders.tsx` (tab exchange) | `create_exchange_transaction` | Return + Sales Invoice mới |
| Cấu hình phí/hạn trả | `pages/Settings.tsx` (tab returns) | (app_settings) | (tùy chỉnh VN) |

**Quy tắc ERPNext cần học:** Phiếu trả là một chứng từ số lượng âm tham chiếu chứng từ gốc; hoàn tồn kho phải vào **đúng lô** đã bán ra; hoàn giá vốn đúng giá đã xuất. Tham chiếu: trường `is_return`, `return_against` trong Sales Invoice / Delivery Note.

> ✅ **Trạng thái code:** Logic khớp lô + phục hồi lô bị xóa đã có trong `supabase_migration_v7_core_consolidation.sql`. **Cần xác nhận migration đã chạy trên DB.**

---

## 6. HỦY / XUẤT HỦY HÀNG

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Danh sách phiếu hủy | `pages/Disposals.tsx` | `filterDisposalsPaginated`, `deleteDisposal` | **Stock Entry (Material Issue)** |
| Tạo phiếu hủy | `pages/DisposalForm.tsx` | `createDisposal`, `updateDisposal` | **Stock Entry (Material Issue)** |

**Quy tắc ERPNext cần học:** Xuất hủy = Material Issue (xuất kho không doanh thu), ghi giá trị tổn thất theo giá vốn. **Hủy chứng từ → bút toán đảo hoàn lại tồn kho/lô.** Tham chiếu: `erpnext/stock/doctype/stock_entry/` (purpose = Material Issue), logic `on_cancel`.

> ✅ **Trạng thái code:** `delete_disposal_with_restore` đã hoàn kho/lô khi xóa phiếu COMPLETED. **Cần xác nhận migration đã chạy** (nếu chưa, code rơi vào nhánh fallback xóa KHÔNG hoàn kho).

---

## 7. KHÁCH HÀNG & CÔNG NỢ

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Quản lý khách hàng | `pages/Customers.tsx`, `components/MobileCustomers.tsx` | `getCustomersPaginated`, `getCustomerStats` | **Customer** |
| Thanh toán công nợ KH | `components/PayDebtModal.tsx` | `payDebt` | **Payment Entry** |
| Điều chỉnh điểm thủ công | `pages/Customers.tsx` | `adjustPoints` | **Loyalty Point Entry** |

**Quy tắc ERPNext cần học:** Công nợ là sổ cái (ledger) cộng dồn từ hóa đơn & thanh toán, không phải một con số sửa tay. Tham chiếu: `erpnext/accounts/doctype/payment_entry/`, **Accounts Receivable**.

---

## 8. NHÀ CUNG CẤP

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Quản lý NCC | `pages/Suppliers.tsx`, `components/MobileSuppliers.tsx` | `filterSuppliersPaginated`, `getSupplierStats` | **Supplier** |
| Thanh toán công nợ NCC | `pages/Suppliers.tsx` | `paySupplierDebt` | **Payment Entry** |

**Quy tắc ERPNext cần học:** tương tự công nợ KH nhưng phía mua. Tham chiếu: **Accounts Payable**.

---

## 9. DANH MỤC / THƯƠNG HIỆU

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Danh mục sản phẩm | `pages/CategoryManagement.tsx` | `getCategoryProductCounts`, `getUnsyncedCategories` | **Item Group** |
| Thương hiệu | `pages/BrandManagement.tsx` | `getBrandProductCounts`, `getUnsyncedBrands` | **Brand** |

---

## 10. BÁO CÁO

| VietSale Pro | File chính | RPC | Module ERPNext |
|---|---|---|---|
| Doanh số | `pages/Reports.tsx` | `get_sales_report` | **Sales Register** |
| Lợi nhuận | `pages/Reports.tsx` | `get_profit_report` | **Gross Profit Report** |
| Tồn kho | `pages/Reports.tsx` | `get_inventory_report` | **Stock Balance**, **Stock Ledger** |
| Khách hàng | `pages/Reports.tsx` | `get_customer_report` | **Customer Ledger Summary** |
| Dashboard | `pages/Dashboard.tsx`, `components/MobileHome.tsx` | `get_dashboard_summary` | **Dashboard** |

**Quy tắc ERPNext cần học:** Lợi nhuận = Doanh thu − Giá vốn (COGS lấy từ Stock Ledger tại thời điểm bán). Sai giá vốn → sai lợi nhuận. Đây là điểm cần đối chiếu kỹ.

---

## 11. KHUYẾN MÃI / TÍCH ĐIỂM

| VietSale Pro | File chính | RPC/Service | Module ERPNext |
|---|---|---|---|
| Cấu hình tích điểm | `pages/Settings.tsx` (tab points) | (app_settings) | **Loyalty Program** |
| Quà đổi điểm | `pages/Settings.tsx` (tab rewards) | `getRewards`, `addReward`, `redeemReward` | **Loyalty Program** |
| Khuyến mãi (X tặng Y, combo, %, ...) | `pages/Settings.tsx`, `utils/promotionUtils.ts` | `getPromotions`, `applyPromotions` | **Pricing Rule**, **Promotional Scheme** |
| Phân hạng khách | `pages/Settings.tsx` (tab ranking) | (app_settings) | **Customer Group** + Loyalty Tier |

**Quy tắc ERPNext cần học:** Pricing Rule có thứ tự ưu tiên, điều kiện áp dụng (số lượng tối thiểu, nhóm KH, khoảng thời gian), và quy tắc không cộng dồn (apply on / mixed conditions). Tham chiếu: `erpnext/accounts/doctype/pricing_rule/`.

---

## 12. CÀI ĐẶT / KHÁC

| VietSale Pro | File chính | Module ERPNext |
|---|---|---|
| Cấu hình in hóa đơn | `pages/Settings.tsx` (tab print) | **Print Format** |
| Thông tin cửa hàng | `pages/Settings.tsx` | **Company / POS Profile** |

---

## Ghi chú quan trọng khi tham chiếu ERPNext

1. **ERPNext rất tổng quát** (đa kho, đa tiền tệ, kế toán kép đầy đủ). VietSale Pro gọn nhẹ cho thị trường VN → chỉ lấy phần *quy tắc cốt lõi*, **không bê nguyên độ phức tạp**.
2. **Khác biệt kiến trúc lớn nhất:** ERPNext dùng Stock Ledger (một nguồn sự thật) ⇄ VietSale Pro lưu số tồn trực tiếp + lô ở 2 nơi. Khi tham chiếu, luôn hỏi: "ERPNext bảo đảm tính nhất quán bằng sổ cái — VietSale Pro bảo đảm bằng cách nào?"
3. **Cách dịch quy tắc (prompt mẫu cho chat sau):**
   > "Trong ERPNext, khi [nghiệp vụ X] xảy ra với hàng quản lý theo lô, hệ thống cập nhật tồn kho / giá vốn / công nợ như thế nào? Giải thích thành quy tắc nghiệp vụ tiếng Việt, kèm các trường hợp biên. KHÔNG đưa code Python."
