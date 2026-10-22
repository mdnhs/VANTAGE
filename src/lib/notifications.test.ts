import { describe, expect, it } from 'vitest';
import { badgeText } from './notifications';

describe('badgeText', () => {
  it('shows the count up to 9', () => {
    expect(badgeText(0)).toBe('0');
    expect(badgeText(9)).toBe('9');
  });

  it('caps above 9', () => {
    expect(badgeText(10)).toBe('9+');
  });
});
