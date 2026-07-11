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

function makeOrderId(input: { tenantId: string; invoiceId?: string; prefix?: string }): string {
  const base = input.invoiceId || `${Date.now()}`;
  return `${input.prefix || 'momo'}_${input.tenantId}_${base}`;
}

function extractTenantId(payload: WebhookPayload): string | undefined {
  const body = typeof payload.body === 'string' ? {} : payload.body;
  return (body?.tenantId as string) || (body?.extraData ? JSON.parse(body.extraData as string).tenantId : undefined);
}

export const momoProvider: BillingProvider = {
  name: 'momo',

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    const orderId = makeOrderId({ tenantId: input.tenantId, invoiceId: input.planKey, prefix: 'momo_sub' });
    return {
      provider: 'momo',
      status: 'pending',
      providerSubscriptionId: orderId,
      paymentUrl: `https://test-payment.momo.vn/gateway/${orderId}`,
      message: 'Momo recurring payment request generated',
    };
  },

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult> {
    return {
      provider: 'momo',
      status: 'cancelled',
      message: input.providerSubscriptionId
        ? `Cancelled ${input.providerSubscriptionId}`
        : 'Momo cancellation requires server-side call',
    };
  },

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    const orderId = makeOrderId({ tenantId: input.tenantId, invoiceId: input.invoiceId, prefix: 'momo' });
    return {
      provider: 'momo',
      status: 'pending',
      paymentIntentId: orderId,
      paymentUrl: `https://test-payment.momo.vn/gateway/${orderId}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=momo:${orderId}:${input.amount}`,
      message: 'Momo payment request generated',
    };
  },

  async handleWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    const body = typeof payload.body === 'string' ? {} : payload.body;
    return {
      success: true,
      event: (body?.resultCode === 0 ? 'payment.success' : 'payment.failed') as string,
      tenantId: extractTenantId(payload),
    };
  },
};
