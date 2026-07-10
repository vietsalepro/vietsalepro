# Hướng dẫn tạo Shop (Tenant) mới — VietSales Pro v7

## Tổng quan kiến trúc Multi-Tenant

```
Frontend (React SPA)         DNS                     Backend (Supabase)
─────────────────          ──────────               ──────────────────────
shop-1.vietsalepro.com  →  CNAME → Vercel     →    tenants table
shop-2.vietsalepro.com  →  CNAME → Vercel     →    tenant_memberships
shop-3.vietsalepro.com  →  CNAME → Vercel     →    tenant_subscriptions
admin.vietsalepro.com   →  CNAME → Vercel     →    system_admins
```

**Cách hoạt động:**
- Mỗi khách hàng (shop) có **1 subdomain riêng**: `{tên}.vietsalepro.com`
- Tất cả subdomain đều trỏ đến **cùng 1 deploy Vercel** (SPA)
- App phía client (JS) đọc `window.location.host` → tách subdomain → gọi Supabase RPC `get_tenant_by_subdomain` → lấy được tenant_id
- Dữ liệu mỗi tenant được phân cách bằng `tenant_id` trong DB + RLS (Row Level Security)

---

## Có 2 cách tạo Shop mới

### Cách 1: Qua System Admin Dashboard (Khuyến nghị)

**Bước 1: Đăng nhập System Admin**
- Truy cập: `https://admin.vietsalepro.com`
- Đăng nhập bằng tài khoản System Admin (có trong bảng `system_admins`)

**Bước 2: Vào tab "Cửa hàng"**
- Sidebar → chọn **"Cửa hàng"** (hoặc tab Tenants)
- Nhấn nút **"Thêm cửa hàng"**

**Bước 3: Điền thông tin**
```
Tên cửa hàng:  Ví dụ: "Cửa hàng Sữa Mẹ và Bé - Sữa Cậu Ba"
Subdomain:     shop-1        ← sẽ thành shop-1.vietsalepro.com
Gói dịch vụ:   Free  hoặc  VIP
```
- Subdomain chỉ được chứa: chữ thường (a-z), số (0-9), dấu gạch ngang (-)
- Không được bắt đầu/kết thúc bằng gạch ngang
- Độ dài: 3-63 ký tự
- Subdomain `admin`, `www`, `api`, `app` là reserved

**Bước 4: Xác nhận tạo**
- Hệ thống sẽ gọi RPC `create_tenant_with_admin()` trên database
- Tạo đồng thời:
  1. Dòng mới trong bảng **`tenants`** (thông tin cửa hàng)
  2. Dòng mới trong bảng **`tenant_subscriptions`** (hạn mức gói dịch vụ)
  3. Dòng mới trong bảng **`tenant_memberships`** (gán user System Admin làm chủ shop)
- Thành công → Shop xuất hiện trong danh sách

**Lưu ý:** Cách này dùng khi **admin user đã tồn tại trong `auth.users`** (System Admin đang đăng nhập sẽ làm chủ shop luôn).

---

### Cách 2: Qua Edge Function HTTP API (Tạo cho KHÁCH HÀNG mới)

Cách này dùng khi bạn muốn tạo shop cho một **khách hàng hoàn toàn mới** (chưa có tài khoản), kèm luôn tài khoản đăng nhập cho họ.

**Gửi request:**

```bash
curl -X POST https://rsialbfjswnrkzcxarnj.supabase.co/functions/v1/create-tenant \
  -H "Authorization: Bearer <JWT_CUA_SYSTEM_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cửa hàng của Nguyễn Văn A",
    "subdomain": "shop-1",
    "email": "khachhang@email.com",
    "plan": "free"
  }'
```

**Kết quả trả về (201 Created):**
```json
{
  "tenant": {
    "id": "uuid-cua-shop",
    "name": "Cửa hàng của Nguyễn Văn A",
    "subdomain": "shop-1",
    "status": "active",
    "plan": "free"
  },
  "adminUser": {
    "id": "uuid-cua-admin",
    "email": "khachhang@email.com"
  },
  "resetEmailSent": true,
  "redirectTo": "https://shop-1.vietsalepro.com/set-password"
}
```

