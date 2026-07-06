import { supabase } from '../lib/supabase';
import { Plan, CreatePlanInput, UpdatePlanInput } from '../types/tenant';

const mapPlanFromDB = (row: any): Plan => ({
  key: row.key,
  name: row.name,
  description: row.description,
  maxUsers: row.max_users ?? 0,
  maxProducts: row.max_products ?? 0,
  maxOrdersPerMonth: row.max_orders_per_month ?? 0,
  monthlyPrice: Number(row.monthly_price ?? 0),
  yearlyPrice: Number(row.yearly_price ?? 0),
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.rpc('get_plans');
  if (error) throw error;
  return (data || []).map(mapPlanFromDB);
}

export async function getPlanByKey(key: string): Promise<Plan> {
  const { data, error } = await supabase.rpc('get_plan_by_key', { p_key: key });
  if (error) throw error;
  return mapPlanFromDB(data);
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const { data, error } = await supabase.rpc('create_plan', {
    p_key: input.key,
    p_name: input.name,
    p_description: input.description ?? null,
    p_max_users: input.maxUsers,
    p_max_products: input.maxProducts,
    p_max_orders_per_month: input.maxOrdersPerMonth,
    p_monthly_price: input.monthlyPrice ?? 0,
    p_yearly_price: input.yearlyPrice ?? 0,
  });
  if (error) throw error;
  return mapPlanFromDB(data);
}

export async function updatePlan(key: string, input: UpdatePlanInput): Promise<Plan> {
  const { data, error } = await supabase.rpc('update_plan', {
    p_key: key,
    p_name: input.name ?? null,
    p_description: input.description ?? null,
    p_max_users: input.maxUsers ?? null,
    p_max_products: input.maxProducts ?? null,
    p_max_orders_per_month: input.maxOrdersPerMonth ?? null,
    p_monthly_price: input.monthlyPrice ?? null,
    p_yearly_price: input.yearlyPrice ?? null,
    p_is_active: input.isActive ?? null,
  });
  if (error) throw error;
  return mapPlanFromDB(data);
}

export async function deletePlan(key: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('delete_plan', { p_key: key });
  if (error) throw error;
  return !!data;
}
