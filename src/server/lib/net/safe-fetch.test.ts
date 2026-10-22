import dns from 'node:dns';

import { afterEach, describe, expect, it, vi } from 'vitest';

const undiciFetch = vi.hoisted(() => vi.fn());
vi.mock('undici', async (orig) => {
  const actual = await orig<typeof import('undici')>();
  undiciFetch.mockImplementation(actual.fetch as never);
  return { ...actual, fetch: undiciFetch };
});

import { fetchFor, isPrivateAddress, PrivateAddressError } from './safe-fetch';

afterEach(() => vi.restoreAllMocks());

describe('isPrivateAddress', () => {
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '100.127.255.254',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.8',
    '192.168.1.1',
    '198.18.0.1',
    '198.19.255.255',
    '224.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'febf::1',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:10.0.0.5',
    '::127.0.0.1',
    '::0.0.0.5',
    '64:ff9b::7f00:1',
    '64:ff9b::10.0.0.1',
    '2002:7f00:1::',
    '2002:a9fe:a9fe::1',
    'not-an-ip',
  ])('treats %s as private', (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '100.63.255.255',
    '100.128.0.1',
    '172.15.0.1',
    '172.32.0.1',
    '192.0.2.1',
    '198.17.0.1',
    '198.20.0.1',
    '223.255.255.255',
    '2001:4860::8888',
    '2606:4700::1111',
    '::ffff:8.8.8.8',
    '::8.8.8.8',
    '64:ff9b::808:808',
    '2002:808:808::',
  ])('treats %s as public', (address) => {
    expect(isPrivateAddress(address)).toBe(false);
  });
});

describe('fetchFor', () => {
  it('uses the global fetch with redirects refused when private addresses are allowed', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    await fetchFor(true)('http://127.0.0.1:9/x', { method: 'GET', redirect: 'follow' });
    expect(spy.mock.calls[0]![1]!.redirect).toBe('error');
  });

  it('passes redirect:error and a dispatcher to undici when guarded', async () => {
    undiciFetch.mockResolvedValueOnce(new Response('{}'));
    await fetchFor(false)('https://api.example.com/x', { redirect: 'follow' });
    const init = undiciFetch.mock.calls[0]![1] as { redirect: string; dispatcher: unknown };
    expect(init.redirect).toBe('error');
    expect(init.dispatcher).toBeTruthy();
  });

  it('refuses an IP-literal host in a private range before connecting', async () => {
    await expect(fetchFor(false)('http://127.0.0.1:9/x')).rejects.toBeInstanceOf(PrivateAddressError);
    await expect(fetchFor(false)('http://[::1]:9/x')).rejects.toThrow('That address points to a private network');
    await expect(fetchFor(false)('http://2130706433/x')).rejects.toBeInstanceOf(PrivateAddressError);
  });

  it('refuses a name that resolves to a private address', async () => {
    const lookup = vi.spyOn(dns, 'lookup').mockImplementation(((_h: string, _o: unknown, cb: unknown) => {
      (cb as (e: null, a: { address: string; family: number }[]) => void)(null, [{ address: '10.0.0.5', family: 4 }]);
    }) as unknown as typeof dns.lookup);
    await expect(fetchFor(false)('http://evil.example/x')).rejects.toThrow('That address points to a private network');
    expect(lookup).toHaveBeenCalled();
  });

  it('refuses when any one of several answers is private', async () => {
    vi.spyOn(dns, 'lookup').mockImplementation(((_h: string, _o: unknown, cb: unknown) => {
      (cb as (e: null, a: { address: string; family: number }[]) => void)(null, [
        { address: '8.8.8.8', family: 4 },
        { address: '::ffff:127.0.0.1', family: 6 },
      ]);
    }) as unknown as typeof dns.lookup);
    await expect(fetchFor(false)('https://mixed.example/x')).rejects.toBeInstanceOf(PrivateAddressError);
  });
});
