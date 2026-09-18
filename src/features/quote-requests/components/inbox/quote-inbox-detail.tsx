'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Save,
  Trash2,
  Wrench,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { QuoteStatusBadge } from '../quote-status-badge';
import { useUpdateQuoteRequest } from '../../hooks/api/mutation/use-update-quote-request';
import { useDeleteQuoteRequest } from '../../hooks/api/mutation/use-delete-quote-request';
import { QUOTE_STATUSES, type QuoteRequest, type QuoteStatus } from '../../types';
import { formatFullDate, formatServiceType, getAvatarColor, getInitials } from './quote-inbox-formatters';

interface QuoteInboxDetailProps {
  quote: QuoteRequest;
  onCloseMobile?: () => void;
  onDeleted?: (id: string) => void;
}

export function QuoteInboxDetail({ quote, onCloseMobile, onDeleted }: QuoteInboxDetailProps) {
  const [status, setStatus] = useState<QuoteStatus>(quote.status as QuoteStatus);
  const [estimatedCost, setEstimatedCost] = useState<string>(quote.estimatedCost ?? '');
  const [adminNotes, setAdminNotes] = useState<string>(quote.adminNotes ?? '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const updateQuote = useUpdateQuoteRequest(quote.id);
  const deleteQuote = useDeleteQuoteRequest();

  const phoneDigits = quote.phone.replace(/[^\d+]/g, '');

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    setStatus(newStatus);
    await updateQuote.mutateAsync({ status: newStatus });
  };

  const handleSaveWorkshopNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    await updateQuote.mutateAsync({
      status,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      adminNotes: adminNotes.trim() ? adminNotes.trim() : null,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete quote request from "${quote.name}"? This cannot be undone.`)) {
      deleteQuote.mutate(quote.id, {
        onSuccess: () => {
          onDeleted?.(quote.id);
        },
      });
    }
  };

  return (
    <div className='flex h-full w-full min-w-0 flex-1 flex-col overflow-y-auto bg-background'>
      {/* Top Action Toolbar */}
      <div className='sticky top-0 z-20 flex w-full flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur-xs sm:px-6'>
        {/* Left: Mobile Back Button & Status Dropdown */}
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
            disabled={updateQuote.isPending}
            onValueChange={(val) => handleStatusChange(val as QuoteStatus)}
          >
            <SelectTrigger className='h-8 w-[130px] text-xs'>
              <SelectValue>
                <QuoteStatusBadge status={status} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {QUOTE_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className='text-xs'>
                  <QuoteStatusBadge status={s} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right: Fast Contact & Actions */}
        <div className='flex items-center gap-1 sm:gap-1.5'>
          {/* WhatsApp Direct */}
          <a
            href={`https://wa.me/${phoneDigits.replace('+', '')}`}
            target='_blank'
            rel='noopener noreferrer'
            title='Chat with customer on WhatsApp'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 gap-1.5 border-emerald-500/30 px-2.5 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400',
            )}
          >
            <MessageSquare className='size-3.5' />
            <span className='hidden sm:inline'>WhatsApp</span>
          </a>

          {/* Call Customer */}
          <a
            href={`tel:${phoneDigits}`}
            title='Call customer phone'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 gap-1.5 border-blue-500/30 px-2.5 text-xs text-blue-600 hover:bg-blue-500/10 dark:text-blue-400',
            )}
          >
            <Phone className='size-3.5' />
            <span className='hidden sm:inline'>Call</span>
          </a>

          {/* Email Reply */}
          <a
            href={`mailto:${quote.email}?subject=Regarding Your Quote Request — Vantage Autobody`}
            title='Reply via email'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground',
            )}
          >
            <Mail className='size-3.5' />
            <span className='hidden sm:inline'>Email</span>
          </a>

          {/* Full Page Link */}
          <Link
            href={APP_ROUTES.leads.quotes.details(quote.id)}
            title='Open standalone page'
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'size-8 text-muted-foreground hover:text-foreground',
            )}
          >
            <ExternalLink className='size-3.5' />
          </Link>

          {/* Delete Quote */}
          <Button
            type='button'
            variant='ghost'
            size='icon'
            title='Delete inquiry'
            disabled={deleteQuote.isPending}
            onClick={handleDelete}
            className='size-8 text-destructive hover:bg-destructive/10'
          >
            <Trash2 className='size-3.5' />
          </Button>
        </div>
      </div>

      {/* Main Email Reading Body */}
      <div className='flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8'>
        {/* Email Header: Customer & Meta */}
        <div className='flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5'>
          <div className='flex items-start gap-3.5'>
            <div
              className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-full border text-sm font-bold shadow-xs',
                getAvatarColor(quote.name),
              )}
            >
              {getInitials(quote.name)}
            </div>

            <div className='flex flex-col gap-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='text-lg font-bold tracking-tight text-foreground sm:text-xl'>{quote.name}</h2>
                <QuoteStatusBadge status={status} />
              </div>

              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                <a href={`mailto:${quote.email}`} className='hover:text-foreground hover:underline'>
                  {quote.email}
                </a>
                <span>•</span>
                <a href={`tel:${phoneDigits}`} className='font-mono hover:text-foreground hover:underline'>
                  {quote.phone}
                </a>
              </div>

              <div className='mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/80'>
                <Calendar className='size-3 shrink-0' />
                <span>{formatFullDate(quote.createdAt)}</span>
                <span>•</span>
                <span className='capitalize'>Via {quote.source.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Registration Plate Tag */}
          {quote.registration && (
            <div className='flex flex-col items-start sm:items-end'>
              <span className='inline-flex items-center rounded border border-neutral-300 bg-amber-400 px-3 py-1 font-mono text-sm font-bold tracking-wider text-black uppercase shadow-xs'>
                {quote.registration}
              </span>
              <span className='mt-1 text-[10px] font-medium text-muted-foreground uppercase'>Registration</span>
            </div>
          )}
        </div>

        {/* Vehicle & Requested Service Chips */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {/* Vehicle card */}
          <div className='flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
              <Car className='size-4 text-foreground' />
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Vehicle Model</span>
              <span className='truncate text-xs font-semibold text-foreground'>
                {[quote.year, quote.make, quote.model].filter(Boolean).join(' ') || 'Not Specified'}
              </span>
            </div>
          </div>

          {/* Service card */}
          <div className='flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
              <Wrench className='size-4 text-red-600' />
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Service Required</span>
              <span className='truncate text-xs font-semibold text-foreground'>
                {formatServiceType(quote.serviceType)}
              </span>
            </div>
          </div>

          {/* Registration card */}
          <div className='flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2 lg:col-span-1'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-muted-foreground'>
              IRL
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Irish Reg Plate</span>
              <span className='truncate font-mono text-xs font-bold text-foreground uppercase'>
                {quote.registration || 'No Plate Entered'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Message (The "Email Body") */}
        <div className='flex flex-col gap-2'>
          <span className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
            Customer Damage Description
          </span>
          <div className='rounded-xl border border-border/70 bg-card/60 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground sm:p-5'>
            {quote.description ? (
              quote.description
            ) : (
              <span className='text-muted-foreground italic'>
                No specific damage notes were written by the customer.
              </span>
            )}
          </div>
        </div>

        {/* Attachments: Customer Photos */}
        {quote.photoUrls && quote.photoUrls.length > 0 && (
          <div className='flex flex-col gap-2.5'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                Attached Damage Photos ({quote.photoUrls.length})
              </span>
              <span className='text-[11px] text-muted-foreground'>Click to expand full resolution</span>
            </div>

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
              {quote.photoUrls.map((url, idx) => (
                <button
                  key={idx}
                  type='button'
                  onClick={() => setSelectedPhoto(url)}
                  className='group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-black text-left shadow-2xs transition-all hover:border-red-500/50 hover:shadow-xs'
                >
                  <Image
                    src={url}
                    alt={`Damage image ${idx + 1}`}
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

        {/* Workshop Management & Cost Estimation (The "Reply / Internal Note" Footer) */}
        <form
          onSubmit={handleSaveWorkshopNotes}
          className='flex flex-col gap-4 rounded-xl border border-border/80 bg-muted/15 p-4 sm:p-5'
        >
          <div className='flex items-center justify-between border-b border-border/50 pb-3'>
            <div>
              <h3 className='text-xs font-semibold tracking-wider text-foreground uppercase'>
                Workshop Notes &amp; Estimation
              </h3>
              <p className='text-[11px] text-muted-foreground'>
                Record estimated repair costs and private internal notes for technicians.
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
              <Label htmlFor='inbox-estimatedCost' className='text-xs'>
                Estimated Repair Cost (€ EUR)
              </Label>
              <Input
                id='inbox-estimatedCost'
                type='number'
                step='0.01'
                min='0'
                placeholder='e.g. 650.00'
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='inbox-status' className='text-xs'>
                Current Lead Status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as QuoteStatus)}>
                <SelectTrigger id='inbox-status' className='h-8 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className='text-xs'>
                      <QuoteStatusBadge status={s} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5 sm:col-span-2'>
              <Label htmlFor='inbox-adminNotes' className='text-xs'>
                Internal Workshop Notes (Private)
              </Label>
              <Textarea
                id='inbox-adminNotes'
                rows={3}
                placeholder='Add notes from customer call, parts quote, paint code, insurer reference...'
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className='resize-y text-xs leading-relaxed'
              />
            </div>
          </div>

          <div className='flex items-center justify-between pt-1'>
            {updateQuote.isError ? (
              <span className='flex items-center gap-1 text-xs text-destructive'>
                <AlertCircle className='size-3.5' />
                {updateQuote.error.message}
              </span>
            ) : (
              <span />
            )}

            <Button type='submit' size='sm' disabled={updateQuote.isPending} className='h-8 gap-1.5 text-xs'>
              <Save className='size-3.5' />
              <span>{updateQuote.isPending ? 'Saving…' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Lightbox Modal for Photo Preview */}
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
              alt='Full resolution damage photo'
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
