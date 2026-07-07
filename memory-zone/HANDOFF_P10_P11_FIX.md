# Handoff: Fix lỗi TypeScript build từ Phase P10 & P11

> Tình trạng: project chưa pass `npm run lint`. Các lỗi tập trung ở P10 (voucher/promotion types & service API) và P11 (ticket update email function). File này dùng để bàn giao cho chat/session tiếp theo fix.

---

## 1. Tổng quan lỗi

```bash
cd "c:/Users/SUACAUBA/Downloads/Project/vietsale-pro-v7"
npm run lint
```

Kết quả hiện tại (sau khi P12.2 đã được sửa và smoke test P12.2 pass):

```
components/InvoiceManager.tsx(24,10): error TS2305: Module '"../services/promotionService"' has no exported member 'applyVoucherToInvoice'.
components/InvoiceManager.tsx(24,33): error TS2305: Module '"../services/promotionService"' has no exported member 'getPromoCodeUsagesByInvoiceId'.
components/InvoiceManager.tsx(149,13): error TS7006: Parameter 'usages' implicitly has an 'any' type.
components/TicketInbox.tsx(28,3): error TS2305: Module '"../services/ticketService"' has no exported member 'sendTicketUpdateEmail'.
components/VoucherManager.tsx(6,3): error TS2305: Module '"../types/billing"' has no exported member 'PromoCode'.
components/VoucherManager.tsx(7,3): error TS2305: Module '"../types/billing"' has no exported member 'PromotionRule'.
components/VoucherManager.tsx(8,3): error TS2305: Module '"../types/billing"' has no exported member 'PromoCodeKind'.
components/VoucherManager.tsx(9,3): error TS2305: Module '"../types/billing"' has no exported member 'PromotionRuleConditionType'.
components/VoucherManager.tsx(10,3): error TS2305: Module '"../types/billing"' has no exported member 'PromotionRuleBenefitType'.
components/VoucherManager.tsx(11,3): error TS2305: Module '"../types/billing"' has no exported member 'PromoCodeTargetConditions'.
services/promotionService.ts(3,3): error TS2305: Module '"../types/billing"' has no exported member 'PromoCode'.
services/promotionService.ts(4,3): error TS2305: Module '"../types/billing"' has no exported member 'PromotionRule'.
services/promotionService.ts(5,3): error TS2305: Module '"../types/billing"' has no exported member 'PromoCodeUsage'.
services/promotionService.ts(6,3): error TS2305: Module '"../types/billing"' has no exported member 'CreatePromoCodeInput'.
services/promotionService.ts(7,3): error TS2305: Module '"../types/billing"' has no exported member 'UpdatePromoCodeInput'.
services/promotionService.ts(8,3): error TS2305: Module '"../types/billing"' has no exported member 'CreatePromotionRuleInput'.
services/promotionService.ts(9,3): error TS2305: Module '"../types/billing"' has no exported member 'UpdatePromotionRuleInput'.
services/promotionService.ts(10,3): error TS2305: Module '"../types/billing"' has no exported member 'PromoCodeUsageCounts'.
tests/smoke/admin-dashboard-p11-2-ticket-inbox-email.test.ts(15,3): error TS2305: Module '"../../services/ticketService"' has no exported member 'sendTicketUpdateEmail'.
```

Tổng cộng: **20 lỗi TypeScript**, chia làm 2 nhóm lớn:

- **P10 — Voucher/Promotion:** 18 lỗi (thiếu types, thiếu service function).
- **P11 — Ticket email:** 2 lỗi (thiếu `sendTicketUpdateEmail`).

---

## 2. Chi tiết nhóm P10 — Voucher/Promotion

### 2.1. Các types bị thiếu

**File import:** `services/promotionService.ts` dòng 2–11, `components/VoucherManager.tsx` dòng 5–12.
**File export hiện tại:** `types/billing.ts` (KHÔNG có các type promotion).

Các type cần có nhưng hiện chưa tồn tại ở đâu trong codebase:

- `PromoCode`
- `PromotionRule`
- `PromoCodeUsage`
- `PromoCodeKind`
- `PromotionRuleConditionType`
- `PromotionRuleBenefitType`
- `PromoCodeTargetConditions`
- `CreatePromoCodeInput`
- `UpdatePromoCodeInput`
- `CreatePromotionRuleInput`
- `UpdatePromotionRuleInput`
- `PromoCodeUsageCounts`

