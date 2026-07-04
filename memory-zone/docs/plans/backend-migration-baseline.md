# Backend Migration Baseline Plan

## Đồng bộ production schema + RPC vào repo & chuyển sang Supabase CLI migrations

> **Project:** VietSales Pro v7  
> **Path:** `C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7`  
> **Supabase Project Ref:** `rsialbfjswnrkzcxarnj`  
> **Created:** 2026-07-03  
> **Goal:** Không còn drift giữa repo và production; repo có thể tái tạo database mới cho staging / demo / khách hàng.

---

## 1. Tổng quan

### 1.1. Mục tiêu
- Đưa **toàn bộ schema, RPC, trigger, function, policy** đang chạy trên production vào repo dưới dạng một **baseline migration**.
- Chuyển từ workflow migration thủ công (file SQL rời rạc + chạy tay trên dashboard) sang **Supabase CLI migrations** có versioning, rollback và CI/CD check.
- Thiết lập quy trình vận hành để drift không bao giờ tái diễn.

### 1.2. Phạm vi
- Toàn bộ đối tượng trong `public` schema của Supabase project `rsialbfjswnrkzcxarnj`.
- Các RPC được gọi từ frontend (`services/supabaseService.ts` và các file khác).
- Các helper function, trigger function, trigger, index, policy, type liên quan.

### 1.3. Ngoài phạm vi
- Không sửa UI, business logic, `types.ts`, API contract hiện tại.
- Không thay đổi dữ liệu production.
- Không refactor code frontend.

---

## 2. Vấn đề cần giải quyết

| Vấn đề | Mô tả | Mức độ nghiêm trọng |
|---|---|---|
| Drift RPC | 42/48 RPC frontend gọi **không có** định nghĩa trong repo | 🔴 Cao |
| Thiếu migration workflow | Không có `supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql` | 🔴 Cao |
| Sửa đổi trực tiếp trên dashboard | `get_import_receipts_by_product_and_lot` vừa được sửa trên production nhưng chưa đồng bộ repo | 🟠 Trung bình |
| File tạm tồn tại | `.temp/phase7c_sections/` chứa nhiều RPC WIP chưa merge | 🟡 Cần dọn dẹp |
| Không tái tạo môi trường | Không thể tạo instance mới (staging, demo, khách hàng) từ repo | 🔴 Blocker thương mại hóa |

---

## 3. Giả định & rủi ro

### 3.1. Giả định
- Bạn có quyền **Owner** hoặc ít nhất **Admin** trên Supabase project `rsialbfjswnrkzcxarnj`.
- Máy local đã cài Node.js, npm và có thể cài `supabase` CLI.
- Có thể tạo một Supabase project test hoặc chạy `supabase start` (local Docker) để verify.
- Production hiện tại đang chạy đúng (test 31.1–31.7 PASS).

### 3.2. Rủi ro
| Rủi ro | Tác động | Cách giảm thiểu |
|---|---|---|
| Dump production chứa function tạm/lỗi | Baseline không sạch | Audit `pg_proc` trước khi đưa vào repo; loại bỏ function test/tạm |
| Production có thay đổi trong lúc dump | Baseline không khớp | Chọn khung giờ ít tác động; dump nhanh; so sánh checksum |
| `supabase db dump` lỗi do object system | File dump không dùng được | Dùng `pg_dump` trực tiếp qua connection string hoặc query `pg_proc` |
| Baseline migration quá lớn | Khó review | Chia nhỏ theo nhóm: schema, RPC, trigger, seed (tùy chọn) |
| Làm hỏng local test | Không verify được | Backup project trước; dùng DB test riêng |

---

## 4. Giai đoạn thực hiện

### Phase 0 — Chuẩn bị (1 buổi)

#### 0.1. Backup project
```powershell
# Windows
xcopy /E /I /H "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_20260703_baseline"
```

#### 0.2. Cài đặt Supabase CLI
```bash
# Kiểm tra đã cài chưa
supabase --version

# Nếu chưa cài
npm install -g supabase

# Hoặc trên Windows bằng scoop
scoop install supabase
```

