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
  MapPin,
  CalendarClock,
  UserCheck2,
  Receipt,
  CreditCard,
  Banknote,
  Building2,
  ShieldCheck,
  CheckCircle2,
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
import { useAdminUserList } from '@/features/admin-users/hooks/api/query/use-admin-user-list';
import {
  QUOTE_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  type QuoteRequest,
  type QuoteStatus,
  type PaymentStatus,
  type PaymentMethod,
} from '../../types';

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

function toDatetimeLocal(isoStr?: string | Date | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  card: CreditCard,
  cash: Banknote,
  bank_transfer: Building2,
  insurance_billing: ShieldCheck,
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Credit / Debit Card',
  cash: 'Cash at Counter',
  bank_transfer: 'Bank Transfer (EFT)',
  insurance_billing: 'Insurance Claim Direct',
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; badgeClass: string; dotClass: string }> = {
  unpaid: {
    label: 'Unpaid',
    badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
    dotClass: 'bg-red-500',
  },
  partially_paid: {
    label: 'Partially Paid',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    dotClass: 'bg-amber-500',
  },
  paid_in_full: {
    label: 'Paid in Full',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
  },
};

export function QuoteDetailView({ quote: initialQuote }: QuoteDetailViewProps) {
  const [status, setStatus] = useState<QuoteStatus>(initialQuote.status as QuoteStatus);
  const [estimatedCost, setEstimatedCost] = useState<string>(initialQuote.estimatedCost ?? '');
  const [adminNotes, setAdminNotes] = useState<string>(initialQuote.adminNotes ?? '');
  const [address, setAddress] = useState<string>(initialQuote.address ?? '');
  const [city, setCity] = useState<string>(initialQuote.city ?? '');
  const [eircode, setEircode] = useState<string>(initialQuote.eircode ?? '');
  const [assignedAdminId, setAssignedAdminId] = useState<string>(initialQuote.assignedAdminId ?? 'unassigned');
  const [inspectionDate, setInspectionDate] = useState<string>(toDatetimeLocal(initialQuote.inspectionDate));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    (initialQuote.paymentStatus as PaymentStatus) ?? 'unpaid',
  );
  const [paidAmount, setPaidAmount] = useState<string>(initialQuote.paidAmount ?? '0.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (initialQuote.paymentMethod as PaymentMethod) ?? 'card',
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>(initialQuote.invoiceNumber ?? '');
  const [completedAt, setCompletedAt] = useState<string>(toDatetimeLocal(initialQuote.completedAt));

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: adminUsers } = useAdminUserList();
  const updateQuote = useUpdateQuoteRequest(initialQuote.id);
  const deleteQuote = useDeleteQuoteRequest();

  const phoneDigits = initialQuote.phone.replace(/[^\d+]/g, '');

  const totalCostNum = parseFloat(estimatedCost) || 0;
  const paidAmountNum = parseFloat(paidAmount) || 0;
  const balanceDue = Math.max(0, totalCostNum - paidAmountNum);
  const isSettled = totalCostNum > 0 && paidAmountNum >= totalCostNum;

  const mapsQuery = [
    address || initialQuote.address,
    city || initialQuote.city,
    eircode || initialQuote.eircode,
    'Ireland',
  ]
    .filter(Boolean)
    .join(', ');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const hasAddress = Boolean(
    address || initialQuote.address || city || initialQuote.city || eircode || initialQuote.eircode,
  );

  const handleMarkPaidInFull = () => {
    const cost = estimatedCost || '0.00';
    setPaidAmount(cost);
    setPaymentStatus('paid_in_full');
  };

  const handleMarkHandedOver = () => {
    const nowIso = new Date().toISOString();
    setCompletedAt(toDatetimeLocal(nowIso));
    setStatus('completed');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    await updateQuote.mutateAsync({
      status,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      adminNotes: adminNotes.trim() ? adminNotes.trim() : null,
      address: address.trim() ? address.trim() : null,
      city: city.trim() ? city.trim() : null,
      eircode: eircode.trim() ? eircode.trim().toUpperCase() : null,
      assignedAdminId: assignedAdminId === 'unassigned' ? null : assignedAdminId,
      inspectionDate: inspectionDate ? new Date(inspectionDate).toISOString() : null,
      paymentStatus,
      paidAmount: paidAmount !== '' ? parseFloat(paidAmount) : 0,
      paymentMethod,
      invoiceNumber: invoiceNumber.trim() ? invoiceNumber.trim() : null,
      completedAt: completedAt ? new Date(completedAt).toISOString() : null,
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
              <div className='flex flex-wrap items-center gap-3'>
                <CardTitle className='text-2xl'>{initialQuote.name}</CardTitle>
                <QuoteStatusBadge status={status} />
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                    PAYMENT_STATUS_CONFIG[paymentStatus]?.badgeClass ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', PAYMENT_STATUS_CONFIG[paymentStatus]?.dotClass)} />
                  {PAYMENT_STATUS_CONFIG[paymentStatus]?.label ?? paymentStatus}
                </span>
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

      {/* 3-Column Info Layout */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Customer Contact & Address Details */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <MapPin className='size-4 text-blue-500' />
              <span>Customer &amp; Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-2.5 text-sm'>
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
              <span className='max-w-[160px] truncate font-medium' title={initialQuote.email}>
                {initialQuote.email}
              </span>
            </div>
            <div className='flex flex-col gap-1 border-b border-border pb-2'>
              <span className='text-muted-foreground'>Street Address</span>
              <span className='font-medium'>{address || initialQuote.address || 'Not specified'}</span>
            </div>
            <div className='flex justify-between border-b border-border pb-2'>
              <span className='text-muted-foreground'>City / County</span>
              <span className='font-medium'>{city || initialQuote.city || 'Not specified'}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Eircode</span>
              <span className='font-mono font-bold text-blue-600 dark:text-blue-400'>
                {eircode || initialQuote.eircode || '—'}
              </span>
            </div>
            {hasAddress && (
              <a
                href={googleMapsUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border/80 bg-muted/40 py-1.5 text-xs font-medium text-blue-600 hover:bg-muted dark:text-blue-400'
              >
                <ExternalLink className='size-3.5' />
                <span>Open in Google Maps</span>
              </a>
            )}
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

        {/* Staff Assignment & Inspection */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <UserCheck2 className='size-4 text-purple-500' />
              <span>Staff &amp; Physical Inspection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col gap-3 text-sm'>
            <div className='flex flex-col gap-1.5 border-b border-border pb-2'>
              <span className='text-xs font-medium text-muted-foreground'>Assigned Technician / Staff</span>
              <Select
                value={assignedAdminId}
                onValueChange={(v) => {
                  if (v) setAssignedAdminId(v);
                }}
              >
                <SelectTrigger className='h-8 text-xs'>
                  <SelectValue placeholder='Unassigned' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='unassigned'>
                    <span className='text-muted-foreground italic'>Unassigned</span>
                  </SelectItem>
                  {adminUsers?.map((u) => (
                    <SelectItem key={u.id} value={u.id} className='text-xs'>
                      <span>{u.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <span className='flex items-center gap-1 text-xs font-medium text-muted-foreground'>
                <CalendarClock className='size-3 text-amber-500' />
                <span>Scheduled Physical Inspection</span>
              </span>
              <Input
                type='datetime-local'
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service & Damage Description Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Wrench className='size-4 text-[#dc2626]' />
            <span>Service Required &amp; Damage Description</span>
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

      {/* Milestone 5: Handover, Invoicing & Payment Tracking Card */}
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='flex items-center gap-2.5'>
              <div className='flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500'>
                <Receipt className='size-4' />
              </div>
              <div>
                <CardTitle className='text-base'>Milestone 5: Handover, Invoicing &amp; Settlement</CardTitle>
                <CardDescription>
                  Track payments, invoice records, payment channels, and handover timestamps.
                </CardDescription>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {!isSettled && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleMarkPaidInFull}
                  disabled={!estimatedCost}
                  className='h-7 gap-1 border-emerald-500/30 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400'
                >
                  <CheckCircle2 className='size-3.5' />
                  <span>Mark Paid in Full</span>
                </Button>
              )}
              {status !== 'completed' && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleMarkHandedOver}
                  className='h-7 gap-1 border-blue-500/30 text-xs text-blue-600 hover:bg-blue-500/10 dark:text-blue-400'
                >
                  <Check className='size-3.5' />
                  <span>Mark Handed Over</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {/* Summary Metric Cards */}
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <div className='rounded-lg border border-border/80 bg-muted/20 p-3'>
              <span className='text-xs font-semibold text-muted-foreground uppercase'>Total Estimated Cost</span>
              <div className='mt-1 font-mono text-xl font-bold text-foreground'>
                €{totalCostNum.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className='rounded-lg border border-border/80 bg-muted/20 p-3'>
              <span className='text-xs font-semibold text-muted-foreground uppercase'>Amount Paid</span>
              <div className='mt-1 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400'>
                €{paidAmountNum.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className='rounded-lg border border-border/80 bg-muted/20 p-3'>
              <span className='text-xs font-semibold text-muted-foreground uppercase'>Balance Due</span>
              <div className='mt-1 flex items-center gap-2'>
                <span
                  className={cn(
                    'font-mono text-xl font-bold',
                    isSettled
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : balanceDue > 0
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-foreground',
                  )}
                >
                  €{balanceDue.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {isSettled && (
                  <span className='rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-500'>
                    Settled
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Fields Grid */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='payment-status' className='text-xs'>
                Payment Status
              </Label>
              <Select
                value={paymentStatus}
                onValueChange={(v) => {
                  if (v) setPaymentStatus(v as PaymentStatus);
                }}
              >
                <SelectTrigger id='payment-status' className='h-8 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((ps) => (
                    <SelectItem key={ps} value={ps} className='text-xs'>
                      <span className='flex items-center gap-1.5'>
                        <span className={cn('size-1.5 rounded-full', PAYMENT_STATUS_CONFIG[ps]?.dotClass)} />
                        {PAYMENT_STATUS_CONFIG[ps]?.label ?? ps}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='paid-amount' className='text-xs'>
                Paid Amount (€ EUR)
              </Label>
              <Input
                id='paid-amount'
                type='number'
                step='0.01'
                min='0'
                placeholder='0.00'
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='payment-method' className='text-xs'>
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => {
                  if (v) setPaymentMethod(v as PaymentMethod);
                }}
              >
                <SelectTrigger id='payment-method' className='h-8 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => {
                    const Icon = PAYMENT_METHOD_ICONS[pm];
                    return (
                      <SelectItem key={pm} value={pm} className='text-xs'>
                        <span className='flex items-center gap-1.5'>
                          <Icon className='size-3 text-muted-foreground' />
                          {PAYMENT_METHOD_LABELS[pm] ?? pm}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='invoice-number' className='text-xs'>
                Invoice Number
              </Label>
              <Input
                id='invoice-number'
                placeholder='e.g. INV-2026-001'
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className='h-8 font-mono text-xs uppercase'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='handover-time' className='text-xs'>
                Vehicle Handover / Completion Date
              </Label>
              <Input
                id='handover-time'
                type='datetime-local'
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>

            <div className='flex flex-col justify-end'>
              <span className='text-xs text-muted-foreground'>
                {completedAt ? (
                  <span className='flex items-center gap-1 font-medium text-emerald-500'>
                    <Check className='size-3.5' /> Vehicle recorded as handed over
                  </span>
                ) : (
                  <span className='italic'>Vehicle pending completion and collection.</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workshop Administration & Quoting Form */}
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Workshop Lead Management &amp; Customer Edit</CardTitle>
            <CardDescription>
              Update quote progress status, calculate estimated repair costs, customer address, and save private
              workshop notes.
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-3'>
            <div className='flex flex-col gap-1.5 sm:col-span-1'>
              <Label htmlFor='edit-address' className='text-xs'>
                Street Address
              </Label>
              <Input
                id='edit-address'
                placeholder='14 Ballymount Road'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='flex flex-col gap-1.5 sm:col-span-1'>
              <Label htmlFor='edit-city' className='text-xs'>
                City / County
              </Label>
              <Input
                id='edit-city'
                placeholder='Dublin 12'
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='flex flex-col gap-1.5 sm:col-span-1'>
              <Label htmlFor='edit-eircode' className='text-xs'>
                Eircode
              </Label>
              <Input
                id='edit-eircode'
                placeholder='D12 X345'
                value={eircode}
                onChange={(e) => setEircode(e.target.value.toUpperCase())}
                className='h-8 font-mono text-xs uppercase'
              />
            </div>

            <div className='flex flex-col gap-1.5 sm:col-span-1'>
              <Label htmlFor='status' className='text-xs'>
                Lead Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v) setStatus(v as QuoteStatus);
                }}
              >
                <SelectTrigger id='status' className='h-8 text-xs'>
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
              <Label htmlFor='estimatedCost' className='text-xs'>
                Estimated Repair Cost (€ EUR)
              </Label>
              <Input
                id='estimatedCost'
                type='number'
                step='0.01'
                min='0'
                placeholder='e.g. 450.00'
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>

            <div className='flex flex-col gap-1.5 sm:col-span-3'>
              <Label htmlFor='adminNotes' className='text-xs'>
                Internal Workshop Notes (Private)
              </Label>
              <Textarea
                id='adminNotes'
                rows={4}
                placeholder='Record notes from telephone conversation, paint code references, insurance details, parts quotes, or technician assignments...'
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className='text-xs leading-relaxed'
              />
            </div>

            <div className='flex items-center gap-3 pt-2 sm:col-span-3'>
              <Button
                type='submit'
                disabled={updateQuote.isPending}
                className='gap-2 bg-red-600 text-white hover:bg-red-700'
              >
                <Save className='size-4' />
                <span>{updateQuote.isPending ? 'Saving…' : 'Save Changes'}</span>
              </Button>
              {savedSuccess && (
                <span className='flex items-center gap-1 text-sm text-emerald-500'>
                  <Check className='size-4' /> Saved successfully
                </span>
              )}
              {updateQuote.error && (
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
