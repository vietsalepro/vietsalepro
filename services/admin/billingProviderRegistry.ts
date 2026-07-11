// ============================================================
// BILLING PROVIDER REGISTRY
// Basejump reference: Section 3.6 (provider registry)
// ponytail: registry maps provider names to typed instances.
// ============================================================

import type { BillingProvider, BillingProviderName } from '../../types/billing';
import { stripeProvider } from './providers/stripeProvider';
import { momoProvider } from './providers/momoProvider';
import { vnpayProvider } from './providers/vnpayProvider';
import { bankTransferProvider } from './providers/bankTransferProvider';

const providers: Record<BillingProviderName, BillingProvider> = {
  stripe: stripeProvider,
  momo: momoProvider,
  vnpay: vnpayProvider,
  bank_transfer: bankTransferProvider,
};

export function getBillingProvider(name: BillingProviderName): BillingProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unsupported billing provider: ${name}`);
  }
  return provider;
}

export function listBillingProviders(): BillingProviderName[] {
  return Object.keys(providers) as BillingProviderName[];
}

export function isBillingProviderName(name: string): name is BillingProviderName {
  return name in providers;
}