#### 0.3. Tạo môi trường test
**Lựa chọn A (khuyến nghị):** Dùng `supabase start` (local Docker):
```bash
supabase start
```

**Lựa chọn B:** Tạo project test mới trên Supabase (có thể tốn phí, cần xác nhận).

#### 0.4. Đăng nhập Supabase
```bash
supabase login
```

---

### Phase 1 — Thu thập baseline từ production (1 buổi)

#### 1.1. Link project
```bash
cd "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7"
supabase init
supabase link --project-ref rsialbfjswnrkzcxarnj
```

> **Lưu ý:** `supabase init` sẽ tạo `supabase/config.toml`. Nếu file đã tồn tại, kiểm tra xem có xung đột không.

#### 1.2. Dump schema-only từ production
```bash
# Tạo thư mục migrations nếu chưa có
mkdir -p supabase/migrations

# Dump schema-only (public schema)
supabase db dump --schema-only --file supabase/migrations/20260703000000_baseline.sql
```

Nếu `supabase db dump` gặp lỗi, dùng phương án dự phòng:
```bash
# Lấy connection string từ Supabase Dashboard → Settings → Database
# Ví dụ: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
pg_dump --schema-only --no-owner --no-privileges --schema=public \
  "postgresql://postgres:PASSWORD@db.rsialbfjswnrkzcxarnj.supabase.co:5432/postgres" \
  > supabase/migrations/20260703000000_baseline.sql
```

#### 1.3. Kiểm tra & làm sạch file dump
Mở `supabase/migrations/20260703000000_baseline.sql` và kiểm tra:
- Có đủ `CREATE TABLE`, `CREATE OR REPLACE FUNCTION`, `CREATE TRIGGER`, `CREATE INDEX`, `CREATE POLICY` không?
- Có lẫn object của Supabase system (`auth.*`, `storage.*`, `realtime.*`) không? Nếu có, loại bỏ.
- Có function test/tạm không? (ví dụ tên chứa `test_`, `temp_`, `debug_`). Nếu có, đánh dấu và loại bỏ nếu không cần.
- Có dữ liệu seed (INSERT) không? Nếu muốn, tách ra file `supabase/seed.sql` riêng.

#### 1.4. Đối chiếu với danh sách RPC frontend
Dùng script đơn giản hoặc grep để kiểm tra:
```bash
# Liệt kê các function trong file dump
grep -oE "CREATE OR REPLACE FUNCTION public\.[a-zA-Z0-9_]+" \
  supabase/migrations/20260703000000_baseline.sql | sort | uniq

# Liệt kê các RPC frontend gọi
grep -oE "rpc\('[a-zA-Z0-9_]+'" services/supabaseService.ts | sed "s/rpc('//;s/'//" | sort | uniq
```

So sánh 2 danh sách. Nếu thiếu function nào, cần tìm lý do (có thể function nằm trong schema khác hoặc tên không khớp).

---

### Phase 2 — Tạo migration baseline trong repo (1 buổi)

#### 2.1. Tổ chức file migration

```
supabase/
  migrations/
    20260703000000_baseline.sql          # Dump production schema + RPC
    20260703000001_cleanup_legacy.sql    # (tùy chọn) đánh dấu file cũ
  config.toml
  seed.sql                               # (tùy chọn) dữ liệu mẫu cho test
```

> **Quy tắc đặt tên:** `YYYYMMDDHHMMSS_description.sql`. Luôn tăng timestamp cho migration mới.

#### 2.2. Xử lý file migration cũ trong `supabase/`
Các file hiện có (`migration_phase3a_import_cost_ssot.sql`, `migration_phase6_stock_ledger_hardening.sql`, ...) đã **lỗi thời** vì thiếu nhiều RPC. Không xóa chúng để giữ lịch sử, nhưng tạo file ghi chú:

```markdown
# supabase/LEGACY_MIGRATIONS.md

Các file `migration_phase*.sql` trong thư mục này là migration thủ công cũ, không còn đầy đủ.
Từ 2026-07-03, source of truth là `supabase/migrations/20260703000000_baseline.sql`
và các migration timestamp tiếp theo.

File cũ chỉ dùng để tham khảo lịch sử, không dùng để chạy lại.
```

