'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Mail, MessageSquare, Phone, Trash2, Search, Inbox } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { ContactStatusBadge } from '../contact-status-badge';
import { ContactStatusTabs } from './contact-status-tabs';
import { useContactMessageList } from '../../hooks/api/query/use-contact-message-list';
import { useContactMessageStats } from '../../hooks/api/query/use-contact-message-stats';
import { useUpdateContactMessage } from '../../hooks/api/mutation/use-update-contact-message';
import { useDeleteContactMessage } from '../../hooks/api/mutation/use-delete-contact-message';
import { CONTACT_STATUSES, type ContactMessage, type ContactMessageStats, type ContactStatus } from '../../types';

interface ContactMessageTableProps {
  initialData: { data: ContactMessage[]; total: number };
  initialStats: ContactMessageStats;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusQuickSelect({ message }: { message: ContactMessage }) {
  const updateMessage = useUpdateContactMessage(message.id);

  return (
    <Select
      value={message.status}
      disabled={updateMessage.isPending}
      onValueChange={(val) => updateMessage.mutate({ status: val as ContactStatus })}
    >
      <SelectTrigger className='h-7 w-[125px] text-xs'>
        <SelectValue>
          <ContactStatusBadge status={message.status} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CONTACT_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className='text-xs'>
            <ContactStatusBadge status={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ContactMessageTable({ initialData, initialStats }: ContactMessageTableProps) {
  const [status, setStatus] = useState<ContactStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: stats } = useContactMessageStats();
  const { data } = useContactMessageList({
    page,
    limit,
    status,
    search: search ? search : undefined,
  });

  const rows = data?.data ?? initialData.data;
  const total = data?.pagination?.total ?? initialData.total;
  const currentStats = stats ?? initialStats;

  const deleteMessage = useDeleteContactMessage();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete contact inquiry from "${name}"? This cannot be undone.`)) {
      setPendingDeleteId(id);
      deleteMessage.mutate(id, { onSettled: () => setPendingDeleteId(null) });
    }
  };

  return (
    <div className='flex flex-col gap-5'>
      {/* Top Filter Tabs */}
      <ContactStatusTabs
        currentStatus={status}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        stats={currentStats}
      />

      {/* Search Bar */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='relative w-full max-w-sm'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder='Search name, email, phone, message...'
            className='pl-9 text-xs'
          />
        </div>
        <span className='text-xs text-muted-foreground'>
          Showing {rows.length} of {total} {total === 1 ? 'inquiry' : 'inquiries'}
        </span>
      </div>

      {/* Table Container */}
      {rows.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
            <Inbox className='size-5' />
          </div>
          <h3 className='mt-3 text-sm font-semibold'>No contact inquiries found</h3>
          <p className='mt-1 text-xs text-muted-foreground'>
            {search || status !== 'all'
              ? 'Try adjusting your search or status filter.'
              : 'Inquiries submitted through the /contact page will appear here in real time.'}
          </p>
        </div>
      ) : (
        <div className='overflow-x-auto rounded-lg border border-border'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground'>
                <th className='px-4 py-3'>Sender</th>
                <th className='px-4 py-3'>Service / Subject</th>
                <th className='px-4 py-3'>Message Preview</th>
                <th className='px-4 py-3'>Date Received</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {rows.map((msg) => {
                const fullName = `${msg.firstName} ${msg.lastName}`.trim();
                const phoneDigits = msg.phone.replace(/[^\d+]/g, '');
                return (
                  <tr key={msg.id} className='transition-colors hover:bg-muted/30'>
                    {/* Sender */}
                    <td className='px-4 py-3'>
                      <div className='flex flex-col'>
                        <span className='font-medium text-foreground'>{fullName}</span>
                        <span className='text-xs text-muted-foreground'>{msg.phone}</span>
                        <span className='max-w-[180px] truncate text-xs text-muted-foreground'>{msg.email}</span>
                      </div>
                    </td>

                    {/* Service */}
                    <td className='px-4 py-3'>
                      <span className='text-xs font-medium text-foreground'>{msg.service || 'General Enquiry'}</span>
                    </td>

                    {/* Message Preview */}
                    <td className='px-4 py-3'>
                      <div className='flex max-w-sm flex-col gap-1'>
                        <span className='line-clamp-2 text-xs text-muted-foreground'>{msg.message}</span>
                        {msg.photoUrls && msg.photoUrls.length > 0 && (
                          <span className='inline-flex w-fit items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
                            📷 {msg.photoUrls.length} {msg.photoUrls.length === 1 ? 'attachment' : 'attachments'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className='px-4 py-3 text-xs whitespace-nowrap text-muted-foreground'>
                      {formatDate(msg.createdAt)}
                    </td>

                    {/* Status */}
                    <td className='px-4 py-3'>
                      <StatusQuickSelect message={msg} />
                    </td>

                    {/* Actions */}
                    <td className='px-4 py-3 text-right whitespace-nowrap'>
                      <div className='flex items-center justify-end gap-1'>
                        {/* WhatsApp */}
                        {phoneDigits && (
                          <a
                            href={`https://wa.me/${phoneDigits.replace('+', '')}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            title='Chat on WhatsApp'
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'icon' }),
                              'size-8 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400',
                            )}
                          >
                            <MessageSquare className='size-4' />
                          </a>
                        )}

                        {/* Call */}
                        {phoneDigits && (
                          <a
                            href={`tel:${phoneDigits}`}
                            title='Call sender'
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'icon' }),
                              'size-8 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400',
                            )}
                          >
                            <Phone className='size-4' />
                          </a>
                        )}

                        {/* Email */}
                        {msg.email && (
                          <a
                            href={`mailto:${msg.email}?subject=Re: Your enquiry with Vantage Workshop`}
                            title='Send Email'
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'icon' }),
                              'size-8 text-purple-500 hover:bg-purple-500/10 hover:text-purple-400',
                            )}
                          >
                            <Mail className='size-4' />
                          </a>
                        )}

                        {/* View Details */}
                        <Link
                          href={APP_ROUTES.leads.contacts.details(msg.id)}
                          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8 text-foreground')}
                          title='View details'
                        >
                          <Eye className='size-4' />
                        </Link>

                        {/* Delete */}
                        <Button
                          variant='ghost'
                          size='icon'
                          disabled={pendingDeleteId === msg.id}
                          onClick={() => handleDelete(msg.id, fullName)}
                          className='size-8 text-red-500 hover:bg-red-500/10 hover:text-red-600'
                          title='Delete inquiry'
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
