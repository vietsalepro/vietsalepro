import { supabase } from '../lib/supabase';
import {
  Invoice,
  InvoiceItem,
  Payment,
  CreateInvoiceInput,
  ConfirmPaymentInput,
  InvoicePricing,
  InvoiceWithTenant,
  InvoiceDetail,
} from '../types/billing';

const mapInvoiceFromDB = (row: any): Invoice => ({
  id: row.id,
  tenantId: row.tenant_id,
  invoiceNo: row.invoice_no,
  status: row.status,
  issueDate: row.issue_date,
  dueDate: row.due_date,
  periodStart: row.period_start,
  periodEnd: row.period_end,
  subtotal: row.subtotal,
  discount: row.discount,
  tax: row.tax,
  total: row.total,
  amountPaid: row.amount_paid,
  balance: row.balance,
  notes: row.notes,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPaymentFromDB = (row: any): Payment => ({
  id: row.id,
  tenantId: row.tenant_id,
  invoiceId: row.invoice_id,
  amount: row.amount,
  paymentMethod: row.payment_method,
  paymentDate: row.payment_date,
  referenceCode: row.reference_code,
  status: row.status,
  notes: row.notes,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapInvoiceItemFromDB = (row: any): InvoiceItem => ({
  id: row.id,
  invoiceId: row.invoice_id,
  tenantId: row.tenant_id,
  description: row.description,
  quantity: row.quantity,
  unitPrice: row.unit_price,
  amount: row.amount,
  createdAt: row.created_at,
});

const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

export function calculateInvoicePrice(
  input: Pick<CreateInvoiceInput, 'cycleType' | 'quantity' | 'bonusMonths'>,
  currentExpiresAt?: string | null
): InvoicePricing {
  const paidMonths = input.cycleType === 'yearly' ? input.quantity * 12 : input.quantity;
  const unitPrice = input.cycleType === 'yearly' ? 59000 : 69000;
  const subtotal = paidMonths * unitPrice;

  const today = new Date().toISOString().slice(0, 10);
  const expiresDate = currentExpiresAt?.slice(0, 10);
  const periodStart = expiresDate && expiresDate >= today ? expiresDate : today;
  const periodEnd = addMonths(periodStart, paidMonths + input.bonusMonths);

  return {
    paidMonths,
    unitPrice,
    subtotal,
    total: subtotal,
    periodStart,
    periodEnd,
  };
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const { data, error } = await supabase.rpc('create_invoice', {
    p_tenant_id: input.tenantId,
    p_cycle_type: input.cycleType,
    p_quantity: input.quantity,
    p_bonus_months: input.bonusMonths,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  return mapInvoiceFromDB(data);
}

export async function getInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapInvoiceFromDB);
}

export async function confirmPayment(input: ConfirmPaymentInput): Promise<Payment> {
  const { data, error } = await supabase.rpc('confirm_payment', {
    p_invoice_id: input.invoiceId,
    p_payment_method: input.paymentMethod ?? 'bank_transfer',
    p_reference_code: input.referenceCode ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  return mapPaymentFromDB(data);
}

export async function getAllInvoices(): Promise<InvoiceWithTenant[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, tenants(name, subdomain)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...mapInvoiceFromDB(row),
    tenantName: row.tenants?.name ?? '',
    tenantSubdomain: row.tenants?.subdomain ?? '',
  }));
}

export async function getInvoiceById(id: string): Promise<InvoiceDetail | null> {
  const { data: invoiceRow, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  if (invoiceError) {
    if (invoiceError.code === 'PGRST116') return null;
    throw invoiceError;
  }

  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('created_at', { ascending: true });
  if (itemsError) throw itemsError;

  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', id)
    .order('created_at', { ascending: true });
  if (paymentsError) throw paymentsError;

  return {
    invoice: mapInvoiceFromDB(invoiceRow),
    items: (items || []).map(mapInvoiceItemFromDB),
    payments: (payments || []).map(mapPaymentFromDB),
  };
}
