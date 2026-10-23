import { describe, expect, it, vi } from 'vitest';

import { captureAuthLinks, deliverAuthEmail, isInviteLink, recordAuthLink } from './email';

const link = (callback: string) =>
  `http://localhost:3000/api/auth/reset-password/tok123?callbackURL=${encodeURIComponent(callback)}`;

describe('isInviteLink', () => {
  it.each([
    ['/dashboard/reset-password?invite=1', true],
    ['/reset-password?a=b&invite=1', true],
    ['/reset-password', false],
    ['/reset-password?invite=10', false],
    ['/reset-password?noinvite=1', false],
    ['/reset-password?x=invite%3D1', false],
  ])('%s -> %s', (callback, expected) => {
    expect(isInviteLink(link(callback))).toBe(expected);
  });

  it('is false without a callbackURL or for garbage', () => {
    expect(isInviteLink('http://localhost:3000/api/auth/reset-password/t')).toBe(false);
    expect(isInviteLink('not a url?invite=1')).toBe(false);
  });
});

describe('deliverAuthEmail', () => {
  const user = { name: 'Ed', email: 'ed@example.com' };

  it('returns the link as manualLink when SMTP is not configured, sending nothing', async () => {
    const send = vi.fn();
    const url = link('/reset-password?invite=1');
    await expect(deliverAuthEmail(user, url, send, () => false)).resolves.toEqual({ manualLink: url });
    expect(send).not.toHaveBeenCalled();
  });

  it('sends the invite template for invite links', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    await expect(deliverAuthEmail(user, link('/reset-password?invite=1'), send, () => true)).resolves.toEqual({});
    expect(send.mock.calls[0]![0]).toMatchObject({ to: 'ed@example.com', subject: expect.stringMatching(/invited/i) });
  });

  it('sends the reset template otherwise', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    await deliverAuthEmail(user, link('/reset-password'), send, () => true);
    expect(send.mock.calls[0]![0].subject).toMatch(/reset/i);
  });

  it('resolves before a never-settling send when SMTP is configured', async () => {
    const send = vi.fn(() => new Promise<never>(() => {}));
    await expect(deliverAuthEmail(user, link('/x'), send, () => true)).resolves.toEqual({});
    expect(send).toHaveBeenCalledOnce();
  });

  it('logs background failures without the link or token, and never throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const url = link('/x');
    await expect(
      deliverAuthEmail(
        user,
        url,
        () => Promise.reject(new Error('boom')),
        () => true,
      ),
    ).resolves.toEqual({});
    await expect(
      deliverAuthEmail(
        user,
        url,
        () => {
          throw new Error('sync');
        },
        () => true,
      ),
    ).resolves.toEqual({});
    await new Promise((r) => setTimeout(r, 0));
    expect(error).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(error.mock.calls)).not.toContain('tok123');
    error.mockRestore();
  });
});

describe('captureAuthLinks', () => {
  it('collects links recorded inside, and nothing outside', async () => {
    recordAuthLink('http://outside.test/ignored');
    const { result, links } = await captureAuthLinks(async () => {
      await Promise.resolve();
      recordAuthLink('http://inside.test/one');
      return 42;
    });
    expect(result).toBe(42);
    expect(links).toEqual(['http://inside.test/one']);
  });
});
