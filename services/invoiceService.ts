import { supabase } from '../lib/supabase';
import { Invoice, CreateInvoiceInput, InvoicePricing } from '../types/billing';

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
