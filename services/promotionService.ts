import { supabase } from '../lib/supabase';
import {
  PromoCode,
  PromotionRule,
  PromoCodeUsage,
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
  CreatePromotionRuleInput,
  UpdatePromotionRuleInput,
  PromoCodeUsageCounts,
} from '../types/billing';

const mapPromoCodeFromDB = (row: any): PromoCode => ({
  id: row.id,
  code: row.code,
  description: row.description,
  kind: row.kind,
  discountValue: Number(row.discount_value ?? 0),
  maxDiscountAmount: row.max_discount_amount ? Number(row.max_discount_amount) : undefined,
  minInvoiceAmount: Number(row.min_invoice_amount ?? 0),
  validFrom: row.valid_from,
  validUntil: row.valid_until,
  maxUsesTotal: row.max_uses_total,
  maxUsesPerTenant: row.max_uses_per_tenant,
  targetConditions: row.target_conditions && Object.keys(row.target_conditions).length
    ? {
        tenantAgeDays: row.target_conditions.tenant_age_days,
        plan: row.target_conditions.plan,
        tenantIds: row.target_conditions.tenant_ids,
      }
    : undefined,
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTargetConditionsToDB = (conditions?: PromoCode['targetConditions']) => {
  if (!conditions) return {};
  const out: Record<string, any> = {};
  if (conditions.tenantAgeDays !== undefined) out.tenant_age_days = conditions.tenantAgeDays;
  if (conditions.plan !== undefined) out.plan = conditions.plan;
  if (conditions.tenantIds !== undefined) out.tenant_ids = conditions.tenantIds;
  return out;
};

const mapPromotionRuleFromDB = (row: any): PromotionRule => ({
  id: row.id,
  name: row.name,
  description: row.description,
  conditionType: row.condition_type,
  conditionValue: row.condition_value || {},
  benefitType: row.benefit_type,
  benefitValue: Number(row.benefit_value ?? 0),
  priority: row.priority ?? 0,
  validFrom: row.valid_from,
  validUntil: row.valid_until,
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPromoCodeUsageFromDB = (row: any): PromoCodeUsage => ({
  id: row.id,
  promoCodeId: row.promo_code_id,
  tenantId: row.tenant_id,
  invoiceId: row.invoice_id,
  usedAt: row.used_at,
  createdAt: row.created_at,
});

// --- promo_codes CRUD ---

export async function getPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapPromoCodeFromDB);
}

export async function getPromoCodeById(id: string): Promise<PromoCode | null> {
  const { data, error } = await supabase.from('promo_codes').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapPromoCodeFromDB(data) : null;
}

export async function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
  const { data, error } = await supabase.from('promo_codes').select('*').eq('code', code).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapPromoCodeFromDB(data) : null;
}

export async function createPromoCode(input: CreatePromoCodeInput): Promise<PromoCode> {
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code: input.code,
      description: input.description,
      kind: input.kind,
      discount_value: input.discountValue,
      max_discount_amount: input.maxDiscountAmount,
      min_invoice_amount: input.minInvoiceAmount,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
      max_uses_total: input.maxUsesTotal,
      max_uses_per_tenant: input.maxUsesPerTenant,
      target_conditions: mapTargetConditionsToDB(input.targetConditions),
      is_active: input.isActive,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPromoCodeFromDB(data);
}

export async function updatePromoCode(id: string, input: UpdatePromoCodeInput): Promise<PromoCode> {
  const update: Record<string, any> = {};
  if (input.code !== undefined) update.code = input.code;
  if (input.description !== undefined) update.description = input.description;
  if (input.kind !== undefined) update.kind = input.kind;
  if (input.discountValue !== undefined) update.discount_value = input.discountValue;
  if (input.maxDiscountAmount !== undefined) update.max_discount_amount = input.maxDiscountAmount;
  if (input.minInvoiceAmount !== undefined) update.min_invoice_amount = input.minInvoiceAmount;
  if (input.validFrom !== undefined) update.valid_from = input.validFrom;
  if (input.validUntil !== undefined) update.valid_until = input.validUntil;
  if (input.maxUsesTotal !== undefined) update.max_uses_total = input.maxUsesTotal;
  if (input.maxUsesPerTenant !== undefined) update.max_uses_per_tenant = input.maxUsesPerTenant;
  if (input.targetConditions !== undefined) update.target_conditions = mapTargetConditionsToDB(input.targetConditions);
  if (input.isActive !== undefined) update.is_active = input.isActive;

  const { data, error } = await supabase
    .from('promo_codes')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapPromoCodeFromDB(data);
}

export async function deletePromoCode(id: string): Promise<void> {
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);
  if (error) throw error;
}

// --- promotion_rules CRUD ---

export async function getPromotionRules(): Promise<PromotionRule[]> {
  const { data, error } = await supabase
    .from('promotion_rules')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapPromotionRuleFromDB);
}

export async function getPromotionRuleById(id: string): Promise<PromotionRule | null> {
  const { data, error } = await supabase.from('promotion_rules').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapPromotionRuleFromDB(data) : null;
}

