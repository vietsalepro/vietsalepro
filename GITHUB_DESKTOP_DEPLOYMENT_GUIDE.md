# Hướng dẫn Deploy Frontend bằng GitHub Desktop

## 📋 Prerequisites
- GitHub Desktop đã cài đặt
- GitHub repository đã có
- GitHub Pages hoặc GitHub Actions đã được cấu hình (nếu cần)

## 🚀 Các bước Deploy

### Bước 1: Commit Changes

1. **Mở GitHub Desktop**
   - Mở GitHub Desktop từ máy tính của bạn

2. **Review Changes**
   - Bạn sẽ thấy các file đã thay đổi:
     - `supabase/functions/create-system-admin/index.ts` (edge function mới)
     - `services/systemAdminService.ts` (service layer update)
     - `pages/SystemAdminDashboard.tsx` (UI update)
     - `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md` (documentation)
     - `PLAN_CREATE_SYSTEM_ADMIN_SUB_PHASE.md` (plan update)

3. **Commit Changes**
   - Nhập commit message:
     ```
     feat: Add system admin creation via email/password
     
     - Deploy edge function create-system-admin to production
     - Update frontend to support email/password input
     - Add comprehensive deployment documentation
     - Complete all 8 sub-phases of system admin feature
     ```
   - Click "Commit to main" (hoặc branch của bạn)

### Bước 2: Push to GitHub

1. **Push Changes**
   - Click "Push origin" để đẩy code lên GitHub
   - Chờ push hoàn thành

### Bước 3: Deploy Frontend

#### Option A: GitHub Pages (nếu đã cấu hình)

1. **Kiểm tra GitHub Pages Settings**
   - Vào GitHub repository → Settings → Pages
   - Xác nhận Source đã được cấu hình (thường là `gh-pages` branch hoặc `/dist` folder)

2. **Trigger Deployment**
   - Nếu dùng GitHub Actions, push sẽ tự động trigger deployment
   - Kiểm tra tab "Actions" để xem deployment progress

3. **Verify Deployment**
   - Chờ vài phút cho deployment hoàn thành
   - Truy cập URL GitHub Pages của bạn
   - Test tính năng tạo system admin

#### Option B: GitHub Actions (nếu đã cấu hình)

1. **Kiểm tra Workflow**
   - Vào GitHub repository → Actions tab
   - Xác nhận workflow deploy đã chạy

2. **Monitor Deployment**
   - Click vào workflow run mới nhất
   - Kiểm tra các steps để đảm bảo không có lỗi

3. **Get Deployment URL**
   - Sau khi hoàn thành, workflow sẽ cung cấp URL
   - Hoặc kiểm tra trong deployment settings

#### Option C: Manual Deploy từ dist/

Nếu bạn chưa cấu hình tự động deploy:

1. **Build Production**
   ```bash
   npm run build
   ```

2. **Copy dist/ folder**
   - Copy toàn bộ nội dung thư mục `dist/`
   - Paste vào thư mục hosting của bạn

3. **Upload to Hosting**
   - Nếu dùng FTP/SFTP: upload `dist/` contents
   - Nếu dùng cPanel: upload qua File Manager
   - Nếu dùng Netlify/Vercel: drag-and-drop `dist/` folder

### Bước 4: Verify Deployment

1. **Test Edge Function**
   - Vào Admin Dashboard → System Admins tab
   - Nhập email và password
   - Click "Thêm"
   - Verify user được tạo thành công

2. **Check Supabase Dashboard**
   - Vào https://supabase.com/dashboard/project/rsialbfjswnrkzcxarnj/functions/create-system-admin
   - Kiểm tra invocation logs
   - Verify không có errors

3. **Test UI**
   - Verify form hiển thị đúng (email + password inputs)
   - Test validation (email format, password length)
   - Test error messages
   - Test success message

## 🔍 Troubleshooting

### GitHub Desktop không push được
- Kiểm tra internet connection
- Verify GitHub credentials
- Check repository permissions

### Deployment không hoạt động
- Kiểm tra GitHub Pages settings
- Verify build output trong `dist/` folder
- Check error logs trong GitHub Actions

### Edge function không hoạt động
- Verify function status trong Supabase Dashboard
- Check function logs
- Test với Postman hoặc curl

## 📝 Checklist

- [ ] Commit changes trong GitHub Desktop
- [ ] Push to GitHub
- [ ] Deploy frontend (GitHub Pages/Actions/Manual)
- [ ] Verify deployment URL hoạt động
- [ ] Test tạo system admin với email/password
- [ ] Check Supabase logs
- [ ] Verify audit logs

## 🎯 Sau khi Deploy

1. **Monitor logs** trong 24-48 giờ đầu
2. **Test functionality** với user thật
3. **Gather feedback** từ users
4. **Document issues** nếu có

## 📞 Support

Nếu gặp vấn đề:
- Check GitHub Desktop documentation
- Review GitHub Pages documentation
- Check Supabase Edge Functions documentation
- Review deployment documentation: `DEPLOYMENT_SYSTEM_ADMIN_FEATURE.md`
