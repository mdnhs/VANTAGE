'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Save,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import {
  formatFullDate,
  formatServiceType,
  getAvatarColor,
  getInitials,
} from '@/features/quote-requests/components/inbox/quote-inbox-formatters';
import { ContactStatusBadge } from '../contact-status-badge';
import { useUpdateContactMessage } from '../../hooks/api/mutation/use-update-contact-message';
import { useDeleteContactMessage } from '../../hooks/api/mutation/use-delete-contact-message';
import { CONTACT_STATUSES, type ContactMessage, type ContactStatus } from '../../types';

interface ContactInboxDetailProps {
  message: ContactMessage;
  onCloseMobile?: () => void;
  onDeleted?: (id: string) => void;
}

export function ContactInboxDetail({ message, onCloseMobile, onDeleted }: ContactInboxDetailProps) {
  const [status, setStatus] = useState<ContactStatus>(message.status as ContactStatus);
  const [adminNotes, setAdminNotes] = useState<string>(message.adminNotes ?? '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const updateMessage = useUpdateContactMessage(message.id);
  const deleteMessage = useDeleteContactMessage();

  const fullName = `${message.firstName} ${message.lastName}`.trim();
  const phoneDigits = message.phone.replace(/[^\d+]/g, '');

  const handleStatusChange = async (newStatus: ContactStatus) => {
    setStatus(newStatus);
    await updateMessage.mutateAsync({ status: newStatus });
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    await updateMessage.mutateAsync({
      status,
      adminNotes: adminNotes.trim() ? adminNotes.trim() : null,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete message from "${fullName}"? This cannot be undone.`)) {
      deleteMessage.mutate(message.id, { onSuccess: () => onDeleted?.(message.id) });
    }
  };

  const photos = message.photoUrls ?? [];

  return (
    <div className='flex h-full w-full min-w-0 flex-1 flex-col overflow-y-auto bg-background'>
      {/* Top action toolbar */}
      <div className='sticky top-0 z-20 flex w-full flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur-xs sm:px-6'>
        <div className='flex items-center gap-2'>
          {onCloseMobile && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={onCloseMobile}
              className='h-8 gap-1 px-2 text-xs lg:hidden'
            >
              <ArrowLeft className='size-3.5' />
              <span>Inbox</span>
            </Button>
          )}

          <Select
            value={status}
            disabled={updateMessage.isPending}
            onValueChange={(val) => handleStatusChange(val as ContactStatus)}
          >
            <SelectTrigger className='h-8 w-[140px] text-xs'>
              <SelectValue>
                <ContactStatusBadge status={status} />
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
        </div>

        <div className='flex items-center gap-1 sm:gap-1.5'>
          <a
            href={`https://wa.me/${phoneDigits.replace('+', '')}`}
            target='_blank'
            rel='noopener noreferrer'
            title='Chat on WhatsApp'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 gap-1.5 border-emerald-500/30 px-2.5 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400',
            )}
          >
            <MessageSquare className='size-3.5' />
            <span className='hidden sm:inline'>WhatsApp</span>
          </a>

          <a
            href={`tel:${phoneDigits}`}
            title='Call'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 gap-1.5 border-blue-500/30 px-2.5 text-xs text-blue-600 hover:bg-blue-500/10 dark:text-blue-400',
            )}
          >
            <Phone className='size-3.5' />
            <span className='hidden sm:inline'>Call</span>
          </a>

          <a
            href={`mailto:${message.email}?subject=Re: Your enquiry — Vantage Autobody`}
            title='Reply via email'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground',
            )}
          >
            <Mail className='size-3.5' />
            <span className='hidden sm:inline'>Email</span>
          </a>

          <Link
            href={APP_ROUTES.leads.contacts.details(message.id)}
            title='Open standalone page'
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'size-8 text-muted-foreground hover:text-foreground',
            )}
          >
            <ExternalLink className='size-3.5' />
          </Link>

          <Button
            type='button'
            variant='ghost'
            size='icon'
            title='Delete message'
            disabled={deleteMessage.isPending}
            onClick={handleDelete}
            className='size-8 text-destructive hover:bg-destructive/10'
          >
            <Trash2 className='size-3.5' />
          </Button>
        </div>
      </div>

      {/* Reading body */}
      <div className='flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8'>
        <div className='flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5'>
          <div className='flex items-start gap-3.5'>
            <div
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-full border text-sm font-bold shadow-xs',
                getAvatarColor(fullName),
              )}
            >
              {getInitials(fullName)}
            </div>

            <div className='flex flex-col gap-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='text-lg font-bold tracking-tight text-foreground sm:text-xl'>{fullName}</h2>
                <ContactStatusBadge status={status} />
              </div>

              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                <a href={`mailto:${message.email}`} className='hover:text-foreground hover:underline'>
                  {message.email}
                </a>
                <span>•</span>
                <a href={`tel:${phoneDigits}`} className='font-mono hover:text-foreground hover:underline'>
                  {message.phone}
                </a>
              </div>

              <div className='mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/80'>
                <Calendar className='size-3 shrink-0' />
                <span>{formatFullDate(message.createdAt)}</span>
                <span>•</span>
                <span className='capitalize'>Via {message.source.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service interest chip */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted'>
              <Wrench className='size-4 text-red-600' />
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Service Interest</span>
              <span className='truncate text-xs font-semibold text-foreground'>
                {formatServiceType(message.service)}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted'>
              <Phone className='size-4 text-foreground' />
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Phone</span>
              <span className='truncate font-mono text-xs font-semibold text-foreground'>{message.phone}</span>
            </div>
          </div>
        </div>

        {/* Message body */}
        <div className='flex flex-col gap-2'>
          <span className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>Message</span>
          <div className='rounded-xl border border-border/70 bg-card/60 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground sm:p-5'>
            {message.message}
          </div>
        </div>

        {/* Attachments */}
        {photos.length > 0 && (
          <div className='flex flex-col gap-2.5'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                Attachments ({photos.length})
              </span>
              <span className='text-[11px] text-muted-foreground'>Click to expand full resolution</span>
            </div>

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  type='button'
                  onClick={() => setSelectedPhoto(url)}
                  className='group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-black text-left shadow-2xs transition-all hover:border-red-500/50 hover:shadow-xs'
                >
                  <Image
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    fill
                    sizes='(max-width: 768px) 50vw, 25vw'
                    className='object-cover transition-transform duration-300 group-hover:scale-105'
                  />
                  <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
                    <ExternalLink className='size-4 text-white' />
                  </div>
                  <span className='absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white/90'>
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Internal notes */}
        <form
          onSubmit={handleSaveNotes}
          className='flex flex-col gap-4 rounded-xl border border-border/80 bg-muted/15 p-4 sm:p-5'
        >
          <div className='flex items-center justify-between border-b border-border/50 pb-3'>
            <div>
              <h3 className='text-xs font-semibold tracking-wider text-foreground uppercase'>Internal Notes</h3>
              <p className='text-[11px] text-muted-foreground'>
                Private notes for the team — never shown to the customer.
              </p>
            </div>
            {savedSuccess && (
              <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                <Check className='size-3.5' />
                Saved
              </span>
            )}
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='contact-inbox-status' className='text-xs'>
                Status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContactStatus)}>
                <SelectTrigger id='contact-inbox-status' className='h-8 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className='text-xs'>
                      <ContactStatusBadge status={s} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5 sm:col-span-2'>
              <Label htmlFor='contact-inbox-notes' className='text-xs'>
                Notes (Private)
              </Label>
              <Textarea
                id='contact-inbox-notes'
                rows={3}
                placeholder='Call outcome, follow-up date, who replied...'
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className='resize-y text-xs leading-relaxed'
              />
            </div>
          </div>

          <div className='flex items-center justify-between pt-1'>
            {updateMessage.isError ? (
              <span className='flex items-center gap-1 text-xs text-destructive'>
                <AlertCircle className='size-3.5' />
                {updateMessage.error.message}
              </span>
            ) : (
              <span />
            )}

            <Button type='submit' size='sm' disabled={updateMessage.isPending} className='h-8 gap-1.5 text-xs'>
              <Save className='size-3.5' />
              <span>{updateMessage.isPending ? 'Saving…' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </div>

      {selectedPhoto && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4'
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            type='button'
            onClick={() => setSelectedPhoto(null)}
            className='absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20'
          >
            <X className='size-5' />
          </button>
          <div
            className='relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto}
              alt='Full resolution attachment'
              width={1400}
              height={900}
              className='max-h-[85vh] w-auto object-contain'
            />
          </div>
        </div>
      )}
    </div>
  );
}