#### 2.3. Xử lý `.temp/phase7c_sections/`
Đối chiếu từng file trong `.temp/phase7c_sections/` với baseline:
- Nếu đã có trong baseline → xóa file `.temp/`.
- Nếu chưa có nhưng đã deploy trên production → baseline đã bao gồm; nếu baseline dump trước khi deploy, tạo migration mới.
- Nếu là WIP chưa deploy → giữ lại, chuyển thành migration tương lai sau khi hoàn thiện.

#### 2.4. Tách riêng fix `get_import_receipts_by_product_and_lot` (nếu cần)

Nếu baseline dump được thực hiện **sau** khi fix trên production, thì baseline đã chứa bản đúng → không cần migration riêng.

Nếu baseline dump được thực hiện **trước** khi fix, tạo migration riêng:

```sql
-- supabase/migrations/20260703000001_fix_import_receipts_by_product_and_lot.sql
CREATE OR REPLACE FUNCTION public.get_import_receipts_by_product_and_lot(
  p_product_id TEXT,
  p_lot_id TEXT
)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Logic đúng: join import_items.receipt_id = import_receipts.id
-- và match lot bằng import_items.lot_code = product_lots.code + product_id
$$;
```

> **Lưu ý quan trọng:** RPC này phải match lô bằng cả `product_id` và `lot_code`, vì `product_lots.code` có thể trùng giữa các sản phẩm khác nhau.

---

### Phase 3 — Verify trên môi trường test/local (1–2 ngày)

#### 3.1. Reset local database
```bash
supabase stop
supabase start
supabase db reset
```

#### 3.2. Kiểm tra migration list
```bash
supabase migration list
```

Phải thấy:
```
  20260703000000_baseline  ...  Applied
  20260703000001_fix_...     ...  Applied  (nếu có)
```

#### 3.3. So sánh `pg_proc` local vs production
Chạy trên local (Supabase Studio SQL Editor hoặc psql):
```sql
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;
```

Chạy câu truy vấn tương tự trên production. So sánh 2 danh sách. Nếu khác, xác định function nào thiếu/thừa và cập nhật baseline.

#### 3.4. Chạy ứng dụng local kết nối local DB
Cập nhật `.env` hoặc `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` để trỏ về local Supabase:
```bash
# Lấy URL local
supabase status
```

Chạy:
```bash
npm run dev
```

#### 3.5. Manual test
Thực hiện lại các test case đã PASS trong `test-results/phase-10-4b/TEST_REPORT.md`:
- 31.1 Tạo phiếu kiểm kê
- 31.2 Import Excel / Scan / Diff
- 31.3 Tạo phiếu đổi hàng NCC
- 31.4 Wizard lot grid / receipt list / exchange item cards
- 31.5–31.7 Responsive

Đặc biệt chú ý **SupplierExchanges** để xác nhận `get_import_receipts_by_product_and_lot` trả về đúng phiếu nhập.

#### 3.6. Build & lint
```bash
npm run lint
npm run build
```

---

### Phase 4 — Cập nhật tài liệu & workflow (1 buổi)

#### 4.1. Tạo `docs/RPC_REGISTRY.md`
Danh sách tất cả RPC, mục đích, file migration, frontend caller:

```markdown
# RPC Registry

| RPC Name | Purpose | Migration File | Frontend Caller |
|---|---|---|---|
| get_import_receipts_by_product_and_lot | Tìm phiếu nhập gốc theo sản phẩm & lô | 20260703000000_baseline.sql | supabaseService.getImportReceiptsByProductAndLot |
| process_checkout | Xử lý bán hàng | 20260703000000_baseline.sql | supabaseService.createOrder |
| ... | ... | ... | ... |
```

#### 4.2. Tạo `docs/MIGRATION_WORKFLOW.md`
Quy trình rõ ràng cho mọi thay đổi schema/RPC sau này:

