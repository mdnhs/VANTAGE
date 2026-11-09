'use client';

import { ArrowLeft, MessagesSquare, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { EmptyState } from '@/components/admin/dashboard/empty-state';
import { PageHeader, TOOLBAR_ACTION } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/contexts/actor-provider';
import type { SupportDetailDto, SupportListItemDto, SupportStatus } from '@/lib/support/types';
import { cn } from '@/lib/utils';
import { SUPPORT_MESSAGE_MAX } from '@/validations/support-schema';

import {
  useAssignSupportChat,
  useCloseSupportChat,
  useDeleteSupportChat,
  useMarkSupportRead,
  useSendSupportMessage,
  useSetSupportAi,
  useSupportAgents,
  useSupportDetail,
  useSupportList,
} from '../../hooks/use-support';

const PAGE = 50;
const UNASSIGNED = 'none';

const visitorLabel = (c: Pick<SupportListItemDto, 'visitorName' | 'visitorEmail'>) =>
  c.visitorName || c.visitorEmail || 'Website visitor';

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const stampOf = (iso: string) =>
  new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function SupportInboxView({ initialId }: { initialId: string | null }) {
  const [status, setStatus] = useState<SupportStatus>('open');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<string | null>(initialId);
  const { data, isPending, isError } = useSupportList(status, limit);

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Live chat' description='Chats started by visitors on the website.' />
      <div className='grid h-[calc(var(--content-h)-11rem)] min-h-[480px] overflow-hidden rounded-card border bg-card lg:grid-cols-[340px_minmax(0,1fr)]'>
        <section className={cn('flex min-h-0 flex-col border-r', selected && 'hidden lg:flex')}>
          <div className='border-b p-3'>
            <Tabs
              value={status}
              onValueChange={(value) => {
                setStatus(value as SupportStatus);
                setLimit(PAGE);
              }}
            >
              <TabsList className='w-full'>
                <TabsTrigger value='open'>Open</TabsTrigger>
                <TabsTrigger value='closed'>Closed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto'>
            {isPending ? (
              <div className='flex flex-col gap-2 p-3'>
                <Skeleton className='h-16' />
                <Skeleton className='h-16' />
                <Skeleton className='h-16' />
              </div>
            ) : isError ? (
              <p className='p-4 text-sm text-muted-foreground'>
                The chats could not be loaded. Reload the page to retry.
              </p>
            ) : data.items.length === 0 ? (
              <p className='p-4 text-sm text-muted-foreground'>
                {status === 'open' ? 'No open chats right now.' : 'No closed chats yet.'}
              </p>
            ) : (
              <ul>
                {data.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type='button'
                      onClick={() => setSelected(item.id)}
                      aria-current={item.id === selected}
                      className={cn(
                        'flex w-full cursor-pointer flex-col gap-1 border-b px-4 py-3 text-left hover:bg-muted/60',
                        item.id === selected && 'bg-muted',
                      )}
                    >
                      <span className='flex items-center justify-between gap-2'>
                        <span className={cn('truncate text-sm', item.unread ? 'font-bold' : 'font-medium')}>
                          {visitorLabel(item)}
                        </span>
                        <span className='shrink-0 text-xs text-muted-foreground'>{stampOf(item.lastMessageAt)}</span>
                      </span>
                      <span className='flex items-center gap-2'>
                        <span className='min-w-0 flex-1 truncate text-sm text-muted-foreground'>{item.preview}</span>
                        {item.unread ? (
                          <span className='size-2 shrink-0 rounded-full bg-primary'>
                            <span className='sr-only'>Unread</span>
                          </span>
                        ) : null}
                      </span>
                      <span className='flex items-center gap-2 text-xs text-muted-foreground'>
                        {item.assigneeName ?? 'Unassigned'}
                        {item.needsHuman ? (
                          <span className='rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive'>
                            Needs a person
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {data?.hasMore ? (
              <div className='p-3'>
                <Button variant='outline' className='w-full' onClick={() => setLimit((n) => Math.min(n + PAGE, 200))}>
                  Show more
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <section className={cn('min-h-0 min-w-0 flex-col', selected ? 'flex' : 'hidden lg:flex')}>
          {selected ? (
            <ChatThread key={selected} id={selected} onBack={() => setSelected(null)} />
          ) : (
            <div className='grid flex-1 place-items-center p-6'>
              <EmptyState
                icon={MessagesSquare}
                title='Choose a chat'
                description='The conversation with the visitor will open here.'
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChatThread({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isPending, isError } = useSupportDetail(id);
  const markRead = useMarkSupportRead(id);
  const markReadNow = markRead.mutate;
  const unread = data?.unread;
  const log = useRef<HTMLDivElement>(null);
  const count = data?.messages.length ?? 0;

  useEffect(() => {
    if (unread) markReadNow();
  }, [unread, count, markReadNow]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [count]);

  if (isPending) return <Skeleton className='m-4 h-full' />;
  if (isError) {
    return (
      <p className='p-6 text-sm text-muted-foreground'>This chat could not be opened. It may have been reassigned.</p>
    );
  }

  return (
    <>
      <ChatHeader chat={data} onBack={onBack} />
      <div
        ref={log}
        role='log'
        aria-live='polite'
        className='flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain bg-sidebar p-4'
      >
        {data.messages.map((m) =>
          m.sender === 'system' ? (
            <p key={m.id} className='py-1 text-center text-xs text-muted-foreground'>
              {m.body}
            </p>
          ) : (
            <div
              key={m.id}
              className={cn('flex max-w-[75%] flex-col gap-1', m.sender === 'staff' && 'items-end self-end')}
            >
              <p
                className={cn(
                  'rounded-xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap',
                  m.sender === 'staff' && 'bg-primary text-primary-foreground',
                  m.sender === 'visitor' && 'border bg-card',
                  m.sender === 'ai' && 'border border-dashed bg-muted',
                )}
              >
                {m.body}
              </p>
              <span className='text-xs text-muted-foreground'>
                {m.sender === 'staff' && m.senderName ? `${m.senderName}, ` : ''}
                {m.sender === 'ai' ? `${m.senderName || 'AI assistant'}, ` : ''}
                {timeOf(m.createdAt)}
              </span>
            </div>
          ),
        )}
      </div>
      <Composer id={id} closed={data.status === 'closed'} />
    </>
  );
}

function ChatHeader({ chat, onBack }: { chat: SupportDetailDto; onBack: () => void }) {
  const canAssign = useCan({ support: ['assign'] });
  const canReply = useCan({ support: ['reply'] });
  const agents = useSupportAgents(canAssign);
  const assign = useAssignSupportChat(chat.id);
  const close = useCloseSupportChat(chat.id);
  const setAi = useSetSupportAi(chat.id);
  const remove = useDeleteSupportChat(chat.id);
  const [confirming, setConfirming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const open = chat.status === 'open';

  return (
    <header className='flex flex-wrap items-center gap-x-3 gap-y-2 border-b p-3'>
      <Button variant='ghost' size='icon' className='lg:hidden' onClick={onBack} aria-label='Back to chats'>
        <ArrowLeft />
      </Button>
      <div className='min-w-0 flex-1'>
        <h2 className='truncate text-sm font-semibold'>{visitorLabel(chat)}</h2>
        <p className='truncate text-xs text-muted-foreground'>
          {chat.visitorEmail ? (
            <a href={`mailto:${chat.visitorEmail}`} className='underline underline-offset-2'>
              {chat.visitorEmail}
            </a>
          ) : (
            'No email given'
          )}
          {chat.sourcePath ? ` · from ${chat.sourcePath}` : ''}
        </p>
      </div>
      {canAssign && open ? (
        <Select
          value={chat.assignedTo ?? UNASSIGNED}
          onValueChange={(value) => assign.mutate(value === UNASSIGNED ? null : (value as string))}
          disabled={assign.isPending}
        >
          <SelectTrigger className='h-9 w-[190px]' aria-label='Assign this chat'>
            <SelectValue>{chat.assigneeName ?? 'Unassigned'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {agents.data?.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
                {agent.online ? ' (online)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className='text-xs text-muted-foreground'>{chat.assigneeName ?? 'Unassigned'}</span>
      )}
      {canReply && open ? (
        <Button
          variant={chat.aiEnabled ? 'default' : 'outline'}
          className={TOOLBAR_ACTION}
          disabled={setAi.isPending}
          onClick={() => setAi.mutate(!chat.aiEnabled)}
        >
          {chat.aiEnabled ? 'Take over' : 'Hand back to AI'}
        </Button>
      ) : null}
      {canReply && open ? (
        <Button
          variant={confirming ? 'destructive' : 'outline'}
          className={TOOLBAR_ACTION}
          disabled={close.isPending}
          onBlur={() => setConfirming(false)}
          onClick={() => (confirming ? close.mutate() : setConfirming(true))}
        >
          {confirming ? 'Confirm end' : 'End chat'}
        </Button>
      ) : null}
      {canAssign ? (
        <Button
          variant={confirmingDelete ? 'destructive' : 'ghost'}
          className={TOOLBAR_ACTION}
          disabled={remove.isPending}
          onBlur={() => setConfirmingDelete(false)}
          onClick={() =>
            confirmingDelete ? remove.mutate(undefined, { onSuccess: onBack }) : setConfirmingDelete(true)
          }
        >
          {confirmingDelete ? 'Delete for good' : 'Delete'}
        </Button>
      ) : null}
    </header>
  );
}

function Composer({ id, closed }: { id: string; closed: boolean }) {
  const canReply = useCan({ support: ['reply'] });
  const [draft, setDraft] = useState('');
  const send = useSendSupportMessage(id);

  if (closed || !canReply) {
    return (
      <p className='border-t p-4 text-center text-sm text-muted-foreground'>
        {closed ? 'This chat has ended.' : 'You can read this chat but not reply.'}
      </p>
    );
  }

  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(body, { onSuccess: () => setDraft('') });
  };

  return (
    <div className='flex items-end gap-2 border-t p-3'>
      <Textarea
        rows={1}
        value={draft}
        maxLength={SUPPORT_MESSAGE_MAX}
        aria-label='Your reply'
        placeholder='Write a reply'
        className='max-h-32 min-h-10 resize-none'
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button
        size='icon'
        className='size-10'
        onClick={submit}
        disabled={send.isPending || !draft.trim()}
        aria-label='Send reply'
      >
        <SendHorizontal />
      </Button>
    </div>
  );
}
