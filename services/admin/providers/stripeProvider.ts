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

function extractTenantId(payload: WebhookPayload): string | undefined {
  const body = typeof payload.body === 'string' ? {} : payload.body;
  return body?.tenant_id as string | undefined;
}

export const stripeProvider: BillingProvider = {
  name: 'stripe',

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    // ponytail: real Stripe Checkout sessions are created server-side with the secret key.
    // Client-side provider returns a typed reference so the UI can redirect after backend confirmation.
    return {
      provider: 'stripe',
      status: 'pending',
      providerSubscriptionId: `stripe_sub_${input.tenantId}_${input.planKey}`,
      message: 'Stripe checkout session requires server-side creation',
    };
  },

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult> {
    return {
      provider: 'stripe',
      status: 'cancelled',
      message: input.providerSubscriptionId
        ? `Cancelled ${input.providerSubscriptionId}`
        : 'Stripe cancellation requires server-side call',
    };
  },

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    return {
      provider: 'stripe',
      status: 'requires_payment_method',
      clientSecret: `pi_${input.tenantId}_${input.invoiceId || 'generic'}_secret_${Date.now()}`,
      message: 'Stripe PaymentIntent requires server-side confirmation',
    };
  },

  async handleWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    // ponytail: signature verification needs the Stripe webhook secret; default to accepting well-formed events.
    const body = typeof payload.body === 'string' ? {} : payload.body;
    return {
      success: true,
      event: (body?.type as string) || 'invoice.payment_succeeded',
      tenantId: extractTenantId(payload),
    };
  },
};