```markdown
# Migration Workflow

1. Tuyệt đối KHÔNG sửa schema/RPC trực tiếp trên Supabase dashboard.
2. Mọi thay đổi phải qua migration file trong `supabase/migrations/`.
3. Tạo migration mới:
   ```bash
   supabase migration new ten_migration
   ```
4. Viết SQL trong file migration.
5. Chạy `supabase db reset` trên local để verify.
6. Chạy `npm run lint` và `npm run build`.
7. Chạy manual test trên local.
8. Merge vào repo chính.
9. Deploy lên staging trước production.
10. Backup production trước khi chạy migration.
```

#### 4.3. Cập nhật `AGENTS.md`
Thêm section mới:
```markdown
## Backend Migration Baseline (2026-07-03)
- Đã dump production schema + RPC vào `supabase/migrations/20260703000000_baseline.sql`.
- Chuyển sang Supabase CLI migrations.
- Cấm sửa schema/RPC trực tiếp trên dashboard.
```

#### 4.4. (Tùy chọn) CI/CD check
Tạo `.github/workflows/migration-check.yml`:

```yaml
name: Migration Check
on: [push, pull_request]
jobs:
  migration-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase link --project-ref rsialbfjswnrkzcxarnj
      - run: supabase db lint
      - run: supabase migration list
```

> **Lưu ý:** CI/CD cần secret `SUPABASE_ACCESS_TOKEN`. Nếu chưa có GitHub repo, lưu template lại để dùng sau.

---

### Phase 5 — Triển khai quy trình vận hành (ongoing)

#### 5.1. Cấm sửa trực tiếp trên dashboard
- Chỉ owner mới có quyền sửa schema/RPC trên dashboard.
- Mọi sửa đổi bắt buộc phải qua migration + review.

#### 5.2. Staging bắt buộc
- Mọi migration mới phải chạy trên staging trước production.
- Staging phải được tạo từ baseline migration.

