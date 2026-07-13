// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSmsProvider,
  normalizePhone,
} from '../../supabase/functions/_shared/sms';

describe('send-sms shared helpers', () => {
  describe('normalizePhone', () => {
    it('adds + prefix when missing', () => {
      expect(normalizePhone('912345678')).toBe('+912345678');
    });

    it('keeps existing + prefix', () => {
      expect(normalizePhone('+84912345678')).toBe('+84912345678');
    });

    it('strips non-digit characters', () => {
      expect(normalizePhone('(84) 912-345-678')).toBe('+84912345678');
    });

    it('returns null for empty input', () => {
      expect(normalizePhone('')).toBeNull();
    });

    it('returns null for invalid length', () => {
      expect(normalizePhone('123')).toBeNull();
    });
  });

  describe('createSmsProvider', () => {
    it('returns null when provider is not supported', () => {
      const provider = createSmsProvider({
        provider: 'vonage' as any,
        from: '+1234567890',
      });
      expect(provider).toBeNull();
    });

    it('returns null when Twilio credentials are missing', () => {
      const provider = createSmsProvider({
        provider: 'twilio',
        from: '+1234567890',
      });
      expect(provider).toBeNull();
    });
  });

  describe('TwilioSmsProvider', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ sid: 'SM123' }), { status: 200 }))
      );
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('sends one request per recipient', async () => {
      const provider = createSmsProvider({
        provider: 'twilio',
        from: '+1234567890',
        twilioAccountSid: 'ACtest',
        twilioAuthToken: 'token',
      });
      if (!provider) throw new Error('provider should not be null');

      const result = await provider.send({
        to: ['+84912345678', '+84987654321'],
        body: 'Xin chào',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.ids).toEqual(['SM123', 'SM123']);
    });

    it('throws when provider returns an error', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid to number' }), { status: 400 })
      );

      const provider = createSmsProvider({
        provider: 'twilio',
        from: '+1234567890',
        twilioAccountSid: 'ACtest',
        twilioAuthToken: 'token',
      });
      if (!provider) throw new Error('provider should not be null');

      await expect(
        provider.send({ to: ['+bad'], body: 'Xin chào' })
      ).rejects.toThrow('Twilio error 400: Invalid to number');
    });

    it('uses Basic auth with account SID and token', async () => {
      const provider = createSmsProvider({
        provider: 'twilio',
        from: '+1234567890',
        twilioAccountSid: 'ACtest',
        twilioAuthToken: 'token',
      });
      if (!provider) throw new Error('provider should not be null');

      await provider.send({ to: ['+84912345678'], body: 'Hi' });

      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toContain('/Accounts/ACtest/Messages.json');
      expect(init?.headers).toMatchObject({
        Authorization: `Basic ${btoa('ACtest:token')}`,
      });
    });
  });
});
