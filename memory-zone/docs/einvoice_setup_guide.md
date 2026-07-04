# 📘 Hướng Dẫn Đăng Ký & Cấu Hình Tài Khoản Hóa Đơn Điện Tử (HĐĐT)

> **Phiên bản:** 1.0  
> **Ngày:** 19/06/2026  
> **Mục tiêu:** Hướng dẫn chi tiết từng bước đăng ký tài khoản với nhà cung cấp dịch vụ HĐĐT, cài đặt chứng thư số và cấu hình trong phần mềm ViệtSale Pro.

---

## 📋 Mục Lục

1. [Tổng quan về Hóa đơn điện tử](#1-tổng-quan-về-hóa-đơn-điện-tử)
2. [Chọn nhà cung cấp dịch vụ HĐĐT](#2-chọn-nhà-cung-cấp-dịch-vụ-hđđt)
3. [Đăng ký tài khoản](#3-đăng-ký-tài-khoản)
   - [3.1. Sapo Invoice](#31-sapo-invoice)
   - [3.2. Viettel S-Invoice](#32-viettel-s-invoice)
   - [3.3. VNPT E-Invoice](#33-vnpt-e-invoice)
   - [3.4. M-Invoice](#34-m-invoice)
4. [Mua & Cài đặt Chứng thư số (Chữ ký số)](#4-mua--cài-đặt-chứng-thư-số-chữ-ký-số)
5. [Lấy API Key & Cấu hình trong ViệtSale Pro](#5-lấy-api-key--cấu-hình-trong-việtsale-pro)
6. [Kiểm tra kết nối & Gửi hóa đơn thử nghiệm](#6-kiểm-tra-kết-nối--gửi-hóa-đơn-thử-nghiệm)
7. [FAQ - Các câu hỏi thường gặp](#7-faq---các-câu-hỏi-thường-gặp)

---

## 1. Tổng quan về Hóa đơn điện tử

Hóa đơn điện tử (HĐĐT) là tập hợp các thông điệp dữ liệu được tạo ra dưới dạng điện tử để ghi nhận việc mua bán hàng hóa, cung ứng dịch vụ theo quy định của pháp luật.

**Lợi ích:**
- ✅ Tiết kiệm chi phí in ấn, lưu trữ
- ✅ Tự động hóa quy trình phát hành hóa đơn
- ✅ Đồng bộ dữ liệu với cơ quan thuế qua T-VAN
- ✅ Giảm sai sót so với nhập liệu thủ công
- ✅ Tra cứu nhanh chóng, dễ dàng

**Quy trình tổng quan:**
```
Đăng ký NCC HĐĐT → Mua chứng thư số → Lấy API Key → Cấu hình trong ViệtSale Pro → Gửi HĐ test → Sử dụng thực tế
```

---

## 2. Chọn nhà cung cấp dịch vụ HĐĐT

ViệtSale Pro hỗ trợ **4 nhà cung cấp dịch vụ HĐĐT** đã được Tổng cục Thuế cấp phép:

| Nhà cung cấp | Website | Chi phí tham khảo | Ưu điểm | Phù hợp với |
|:-------------|:--------|:-----------------:|:--------|:-----------|
| **Sapo Invoice** | [invoice.sapo.vn](https://invoice.sapo.vn/) | 500-1.500đ/HĐ | Dễ sử dụng, tích hợp sẵn Sapo POS | Cửa hàng bán lẻ, SMEs |
| **Viettel S-Invoice** | [smebilling.viettel.vn](https://smebilling.viettel.vn/) | 200-1.000đ/HĐ | Giá rẻ, uy tín, phủ sóng toàn quốc | Doanh nghiệp vừa và nhỏ |
| **VNPT E-Invoice** | [einvoice.vnpt.com.vn](https://einvoice.vnpt.com.vn/) | 300-1.200đ/HĐ | Tích hợp với hệ sinh thái VNPT | Doanh nghiệp truyền thống |
| **M-Invoice** | [minvoice.com.vn](https://minvoice.com.vn/) | 200-800đ/HĐ | Giá cạnh tranh, hỗ trợ tốt | Startup, SMEs |

> 💡 **Gợi ý:** Nếu bạn mới bắt đầu, hãy chọn **Sapo Invoice** vì dễ đăng ký và sử dụng nhất. Nếu cần tiết kiệm chi phí lâu dài, **Viettel S-Invoice** hoặc **M-Invoice** là lựa chọn tốt.

---

## 3. Đăng ký tài khoản

### 3.1. Sapo Invoice

**Bước 1:** Truy cập [https://invoice.sapo.vn/](https://invoice.sapo.vn/)

**Bước 2:** Click **"Đăng ký dùng thử"** hoặc **"Trải nghiệm miễn phí"**

**Bước 3:** Điền thông tin đăng ký:
- 📧 Email: `email_công_ty@example.com`
- 📱 Số điện thoại: `098xxxxxxx`
- 🏢 Tên doanh nghiệp: *(Tên đăng ký kinh doanh)*
- 🆔 Mã số thuế: `0123456789`
- 🔑 Mật khẩu

**Bước 4:** Xác thực email/số điện thoại

**Bước 5:** Đăng nhập và cấu hình thông tin doanh nghiệp:
- Cập nhật đầy đủ: Tên công ty, MST, địa chỉ, số điện thoại, email
- Thêm tài khoản ngân hàng (nếu có)
- Tải lên logo công ty

**Bước 6:** Liên hệ bộ phận kinh doanh Sapo để kích hoạt gói dịch vụ và nhận API Key

> ⏱ **Thời gian xử lý:** 1-2 ngày làm việc

---

### 3.2. Viettel S-Invoice

**Bước 1:** Truy cập [https://smebilling.viettel.vn/](https://smebilling.viettel.vn/)

**Bước 2:** Click **"Đăng ký ngay"**

**Bước 3:** Điền thông tin:
- 🏢 Tên doanh nghiệp
- 🆔 Mã số thuế
- 📱 Số điện thoại liên hệ
- 📧 Email

**Bước 4:** Đội ngũ Viettel sẽ liên hệ lại để:
- Xác thực thông tin doanh nghiệp
- Hướng dẫn ký hợp đồng
- Cấp tài khoản đăng nhập

**Bước 5:** Sau khi kích hoạt, đăng nhập vào hệ thống Viettel S-Invoice

**Bước 6:** Cấu hình thông tin doanh nghiệp và lấy API credentials:
- Vào menu **"Cấu hình" → "Tích hợp API"**
- Tạo **App ID** và **Secret Key**
- Lưu lại các thông tin: `app_id`, `secret_key`, `api_url`

> ⏱ **Thời gian xử lý:** 2-3 ngày làm việc

---

### 3.3. VNPT E-Invoice

**Bước 1:** Truy cập [https://einvoice.vnpt.com.vn/](https://einvoice.vnpt.com.vn/)

**Bước 2:** Click **"Đăng ký"** hoặc gọi hotline **1800 1260**

**Bước 3:** Điền thông tin đăng ký online hoặc liên hệ trực tiếp:
- 🏢 Tên doanh nghiệp
- 🆔 Mã số thuế
- 📧 Email liên hệ
- 📱 Số điện thoại

**Bước 4:** Ký hợp đồng dịch vụ với VNPT

**Bước 5:** Nhận tài khoản đăng nhập qua email

**Bước 6:** Cấu hình thông tin doanh nghiệp trên hệ thống VNPT

**Bước 7:** Lấy API credentials:
- Vào **"Cấu hình" → "API Integration"**
- Lấy **Username/Password** hoặc **API Token**
- Ghi lại URL endpoint: `https://api.einvoice.vnpt.com.vn/`

> ⏱ **Thời gian xử lý:** 2-4 ngày làm việc

---

### 3.4. M-Invoice

**Bước 1:** Truy cập [https://minvoice.com.vn/](https://minvoice.com.vn/)

**Bước 2:** Click **"Đăng ký dùng thử"** hoặc gọi **1900 638 389**

**Bước 3:** Điền form đăng ký:
- 🏢 Tên doanh nghiệp
- 🆔 Mã số thuế
- 📧 Email
- 📱 Số điện thoại

**Bước 4:** Nhân viên M-Invoice sẽ liên hệ xác thực và hướng dẫn

**Bước 5:** Nhận tài khoản và API credentials:
- **Client ID** / **Client Secret** (cho OAuth2)
- **API Endpoint** (URL test và production)

> ⏱ **Thời gian xử lý:** 1-2 ngày làm việc

---

## 4. Mua & Cài đặt Chứng thư số (Chữ ký số)

Chứng thư số (Digital Certificate) là yêu cầu bắt buộc để ký số lên hóa đơn điện tử trước khi gửi lên Cơ quan Thuế.

### 4.1. Chọn nhà cung cấp chứng thư số

Các nhà cung cấp được Tổng cục Thuế chấp nhận:

| Nhà cung cấp | Website | Loại |
|:-------------|:--------|:-----|
| **Viettel CA** | [ca.viettel.vn](https://ca.viettel.vn/) | USB Token / HSM |
| **VNPT CA** | [ca.vnpt.vn](https://ca.vnpt.vn/) | USB Token / HSM |
| **BKAV CA** | [ca.bkav.com.vn](https://ca.bkav.com.vn/) | USB Token |
| **FPT CA** | [ca.fpt.vn](https://ca.fpt.vn/) | USB Token / HSM |
| **MobiFone CA** | [ca.mobifone.vn](https://ca.mobifone.vn/) | USB Token |

### 4.2. Hướng dẫn mua

1. **Liên hệ nhà cung cấp** chứng thư số để đăng ký
2. **Chuẩn bị hồ sơ:**
   - Giấy phép đăng ký kinh doanh (bản sao)
   - CMND/CCCD của người đại diện
   - Mẫu đăng ký chứng thư số
3. **Chọn loại:**
   - **USB Token:** Phù hợp cho SMEs, giá 500.000-2.000.000đ, hạn 1-3 năm
   - **HSM (Hardware Security Module):** Phù hợp cho doanh nghiệp lớn, ký số tự động
4. **Thanh toán và nhận thiết bị**

### 4.3. Cài đặt USB Token

**Bước 1:** Cắm USB Token vào máy tính

**Bước 2:** Cài đặt driver:
- Truy cập website nhà cung cấp
- Tải và cài đặt **USB Token Driver** (VD: ViettelCA Driver, VNPTCA Driver, ...)
- Khởi động lại máy tính

**Bước 3:** Cài đặt chứng thư số:
- Mở trình duyệt, truy cập trang quản lý token
- Đăng nhập với **PIN mặc định** (thường là `12345678` hoặc do NCC cung cấp)
- Đổi PIN mặc định thành PIN mới (bắt buộc vì lý do bảo mật)
- Kiểm tra chứng thư số đã được cài đặt thành công

**Bước 4:** Kiểm tra chứng thư số:
- Mở **Internet Explorer** (hoặc **Settings → Certificates**)
- Vào tab **"Personal"** hoặc **"Personal Certificates"**
- Kiểm tra chứng thư số đã xuất hiện

### 4.4. Cấu hình USB Token trong ViệtSale Pro

Trong phần cấu hình HĐĐT của ViệtSale Pro, bạn cần nhập:

| Thông tin | Mô tả |
|:----------|:------|
| **Loại chữ ký số** | USB Token / PFX File / Provider tự ký |
| **PIN/Password** | PIN của USB Token (bảo mật) |
| **Số seri cert** | Serial number của chứng thư số (tự động lấy) |
| **PFX File** (nếu dùng file) | Đường dẫn file .pfx/.p12 |
| **PFX Password** | Mật khẩu file PFX |

> ⚠️ **Lưu ý quan trọng:**
> - Giữ PIN/USB Token cẩn thận, không để người khác sử dụng
> - Sao lưu chứng thư số (export .pfx) sau khi cài đặt
> - Chứng thư số có thời hạn, cần gia hạn trước khi hết hạn 30 ngày
> - PIN sai quá 5 lần sẽ bị khóa USB Token

---

## 5. Lấy API Key & Cấu hình trong ViệtSale Pro

### 5.1. Các thông tin cần chuẩn bị

Sau khi đăng ký tài khoản với nhà cung cấp HĐĐT, bạn cần thu thập các thông tin sau:

| Thông tin | Mô tả | Bắt buộc |
|:----------|:------|:--------:|
| **Provider** | Nhà cung cấp HĐĐT bạn chọn | ✅ |
| **API URL** | Endpoint gốc của dịch vụ | ✅ |
| **API Key** / **App ID** | Khóa xác thực API | ✅ |
| **Secret Key** | Khóa bí mật (nếu có) | ✅ |
| **Username** | Tên đăng nhập (nếu có) | ⬜ |
| **Password** | Mật khẩu (nếu có) | ⬜ |
| **Mã số thuế** | MST doanh nghiệp | ✅ |
| **Mẫu số hóa đơn** | VD: `01GTKT0/001` | ✅ |
| **Ký hiệu hóa đơn** | VD: `AA/22E` | ✅ |

### 5.2. Cấu hình trong ViệtSale Pro

**Bước 1:** Đăng nhập vào ViệtSale Pro

**Bước 2:** Vào menu **"Kê khai thuế"** → **"Kết nối HĐĐT"**

**Bước 3:** Điền thông tin cấu hình:
- **Nhà cung cấp:** Chọn provider (Sapo Invoice / Viettel / VNPT / M-Invoice)
- **API URL:** Nhập URL từ provider
- **API Key / App ID:** Nhập khóa API
- **Secret Key:** Nhập secret key
- **Chữ ký số:** Cấu hình USB Token hoặc PFX

**Bước 4:** Click **"Test Connection"** để kiểm tra kết nối tới provider

**Bước 5:** Nếu kết nối thành công, click **"Lưu cấu hình"**

### 5.3. Cấu hình thông tin doanh nghiệp

Trên hệ thống của nhà cung cấp HĐĐT, cần khai báo đầy đủ:

- ✅ **Tên doanh nghiệp** (đúng với giấy phép kinh doanh)
- ✅ **Mã số thuế** (10 hoặc 13 số)
- ✅ **Địa chỉ trụ sở chính**
- ✅ **Số điện thoại liên hệ**
- ✅ **Email** (nhận thông báo)
- ⬜ **Tài khoản ngân hàng** (số tài khoản, tên ngân hàng)
- ⬜ **Logo doanh nghiệp**

---

## 6. Kiểm tra kết nối & Gửi hóa đơn thử nghiệm

Sau khi cấu hình xong, thực hiện kiểm tra:

### 6.1. Kiểm tra kết nối
1. Mở **"Kết nối HĐĐT"** trong ViệtSale Pro
2. Click **"Test Connection"**
3. ✅ **Kết quả:** "Kết nối thành công" → Sẵn sàng sử dụng
4. ❌ **Kết quả:** "Kết nối thất bại" → Kiểm tra lại thông tin cấu hình

### 6.2. Nộp tờ khai đăng ký HĐĐT (Mẫu 01/ĐKTĐ-HĐĐT)
1. Trong giao diện "Kết nối HĐĐT", tab **"Đăng ký HĐĐT"**
2. Kiểm tra thông tin tờ khai
3. Click **"Gửi tờ khai"**
4. Chờ CQT phê duyệt (thường 1-3 ngày làm việc)

### 6.3. Phát hành hóa đơn thử nghiệm
1. Vào trang **"Tính thuế"**
2. Chọn 1 đơn hàng bất kỳ
3. Click **"Xuất HĐĐT"**
4. Kiểm tra trạng thái:
   - ✅ **Thành công:** Hóa đơn đã có mã CQT
   - ⏳ **Chờ xử lý:** Đang chờ CQT trả mã
   - ❌ **Lỗi:** Xem chi tiết lỗi và khắc phục

---

## 7. FAQ - Các câu hỏi thường gặp

### ❓ Tôi cần những gì để bắt đầu sử dụng HĐĐT?
Bạn cần: (1) Tài khoản nhà cung cấp HĐĐT, (2) Chứng thư số (USB Token), (3) Thông tin doanh nghiệp đã cập nhật đầy đủ.

### ❓ Phát hành hóa đơn điện tử có mất phí không?
Có. Mỗi hóa đơn phát hành sẽ mất phí dịch vụ (200-1.500đ/HĐ tùy nhà cung cấp) và phí chứng thư số (500.000-2.000.000đ/năm).

### ❓ Thời gian để CQT trả mã hóa đơn là bao lâu?
Thông thường từ **vài giây đến vài phút**. Trong giờ cao điểm có thể lâu hơn.

### ❓ Làm gì khi hóa đơn bị CQT từ chối?
Xem lý do từ chối trong chi tiết hóa đơn, sửa lỗi và gửi lại. Các lỗi thường gặp: sai MST, sai thông tin người mua, sai định dạng.

### ❓ Tôi muốn hủy hóa đơn đã phát hành thì làm thế nào?
Vào danh sách HĐĐT, chọn hóa đơn cần hủy, click **"Hủy hóa đơn"**. Hủy phải được thực hiện trong vòng 10 ngày kể từ ngày phát hành.

### ❓ Chứng thư số hết hạn có tiếp tục phát hành được không?
Không. Bạn cần gia hạn chứng thư số trước khi hết hạn. Hệ thống sẽ cảnh báo trước 30 ngày.

### ❓ Tôi có thể đăng ký nhiều nhà cung cấp cùng lúc không?
Có. ViệtSale Pro hỗ trợ cấu hình nhiều provider, nhưng chỉ sử dụng 1 provider chính tại một thời điểm.

### ❓ Dùng thử có mất phí không?
Hầu hết các nhà cung cấp đều có gói **dùng thử miễn phí** (giới hạn số lượng hóa đơn).

---

## 📞 Hỗ trợ

Nếu gặp khó khăn trong quá trình đăng ký hoặc cấu hình, vui lòng liên hệ:

- **Hotline ViệtSale Pro:** [Số hotline]
- **Email:** [Email hỗ trợ]
- **Zalo OA:** [Zalo]

---

> ⚠️ **Lưu ý cuối:** Việc sử dụng hóa đơn điện tử phải tuân thủ theo quy định tại **Thông tư 78/2021/TT-BTC** và các văn bản pháp luật liên quan. Vui lòng tham khảo ý kiến của kế toán viên hoặc chuyên gia thuế nếu cần.