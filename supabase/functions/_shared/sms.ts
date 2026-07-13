// Shared SMS provider seam used by Supabase Edge Functions and unit tests.
// ponytail: one provider (Twilio) for transactional SMS; extend seam when a second provider is needed.

export interface SmsProviderConfig {
  provider: 'twilio';
  from: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
}

export interface SmsMessage {
  to: string[];
  body: string;
}

export interface SmsSendResult {
  provider: string;
  ids: string[];
  to: string[];
  body: string;
  test?: boolean;
}

export interface SmsProvider {
  readonly name: string;
  send(message: SmsMessage): Promise<{ ids: string[]; rawResponses: unknown[] }>;
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : null;
}

export function createSmsProvider(config: SmsProviderConfig): SmsProvider | null {
  switch (config.provider) {
    case 'twilio': {
      if (!config.twilioAccountSid || !config.twilioAuthToken || !config.from) return null;
      return new TwilioSmsProvider(config);
    }
    default:
      return null;
  }
}

class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly from: string;

  constructor(config: SmsProviderConfig) {
    this.accountSid = config.twilioAccountSid!;
    this.authToken = config.twilioAuthToken!;
    this.from = config.from;
  }

  async send(message: SmsMessage): Promise<{ ids: string[]; rawResponses: unknown[] }> {
    const auth = btoa(`${this.accountSid}:${this.authToken}`);
    const ids: string[] = [];
    const rawResponses: unknown[] = [];

    for (const to of message.to) {
      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: this.from, To: to, Body: message.body }).toString(),
        }
      );
      const data = await resp.json().catch(() => ({}));
      rawResponses.push(data);
      if (!resp.ok) {
        throw new Error(`Twilio error ${resp.status}: ${data.message || 'unknown'}`);
      }
      ids.push(data.sid ?? `twilio-${Date.now()}`);
    }

    return { ids, rawResponses };
  }
}