**Edge function sẽ làm:**

| Bước | Mô tả |
|------|-------|
| 1 | Kiểm tra rate limit (10 request/phút/IP) |
| 2 | Xác thực JWT + kiểm tra System Admin |
| 3 | Validate subdomain (định dạng, reserved, uniqueness) |
| 4 | Tạo user mới trong **`auth.users`** (email + password tạm tự động) |
| 5 | Tạo dòng trong **`tenants`** |
| 6 | Tạo dòng trong **`tenant_subscriptions`** |
| 7 | Tạo dòng trong **`tenant_memberships`** (role = admin) |
| 8 | Lưu email admin vào **`tenant_credentials`** (không lưu mật khẩu) |
| 9 | Gửi email đặt lại mật khẩu (reset/setup) đến admin shop |
| 10 | Ghi audit log |
| 11 | Trả về thông tin + trạng thái gửi email |

> ⚠️ Nếu bước 5-7 thất bại, function **tự động xóa auth user** đã tạo để tránh orphan.
> Mật khẩu tạm không bao giờ được trả về; user sẽ tự đặt mật khẩu qua link trong email.

---

## Cấu hình DNS + Vercel (chỉ làm 1 lần cho toàn bộ hệ thống)

> ⚠️ **Quan trọng:** Bước này là nền tảng cho toàn bộ hệ thống multi-tenant. Làm đúng 1 lần, sau đó không cần động vào nữa. Tất cả subdomain (shop-1, shop-2, ...) sẽ tự động hoạt động.

### Tổng quan — hiểu trước khi làm

**Mục tiêu:** Khi ai đó gõ `shop-1.vietsalepro.com` trên trình duyệt → DNS phải trỏ về Vercel → Vercel trả về app VietSalePro.

```
Trình duyệt gõ:  shop-1.vietsalepro.com
                        │
                        ▼
     Hệ thống DNS (nơi bạn mua tên miền)
     Kiểm tra: ai là người quản lý tên miền này?
                        │
                        ▼
     Nếu đã trỏ về Vercel nameservers → chuyển tiếp
                        │
                        ▼
     Vercel → nhận ra *.vietsalepro.com
            → trả về index.html (app React)
                        │
                        ▼
     App chạy → đọc subdomain "shop-1"
             → gọi Supabase lấy dữ liệu shop-1
```

### Điều kiện cần có

| Thứ | Mô tả | Ví dụ |
|-----|-------|-------|
| 1 | **Tên miền** bạn đã mua | `vietsalepro.com` |
| 2 | **Tài khoản Vercel** đã có project VietSalePro | `vietsale-pro-v7` |
| 3 | **Quyền truy cập DNS** của tên miền | Thường là nơi bạn mua tên miền (Nhà đăng ký: PA Vietnam, iNET, Mat Bao, Namecheap, GoDaddy...) |

---

### Bước 1: Vào Vercel Dashboard để thêm domain