#### 5.3. Backup trước mỗi migration production
```bash
# Tạo backup Supabase (nếu dùng paid plan)
supabase db dump --data-only --file backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 5.4. Audit định kỳ
Hàng tháng chạy script so sánh `pg_proc` production với repo:
```bash
# Lấy danh sách function trên production
supabase db dump --schema-only --file /tmp/prod_schema.sql
# So sánh với repo
```

---

## 5. Các file cần tạo / sửa

| File | Loại | Mục đích |
|---|---|---|
| `supabase/config.toml` | Tạo mới | Cấu hình Supabase CLI |
| `supabase/migrations/20260703000000_baseline.sql` | Tạo mới | Baseline schema + RPC từ production |
| `supabase/migrations/20260703000001_fix_import_receipts_by_product_and_lot.sql` | Tạo mới (nếu cần) | Fix RPC lot/receipt link |
| `supabase/seed.sql` | Tạo mới (tùy chọn) | Dữ liệu mẫu cho local test |
| `supabase/LEGACY_MIGRATIONS.md` | Tạo mới | Ghi chú về file migration cũ |
| `docs/RPC_REGISTRY.md` | Tạo mới | Danh sách RPC + caller |
| `docs/MIGRATION_WORKFLOW.md` | Tạo mới | Quy trình migration chuẩn |
| `docs/plans/backend-migration-baseline.md` | Tạo mới | Plan này |
| `AGENTS.md` | Sửa | Ghi nhận trạng thái baseline |
| `.github/workflows/migration-check.yml` | Tạo mới (tùy chọn) | CI/CD check |
| `.temp/phase7c_sections/` | Xóa/sắp xếp | Dọn dẹp WIP sau khi đối chiếu |

---

## 6. Checklist verify

- [ ] Backup project folder trước khi bắt đầu.
- [ ] `supabase --version` hoạt động.
- [ ] `supabase link --project-ref rsialbfjswnrkzcxarnj` thành công.
- [ ] `supabase db dump --schema-only` tạo ra file baseline.
- [ ] File baseline chỉ chứa `public` schema, không có object system.
- [ ] Tất cả 48 RPC frontend gọi đều có trong baseline.
- [ ] `supabase db reset` chạy thành công trên local.
- [ ] `supabase migration list` hiển thị baseline đã Applied.
- [ ] Danh sách `pg_proc` local khớp production.
- [ ] Ứng dụng local kết nối local DB và chạy được.
- [ ] Manual test 31.1–31.7 PASS.
- [ ] `npm run lint` PASS.
- [ ] `npm run build` PASS.
- [ ] `docs/RPC_REGISTRY.md` và `docs/MIGRATION_WORKFLOW.md` đã được tạo.
- [ ] `AGENTS.md` đã được cập nhật.
- [ ] `.temp/phase7c_sections/` đã được dọn dẹp.

---

## 7. Rollback plan

### 7.1. Trước khi chạy migration production
- Backup project folder.
- Backup dữ liệu production:
  ```bash
  supabase db dump --data-only --file backup_20260703_data.sql
  ```

### 7.2. Nếu migration lỗi trên local/staging
- Dừng lại, không chạy trên production.
- Sửa migration file, chạy `supabase db reset` lại.
- Không bao giờ sửa migration đã apply trên production; tạo migration mới để undo.

### 7.3. Nếu migration lỗi trên production
- Khôi phục function bị lỗi bằng cách chạy `CREATE OR REPLACE FUNCTION` từ backup.
- Nếu nghiêm trọng, restore toàn bộ database từ backup Supabase.

### 7.4. Nguyên tắc an toàn
- Mỗi function dùng `CREATE OR REPLACE FUNCTION` để dễ thay thế.
- Không dùng `DROP FUNCTION` trong migration trừ khi thực sự cần.
- Mỗi migration chỉ làm một việc rõ ràng.

---

## 8. Lưu ý đặc biệt về `get_import_receipts_by_product_and_lot`

### 8.1. Schema thực tế
- `import_items.receipt_id` → liên kết đến `import_receipts.id`.
- `import_items.lot_code` → liên kết đến `product_lots.code` (kết hợp với `product_id`).
- `product_lots` có các cột: `id`, `product_id`, `code`, `expiry_date`, `quantity`, `cost`, ...

### 8.2. Logic đúng của RPC
```sql
CREATE OR REPLACE FUNCTION public.get_import_receipts_by_product_and_lot(
  p_product_id TEXT,
  p_lot_id TEXT
)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    ir.id,
    ir.invoice_number,
    ir.date,
    ir.supplier_id,
    ir.supplier_name,
    ir.total_cost,
    ir.status,
    -- thêm các cột cần thiết
    array_agg(ii.*) FILTER (WHERE ii.id IS NOT NULL) AS import_items
  FROM public.import_receipts ir
  JOIN public.import_items ii ON ii.receipt_id = ir.id
  JOIN public.product_lots pl ON pl.product_id = p_product_id
                              AND pl.id = p_lot_id
                              AND pl.code = ii.lot_code
  WHERE ii.product_id = p_product_id
  GROUP BY ir.id, ir.invoice_number, ir.date, ir.supplier_id, ir.supplier_name, ir.total_cost, ir.status;
END;
$$;
```

> **Lưu ý:** Đoạn SQL trên là ví dụ. Bản chính xác phải lấy từ production sau khi đã fix.

### 8.3. Kiểm tra sau baseline
- Sau khi tạo baseline, chạy manual test tạo phiếu đổi hàng NCC.
- Xác nhận wizard hiển thị đúng phiếu nhập gốc.
- Xác nhận chọn lô khác nhau cho các sản phẩm khác nhau không bị lẫn.

---

## 9. Kết luận

Plan này chuyển hệ thống từ trạng thái **production là source of truth duy nhất** sang **repo là source of truth**. Đây là điều kiện tiên quyết để thương mại hóa phần mềm: bạn có thể tạo môi trường mới, rollback, review thay đổi và triển khai cho nhiều khách hàng một cách an toàn.

Sau khi thực hiện plan này, drift sẽ bị loại bỏ và mọi thay đổi backend tương lai sẽ được kiểm soát.
