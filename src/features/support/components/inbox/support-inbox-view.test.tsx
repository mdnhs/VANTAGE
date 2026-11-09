// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SupportDetailDto, SupportListItemDto } from '@/lib/support/types';

const h = vi.hoisted(() => ({ setAi: vi.fn(), list: [] as unknown[], detail: null as unknown }));

vi.mock('@/contexts/actor-provider', () => ({ useCan: () => true }));
vi.mock('../../hooks/use-support', () => {
  const idle = { mutate: vi.fn(), isPending: false };
  return {
    useSupportList: () => ({ data: { items: h.list, hasMore: false }, isPending: false, isError: false }),
    useSupportDetail: () => ({ data: h.detail, isPending: false, isError: false }),
    useSupportAgents: () => ({ data: [] }),
    useAssignSupportChat: () => idle,
    useCloseSupportChat: () => idle,
    useDeleteSupportChat: () => idle,
    useMarkSupportRead: () => idle,
    useSendSupportMessage: () => idle,
    useSetSupportAi: () => ({ mutate: h.setAi, isPending: false }),
  };
});

import { SupportInboxView } from './support-inbox-view';

const item = (over: Partial<SupportListItemDto> = {}): SupportListItemDto => ({
  id: 'c1',
  status: 'open',
  visitorName: 'Aoife',
  visitorEmail: null,
  assignedTo: null,
  assigneeName: null,
  preview: 'Do you fix dents?',
  lastMessageAt: '2026-11-09T10:00:00Z',
  unread: false,
  needsHuman: false,
  ...over,
});

const detail = (over: Partial<SupportDetailDto> = {}): SupportDetailDto => ({
  ...item(),
  sourcePath: '/services',
  aiEnabled: true,
  createdAt: '2026-11-09T10:00:00Z',
  messages: [
    { id: 'm1', sender: 'visitor', senderName: null, body: 'Do you fix dents?', createdAt: '2026-11-09T10:00:00Z' },
    { id: 'm2', sender: 'ai', senderName: 'AI assistant', body: 'Yes we do.', createdAt: '2026-11-09T10:00:05Z' },
  ],
  ...over,
});

beforeEach(() => {
  h.setAi.mockReset();
  h.list = [item()];
  h.detail = detail();
});
afterEach(cleanup);

describe('support inbox with the ai', () => {
  it('shows ai replies with an AI label, apart from staff and visitor', () => {
    render(<SupportInboxView initialId='c1' />);
    expect(screen.getByText('Yes we do.')).toBeTruthy();
    expect(screen.getByText(/AI assistant, /)).toBeTruthy();
  });

  it('offers Take over while the ai is on, and turns it off when clicked', () => {
    render(<SupportInboxView initialId='c1' />);
    fireEvent.click(screen.getByRole('button', { name: 'Take over' }));
    expect(h.setAi).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('button', { name: 'Hand back to AI' })).toBeNull();
  });

  it('offers Hand back to AI once a person has the chat, and turns it on when clicked', () => {
    h.detail = detail({ aiEnabled: false, assignedTo: 'u1', assigneeName: 'Sam' });
    render(<SupportInboxView initialId='c1' />);
    fireEvent.click(screen.getByRole('button', { name: 'Hand back to AI' }));
    expect(h.setAi).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('button', { name: 'Take over' })).toBeNull();
  });

  it('offers neither on a closed chat', () => {
    h.detail = detail({ status: 'closed' });
    render(<SupportInboxView initialId='c1' />);
    expect(screen.queryByRole('button', { name: 'Take over' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hand back to AI' })).toBeNull();
  });

  it('marks a chat that needs a person in the list', () => {
    h.list = [item({ needsHuman: true }), item({ id: 'c2', needsHuman: false })];
    render(<SupportInboxView initialId={null} />);
    expect(screen.getAllByText('Needs a person')).toHaveLength(1);
  });
});