**1.1** Đăng nhập [vercel.com](https://vercel.com) bằng tài khoản của bạn.

**1.2** Chọn project **vietsale-pro-v7** (hoặc tên project bạn đã deploy).

**1.3** Vào tab **"Settings"** (Cài đặt) → **"Domains"** (Tên miền).

**1.4** Nhìn thấy ô nhập domain — gõ:

```
vietsalepro.com
```

Sau đó nhấn **"Add"**.

**1.5** Sau khi thêm `vietsalepro.com` thành công, lại thêm tiếp:

```
*.vietsalepro.com
```

> Giải thích: `*.vietsalepro.com` là wildcard — nghĩa là **tất cả subdomain** (shop-1, shop-abc, bất kỳ chữ gì) đều trỏ về project này. Bạn chỉ cần thêm 1 lần, không cần thêm từng subdomain riêng lẻ.

### Bước 2: Lấy Vercel Nameservers

**2.1** Sau khi thêm domain xong, Vercel sẽ hiển thị 2 **"Target"** cho `vietsalepro.com`:
- Một cho `vietsalepro.com` (chính)
- Một cho `*.vietsalepro.com` (wildcard)

**2.2** Ở cạnh `vietsalepro.com`, bạn sẽ thấy trạng thái **"Pending Configuration"** (Đang chờ cấu hình). Nhấn vào nó.

**2.3** Vercel hiện ra danh sách **Nameservers** — đây là địa chỉ DNS của Vercel. Nhìn giống như sau:

```
dns1.vercel-dns.com
dns2.vercel-dns.com
```

> ⚠️ **Ghi lại 2 cái tên này ra giấy** hoặc copy vào Notepad. Bạn sẽ cần chúng ở bước tiếp theo.

### Bước 3: Vào nơi quản lý tên miền để trỏ DNS về Vercel

> Nơi bạn mua tên miền (`vietsalepro.com`) là nơi bạn vào.
>
> **Ví dụ các nhà đăng ký phổ biến ở Việt Nam:**
> - **PA Vietnam (P.A Việt Nam):** `https://manage.pavietnam.vn`
> - **iNET:** `https://inett.vn`
> - **Mắt Bão (Mat Bao):** `https://matbao.net`
> - **Nhân Hoà:** `https://nhanhoa.com`
> - **Tenten.vn:** `https://tenten.vn`
>
> **Quốc tế:**
> - **Namecheap:** `https://namecheap.com`
> - **GoDaddy:** `https://godaddy.com`
> - **Cloudflare:** `https://cloudflare.com`

**Các bước chung (dù ở nhà đăng ký nào):**

**3.1** Đăng nhập vào tài khoản nơi bạn mua tên miền.

**3.2** Tìm mục **"DNS Management"**, **"Name Server"**, **"Domain Management"**, hoặc **"Quản lý DNS"**. (Tuỳ nhà đăng ký, tên mục khác nhau nhưng đều có chữ "DNS" hoặc "Nameserver".)

**3.3** Chọn tên miền `vietsalepro.com`.

**3.4** Tìm mục **"Nameservers"** (Máy chủ tên miền). Thường đang để mặc định của nhà đăng ký (ví dụ: `ns1.pavietnam.vn`, `ns2.pavietnam.vn`).

**3.5** **Chuyển từ mặc định sang "Custom Nameservers"** (hoặc "Tự chỉ định máy chủ tên miền").

**3.6** Nhập 2 nameservers của Vercel (lấy từ Bước 2):

```
dns1.vercel-dns.com
dns2.vercel-dns.com
```

> Có nơi bắt nhập "Primary" (chính) và "Secondary" (phụ). Nhập dns1 vào Primary, dns2 vào Secondary.

**3.7** Nhấn **"Save"** (Lưu) hoặc **"Update"** (Cập nhật).

**Hình minh hoạ (dạng text):**
```
Trước khi đổi:
  Nameservers: ns1.pavietnam.vn
               ns2.pavietnam.vn
               (DNS của nhà đăng ký)

Sau khi đổi:
  Nameservers: dns1.vercel-dns.com  ← Primary
               dns2.vercel-dns.com  ← Secondary
```

### Bước 4: Chờ DNS lan toả (propagation)

Sau khi đổi nameservers, bạn **phải chờ**. Thời gian chờ:

- **Thường:** 15 phút — 2 tiếng.
- **Có thể lâu hơn:** lên đến 24-48 tiếng (trường hợp hiếm, thường do nhà đăng ký cache lâu).

**Lưu ý trong thời gian chờ:**
- Có người truy cập được, có người chưa — đó là bình thường.
- Bạn có thể kiểm tra bằng công cụ: `https://whatsmydns.net` — gõ `vietsalepro.com`, nếu thấy Vercel IP ở hầu hết các location là đã xong.

### Bước 5: Kiểm tra và xác nhận

**5.1** Quay lại **Vercel Dashboard → Settings → Domains**.

**5.2** Xem trạng thái của `vietsalepro.com`:
- 🟢 **"Valid Configuration"** (xanh) → OK rồi.
- 🟡 **"Pending Configuration"** (vàng) → Chưa xong, đợi thêm.

**5.3** Mở trình duyệt, gõ thử:

```
https://vietsalepro.com
```

Nếu thấy trang **Landing Page** của VietSalePro → thành công.

**5.4** Gõ thử 1 subdomain bất kỳ:

```
https://shop-1.vietsalepro.com
```

Nếu cũng ra app VietSalePro (không báo lỗi DNS) → **cấu hình wildcard thành công**.

### 🎉 Sau khi hoàn tất

Bạn không cần làm gì thêm về DNS nữa. Từ nay, **bất kỳ subdomain nào** bạn tạo (shop-1, shop-abc, shop-abcxyz...) đều:

```
Tự động trỏ về Vercel  →  Tự động chạy app  →  Tự động nhận diện shop
```

Không cần thêm record DNS, không cần thêm domain trên Vercel cho từng shop.

### 🔄 Cách kiểm tra nhanh 1 subdomain bất kỳ

Mở **Command Prompt (CMD)** trên Windows, gõ lệnh:

```cmd
nslookup shop-thu123.vietsalepro.com
```

Kết quả trả về phải có dòng:
```
Addresses:  (một dãy số IP)
```
Nếu thấy lỗi `Non-existent domain` hoặc `server can't find` → DNS chưa xong.

### ❌ Xử lý lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|------------|-------------|------------|
| Gõ `vietsalepro.com` ra trang của nhà đăng ký | Chưa đổi nameservers | Làm lại Bước 3 |
| Gõ `vietsalepro.com` ra "Page không tìm thấy" | Vercel chưa nhận diện domain | Vào Vercel → Settings → Domains, kiểm tra trạng thái |
| `shop-1.vietsalepro.com` không vào được nhưng `vietsalepro.com` vào được | Quên thêm wildcard `*` | Làm lại Bước 1.5 |
| Vào được app nhưng báo lỗi "Không tìm thấy tenant" | App chạy được, DNS ổn. Chỉ là chưa tạo shop trong database | Đọc phần "Có 2 cách tạo Shop mới" bên trên |

---

## Luồng App phía Client — cách tenant được nhận diện

Khi user truy cập `shop-1.vietsalepro.com`:

```
1. Browser → shop-1.vietsalepro.com
2. DNS → Vercel → trả về index.html (SPA)
3. App khởi động → lib/tenant.ts: getSubdomain()
   → host = "shop-1.vietsalepro.com"
   → tách parts[0] = "shop-1"
4. Gọi supabase.rpc('get_tenant_by_subdomain', { p_subdomain: 'shop-1' })
5. Supabase trả về tenant record → setCurrentTenantId()
6. Từ nay mọi request Supabase đều kèm header x-tenant-id
```

**Chi tiết file `lib/tenant.ts`:**
- `getSubdomain()`: lấy subdomain từ URL host
- `getTenantId()`: gọi RPC `get_tenant_by_subdomain` hoặc `get_tenant_by_domain` (cho custom domain)
- `getTenantUrl()`: xây dựng URL đầy đủ cho tenant
- **Localhost**: trả về 'main' → dùng tenant 'main' để dev/test


---

## Giải thích "Chế độ cô lập" (Isolation Mode) — dân dã dễ hiểu

Khi tạo/sửa shop, bạn thấy ô **"Chế độ cô lập"** với 3 lựa chọn: **Shared**, **Schema**, **Project**. Thực ra 3 cái này khác nhau ở chỗ dữ liệu của các shop có **"ở chung hay ở riêng"**.

### 🏢 Shared = Ở chung nhà trọ

> **Nhiều shop ở CHUNG một căn nhà (1 database).**
> Mỗi shop có **phòng riêng (tenant_id)**, cửa có khoá (RLS).

**Ví dụ dễ hình dung nhất:**
- Nhà trọ 10 tầng, 50 phòng (50 shop).
- Shop A ở phòng 101, Shop B ở phòng 102.
- Chủ nhà (PostgreSQL) khoá từng phòng — Shop A không vào được phòng Shop B.
- Nhưng vì chung 1 đường ống nước, nếu Shop A mở vòi hết cỡ (chạy truy vấn nặng), Shop B yếu nước theo.

**Phù hợp với:** Shop Free và phần lớn shop VIP — vì rẻ, dễ quản lý.

### 🏘️ Schema = Ở chung cư, mỗi căn hộ riêng

> **Nhiều shop ở CHUNG một toà chung cư (1 database), nhưng mỗi shop có CĂN HỘ RIÊNG biệt (schema riêng).**

**Ví dụ:**
- Chung cư có 20 tầng, mỗi tầng là 1 căn hộ (1 schema = 1 bộ bảng riêng: products, orders, customers... của riêng shop đó).
- Căn hộ Shop A khác hẳn căn hộ Shop B — tường bê tông ngăn cách, không chung vách.
- Vẫn chung hệ thống điện nước toà nhà (cùng 1 database vật lý), nhưng mỗi căn hộ có đồng hồ điện riêng.

**Phù hợp với:** Shop VIP — dữ liệu nhiều, cần an toàn hơn.
⚠️ Hiện tại code đã sẵn sàng nhưng chưa kích hoạt (đợi ~1000 shop mới dùng).

### 🏰 Project = Mỗi shop 1 căn nhà riêng biệt

> **Mỗi shop có NHÀ RIÊNG (database riêng, server riêng).**
> Không liên quan gì đến nhau.

**Ví dụ:**
- Shop A xây nhà riêng ở quận 1.
- Shop B xây nhà riêng ở quận 2.
- Điện nước mạng riêng, không ai ảnh hưởng ai.
- Nhưng mắc hơn: tiền thuê nhà (phí Supabase Project) gấp nhiều lần ở chung.

**Phù hợp với:** Khách VIP siêu to — tập đoàn lớn, dữ liệu cực kỳ nhạy cảm, cần kiểm toán gắt gao.
⚠️ Code đã có chỗ để ghi chú nhưng chưa có cơ chế tự động tạo.

---

### 🎯 So sánh rút gọn

| Bạn muốn... | Shared | Schema | Project |
|------------|--------|--------|---------|
| Rẻ, đơn giản, chạy ngay | ✅ **Có** | ❌ | ❌ |
| An toàn hơn 1 tí | ❌ | ✅ **Có** | ❌ |
| An toàn tuyệt đối, không lo lộ dữ liệu | ❌ | ❌ | ✅ **Có** |
| Dùng cho Free được không? | ✅ **OK** | ❌ Không được | ❌ Không được |
| Đã chạy thực tế chưa? | ✅ **Đang chạy** | ⏳ Chưa (đợi sau) | ⏳ Chưa (đợi sau) |

### Kết luận đơn giản nhất

> **Chế độ cô lập là thứ để dành cho TƯƠNG LAI, khi có nhiều shop hơn.** Hiện tại (2026), 100% shop VietSales Pro dùng **Shared** — ở chung nhà trọ, khoá cửa phòng cẩn thận. RLS chắn trước cửa, tenant_id gắn từng món đồ — đủ an toàn để chạy rồi.
>

---

## Cấu trúc Database cho Tenant

### Bảng `tenants` — thông tin cửa hàng

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Tên cửa hàng |
| subdomain | TEXT UNIQUE | Subdomain (shop-1) |
| status | TEXT | active / suspended / trial / pending / archived / read_only |
| plan | TEXT | FK → plans.key (free / vip) |
| owner_id | UUID | FK → auth.users.id |
| settings | JSONB | Cấu hình mở rộng |
| isolation_mode | TEXT | shared / schema / project |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### Bảng `tenant_subscriptions` — hạn mức

| Column | Type | Default (Free) | Default (VIP) |
|--------|------|----------------|---------------|
| max_users | INTEGER | 1 | 999999 |
| max_products | INTEGER | 50 | 999999 |
| max_orders_per_month | INTEGER | 300 | 999999 |
| billing_status | TEXT | ok | ok |

### Bảng `tenant_memberships` — nhân viên

- Mỗi tenant có thể có nhiều membership
- Role: `admin`, `cashier`, `inventory_manager`, `accountant`
- 1 user có thể là member của nhiều tenant khác nhau

---

## Các tiện ích hỗ trợ trong System Admin Dashboard

Sau khi tạo shop, System Admin có thể:

| Tính năng | Mô tả |
|-----------|-------|
| **Chỉnh sửa** | Đổi tên, gói, trạng thái shop |
| **Lưu trữ** (Archive) | Soft-delete shop (đưa về status = archived) |
| **Khôi phục** | Đưa shop từ archived về active |
| **Backup** | Tải file backup JSON của tenant |
| **Restore** | Khôi phục tenant từ file backup |
| **Reset demo** | Xóa dữ liệu business, giữ tenant + membership |
| **Feature flags** | Bật/tắt tính năng (POS, Kho, Báo cáo, Tích điểm, ...) |
| **Subscription** | Cập nhật hạn mức, billing status |
| **Impersonate** | Đăng nhập với tư cách admin của shop đó |
| **Quản lý thành viên** | Xem, mời, thay đổi role, reset password |
| **Xem usage** | Số user, sản phẩm, đơn hàng đã dùng so với hạn mức |

---

## Kiến trúc Deploy

```
┌──────────────────────────────────────────────────────┐
│                    Vercel                             │
│  ┌──────────────────────────────────────────────┐    │
│  │  *.vietsalepro.com → index.html (React SPA)  │    │
│  │  _redirects: /* /index.html 200 (SPA fallback)│    │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────┐    │
│  │  Build: vite build → dist/                    │    │
│  │  PWA: service worker, offline support        │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────────┐
│                 Supabase (rsialbfjswnrkzcxarnj)       │
│  ┌──────────────┬──────────────┬──────────────────┐  │
│  │ PostgreSQL   │ Auth         │ Edge Functions   │  │
│  │ - Tenants    │ - users      │ - create-tenant  │  │
│  │ - Products   │ - MFA        │ - check-subdomain│  │
│  │ - Orders     │ - 2FA        │ - invite-member  │  │
│  │ - Customers  │              │ - impersonate    │  │
│  │ - ...        │              │ - system-backup  │  │
│  └──────────────┴──────────────┴──────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Tóm tắt các bước tạo shop-1.vietsalepro.com

```
┌─────────────────────────────────────────────┐
│ 1. Đảm bảo DNS wildcard đã trỏ về Vercel    │
│    *.vietsalepro.com → Vercel               │
├─────────────────────────────────────────────┤
│ 2. System Admin đăng nhập admin.vietsalepro │
├─────────────────────────────────────────────┤
│ 3. Vào tab "Cửa hàng" → Thêm cửa hàng      │
│    - Tên: "Cửa hàng Sữa Mẹ và Bé"          │
│    - Subdomain: "shop-1"                   │
│    - Gói: Free / VIP                       │
├─────────────────────────────────────────────┤
│ 4. Hệ thống tạo:                           │
│    - tenants row (id = shop-1)             │
│    - tenant_subscriptions row              │
│    - tenant_memberships row (admin)        │
├─────────────────────────────────────────────┤
│ 5. Truy cập shop-1.vietsalepro.com         │
│    → App tự động resolve tenant            │
│    → Đăng nhập để bắt đầu sử dụng          │
└─────────────────────────────────────────────┘