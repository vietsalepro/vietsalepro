// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  isValidDomain,
  generateVerificationToken,
  parseTxtRecords,
  findVerificationToken,
} from '../../supabase/functions/_shared/domain-verification';

describe('domain-verification helpers', () => {
  describe('isValidDomain', () => {
    it('accepts a simple custom domain', () => {
      expect(isValidDomain('brand.example.com')).toBe(true);
    });

    it('accepts a domain with hyphens', () => {
      expect(isValidDomain('my-brand.co.uk')).toBe(true);
    });

    it('rejects a bare TLD', () => {
      expect(isValidDomain('example')).toBe(false);
    });

    it('rejects a URL with protocol', () => {
      expect(isValidDomain('https://brand.example.com')).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(isValidDomain('')).toBe(false);
    });

    it('rejects a domain starting with a hyphen', () => {
      expect(isValidDomain('-brand.example.com')).toBe(false);
    });
  });

  describe('generateVerificationToken', () => {
    it('returns a non-empty hex-like string', () => {
      const token = generateVerificationToken();
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('returns different tokens on successive calls', () => {
      const a = generateVerificationToken();
      const b = generateVerificationToken();
      expect(a).not.toBe(b);
    });
  });

  describe('parseTxtRecords', () => {
    it('extracts TXT values from a Google DoH response', () => {
      const dns = {
        Status: 0,
        Answer: [
          { name: 'example.com', type: 16, TTL: 300, data: '"token-a"' },
          { name: 'example.com', type: 1, TTL: 300, data: '1.2.3.4' },
          { name: 'example.com', type: 16, TTL: 300, data: '"token-b"' },
        ],
      };
      expect(parseTxtRecords(dns as any)).toEqual(['token-a', 'token-b']);
    });

    it('returns an empty array when DNS fails', () => {
      expect(parseTxtRecords({ Status: 3, Answer: [] } as any)).toEqual([]);
      expect(parseTxtRecords({ Status: 0 } as any)).toEqual([]);
    });
  });

  describe('findVerificationToken', () => {
    it('finds the exact token', () => {
      expect(findVerificationToken(['token-a', 'token-b'], 'token-a')).toBe(true);
    });

    it('ignores surrounding whitespace', () => {
      expect(findVerificationToken(['  token-a  '], 'token-a')).toBe(true);
    });

    it('returns false when token is missing', () => {
      expect(findVerificationToken(['token-a'], 'token-b')).toBe(false);
    });
  });
});