**Root cause:** Các type promotion từng tồn tại (vì `services/promotionService.ts` và `components/VoucherManager.tsx` đang import chúng) nhưng đã bị xóa khỏi `types/billing.ts`, hoặc từng nằm ở file khác và bị xóa/đổi tên. Code import vẫn còn nhưng source type đã mất.

### 2.2. Các service function bị thiếu

**File import:** `components/InvoiceManager.tsx` dòng 24.
**File export hiện tại:** `services/promotionService.ts`.

Các function cần có nhưng chưa được export:

- `applyVoucherToInvoice`
- `getPromoCodeUsagesByInvoiceId`

`getPromoCodeUsageCounts` đã tồn tại (dòng 252). `validatePromoCode` đã tồn tại (dòng 265).

### 2.3. Lỗi `any` ở InvoiceManager

```ts
// components/InvoiceManager.tsx dòng 148-153
getPromoCodeUsagesByInvoiceId(detailId)
  .then(usages => { // usages bị suy luận là any vì function chưa có type
```

Sẽ tự động hết khi `getPromoCodeUsagesByInvoiceId` được định nghĩa đúng type.

### 2.4. Cách fix P10

#### Bước 1: Khôi phục / viết lại promotion types

**Lựa chọn A (khuyến nghị nếu có backup):** tìm trong git history hoặc backup của phase P10 để lấy lại các type promotion rồi paste vào `types/billing.ts` hoặc tạo file `types/promotion.ts` mới.

**Lựa chọn B (nếu không có backup):** dựa vào các file `services/promotionService.ts` và `components/VoucherManager.tsx` để suy ngược các type. Dưới đây là bản nháp type từ code hiện tại:

```ts
// types/billing.ts (hoặc types/promotion.ts)

export type PromoCodeKind = 'percentage' | 'fixed_amount';

export type PromotionRuleConditionType =
  | 'always'
  | 'tenant_age_days'
  | 'plan'
  | 'specific_tenant'
  | 'cycle_type';

export type PromotionRuleBenefitType =
  | 'bonus_months'
  | 'discount_percentage'
  | 'fixed_discount';

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  kind: PromoCodeKind;
  discountValue: number;
  maxDiscountAmount?: number;
  minInvoiceAmount: number;
  validFrom?: string;
  validUntil?: string;
  maxUsesTotal?: number;
  maxUsesPerTenant?: number;
  targetConditions?: PromoCodeTargetConditions;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromoCodeInput
  extends Omit<PromoCode, 'id' | 'createdAt' | 'updatedAt'> {}

export type UpdatePromoCodeInput = Partial<
  Omit<PromoCode, 'id' | 'createdAt' | 'updatedAt'>
>;

export interface PromotionRule {
  id: string;
  name: string;
  description?: string;
  conditionType: PromotionRuleConditionType;
  conditionValue: Record<string, any>;
  benefitType: PromotionRuleBenefitType;
  benefitValue: number;
  priority: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionRuleInput
  extends Omit<PromotionRule, 'id' | 'createdAt' | 'updatedAt'> {}

export type UpdatePromotionRuleInput = Partial<
  Omit<PromotionRule, 'id' | 'createdAt' | 'updatedAt'>
>;

export interface PromoCodeUsage {
  id: string;
  promoCodeId: string;
  tenantId: string;
  invoiceId?: string;
  usedAt?: string;
  createdAt?: string;
}

export interface PromoCodeUsageCounts {
  total: number;
  perTenant: Record<string, number>;
}

// Điều kiện đối tượng áp dụng promo code
export interface PromoCodeTargetConditions {
  plan?: string;
  tenantIds?: string[];
  tenantAgeDays?: number;
  cycleType?: 'monthly' | 'yearly';
}
```

> **Lưu ý:** VoucherManager dùng `PromoCodeTargetConditions` (dòng 145, 162). Nếu type này không khớp với schema DB, cần điều chỉnh cho đúng.

#### Bước 2: Bổ sung service functions cho InvoiceManager

Trong `services/promotionService.ts`, thêm 2 export sau (ví dụ minh họa, cần kiểm tra RPC/backend tương ứng):

