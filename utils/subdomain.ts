export const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

export const RESERVED_SUBDOMAINS = new Set(['admin', 'www', 'api', 'app']);

export function normalizeSubdomain(subdomain: string): string {
  return subdomain.trim().toLowerCase();
}

export function isValidSubdomainFormat(subdomain: string): boolean {
  const s = normalizeSubdomain(subdomain);
  return s.length >= 3 && s.length <= 63 && SUBDOMAIN_REGEX.test(s) && !RESERVED_SUBDOMAINS.has(s);
}
