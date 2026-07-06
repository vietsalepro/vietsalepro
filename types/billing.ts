// ============================================================
// BILLING TYPES — P7.1 billing schema + bank/company config
// ============================================================

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