export async function createPromotionRule(input: CreatePromotionRuleInput): Promise<PromotionRule> {
  const { data, error } = await supabase
    .from('promotion_rules')
    .insert({
      name: input.name,
      description: input.description,
      condition_type: input.conditionType,
      condition_value: input.conditionValue,
      benefit_type: input.benefitType,
      benefit_value: input.benefitValue,
      priority: input.priority,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
      is_active: input.isActive,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPromotionRuleFromDB(data);
}

export async function updatePromotionRule(
  id: string,
  input: UpdatePromotionRuleInput
): Promise<PromotionRule> {
  const update: Record<string, any> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.description !== undefined) update.description = input.description;
  if (input.conditionType !== undefined) update.condition_type = input.conditionType;
  if (input.conditionValue !== undefined) update.condition_value = input.conditionValue;
  if (input.benefitType !== undefined) update.benefit_type = input.benefitType;
  if (input.benefitValue !== undefined) update.benefit_value = input.benefitValue;
  if (input.priority !== undefined) update.priority = input.priority;
  if (input.validFrom !== undefined) update.valid_from = input.validFrom;
  if (input.validUntil !== undefined) update.valid_until = input.validUntil;
  if (input.isActive !== undefined) update.is_active = input.isActive;

  const { data, error } = await supabase
    .from('promotion_rules')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapPromotionRuleFromDB(data);
}

export async function deletePromotionRule(id: string): Promise<void> {
  const { error } = await supabase.from('promotion_rules').delete().eq('id', id);
  if (error) throw error;
}

// --- promo_code_usages ---

export async function getPromoCodeUsages(filters?: {
  promoCodeId?: string;
  tenantId?: string;
}): Promise<PromoCodeUsage[]> {
  let query = supabase.from('promo_code_usages').select('*').order('created_at', { ascending: false });
  if (filters?.promoCodeId) {
    query = query.eq('promo_code_id', filters.promoCodeId);
  }
  if (filters?.tenantId) {
    query = query.eq('tenant_id', filters.tenantId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapPromoCodeUsageFromDB);
}

export async function createPromoCodeUsage(input: {
  promoCodeId: string;
  tenantId: string;
  invoiceId?: string;
}): Promise<PromoCodeUsage> {
  const { data, error } = await supabase
    .from('promo_code_usages')
    .insert({
      promo_code_id: input.promoCodeId,
      tenant_id: input.tenantId,
      invoice_id: input.invoiceId,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPromoCodeUsageFromDB(data);
}

export async function getPromoCodeUsageCounts(promoCodeId: string): Promise<PromoCodeUsageCounts> {
  const { data, error } = await supabase.rpc('get_promo_code_usage_counts', {
    p_promo_code_id: promoCodeId,
  });
  if (error) throw error;

  const perTenant = (data?.per_tenant as Record<string, number>) || {};
  return {
    total: (data?.total as number) ?? 0,
    perTenant,
  };
}

export async function getPromoCodeUsagesByInvoiceId(invoiceId: string): Promise<PromoCodeUsage[]> {
  const { data, error } = await supabase
    .from('promo_code_usages')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapPromoCodeUsageFromDB);
}

export interface ApplyVoucherToInvoiceInput {
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

export async function applyVoucherToInvoice(
  input: ApplyVoucherToInvoiceInput
): Promise<ApplyVoucherResult> {
  const { data, error } = await supabase.rpc('apply_voucher_to_invoice', {
    p_invoice_id: input.invoiceId,
    p_code: input.code,
  });
  if (error) throw error;

  if (!data?.success) {
    return { success: false, error: data?.error || 'Áp dụng voucher thất bại' };
  }
  return {
    success: true,
    invoiceId: data.invoice_id,
    promoCodeId: data.promo_code_id,
    code: data.code,
    discount: Number(data.discount ?? 0),
    bonusMonths: data.bonus_months ? Number(data.bonus_months) : undefined,
    total: Number(data.total ?? 0),
    periodEnd: data.period_end,
    usageId: data.usage_id,
  };
}

export async function validatePromoCode(
  code: string,
  tenantId: string,
  invoiceSubtotal = 0
): Promise<{
  valid: boolean;
  error?: string;
  promoCodeId?: string;
  kind?: string;
  discountValue?: number;
  maxDiscountAmount?: number;
}> {
  const { data, error } = await supabase.rpc('validate_promo_code', {
    p_code: code,
    p_tenant_id: tenantId,
    p_invoice_subtotal: invoiceSubtotal,
  });
  if (error) throw error;

  return {
    valid: (data?.valid as boolean) ?? false,
    error: (data?.error as string) || undefined,
    promoCodeId: (data?.promo_code_id as string) || undefined,
    kind: (data?.kind as string) || undefined,
    discountValue: data?.discount_value ? Number(data.discount_value) : undefined,
    maxDiscountAmount: data?.max_discount_amount ? Number(data.max_discount_amount) : undefined,
  };
}
