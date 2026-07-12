// ponytail: tiny defensive-mapping helpers for Supabase RPC responses.
// Ceiling: these helpers only normalize shape, not validate business rules.

export function normalizeRpcError(error: unknown, fallbackMessage: string): Error {
  const message = (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
    ? error.message
    : fallbackMessage;
  console.error(`${fallbackMessage}:`, error);
  return new Error(message);
}

export function normalizeRpcArray<T>(data: unknown, mapper: (row: any) => T): T[] {
  if (Array.isArray(data)) return data.map(mapper);
  if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
    return (data as any).data.map(mapper);
  }
  return [];
}

export function normalizeRpcPaginated<T>(
  data: unknown,
  mapper: (row: any) => T
): { data: T[]; count: number } {
  const raw = Array.isArray(data)
    ? { data, count: data.length }
    : (data as { data?: any[]; count?: number } | null) ?? {};
  return {
    data: (raw.data ?? []).map(mapper),
    count: raw.count ?? 0,
  };
}

export function normalizeRpcObject<T>(data: unknown, mapper: (row: any) => T): T {
  return mapper(data ?? {});
}
