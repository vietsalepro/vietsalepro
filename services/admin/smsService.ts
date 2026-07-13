import { supabase } from '../../lib/supabase';

export interface SendSmsInput {
  to: string | string[];
  body: string;
  test?: boolean;
}

export interface SendSmsResult {
  success: boolean;
  id: string | null;
  ids: string[];
  to: string[];
  body: string;
  provider: string;
  test: boolean;
}

interface SmsEdgeResponse extends Partial<SendSmsResult> {
  error?: string;
}

// ponytail: thin client seam that delegates to the send-sms Edge Function.
// Secrets (Twilio/Vonage keys) live only in Supabase; the browser never touches them.
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const { data, error } = await supabase.functions.invoke<SmsEdgeResponse>('send-sms', {
    body: {
      to: input.to,
      body: input.body,
      test: input.test,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return {
    success: !!data?.success,
    id: data?.id ?? (data?.ids?.[0] ?? null),
    ids: data?.ids ?? [],
    to: data?.to ?? [],
    body: data?.body ?? input.body,
    provider: data?.provider ?? 'unknown',
    test: !!data?.test,
  };
}
