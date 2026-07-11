// ============================================================
// BILLING TYPES — P7.1 billing schema + bank/company config
// Sub-Phase 4.2: extended with BillingProvider abstraction + feature gating
// Basejump reference: Section 3.6 (BillingProvider), Section 3.7 (feature gating)
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
  // Sub-Phase 4.1 migration tightened DB constraint to Basejump status set.
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
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

// P16.1: Revenue metrics
export interface RevenueByPlanItem {
  plan: string;
  planName: string;
  revenue: number;
  paymentCount: number;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  revenueByPlan: RevenueByPlanItem[];
  periodStart: string;
  periodEnd: string;
}

// P16.2: Churn + cohort + LTV + sales funnel
export interface ChurnMetric {
  activeStart: number;
  activeEnd: number;
  churnedCount: number;
  churnRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface CohortRetentionPoint {
  month: string;
  conversionRate: number;
}

export interface CohortRow {
  month: string;
  total: number;
  retention: CohortRetentionPoint[];
}

export interface CohortMetrics {
  months: string[];
  cohorts: CohortRow[];
}

export interface LtvByPlanItem {
  plan: string;
  planName: string;
  revenue: number;
  tenants: number;
  ltv: number;
}

export interface LtvMetrics {
  averageLtv: number;
  totalRevenue: number;
  payingTenants: number;
  byPlan: LtvByPlanItem[];
}

export interface FunnelMetrics {
  trial: number;
  activeFree: number;
  paying: number;
  churned: number;
}

export interface ChurnCohortMetrics {
  churn: ChurnMetric;
  cohort: CohortMetrics;
  ltv: LtvMetrics;
  funnel: FunnelMetrics;
}

// ============================================================
// VOUCHER / PROMOTION TYPES — P10.1/P10.2
// ============================================================

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
  | 'discount_fixed_amount';

// Điều kiện đối tượng áp dụng promo code (kết hợp AND).
export interface PromoCodeTargetConditions {
  tenantAgeDays?: number;
  plan?: string;
  tenantIds?: string[];
}

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

// ============================================================
// SUB-PHASE 4.2: BILLING PROVIDER ABSTRACTION
// Basejump reference: Section 3.6
// ============================================================

export type BillingProviderName = 'stripe' | 'momo' | 'vnpay' | 'bank_transfer';
export type BillingPeriod = 'month' | 'year';
export type SubscriptionProviderStatus = 'active' | 'trialing' | 'pending' | 'past_due' | 'cancelled';
export type PaymentIntentStatus = 'requires_payment_method' | 'requires_action' | 'pending' | 'success' | 'canceled';

export interface CreateSubscriptionInput {
  tenantId: string;
  planKey: string;
  billingPeriod?: BillingPeriod;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
}

export interface CreateSubscriptionResult {
  provider: BillingProviderName;
  providerSubscriptionId?: string;
  checkoutUrl?: string;
  clientSecret?: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  bankTransferInstructions?: BankTransferInstructions;
  status: SubscriptionProviderStatus;
  message?: string;
}

export interface CancelSubscriptionInput {
  tenantId: string;
  providerSubscriptionId?: string;
}

export interface CancelSubscriptionResult {
  provider: BillingProviderName;
  status: 'cancelled' | 'active' | 'pending';
  message?: string;
}

export interface CreatePaymentIntentInput {
  tenantId: string;
  invoiceId?: string;
  amount: number;
  currency?: string;
  description?: string;
  returnUrl?: string;
  orderId?: string;
  orderInfo?: string;
}

export interface BankTransferInstructions {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transferContent?: string;
  amount: number;
}

export interface CreatePaymentIntentResult {
  provider: BillingProviderName;
  paymentIntentId?: string;
  clientSecret?: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  bankTransferInstructions?: BankTransferInstructions;
  status: PaymentIntentStatus;
  message?: string;
}

export interface WebhookPayload {
  provider: BillingProviderName;
  headers: Record<string, string>;
  body: string | Record<string, unknown>;
  signature?: string;
}

export interface WebhookResult {
  success: boolean;
  event?: string;
  subscriptionId?: string;
  invoiceId?: string;
  tenantId?: string;
  message?: string;
}

export interface BillingProvider {
  readonly name: BillingProviderName;
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult>;
  cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult>;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  handleWebhook(payload: WebhookPayload): Promise<WebhookResult>;
}

// ============================================================
// SUB-PHASE 4.2: FEATURE GATING TYPES
// Basejump reference: Section 3.7
// ============================================================

export type FeatureKey = string;

export interface PlanFeature {
  id?: string;
  planId: string;
  featureKey: FeatureKey;
  enabled: boolean;
  limit?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CanUseFeatureOptions {
  tenantId: string;
  featureKey: FeatureKey;
  currentUsage?: number;
}
