import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
  createSmsProvider,
  normalizePhone,
  SmsMessage,
  SmsProviderConfig,
  SmsSendResult,
} from '../_shared/sms.ts';

// SP-6.2: SMS service integration.
// Receives { to, body, test? }; normalizes phone numbers; calls the configured SMS provider.
// Provider credentials are stored in Supabase secrets.
// Body: { to: string | string[], body: string, test?: boolean }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server misconfiguration: missing Supabase environment variables' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authentication: service role or system admin.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === serviceRoleKey;
    if (!isServiceRole) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !user) {
        return jsonResponse({ error: 'Invalid token' }, 401);
      }
      const { data: adminRow, error: adminError } = await supabaseAdmin
        .from('system_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (adminError) throw adminError;
      if (!adminRow) {
        return jsonResponse({ error: 'Chỉ system admin được gửi SMS' }, 403);
      }
    }

    const body = await req.json();
    const { to, body: messageBody, test } = body as {
      to?: string | string[];
      body?: string;
      test?: boolean;
    };

    if (!to || (typeof to !== 'string' && !Array.isArray(to))) {
      return jsonResponse({ error: 'to phải là số điện thoại hoặc mảng số điện thoại' }, 400);
    }
    const rawRecipients = Array.isArray(to) ? to : [to];
    if (rawRecipients.length === 0) {
      return jsonResponse({ error: 'Danh sách người nhận rỗng' }, 400);
    }

    const normalizedRecipients = rawRecipients.map(normalizePhone).filter((p): p is string => p !== null);
    if (normalizedRecipients.length !== rawRecipients.length) {
      return jsonResponse({ error: 'Một hoặc nhiều số điện thoại không hợp lệ' }, 400);
    }

    if (typeof messageBody !== 'string' || messageBody.trim().length === 0) {
      return jsonResponse({ error: 'body không được để trống' }, 400);
    }

    const providerName = Deno.env.get('SMS_PROVIDER');
    const from = Deno.env.get('SMS_FROM');
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (providerName !== 'twilio' || !from || !accountSid || !authToken) {
      return jsonResponse({ error: 'SMS_PROVIDER/SMS_FROM/TWILIO_* chưa được cấu hình trong Supabase secrets' }, 500);
    }

    const config: SmsProviderConfig = {
      provider: 'twilio',
      from,
      twilioAccountSid: accountSid,
      twilioAuthToken: authToken,
    };

    const provider = createSmsProvider(config);
    if (!provider) {
      return jsonResponse({ error: 'Không thể khởi tạo SMS provider' }, 500);
    }

    const message: SmsMessage = { to: normalizedRecipients, body: messageBody };
    const { ids } = await provider.send(message);

    const result: SmsSendResult = {
      provider: provider.name,
      ids,
      to: normalizedRecipients,
      body: messageBody,
      test: !!test,
    };

    return jsonResponse({ success: true, ...result }, 200);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Lỗi không xác định' }, 500);
  }
});
