import { describe, expect, it } from 'vitest';
import { telHref, whatsappHref } from './phone';

describe('telHref', () => {
  it('dials e164 when it matches international format', () => {
    expect(telHref('+353 1 234 5678', '+35312345678')).toBe('tel:+35312345678');
  });

  it('falls back to display with non-digit non-plus stripped when e164 is invalid or empty', () => {
    expect(telHref('01 234 5678', '')).toBe('tel:012345678');
    expect(telHref('+353 (0) 1 234-5678', 'invalid')).toBe('tel:+353012345678');
  });
});

describe('whatsappHref', () => {
  it('builds wa.me link with digits only', () => {
    expect(whatsappHref('+353 1 234 5678')).toBe('https://wa.me/35312345678');
    expect(whatsappHref('087 123 4567')).toBe('https://wa.me/0871234567');
  });
});
