// ============================================================
// BILLING TYPES — P7.1 billing schema + bank/company config
// ============================================================

import type { TenantStatus } from './tenant';

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  transferContent: string;
  isDefault: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyInfo {
  companyName: string;
  brandName: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNo: string;
  status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue' | 'expired';
  issueDate: string;
  dueDate: string;
  periodStart?: string;
  periodEnd?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  tenantId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt?: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'card' | 'other';
  paymentDate: string;
  referenceCode?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvoiceInput {
  tenantId: string;
  cycleType: 'monthly' | 'yearly';
  quantity: number;
  bonusMonths: number;
  notes?: string;
}

export interface ConfirmPaymentInput {
  invoiceId: string;
  paymentMethod?: 'bank_transfer' | 'cash' | 'card' | 'other';
  referenceCode?: string;
  notes?: string;
}

export interface InvoicePricing {
  paidMonths: number;
  unitPrice: number;
  subtotal: number;
  total: number;
  periodStart: string;
  periodEnd: string;
}

export interface InvoiceWithTenant extends Invoice {
  tenantName: string;
  tenantSubdomain: string;
}

export interface InvoiceDetail {
  invoice: Invoice;
  items: InvoiceItem[];
  payments: Payment[];
}

export type BillingEmailType = 'reminder' | 'confirmation';

export interface SendBillingEmailInput {
  invoiceId: string;
  type: BillingEmailType;
  to?: string;
}

export interface BillingReminderConfig {
  enabled: boolean;
  milestones: number[];
  sendTime: string;
  functionUrl: string;
  reminderSecret: string;
}

export interface BillingReminderLog {
  id: string;
  invoiceId: string;
  milestone: 'T-7' | 'T-3' | 'T-1';
  dueDate: string;
  sentAt: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  createdAt: string;
}

export interface PendingReminder {
  invoiceId: string;
  milestone: 'T-7' | 'T-3' | 'T-1';
  dueDate: string;
}

export interface BillingJobLog {
  id: string;
  jobName: string;
  status: 'running' | 'success' | 'failed';
  runAt: string;
  durationMs?: number;
  recordsAffected: number;
  message?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface ExpiringTenantItem {
  id: string;
  name: string;
  subdomain: string;
  expiresAt: string;
  daysRemaining: number;
}

export interface OverdueInvoiceItem {
  id: string;
  invoiceNo: string;
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  dueDate: string;
  status: Invoice['status'];
  balance: number;
}

export interface DunningTenantItem {
  id: string;
  name: string;
  subdomain: string;
  status: TenantStatus;
  billingStatus?: string;
}

export interface BillingAutomationStatus {
  expiringSoonCount: number;
  expiringSoon: ExpiringTenantItem[];
  pendingInvoiceCount: number;
  overdueInvoiceCount: number;
  overdueInvoices: OverdueInvoiceItem[];
  dunningTenantCount: number;
  dunningTenants: DunningTenantItem[];
}

// ============================================================
// P10.1 VOUCHER / PROMOTION TYPES
// ============================================================

export type PromoCodeKind = 'fixed_amount' | 'percentage';

export interface PromoCodeTargetConditions {
  tenantAgeDays?: number;
  plan?: 'free' | 'vip';
  tenantIds?: string[];
}

export type PromotionRuleConditionType =
  | 'tenant_age_days'
  | 'plan'
  | 'specific_tenant'
  | 'cycle_type'
  | 'always';

export type PromotionRuleBenefitType =
  | 'bonus_months'
  | 'discount_percentage'
  | 'discount_fixed_amount';

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  kind: PromoCodeKind;
  discountValue: number;
  maxDiscountAmount?: number;
  minInvoiceAmount: number;
  validFrom: string;
  validUntil?: string;
  maxUsesTotal?: number;
  maxUsesPerTenant?: number;
  targetConditions?: PromoCodeTargetConditions;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromoCodeInput {
  code: string;
  description?: string;
  kind: PromoCodeKind;
  discountValue: number;
  maxDiscountAmount?: number;
  minInvoiceAmount?: number;
  validFrom?: string;
  validUntil?: string;
  maxUsesTotal?: number;
  maxUsesPerTenant?: number;
  targetConditions?: PromoCodeTargetConditions;
  isActive?: boolean;
}

export type UpdatePromoCodeInput = Partial<CreatePromoCodeInput>;

export interface ApplyVoucherInput {
  invoiceId: string;
  code: string;
}

export interface ApplyVoucherResult {
  success: boolean;
  error?: string;
  invoiceId?: string;
  promoCodeId?: string;
  code?: string;
  discount?: number;
  bonusMonths?: number;
  total?: number;
  periodEnd?: string;
  usageId?: string;
}

export interface PromotionRule {
  id: string;
  name: string;
  description?: string;
  conditionType: PromotionRuleConditionType;
  conditionValue: Record<string, any>;
  benefitType: PromotionRuleBenefitType;
  benefitValue: number;
  priority: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionRuleInput {
  name: string;
  description?: string;
  conditionType?: PromotionRuleConditionType;
  conditionValue?: Record<string, any>;
  benefitType?: PromotionRuleBenefitType;
  benefitValue?: number;
  priority?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

export type UpdatePromotionRuleInput = Partial<CreatePromotionRuleInput>;

export interface PromoCodeUsage {
  id: string;
  promoCodeId: string;
  tenantId: string;
  invoiceId?: string;
  usedAt: string;
  createdAt?: string;
}

export interface PromoCodeUsageCounts {
  total: number;
  perTenant: Record<string, number>;
}
