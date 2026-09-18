'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  Mail,
  MessageSquare,
  Phone,
  Save,
  Trash2,
  Wrench,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface QuoteDetailViewProps {
  quote: QuoteRequest;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function QuoteDetailView({ quote: initialQuote }: QuoteDetailViewProps) {
  const [status, setStatus] = useState<QuoteStatus>(initialQuote.status as QuoteStatus);
  const [estimatedCost, setEstimatedCost] = useState<string>(initialQuote.estimatedCost ?? '');
  const [adminNotes, setAdminNotes] = useState<string>(initialQuote.adminNotes ?? '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const updateQuote = useUpdateQuoteRequest(initialQuote.id);
  const deleteQuote = useDeleteQuoteRequest();

  const phoneDigits = initialQuote.phone.replace(/[^\d+]/g, '');

  const handleSave = async (e: React.FormEvent) => {
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
    if (window.confirm(`Delete quote request from "${initialQuote.name}"? This cannot be undone.`)) {
      deleteQuote.mutate(initialQuote.id, {
        onSuccess: () => {
          window.location.href = APP_ROUTES.leads.quotes.index;
        },
      });
    }
  };

  return (
    <div className='flex max-w-5xl flex-col gap-6'>
      {/* Top Bar with Back and Direct Actions */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <Link
          href={APP_ROUTES.leads.quotes.index}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 text-xs text-muted-foreground')}
        >
          <ArrowLeft className='size-3.5' />
          <span>Back to all quotes</span>
        </Link>

        {/* Quick Contact Buttons */}
        <div className='flex items-center gap-2'>
          <a
            href={`https://wa.me/${phoneDigits.replace('+', '')}`}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5 border-emerald-500/30 text-xs text-emerald-500 hover:bg-emerald-500/10',
            )}
          >
            <MessageSquare className='size-3.5' />
            <span>WhatsApp</span>
          </a>

          <a
            href={`tel:${phoneDigits}`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5 border-blue-500/30 text-xs text-blue-500 hover:bg-blue-500/10',
            )}
          >
            <Phone className='size-3.5' />
            <span>Call Customer</span>
          </a>

          <a
            href={`mailto:${initialQuote.email}?subject=Regarding Your Quote Request — Vantage Autobody`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs')}
          >
            <Mail className='size-3.5' />
            <span>Email</span>
          </a>

          <Button
            type='button'
            variant='destructive'
            size='sm'
            onClick={handleDelete}
            disabled={deleteQuote.isPending}
            className='gap-1.5 text-xs'
          >
            <Trash2 className='size-3.5' />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <div className='flex items-center gap-3'>
                <CardTitle className='text-2xl'>{initialQuote.name}</CardTitle>
                <QuoteStatusBadge status={status} />
              </div>
              <CardDescription className='mt-1 flex items-center gap-2 text-xs'>
                <Calendar className='size-3.5' />
                <span>Received {formatDate(initialQuote.createdAt)}</span>
                <span>•</span>
                <span className='capitalize'>Source: {initialQuote.source.replace('_', ' ')}</span>
              </CardDescription>
            </div>

            {/* Registration badge if present */}
            {initialQuote.registration && (
              <div className='flex flex-col items-end'>
                <span className='rounded border border-neutral-300 bg-amber-400 px-3 py-1 font-mono text-sm font-bold text-black uppercase shadow-xs'>
                  {initialQuote.registration}
                </span>
                <span className='mt-1 text-[11px] text-muted-foreground'>Irish Reg Plate</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 2-Column Info Layout */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Customer Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Customer Contact Details</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-3 text-sm'>
            <div className='flex justify-between border-b border-border pb-2'>
              <span className='text-muted-foreground'>Full Name</span>
              <span className='font-medium'>{initialQuote.name}</span>
            </div>
            <div className='flex justify-between border-b border-border pb-2'>
              <span className='text-muted-foreground'>Phone</span>
              <span className='font-mono font-medium'>{initialQuote.phone}</span>
            </div>
            <div className='flex justify-between border-b border-border pb-2'>
              <span className='text-muted-foreground'>Email</span>
              <span className='font-medium'>{initialQuote.email}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Submission Channel</span>
              <span className='font-medium capitalize'>{initialQuote.source.replace('_', ' ')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Car className='size-4 text-primary' />
              <span>Vehicle Specifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-3 text-sm'>
            <div className='flex justify-between border-b border-border pb-2'>
              <span className='text-muted-foreground'>Registration</span>
              <span className='font-mono font-bold'>{initialQuote.registration || 'Not specified'}</span>
            </div>
            <div className='flex justify-between border-b border-border pb-2'>
              <span className='text-muted-foreground'>Make</span>
              <span className='font-medium'>{initialQuote.make || 'Not specified'}</span>
            </div>
            <div className='flex justify-between border-b border-border pb-2'>
              <span className='text-muted-foreground'>Model</span>
              <span className='font-medium'>{initialQuote.model || 'Not specified'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Year</span>
              <span className='font-medium'>{initialQuote.year || 'Not specified'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service & Damage Description Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Wrench className='size-4 text-[#dc2626]' />
            <span>Service Required & Damage Description</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div>
            <span className='text-xs font-semibold text-muted-foreground uppercase'>Requested Service</span>
            <p className='mt-1 text-base font-medium'>{initialQuote.serviceType || 'General Bodywork Assessment'}</p>
          </div>

          <div>
            <span className='text-xs font-semibold text-muted-foreground uppercase'>Damage Description</span>
            <div className='mt-1 rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap'>
              {initialQuote.description || 'No detailed damage description was entered by the customer.'}
            </div>
          </div>

          {/* Photos */}
          {initialQuote.photoUrls && initialQuote.photoUrls.length > 0 && (
            <div>
              <span className='text-xs font-semibold text-muted-foreground uppercase'>
                Customer Photos ({initialQuote.photoUrls.length})
              </span>
              <div className='mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4'>
                {initialQuote.photoUrls.map((url, index) => (
                  <button
                    key={index}
                    type='button'
                    onClick={() => setSelectedPhoto(url)}
                    className='group relative aspect-video overflow-hidden rounded-lg border border-border bg-black'
                  >
                    <Image
                      src={url}
                      alt={`Damage photo ${index + 1}`}
                      fill
                      className='object-cover transition-transform duration-200 group-hover:scale-105'
                    />
                    <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
                      <ExternalLink className='size-4 text-white' />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workshop Administration & Quoting Form */}
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Workshop Lead Management</CardTitle>
            <CardDescription>
              Update quote progress status, calculate estimated repair costs, and save private workshop notes.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='status'>Lead Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as QuoteStatus)}>
                <SelectTrigger id='status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <QuoteStatusBadge status={s} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='estimatedCost'>Estimated Repair Cost (€ EUR)</Label>
              <Input
                id='estimatedCost'
                type='number'
                step='0.01'
                min='0'
                placeholder='e.g. 450.00'
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-1.5 sm:col-span-2'>
              <Label htmlFor='adminNotes'>Internal Workshop Notes (Private)</Label>
              <Textarea
                id='adminNotes'
                rows={4}
                placeholder='Record notes from telephone conversation, paint code references, insurance details, parts quotes, or technician assignments...'
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <div className='flex items-center gap-3 pt-2 sm:col-span-2'>
              <Button type='submit' disabled={updateQuote.isPending} className='gap-2'>
                <Save className='size-4' />
                <span>{updateQuote.isPending ? 'Saving…' : 'Save Changes'}</span>
              </Button>
              {savedSuccess && (
                <span className='flex items-center gap-1 text-sm text-emerald-500'>
                  <Check className='size-4' /> Saved successfully
                </span>
              )}
              {updateQuote.isError && (
                <span className='flex items-center gap-1 text-sm text-destructive'>
                  <AlertCircle className='size-4' /> {updateQuote.error.message}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Photo Modal Preview if clicked */}
      {selectedPhoto && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'
          onClick={() => setSelectedPhoto(null)}
        >
          <div className='relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg'>
            <Image
              src={selectedPhoto}
              alt='Full preview'
              width={1200}
              height={800}
              className='max-h-[85vh] w-auto object-contain'
            />
          </div>
        </div>
      )}
    </div>
  );
}
