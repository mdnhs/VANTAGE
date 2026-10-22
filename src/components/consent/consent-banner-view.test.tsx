// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConsentBannerView, type ConsentCopy } from './consent-banner-view';

afterEach(cleanup);

const copy: ConsentCopy = {
  title: 'Your privacy',
  body: 'Body text',
  accept: 'Accept all',
  reject: 'Reject all',
  customise: 'Customise',
  save: 'Save choices',
  policyLabel: 'Privacy policy',
  policyHref: '/privacy',
  categories: { necessary: 'Necessary text', analytics: 'Analytics text', marketing: 'Marketing text' },
};
const handlers = () => ({
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onCustomise: vi.fn(),
  onSave: vi.fn(),
  onToggle: vi.fn(),
});
const choice = { analytics: false, marketing: false };

describe('ConsentBannerView', () => {
  it('gives accept, reject and customise identical classes on the first layer', () => {
    render(<ConsentBannerView copy={copy} mode='first' choice={choice} {...handlers()} />);
    const dialog = screen.getByRole('dialog', { name: 'Your privacy' });
    expect(dialog.getAttribute('aria-modal')).toBe('false');
    const buttons = ['Accept all', 'Reject all', 'Customise'].map((name) => screen.getByRole('button', { name }));
    expect(new Set(buttons.map((b) => b.className)).size).toBe(1);
    expect(screen.getByRole('link', { name: 'Privacy policy' }).getAttribute('href')).toBe('/privacy');
  });

  it('custom mode shows three checkboxes with necessary checked and disabled', () => {
    const h = handlers();
    render(<ConsentBannerView copy={copy} mode='custom' choice={choice} {...h} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    const necessary = screen.getByRole<HTMLInputElement>('checkbox', { name: /Necessary/ });
    expect(necessary.checked).toBe(true);
    expect(necessary.disabled).toBe(true);
    const analytics = screen.getByRole<HTMLInputElement>('checkbox', { name: /Analytics/ });
    expect(analytics.checked).toBe(false);
    fireEvent.click(analytics);
    expect(h.onToggle).toHaveBeenCalledWith('analytics', true);
    fireEvent.click(screen.getByRole('button', { name: 'Save choices' }));
    expect(h.onSave).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Reject all' })).toBeTruthy();
  });

  it('omits the policy link without policyHref', () => {
    render(<ConsentBannerView copy={{ ...copy, policyHref: '' }} mode='first' choice={choice} {...handlers()} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('positions absolutely when inline', () => {
    render(<ConsentBannerView copy={copy} mode='first' choice={choice} inline {...handlers()} />);
    expect(screen.getByRole('dialog').className).toContain('absolute');
  });
});