```ts
// services/promotionService.ts

export async function getPromoCodeUsagesByInvoiceId(
  invoiceId: string
): Promise<PromoCodeUsage[]> {
  const { data, error } = await supabase
    .from('promo_code_usages')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapPromoCodeUsageFromDB);
}

export interface ApplyVoucherResult {
  success: boolean;
  invoiceId: string;
  promoCodeId?: string;
  discount: number;
  finalTotal: number;
  error?: string;
}

export async function applyVoucherToInvoice(
  invoiceId: string,
  code: string
): Promise<ApplyVoucherResult> {
  const { data, error } = await supabase.rpc('apply_voucher_to_invoice', {
    p_invoice_id: invoiceId,
    p_code: code,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return {
    success: true,
    invoiceId,
    promoCodeId: data?.promo_code_id,
    discount: Number(data?.discount ?? 0),
    finalTotal: Number(data?.final_total ?? 0),
  };
}
```

> **Lưu ý:** RPC `apply_voucher_to_invoice` và bảng `promo_code_usages` phải tồn tại trong migration `20250707000004_phase_p10_2_voucher_invoice_apply.sql`. Cần kiểm tra tên RPC chính xác trong migration.

#### Bước 3: Chạy lint để verify

```bash
npm run lint
```

---

## 3. Chi tiết nhóm P11 — Ticket Update Email

### 3.1. Lỗi

```
components/TicketInbox.tsx(28,3): Module '"../services/ticketService"' has no exported member 'sendTicketUpdateEmail'.
tests/smoke/admin-dashboard-p11-2-ticket-inbox-email.test.ts(15,3): Module '"../../services/ticketService"' has no exported member 'sendTicketUpdateEmail'.
```

**File import:** `components/TicketInbox.tsx` dòng 16–29, `tests/smoke/admin-dashboard-p11-2-ticket-inbox-email.test.ts` dòng 9–16.
**File export hiện tại:** `services/ticketService.ts` (KHÔNG export `sendTicketUpdateEmail`).

### 3.2. Cách dùng trong code

```ts
// components/TicketInbox.tsx
createTicketReply(...)
  .then(() => sendTicketUpdateEmail({ ticketId: ..., event: 'replied' }))

// test
await sendTicketUpdateEmail({ ticketId: ticket.id, event: 'assigned' });
await sendTicketUpdateEmail({ ticketId: ticket.id, event: 'replied' });
```

### 3.3. Cách fix P11

Thêm function `sendTicketUpdateEmail` vào `services/ticketService.ts` và export nó. Function này nên gọi Edge Function `send-ticket-email` (đã deploy ở production) với payload `{ ticket_id, event }`.

Ví dụ minh họa:

```ts
// services/ticketService.ts

export interface SendTicketUpdateEmailInput {
  ticketId: string;
  event: 'assigned' | 'replied' | 'status_changed';
}

export interface SendTicketUpdateEmailResult {
  success: boolean;
  id?: string;
  to?: string;
  event: string;
}

export async function sendTicketUpdateEmail(
  input: SendTicketUpdateEmailInput
): Promise<SendTicketUpdateEmailResult> {
  const { data, error } = await (supabase as any).functions.invoke('send-ticket-email', {
    body: { ticket_id: input.ticketId, event: input.event },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return {
    success: !!data?.success,
    id: data?.id,
    to: data?.to,
    event: input.event,
  };
}
```

> **Lưu ý:**
> - Edge Function `send-ticket-email` đã deploy ở production (`rsialbfjswnrkzcxarnj`) nhưng **chưa deploy ở staging** (`shbmzvfcenbybvyzclem`).
> - Nếu staging cần test P11.2, phải deploy thêm Edge Function này.
> - Cần cập nhật mock `tests/mocks/supabase.ts` để xử lý `send-ticket-email` tương tự `send-template-email` đã làm cho P12.2.

### 3.4. Cập nhật mock cho test P11.2

Trong `tests/mocks/supabase.ts`, function `functionsInvoke`, thêm handler `send-ticket-email`:

```ts
if (name === 'send-ticket-email') {
  const { ticket_id, event } = body;
  const ticket = store.support_tickets?.find(t => t.id === ticket_id);
  if (!ticket) return { data: { error: 'Không tìm thấy ticket' }, error: null };
  return {
    data: { success: true, id: `email-${uuid()}`, to: `owner-${ticket.tenant_id}@example.com`, event },
    error: null,
  };
}
```

> **Lưu ý:** cần kiểm tra `store` có bảng `support_tickets` hay không; nếu chưa có thì thêm vào.

---

## 4. Blocker khi deploy lên Staging (bổ sung từ P12.2)

Trong quá trình kiểm tra deploy P12.2, phát hiện:

- **Production (`rsialbfjswnrkzcxarnj`):** migration P12.2 và Edge Function `send-template-email` đã deploy.
- **Staging (`shbmzvfcenbybvyzclem`):** migration P12.2 **chưa deploy**, Edge Function `send-template-email` **chưa deploy**.

