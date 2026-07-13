export interface ResourceMetrics {
  cpuPercent: number | null;
  memoryPercent: number | null;
  diskPercent: number | null;
}

interface MetricSeries {
  labels: Record<string, string>;
  value: number;
}

type MetricsSnapshot = Record<string, MetricSeries[]>;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const parseProjectRef = (supabaseUrl: string): string | null => {
  try {
    const url = new URL(supabaseUrl);
    const hostParts = url.hostname.split('.');
    if (hostParts.length >= 3 && hostParts[1] === 'supabase' && hostParts[2] === 'co') {
      return hostParts[0];
    }
  } catch {
    // ignore
  }
  return null;
};

const parsePrometheus = (text: string): MetricsSnapshot => {
  const result: MetricsSnapshot = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\s*(?:\{([^}]*)\})?\s+([NaInf0-9eE.+\-]+)(?:\s+\d+)?$/);
    if (!match) continue;
    const name = match[1];
    const labelsPart = match[2] || '';
    const valueRaw = match[3];
    const value = Number(valueRaw);
    if (!Number.isFinite(value)) continue;
    const labels: Record<string, string> = {};
    if (labelsPart) {
      for (const part of labelsPart.split(',')) {
        const kv = part.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"([^"]*)"\s*$/);
        if (kv) labels[kv[1]] = kv[2];
      }
    }
    (result[name] ||= []).push({ labels, value });
  }
  return result;
};

const findMetric = (
  snapshot: MetricsSnapshot,
  name: string,
  filters?: Record<string, string>
): number | null => {
  const series = snapshot[name];
  if (!series) return null;
  for (let i = series.length - 1; i >= 0; i--) {
    if (!filters) return series[i].value;
    const labels = series[i].labels;
    if (Object.entries(filters).every(([k, v]) => labels[k] === v)) {
      return series[i].value;
    }
  }
  return null;
};

const findMetricSum = (
  snapshot: MetricsSnapshot,
  name: string,
  filters?: Record<string, string>
): number | null => {
  const series = snapshot[name];
  if (!series) return null;
  let total = 0;
  let matched = false;
  for (const s of series) {
    if (filters && !Object.entries(filters).every(([k, v]) => s.labels[k] === v)) continue;
    total += s.value;
    matched = true;
  }
  return matched ? total : null;
};

export const fetchSupabaseMetrics = async (
  projectRef: string,
  secretApiKey: string,
  fetchImpl: typeof fetch,
  options?: { timeoutMs?: number }
): Promise<MetricsSnapshot> => {
  const url = `https://${projectRef}.supabase.co/customer/v1/privileged/metrics`;
  const controller = new AbortController();
  const timeout = options?.timeoutMs ? setTimeout(() => controller.abort(), options.timeoutMs) : null;
  try {
    const res = await fetchImpl(url, {
      headers: {
        Authorization: `Basic ${btoa(`service_role:${secretApiKey}`)}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Metrics API responded ${res.status}`);
    }
    const text = await res.text();
    return parsePrometheus(text);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const buildResourceMetrics = (
  sample1: MetricsSnapshot,
  sample2: MetricsSnapshot
): ResourceMetrics => {
  const cpuPercent = ((): number | null => {
    const idle1 = findMetricSum(sample1, 'node_cpu_seconds_total', { service_type: 'db', mode: 'idle' });
    const total1 = findMetricSum(sample1, 'node_cpu_seconds_total', { service_type: 'db' });
    const idle2 = findMetricSum(sample2, 'node_cpu_seconds_total', { service_type: 'db', mode: 'idle' });
    const total2 = findMetricSum(sample2, 'node_cpu_seconds_total', { service_type: 'db' });
    if (
      idle1 == null || total1 == null || idle2 == null || total2 == null ||
      total2 <= total1 || idle2 <= idle1
    ) {
      return null;
    }
    const deltaIdle = idle2 - idle1;
    const deltaTotal = total2 - total1;
    const used = deltaTotal - deltaIdle;
    if (deltaTotal <= 0 || used < 0) return null;
    return Math.min(100, Math.max(0, (used / deltaTotal) * 100));
  })();

  const memoryPercent = ((): number | null => {
    const total = findMetric(sample2, 'node_memory_MemTotal_bytes', { service_type: 'db' });
    const available = findMetric(sample2, 'node_memory_MemAvailable_bytes', { service_type: 'db' });
    if (total == null || available == null || total <= 0) return null;
    const used = total - available;
    if (used < 0) return null;
    return Math.min(100, Math.max(0, (used / total) * 100));
  })();

  const diskPercent = ((): number | null => {
    const size = findMetric(sample2, 'node_filesystem_size_bytes', { service_type: 'db', mountpoint: '/' });
    const avail = findMetric(sample2, 'node_filesystem_avail_bytes', { service_type: 'db', mountpoint: '/' });
    if (size == null || avail == null || size <= 0) return null;
    const used = size - avail;
    if (used < 0) return null;
    return Math.min(100, Math.max(0, (used / size) * 100));
  })();

  return { cpuPercent, memoryPercent, diskPercent };
};
