export interface WebhookDeliveryInput {
  url: string;
  secret?: string;
  eventType: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  maxAttempts?: number;
}

export interface AttemptLogEntry {
  attempt: number;
  status: 'success' | 'failure';
  httpStatus?: number;
  error?: string;
  timestamp: string;
}

export interface WebhookDeliveryResult {
  status: 'delivered' | 'exhausted';
  httpStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  deliveredAt?: string;
  attemptLog: AttemptLogEntry[];
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const encodeBase64 = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  if (typeof btoa === 'function') return btoa(binary);
  // Node fallback
  return Buffer.from(bytes).toString('base64');
};

const signPayload = async (secret: string, body: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign({ name: 'HMAC' }, key, new TextEncoder().encode(body));
  return encodeBase64(new Uint8Array(signature));
};

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const deliverWebhook = async (input: WebhookDeliveryInput): Promise<WebhookDeliveryResult> => {
  const maxAttempts = Math.max(1, Math.min(input.maxAttempts ?? 3, 5));
  const body = JSON.stringify({
    event: input.eventType,
    idempotency_key: input.idempotencyKey,
    timestamp: new Date().toISOString(),
    data: input.payload,
  });

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'VietSales-Pro-Webhook/1.0',
    'X-Webhook-Event': input.eventType,
    'X-Webhook-Idempotency-Key': input.idempotencyKey,
  };

  const attemptLog: AttemptLogEntry[] = [];
  let lastHttpStatus: number | undefined;
  let lastResponseBody: string | undefined;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const headers: Record<string, string> = { ...baseHeaders };
    if (input.secret) {
      try {
        headers['X-Webhook-Signature'] = await signPayload(input.secret, body);
      } catch (e) {
        const err = e instanceof Error ? e.message : 'signature_failed';
        attemptLog.push({ attempt, status: 'failure', error: `Không thể ký payload: ${err}`, timestamp: new Date().toISOString() });
        lastError = err;
        if (attempt < maxAttempts) await sleep(1000);
        continue;
      }
    }

    try {
      const resp = await fetchWithTimeout(input.url, { method: 'POST', headers, body }, 30000);
      const responseText = await resp.text().catch(() => '');
      lastHttpStatus = resp.status;
      lastResponseBody = responseText;

      if (resp.ok) {
        const deliveredAt = new Date().toISOString();
        attemptLog.push({ attempt, status: 'success', httpStatus: resp.status, timestamp: deliveredAt });
        return {
          status: 'delivered',
          httpStatus: resp.status,
          responseBody: responseText,
          deliveredAt,
          attemptLog,
        };
      }

      const errMsg = `HTTP ${resp.status}`;
      lastError = errMsg;
      attemptLog.push({ attempt, status: 'failure', httpStatus: resp.status, error: errMsg, timestamp: new Date().toISOString() });
    } catch (e) {
      const err = e instanceof Error ? e.message : 'fetch_failed';
      lastError = err;
      attemptLog.push({ attempt, status: 'failure', error: err, timestamp: new Date().toISOString() });
    }

    if (attempt < maxAttempts) await sleep(1000);
  }

  return {
    status: 'exhausted',
    httpStatus: lastHttpStatus,
    responseBody: lastResponseBody,
    errorMessage: lastError,
    attemptLog,
  };
};
