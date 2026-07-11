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
  return `${input.prefix || 'vnpay'}_${input.tenantId}_${base}`;
}

function extractTenantId(payload: WebhookPayload): string | undefined {
  const body = typeof payload.body === 'string' ? {} : payload.body;
  return (body?.tenantId as string) || undefined;
}

function makePaymentUrl(orderId: string, amount: number, isSubscription = false): string {
  const base = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const params = new URLSearchParams({
    vnp_TxnRef: orderId,
    vnp_Amount: Math.round(amount * 100).toString(),
    vnp_OrderInfo: isSubscription ? 'subscription' : 'invoice',
  });
  return `${base}?${params.toString()}`;
}

export const vnpayProvider: BillingProvider = {
  name: 'vnpay',

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    const orderId = makeOrderId({ tenantId: input.tenantId, invoiceId: input.planKey, prefix: 'vnpay_sub' });
    return {
      provider: 'vnpay',
      status: 'pending',
      providerSubscriptionId: orderId,
      paymentUrl: makePaymentUrl(orderId, 0, true),
      message: 'VNPay subscription payment URL generated',
    };
  },

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult> {
    return {
      provider: 'vnpay',
      status: 'cancelled',
      message: input.providerSubscriptionId
        ? `Cancelled ${input.providerSubscriptionId}`
        : 'VNPay cancellation requires server-side call',
    };
  },

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    const orderId = makeOrderId({ tenantId: input.tenantId, invoiceId: input.invoiceId, prefix: 'vnpay' });
    return {
      provider: 'vnpay',
      status: 'pending',
      paymentIntentId: orderId,
      paymentUrl: makePaymentUrl(orderId, input.amount),
      message: 'VNPay payment URL generated',
    };
  },

  async handleWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    const body = typeof payload.body === 'string' ? {} : payload.body;
    return {
      success: true,
      event: (body?.vnp_ResponseCode === '00' ? 'payment.success' : 'payment.failed') as string,
      tenantId: extractTenantId(payload),
    };
  },
};
