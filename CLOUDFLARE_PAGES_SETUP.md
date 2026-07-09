# Cloudflare Pages Deployment Setup Guide

Hướng dẫn này giúp bạn thiết lập GitHub Secrets để deploy Vietsale Pro lên Cloudflare Pages thành công.

## Trạng thái hiện tại

GitHub Actions workflow `.github/workflows/deploy-cloudflare.yml` đã được cấu hình sẵn.  
Tuy nhiên, workflow đang fail với "exit code 1" vì **thiếu 3 GitHub Secrets** bắt buộc.

## Các Secrets Cần Tạo

Bạn cần tạo các secrets sau trong GitHub repository (`vietsalepro/vietsalepro86`):

| Secret Name | Mô tả | Cách lấy giá trị |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | API Token để deploy lên Cloudflare | Xem bước 1 bên dưới |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID của Cloudflare | Xem bước 2 bên dưới |
| `VITE_SUPABASE_URL` | Supabase Project URL | Đã có trong `.env` file của bạn |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key | Đã có trong `.env` file của bạn |

> **Lưu ý**: `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` có thể đã được tạo sẵn. Nếu có rồi thì bỏ qua.

---

## Bước 1: Tạo Cloudflare API Token

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vào **Profile** (góc trên bên phải) → **API Tokens**
3. Click **Create Token**
4. Chọn template **"Create Custom Token"** hoặc dùng template có sẵn
5. Cấu hình permissions tối thiểu:
   - **Account** → **Cloudflare Pages** → **Edit**
   - **Account** → **Workers Scripts** → **Edit** (nếu cần)
6. **Account Resources**: Chọn account của bạn
7. Click **Continue to summary** → **Create Token**
8. **Copy token ngay lập tức** (token chỉ hiển thị 1 lần!)

Token sẽ có dạng: `abc123def456...`

## Bước 2: Lấy Cloudflare Account ID

### Cách 1: Từ Cloudflare Dashboard
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Ở trang tổng quan, nhìn góc phải thanh sidebar
3. **Account ID** hiển thị ngay dưới tên account
4. Copy ID (dạng `abc123def456ghi789...`)

### Cách 2: Từ URL
1. Vào [dash.cloudflare.com](https://dash.cloudflare.com) và chọn account
2. URL sẽ có dạng: `https://dash.cloudflare.com/abc123def456ghi789...`
3. Phần sau `dash.cloudflare.com/` chính là Account ID

## Bước 3: Thêm Secrets vào GitHub Repository

1. Vào repository: https://github.com/vietsalepro/vietsalepro86
2. Vào **Settings** tab
3. Sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Thêm từng secret:

   **Secret 1:**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Token từ Bước 1

   **Secret 2:**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: Account ID từ Bước 2

   **Secret 3 (nếu chưa có):**
   - Name: `VITE_SUPABASE_URL`
   - Value: URL Supabase của bạn (VD: `https://xxxxx.supabase.co`)

   **Secret 4 (nếu chưa có):**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Anon key của Supabase

## Bước 4: Kiểm tra Deploy

1. Vào **Actions** tab trên GitHub repository
2. Chọn workflow **"Deploy to Cloudflare Pages"** 
3. Click **Run workflow** → **Run workflow** (manual trigger)
4. Hoặc push code lên branch `master` để trigger tự động
5. Theo dõi log để xác nhận deploy thành công

## Kết quả mong đợi

Sau khi deploy thành công:
- Site sẽ được publish tại: `https://vietsale-pro.pages.dev` (hoặc URL bạn đã config)
- Bạn có thể xem URL deploy trong Cloudflare Dashboard → **Workers & Pages** → chọn project `vietsale-pro`

## Troubleshooting

### Lỗi "HTTP 403: forbidden"
→ API Token không có đủ quyền. Kiểm tra lại permissions ở Bước 1.

### Lỗi "Account not found"
→ Account ID sai. Kiểm tra lại Bước 2.

### Lỗi build (exit code != 0 từ bước build)
→ Kiểm tra `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` đã được set đúng.

### Vẫn fail sau khi thêm secrets?
→ Vào Actions tab, chọn workflow run bị fail, xem log chi tiết để debug.