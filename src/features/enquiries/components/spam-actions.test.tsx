// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActorProvider } from '@/contexts/actor-provider';
import type { MePayload } from '@/lib/auth/me';
import { SpamActions } from './spam-actions';
import { QuoteStatusBadge } from '@/features/quote-requests/components/quote-status-badge';
import { ContactStatusBadge } from '@/features/contact-messages/components/contact-status-badge';

const mockQuoteMutate = vi.fn();
const mockContactMutate = vi.fn();

vi.mock('@/features/auth/hooks/use-me', () => ({
  useMe: (actor: MePayload) => ({ data: actor }),
}));

vi.mock('@/features/quote-requests/hooks/api/mutation/use-update-quote-request', () => ({
  useUpdateQuoteRequest: () => ({
    mutate: mockQuoteMutate,
    isPending: false,
  }),
}));

vi.mock('@/features/contact-messages/hooks/api/mutation/use-update-contact-message', () => ({
  useUpdateContactMessage: () => ({
    mutate: mockContactMutate,
    isPending: false,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

import { permissionMap } from '@/lib/auth/permissions';

const renderWithActor = (ui: React.ReactNode, actor: Partial<MePayload> = {}) => {
  const fullActor: MePayload = {
    user: { id: 'u1', email: 'admin@test.com', name: 'Admin' },
    roles: ['admin'],
    permissions: permissionMap(['admin']),
    twoFactorEnabled: false,
    impersonatedBy: null,
    ...actor,
  };
  return render(<ActorProvider actor={fullActor}>{ui}</ActorProvider>);
};

describe('SpamActions', () => {
  it('calls update with { status: "spam" } on "Mark as spam"', () => {
    renderWithActor(<SpamActions kind='quote' id='q1' status='new' />);
    const btn = screen.getByRole('button', { name: /Mark as spam/i });
    fireEvent.click(btn);
    expect(mockQuoteMutate).toHaveBeenCalledWith({ status: 'spam' });
  });

  it('calls update with { status: "new" } on "Not spam"', () => {
    renderWithActor(<SpamActions kind='quote' id='q1' status='spam' />);
    const btn = screen.getByRole('button', { name: /Not spam/i });
    fireEvent.click(btn);
    expect(mockQuoteMutate).toHaveBeenCalledWith({ status: 'new' });
  });

  it('renders nothing under View-as', () => {
    renderWithActor(<SpamActions kind='quote' id='q1' status='new' />, { impersonatedBy: 'admin-1' });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders nothing if role lacks update rights', () => {
    renderWithActor(<SpamActions kind='quote' id='q1' status='new' />, { roles: ['viewer'] });
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Status badges', () => {
  it('renders the danger tone with label "Spam"', () => {
    const { container: quoteContainer } = render(<QuoteStatusBadge status='spam' />);
    const quotePill = quoteContainer.querySelector('[data-tone]');
    expect(quotePill).not.toBeNull();
    expect(quotePill?.getAttribute('data-tone')).toBe('danger');
    expect(quotePill?.textContent).toBe('Spam');

    const { container: contactContainer } = render(<ContactStatusBadge status='spam' />);
    const contactPill = contactContainer.querySelector('[data-tone]');
    expect(contactPill).not.toBeNull();
    expect(contactPill?.getAttribute('data-tone')).toBe('danger');
    expect(contactPill?.textContent).toBe('Spam');
  });

  it('renders spam reason when available', () => {
    const { container } = render(<QuoteStatusBadge status='spam' spamReason='honeypot' />);
    expect(container.textContent).toBe('Spam · Hidden field filled in');
  });
});
