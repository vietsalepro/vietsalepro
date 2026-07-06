# Handoff: Admin Dashboard Planning Session

> Tạo bởi: Devin
> Ngày: 2026-07-06
> Chủ đề: Lập kế hoạch production-ready cho admin dashboard (`admin.vietsalepro.com`)
> File kế hoạch: `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD.md`

---

## ✅ Đã hoàn thành trong chat này

1. **Review** admin dashboard hiện tại (`pages/SystemAdminDashboard.tsx`).
2. **Mở rộng kế hoạch** từ MVP 6 phase thành **production-ready 14 phase** cho 20 năm vận hành.
3. **Chốt các quyết định kinh doanh** quan trọng cho admin dashboard.
4. **Cập nhật file kế hoạch** `KE_HOACH_ADMIN_DASHBOARD.md` với đầy đủ các mục:
   - Phần 1: MVP 6 phase foundation
   - Phần 2: Production-ready 14 phase
   - Các quyết định kinh doanh đã chốt
   - Các câu hỏi còn mở
   - Tóm tắt cuối cùng

**Không có code nào được implement trong chat này.**

---

## 📋 Quyết định kinh doanh đã chốt

### Thanh toán

- **Phương thức:** Chuyển khoản ngân hàng thủ công.
- **Không tích hợp:** Stripe / VNPay / Momo tự động trong giai đoạn đầu.
- **Giá VIP:**
  - Theo tháng: **69.000 ₫/tháng**.
  - Theo năm: **59.000 ₫/tháng** (tổng **708.000 ₫/năm**).
- **Gói Free:** Giữ nguyên giới hạn hiện tại (1 user, 50 SKU, 300 đơn/tháng).
- **Không có gói trung gian:** Chỉ Free và VIP.
- **Thông tin ngân hàng:** Admin tùy chỉnh trong dashboard (tên TK, số TK, ngân hàng, nội dung CK).
- **Số hóa đơn:** Tự động theo quy tắc (ví dụ: `INV-2026-0001`).
- **Xuất PDF:** Có.
- **Thời hạn hóa đơn:** **24 giờ**. Nếu chưa thanh toán trong 24 giờ, hóa đơn tự động hủy.
- **Workflow:** tạo hóa đơn → tenant chuyển khoản → admin xác nhận thủ công trong dashboard.

### Khuyến mãi

- **Voucher/promo code:** Admin tạo mã giảm giá.
- **Loại voucher:** Phần trăm giảm, giảm số tiền cố định, tặng thêm tháng.
- **Voucher có giới hạn:** Có thể giới hạn số lần sử dụng, giới hạn theo tenant, ngày hiệu lực.
- **Mỗi hóa đơn chỉ 1 voucher.** Không kết hợp nhiều voucher.
- **Có thể kết hợp voucher + chương trình khuyến mãi:** Ví dụ voucher 10% + mua năm tặng 1 tháng.
- **Mua 1 năm tặng x tháng:** Admin tự nhập `x`.

### Hỗ trợ khách hàng

- **Kênh chính:** Zalo cá nhân.
- **Không dùng Zalo OA.**
- **Kênh phụ:** Ticket system trong dashboard.
- Ticket tạo thủ công bởi admin từ thông tin Zalo.
- Thông báo cập nhật ticket qua email.

### Bảo mật

- **2FA cho admin.vietsalepro.com:** Tùy chọn (optional), không bắt buộc.
- **Phương thức 2FA:** Google Authenticator (TOTP).
- Có backup codes.
- Có cơ chế khôi phục khi mất điện thoại / backup codes.

---

## 🎯 Milestone 1 đề xuất (launch production)

| Phase | Nội dung |
|---|---|
| P1 | Tenant list & core management |
| P2 | Subscription & usage |
| P3 | Member management |
| P4 | System analytics |
| P5 | Audit & security |
| P6 | Operations & support cơ bản |
| P7 | Invoicing, manual payment confirmation, pricing & bank config |
| P10 (partial) | Voucher/promotion management |
| P11 | Support tickets (basic) |
| P17 | Optional Google Authenticator 2FA + login history |

