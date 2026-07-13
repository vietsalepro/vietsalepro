// Shared helpers for custom-domain DNS TXT verification.
// Kept pure so they can be unit-tested outside Deno.

// Rejects protocols, bare TLDs, empty labels, and labels starting/ending with hyphens.
const DOMAIN_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)+$/i;

export function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') return false;
  const d = domain.trim().toLowerCase();
  return (
    d.length >= 4 &&
    d.length <= 253 &&
    DOMAIN_REGEX.test(d) &&
    !d.includes('://') &&
    !d.startsWith('-')
  );
}

export function generateVerificationToken(): string {
  // ponytail: 64-char hex string from two UUIDs; enough entropy for a TXT record.
  return (crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''));
}

export interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface DnsResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

export function parseTxtRecords(dns: DnsResponse): string[] {
  if (!dns || dns.Status !== 0 || !Array.isArray(dns.Answer)) return [];
  return dns.Answer.filter((a) => a.type === 16).map((a) =>
    a.data.replace(/^"(.*)"$/, '$1')
  );
}

export function findVerificationToken(txtRecords: string[], expectedToken: string): boolean {
  return txtRecords.some((r) => r === expectedToken || r.trim() === expectedToken);
}

export function buildTxtRecord(token: string): string {
  return `vietsale-domain-verify=${token}`;
}