Thử deploy staging bằng `supabase db push --linked --yes` thì bị lỗi ở migration sớm hơn:

```
Applying migration 20250706000011_phase_p8_1_plan_builder_schema.sql...
ERROR: syntax error at or near "$$;
$$" (SQLSTATE 42601)
At statement: 21
```

**Root cause:** file `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql` chứa nhiều hàm PL/pgSQL dùng `$$ ... $$`. Supabase CLI parser tách statement bằng `;`, nhưng hàm `get_default_plan_limits` (dòng 171–190) có `json_build_object('free', v_free, 'vip', v_vip);` bên trong body — parser có thể tách nhầm tại dấu `;` này, hoặc có lỗi quoting khiến `$$;
$$` bị coi là lỗi cú pháp.

**Hệ quả:** không thể `db push` toàn bộ migration để đưa staging lên P12.2. Cần fix migration P8.1 trước, hoặc deploy P12.2 độc lập bằng MCP/execute_sql thay vì `db push`.

### Cách xử lý blocker (gợi ý)

1. **Kiểm tra migration P8.1:** mở `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql`, xem xung quanh dòng 171–190. Có thể cần wrap phần body hàm hoặc dùng `BEGIN ATOMIC` (PostgreSQL 14+) hoặc escape đúng cách.
2. **Nếu production đã có P8.1:** so sánh version deploy trên production với file local. Production đang ở version `20260707101535` cho P12.2, cho thấy migration từng được deploy bằng công cụ khác (có thể đã sửa tên/đổi version).
3. **Deploy P12.2 độc lập:** nếu không muốn sửa P8.1, có thể dùng MCP `apply_migration` hoặc `execute_sql` để chạy riêng nội dung `20250707000008_phase_p12_2_email_templates.sql` trên staging. Cần đảm bảo các dependency (`system_settings`, `is_system_admin()`, `auth.users`) đã tồn tại.

---

## 5. Files liên quan

| File | Vai trò |
|------|---------|
| `types/billing.ts` | Thiếu các promotion types |
| `services/promotionService.ts` | Thiếu `applyVoucherToInvoice`, `getPromoCodeUsagesByInvoiceId` |
| `components/VoucherManager.tsx` | Import promotion types bị thiếu |
| `components/InvoiceManager.tsx` | Import các service function bị thiếu của promotion |
| `services/ticketService.ts` | Thiếu `sendTicketUpdateEmail` |
| `components/TicketInbox.tsx` | Import `sendTicketUpdateEmail` |
| `tests/smoke/admin-dashboard-p11-2-ticket-inbox-email.test.ts` | Test import `sendTicketUpdateEmail` |
| `tests/mocks/supabase.ts` | Cần bổ sung handler `send-ticket-email` cho test P11.2 |
| `supabase/migrations/20250706000011_phase_p8_1_plan_builder_schema.sql` | Blocker deploy staging |

---

## 6. Checklist fix

- [ ] Khôi phục/viết lại promotion types (file `types/billing.ts` hoặc `types/promotion.ts`).
- [ ] Bổ sung `applyVoucherToInvoice` và `getPromoCodeUsagesByInvoiceId` vào `services/promotionService.ts`.
- [ ] Kiểm tra tên RPC/bảng DB tương ứng với P10 migration.
- [ ] Bổ sung `sendTicketUpdateEmail` vào `services/ticketService.ts`.
- [ ] Bổ sung handler `send-ticket-email` trong `tests/mocks/supabase.ts`.
- [ ] Chạy `npm run lint` cho đến khi pass.
- [ ] Chạy `npx vitest run tests/smoke/admin-dashboard-p10-*.test.ts tests/smoke/admin-dashboard-p11-*.test.ts` nếu có.
- [ ] (Tùy chọn) Xử lý blocker deploy P8.1 trên staging hoặc deploy P12.2 độc lập bằng MCP.

---

## 7. Lưu ý cho người nhận bàn giao

- Đây là lỗi **type/import mismatch**, không phải lỗi logic nặng. Fix bằng cách đảm bảo type và service API khớp với nhau.
- Nên kiểm tra git history của `types/billing.ts` hoặc backup phase P10 để lấy lại đúng bản type ban đầu, tránh phải suy ngược.
- Sau khi fix P10/P11, cần chạy lại toàn bộ smoke test và build để đảm bảo project pass.
- Nếu cần deploy P12.2 lên staging, giải quyết blocker P8.1 trước.