---

## ❓ Câu hỏi còn mở — ĐÃ TRẢ LỜI

> Cập nhật: 2026-07-06 (trong phiên này)

### Cấp độ cao

- [x] **Sau khi hóa đơn hết hạn 24 giờ, tenant bị xử lý như thế nào?** → **Chuyển read-only.** Tenant vẫn xem được dữ liệu cũ nhưng không tạo đơn hàng / nhập hàng mới.
- [x] **Tên công ty / thương hiệu hiển thị trên hóa đơn là gì?** → **Tên do admin tự nhập** trong dashboard.
- [x] **Có cho phép tenant thanh toán trước nhiều tháng không?** → **Cho phép trả trước tự do.** Tenant có thể chọn số tháng (3, 6, 12, ...) khi thanh toán.
- [x] **Có cần tạo hóa đơn thủ công (không theo chu kỳ) không?** → **Có, admin tạo tay.** Admin có thể tạo hóa đơn đặc biệt cho tenant bất kỳ lúc nào.

### Chi tiết voucher

- [x] Voucher có thể dùng bao nhiêu lần? → **Giới hạn theo tenant + tổng số lần.** Mỗi tenant chỉ dùng tối đa X lần, và có tổng giới hạn toàn hệ thống.
- [x] Voucher có giới hạn theo tenant không? → **Kết hợp nhiều điều kiện:** tenant mới, gói cụ thể, từng tenant cụ thể.
- [x] Có cần hiển thị voucher hết hạn / sắp hết hạn trong dashboard? → **Có, cảnh báo trong dashboard.** Hiển thị badge/danh sách voucher sắp hết hạn (7 ngày) và đã hết hạn.

### Ticket system

- [x] Có cần gán ticket cho nhân viên cụ thể không? → **Có, gán cho admin cụ thể phụ trách.**
- [x] Có cần phân loại ticket (bug, billing, support, feature request) không? → **Có, phân loại đầy đủ.**
- [x] Có cần template reply cho ticket không? → **Có, template reply sẵn.**

### 2FA

- [x] Có cần bắt buộc backup codes trước khi bật 2FA không? → **Có, bắt buộc.** Hiển thị backup codes một lần, yêu cầu xác nhận đã lưu mới bật 2FA.
- [x] Workflow khôi phục khi admin mất điện thoại: chỉ backup codes, hay cần manual override bởi admin khác? → **Manual override bởi admin khác.** Cần ít nhất 2 system admin, admin còn lại có thể tắt 2FA cho đồng nghiệp.

### Cài đặt hệ thống

- [x] Có cần mẫu email mặc định (logo, màu sắc) không? → **Có, mặc định + tùy chỉnh.** Có giao diện cấu hình mẫu email, logo, màu chủ đạo, chữ ký.
- [x] Có cần đa ngôn ngữ cho dashboard không? → **Tiếng Việt duy nhất.** Giữ nguyên tiếng Việt, không làm i18n.

---

## 🚀 Next steps (cho chat tiếp theo)

1. Trả lời các câu hỏi còn mở ở trên (nếu cần).
2. Chọn phase để bắt đầu implement. **Khuyến nghị:** bắt đầu từ **P7 (Invoicing & Payment Records)** vì đây là cốt lõi để thu phí.
3. Implement theo từng phase nhỏ, mỗi phase có verification riêng.

---

## 📁 Files liên quan

- `memory-zone/KE_HOACH/Admin_dashboard/KE_HOACH_ADMIN_DASHBOARD.md` — kế hoạch đầy đủ
- `pages/SystemAdminDashboard.tsx` — dashboard hiện tại (chưa sửa)
- `services/tenantService.ts` — service tenant hiện tại
- `services/subscriptionService.ts` — service subscription hiện tại
- `services/auditService.ts` — service audit log hiện tại

---

## ⚠️ Lưu ý

- Đây là **kế hoạch tĩnh**, chưa có code mới nào được thêm vào.
- Khi bắt đầu implement, cần chạy `npm run lint` và `npm run build` sau mỗi phase.
- Nên backup project trước khi bắt đầu implement.
