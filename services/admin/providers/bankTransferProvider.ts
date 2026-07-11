import type {
  BillingProvider,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  CancelSubscriptionInput,
  CancelSubscriptionResult,
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  WebhookPayload,
  WebhookResult,
} from '../../../types/billing';

function makeTransferContent(input: { tenantId: string; invoiceId?: string; planKey?: string }): string {
  const parts = ['VIETSALE', input.tenantId.slice(0, 8), input.invoiceId || input.planKey || ''].filter(Boolean);
  return parts.join(' ').toUpperCase();
}

function extractTenantId(payload: WebhookPayload): string | undefined {
  const body = typeof payload.body === 'string' ? {} : payload.body;
  return (body?.tenantId as string) || undefined;
}

export const bankTransferProvider: BillingProvider = {
  name: 'bank_transfer',

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    return {
      provider: 'bank_transfer',
      status: 'pending',
      providerSubscriptionId: `bt_sub_${input.tenantId}_${input.planKey}`,
      bankTransferInstructions: {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'VIETSALE PRO',
        transferContent: makeTransferContent({ tenantId: input.tenantId, planKey: input.planKey }),
        amount: 0,
      },
      message: 'Bank transfer subscription recorded as pending payment',
    };
  },

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult> {
    return {
      provider: 'bank_transfer',
      status: 'cancelled',
      message: input.providerSubscriptionId
        ? `Cancelled ${input.providerSubscriptionId}`
        : 'Bank transfer cancellation recorded',
    };
  },

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    return {
      provider: 'bank_transfer',
      status: 'pending',
      paymentIntentId: `bt_${input.tenantId}_${input.invoiceId || Date.now()}`,
      bankTransferInstructions: {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'VIETSALE PRO',
        transferContent: makeTransferContent({ tenantId: input.tenantId, invoiceId: input.invoiceId }),
        amount: input.amount,
      },
      message: 'Bank transfer instructions generated',
    };
  },

  async handleWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    const body = typeof payload.body === 'string' ? {} : payload.body;
    return {
      success: true,
      event: (body?.status as string) || 'bank_transfer.pending',
      tenantId: extractTenantId(payload),
    };
  },
};
