'use client';

import {
  ArrowLeft,
  Bot,
  Globe,
  Hand,
  Mail,
  MessagesSquare,
  SendHorizontal,
  Square,
  Trash2,
  UserRound,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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

import { LinkifiedText } from '../widget/linkified-text';

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
const dayKey = (iso: string) => new Date(iso).toDateString();

// "12:25" today, "Yesterday", or "11 Nov" for the list; the full stamp is in the title.
function shortStamp(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return timeOf(iso);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function dayLabel(iso: string) {
  const stamp = shortStamp(iso);
  if (stamp === 'Yesterday') return stamp;
  return dayKey(iso) === new Date().toDateString()
    ? 'Today'
    : new Date(iso).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

function initials(label: string) {
  const words = label
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean);
  return (words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0]?.slice(0, 2) ?? '')).toUpperCase();
}

// A round avatar: the visitor's initials, or a person icon for an anonymous visitor.
function Avatar({ label, className }: { label: string; className?: string }) {
  const anonymous = label === 'Website visitor';
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary',
        className,
      )}
    >
      {anonymous ? <UserRound className='size-[45%]' /> : initials(label)}
    </span>
  );
}

export function SupportInboxView({ initialId }: { initialId: string | null }) {
  const [status, setStatus] = useState<SupportStatus>('open');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<string | null>(initialId);
  const { data, isPending, isError } = useSupportList(status, limit);
  const unreadCount = data?.items.filter((item) => item.unread).length ?? 0;

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Live chat' description='Chats started by visitors on the website.' />
      <div className='grid h-[calc(var(--content-h)-11rem)] min-h-[520px] overflow-hidden rounded-card border bg-card shadow-xs lg:grid-cols-[360px_minmax(0,1fr)]'>
        <section aria-label='Chats' className={cn('flex min-h-0 flex-col border-r', selected && 'hidden lg:flex')}>
          <div className='flex flex-col gap-3 border-b p-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-base font-semibold'>Conversations</h2>
              {unreadCount > 0 ? (
                <span className='rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums'>
                  {unreadCount} unread
                </span>
              ) : null}
            </div>
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
                <Skeleton className='h-18' />
                <Skeleton className='h-18' />
                <Skeleton className='h-18' />
              </div>
            ) : isError ? (
              <p className='p-4 text-sm text-muted-foreground'>
                The chats could not be loaded. Reload the page to retry.
              </p>
            ) : data.items.length === 0 ? (
              <div className='p-6'>
                <EmptyState
                  icon={MessagesSquare}
                  title={status === 'open' ? 'No open chats right now.' : 'No closed chats yet.'}
                  description='New chats from the website appear here.'
                />
              </div>
            ) : (
              <ul className='flex flex-col gap-1 p-2'>
                <AnimatePresence initial={false}>
                  {data.items.map((item) => {
                    const active = item.id === selected;
                    const label = visitorLabel(item);
                    return (
                      // A chat that gets a new message moves to the top: it slides there, and a new
                      // chat fades in.
                      <motion.li
                        key={item.id}
                        layout='position'
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                      >
                        <button
                          type='button'
                          onClick={() => setSelected(item.id)}
                          aria-current={active}
                          className={cn(
                            'relative flex w-full cursor-pointer gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/70',
                            active && 'bg-primary/[0.07] hover:bg-primary/10',
                          )}
                        >
                          {active ? (
                            <span
                              aria-hidden
                              className='absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-primary'
                            />
                          ) : null}
                          <span className='relative'>
                            <Avatar label={label} />
                            {item.unread ? (
                              <span className='absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-primary'>
                                <span className='sr-only'>Unread</span>
                              </span>
                            ) : null}
                          </span>
                          <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                            <span className='flex items-baseline justify-between gap-2'>
                              <span className={cn('truncate text-sm', item.unread ? 'font-bold' : 'font-medium')}>
                                {label}
                              </span>
                              <time
                                dateTime={item.lastMessageAt}
                                title={new Date(item.lastMessageAt).toLocaleString()}
                                className={cn(
                                  'shrink-0 text-xs tabular-nums',
                                  item.unread ? 'font-semibold text-primary' : 'text-muted-foreground',
                                )}
                              >
                                {shortStamp(item.lastMessageAt)}
                              </time>
                            </span>
                            <span
                              className={cn(
                                'truncate text-sm',
                                item.unread ? 'text-foreground' : 'text-muted-foreground',
                              )}
                            >
                              {item.preview}
                            </span>
                            <span className='mt-1 flex flex-wrap items-center gap-1.5 text-xs'>
                              <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground'>
                                <UserRound aria-hidden className='size-3' />
                                {item.assigneeName ?? 'Unassigned'}
                              </span>
                              {item.needsHuman ? (
                                <span className='inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive'>
                                  <Hand aria-hidden className='size-3' />
                                  Needs a person
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
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

        <section
          aria-label='Conversation'
          className={cn('min-h-0 min-w-0 flex-col', selected ? 'flex' : 'hidden lg:flex')}
        >
          {selected ? (
            <ChatThread key={selected} id={selected} onBack={() => setSelected(null)} />
          ) : (
            <div className='grid flex-1 place-items-center bg-muted/30 p-6'>
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

  const label = visitorLabel(data);
  return (
    <>
      <ChatHeader chat={data} onBack={onBack} />
      <div
        ref={log}
        role='log'
        aria-live='polite'
        className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain bg-muted/30 px-4 py-5 sm:px-6'
      >
        <AnimatePresence initial={false}>
          {data.messages.map((m, index) => {
            const previous = data.messages[index - 1];
            const newDay = !previous || dayKey(previous.createdAt) !== dayKey(m.createdAt);
            // Consecutive messages from the same side share one avatar and one meta line.
            const sameAsNext = data.messages[index + 1]?.sender === m.sender;
            const outgoing = m.sender === 'staff' || m.sender === 'ai';
            return (
              // Messages already there on open just appear; new ones rise in from their own side.
              <motion.div
                key={m.id}
                className='flex flex-col gap-3'
                initial={{ opacity: 0, y: 10, x: outgoing ? 12 : -12 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {newDay ? (
                  <div
                    className='flex items-center gap-3 py-1 text-xs font-medium text-muted-foreground'
                    role='separator'
                  >
                    <span className='h-px flex-1 bg-border' />
                    {dayLabel(m.createdAt)}
                    <span className='h-px flex-1 bg-border' />
                  </div>
                ) : null}
                {m.sender === 'system' ? (
                  <p className='self-center rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground'>
                    {m.body}
                  </p>
                ) : (
                  <div className={cn('flex max-w-[80%] items-end gap-2', outgoing && 'flex-row-reverse self-end')}>
                    {outgoing ? (
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-8 shrink-0 place-items-center rounded-full',
                          m.sender === 'ai'
                            ? 'bg-foreground/[0.07] text-foreground'
                            : 'bg-primary text-primary-foreground',
                          sameAsNext && 'invisible',
                        )}
                      >
                        {m.sender === 'ai' ? <Bot className='size-4' /> : <UserRound className='size-4' />}
                      </span>
                    ) : (
                      <Avatar label={label} className={cn('size-8 text-xs', sameAsNext && 'invisible')} />
                    )}
                    <div className={cn('flex min-w-0 flex-col gap-1', outgoing && 'items-end')}>
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-xs',
                          m.sender === 'visitor' && 'rounded-bl-md border bg-card',
                          m.sender === 'ai' && 'rounded-br-md border border-foreground/10 bg-foreground/[0.04]',
                          m.sender === 'staff' && 'rounded-br-md bg-primary text-primary-foreground',
                        )}
                      >
                        <LinkifiedText text={m.body} />
                      </div>
                      {sameAsNext ? null : (
                        <span className='flex items-center gap-1 px-1 text-xs text-muted-foreground'>
                          {m.sender === 'ai' ? <Bot aria-hidden className='size-3' /> : null}
                          {m.sender === 'staff' && m.senderName ? `${m.senderName}, ` : ''}
                          {m.sender === 'ai' ? `${m.senderName || 'AI assistant'}, ` : ''}
                          {timeOf(m.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <Composer id={id} closed={data.status === 'closed'} aiActive={data.aiEnabled} />
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
  const label = visitorLabel(chat);

  return (
    <header className='flex flex-wrap items-center gap-x-3 gap-y-3 border-b px-4 py-3'>
      <Button variant='ghost' size='icon' className='lg:hidden' onClick={onBack} aria-label='Back to chats'>
        <ArrowLeft />
      </Button>
      <Avatar label={label} />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <h2 className='truncate text-base font-semibold'>{label}</h2>
          {!open ? (
            <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>Ended</span>
          ) : chat.aiEnabled ? (
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400'>
              <Bot aria-hidden className='size-3' />
              AI is answering
            </span>
          ) : (
            <span className='inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
              <UserRound aria-hidden className='size-3' />
              {chat.assigneeName ? `${chat.assigneeName} is answering` : 'A person is answering'}
            </span>
          )}
        </div>
        <p className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground'>
          <span className='inline-flex min-w-0 items-center gap-1'>
            <Mail aria-hidden className='size-3.5 shrink-0' />
            {chat.visitorEmail ? (
              <a href={`mailto:${chat.visitorEmail}`} className='truncate underline-offset-2 hover:underline'>
                {chat.visitorEmail}
              </a>
            ) : (
              'No email given'
            )}
          </span>
          {chat.sourcePath ? (
            <span className='inline-flex min-w-0 items-center gap-1'>
              <Globe aria-hidden className='size-3.5 shrink-0' />
              <span className='truncate'>from {chat.sourcePath}</span>
            </span>
          ) : null}
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        {canAssign && open ? (
          <Select
            value={chat.assignedTo ?? UNASSIGNED}
            onValueChange={(value) => assign.mutate(value === UNASSIGNED ? null : (value as string))}
            disabled={assign.isPending}
          >
            <SelectTrigger className='h-9 w-[180px]' aria-label='Assign this chat'>
              <UserRound aria-hidden className='size-4 text-muted-foreground' />
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
        ) : null}
        {canReply && open ? (
          <Button
            variant={chat.aiEnabled ? 'default' : 'outline'}
            className={TOOLBAR_ACTION}
            disabled={setAi.isPending}
            onClick={() => setAi.mutate(!chat.aiEnabled)}
          >
            {chat.aiEnabled ? <Hand aria-hidden /> : <Bot aria-hidden />}
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
            <Square aria-hidden />
            {confirming ? 'Confirm end' : 'End chat'}
          </Button>
        ) : null}
        {canAssign ? (
          <Button
            variant={confirmingDelete ? 'destructive' : 'ghost'}
            size={confirmingDelete ? 'default' : 'icon'}
            className={cn(confirmingDelete ? TOOLBAR_ACTION : 'size-9 text-muted-foreground hover:text-destructive')}
            disabled={remove.isPending}
            aria-label={confirmingDelete ? undefined : 'Delete'}
            title={confirmingDelete ? undefined : 'Delete chat'}
            onBlur={() => setConfirmingDelete(false)}
            onClick={() =>
              confirmingDelete ? remove.mutate(undefined, { onSuccess: onBack }) : setConfirmingDelete(true)
            }
          >
            <Trash2 aria-hidden />
            {confirmingDelete ? 'Delete for good' : null}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function Composer({ id, closed, aiActive }: { id: string; closed: boolean; aiActive: boolean }) {
  const canReply = useCan({ support: ['reply'] });
  const [draft, setDraft] = useState('');
  const send = useSendSupportMessage(id);

  if (closed || !canReply) {
    return (
      <p className='border-t bg-muted/40 p-4 text-center text-sm text-muted-foreground'>
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
    <div className='border-t bg-card p-3 sm:px-4'>
      <div className='flex items-end gap-2 rounded-xl border bg-background p-1.5 pl-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50'>
        <Textarea
          rows={1}
          value={draft}
          maxLength={SUPPORT_MESSAGE_MAX}
          aria-label='Your reply'
          placeholder='Write a reply'
          className='max-h-32 min-h-9 resize-none border-0 bg-transparent px-0 py-2 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent'
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
          className='size-9 shrink-0 rounded-lg'
          onClick={submit}
          disabled={send.isPending || !draft.trim()}
          aria-label='Send reply'
        >
          <SendHorizontal />
        </Button>
      </div>
      <p className='mt-1.5 px-1 text-xs text-muted-foreground'>
        {aiActive ? 'Replying takes the chat over from the AI. ' : ''}Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
