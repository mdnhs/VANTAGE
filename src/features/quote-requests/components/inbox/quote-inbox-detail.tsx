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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { QuoteStatusBadge } from '../quote-status-badge';
import { QuoteSourceBadge } from '../quote-source-badge';
import { useUpdateQuoteRequest } from '../../hooks/api/mutation/use-update-quote-request';
import { useDeleteQuoteRequest } from '../../hooks/api/mutation/use-delete-quote-request';
import { useAdminUserList } from '@/features/admin-users/hooks/api/query/use-admin-user-list';
import {
  PIPELINE_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  type QuoteRequest,
  type QuoteStatus,
  type PaymentStatus,
  type PaymentMethod,
} from '../../types';
import { formatFullDate, formatServiceType, getAvatarColor, getInitials } from './quote-inbox-formatters';

interface QuoteInboxDetailProps {
  quote: QuoteRequest;
  onCloseMobile?: () => void;
  onDeleted?: (id: string) => void;
}

function toDatetimeLocal(isoStr?: string | Date | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatReadableDateTime(isoStr?: string | Date | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

export function QuoteInboxDetail({ quote, onCloseMobile, onDeleted }: QuoteInboxDetailProps) {
  // State initialization
  const [status, setStatus] = useState<QuoteStatus>(quote.status as QuoteStatus);
  const [estimatedCost, setEstimatedCost] = useState<string>(quote.estimatedCost ?? '');
  const [adminNotes, setAdminNotes] = useState<string>(quote.adminNotes ?? '');
  const [address, setAddress] = useState<string>(quote.address ?? '');
  const [city, setCity] = useState<string>(quote.city ?? '');
  const [eircode, setEircode] = useState<string>(quote.eircode ?? '');
  const [assignedAdminId, setAssignedAdminId] = useState<string>(quote.assignedAdminId ?? 'unassigned');
  const [inspectionDate, setInspectionDate] = useState<string>(toDatetimeLocal(quote.inspectionDate));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>((quote.paymentStatus as PaymentStatus) ?? 'unpaid');
  const [paidAmount, setPaidAmount] = useState<string>(quote.paidAmount ?? '0.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>((quote.paymentMethod as PaymentMethod) ?? 'card');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(quote.invoiceNumber ?? '');
  const [completedAt, setCompletedAt] = useState<string>(toDatetimeLocal(quote.completedAt));

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: adminUsers } = useAdminUserList();
  const updateQuote = useUpdateQuoteRequest(quote.id);
  const deleteQuote = useDeleteQuoteRequest();

  const phoneDigits = quote.phone.replace(/[^\d+]/g, '');

  // Quick Status Change from top dropdown
  const handleStatusChange = async (newStatus: QuoteStatus) => {
    setStatus(newStatus);
    await updateQuote.mutateAsync({ status: newStatus });
  };

  // Quick Staff Assignment
  const handleStaffChange = async (newStaffId: string) => {
    setAssignedAdminId(newStaffId);
    await updateQuote.mutateAsync({
      assignedAdminId: newStaffId === 'unassigned' ? null : newStaffId,
    });
  };

  // Quick Inspection Schedule Update
  const handleInspectionChange = async (val: string) => {
    setInspectionDate(val);
    await updateQuote.mutateAsync({
      inspectionDate: val ? new Date(val).toISOString() : null,
    });
  };

  // Quick Full Settlement Action
  const handleMarkPaidInFull = async () => {
    const cost = estimatedCost || '0.00';
    setPaidAmount(cost);
    setPaymentStatus('paid_in_full');
    await updateQuote.mutateAsync({
      paidAmount: cost ? parseFloat(cost) : 0,
      paymentStatus: 'paid_in_full',
    });
  };

  // Quick Handover Action
  const handleMarkHandedOver = async () => {
    const nowIso = new Date().toISOString();
    setCompletedAt(toDatetimeLocal(nowIso));
    setStatus('completed');
    await updateQuote.mutateAsync({
      status: 'completed',
      completedAt: nowIso,
    });
  };

  // Save full workshop notes & Phase 3 fields
  const handleSaveWorkshopNotes = async (e: React.FormEvent) => {
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
    if (window.confirm(`Delete quote request from "${quote.name}"? This cannot be undone.`)) {
      deleteQuote.mutate(quote.id, {
        onSuccess: () => {
          onDeleted?.(quote.id);
        },
      });
    }
  };

  // Financial calculations
  const totalCostNum = parseFloat(estimatedCost) || 0;
  const paidAmountNum = parseFloat(paidAmount) || 0;
  const balanceDue = Math.max(0, totalCostNum - paidAmountNum);
  const isSettled = totalCostNum > 0 && paidAmountNum >= totalCostNum;

  // Google Maps address lookup link
  const addressQuery = [address || quote.address, city || quote.city, eircode || quote.eircode, 'Ireland']
    .filter(Boolean)
    .join(', ');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
  const hasAddress = Boolean(address || quote.address || city || quote.city || eircode || quote.eircode);

  // Assigned staff representation
  const currentAssignedStaff = adminUsers?.find((u) => u.id === assignedAdminId) || quote.assignedAdmin;

  return (
    <div className='@container flex h-full w-full min-w-0 flex-1 flex-col overflow-y-auto bg-background'>
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
            onValueChange={(val) => {
              if (val) handleStatusChange(val as QuoteStatus);
            }}
          >
            <SelectTrigger className='h-8 w-[180px] text-xs'>
              <SelectValue>
                <QuoteStatusBadge status={status} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STATUSES.map((s) => (
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

      {/* Main Reading & Management Body */}
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
                <QuoteSourceBadge source={quote.source} />
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                    PAYMENT_STATUS_CONFIG[paymentStatus]?.badgeClass ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', PAYMENT_STATUS_CONFIG[paymentStatus]?.dotClass)} />
                  {PAYMENT_STATUS_CONFIG[paymentStatus]?.label ?? paymentStatus}
                </span>
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

        {/* Row 1: Vehicle & Requested Service Chips */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {/* Vehicle card */}
          <div className='flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
              <Car className='size-4 text-foreground' />
            </div>
            <div className='flex min-w-0 flex-1 flex-col'>
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
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Service Required</span>
              <span className='truncate text-xs font-semibold text-foreground'>
                {formatServiceType(quote.serviceType)}
              </span>
            </div>
          </div>

          {/* Registration card */}
          <div className='flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2 xl:col-span-1'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-bold text-muted-foreground'>
              IRL
            </div>
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Irish Reg Plate</span>
              <span className='truncate font-mono text-xs font-bold text-foreground uppercase'>
                {quote.registration || 'No Plate Entered'}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Customer Address, Assigned Staff & Physical Inspection (Phase 3) */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {/* Customer Address Card */}
          <div className='flex flex-col justify-between gap-2.5 rounded-lg border border-border/70 bg-muted/20 p-3'>
            <div className='flex items-start gap-2.5'>
              <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-500'>
                <MapPin className='size-4' />
              </div>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Customer Address</span>
                <span className='text-xs leading-snug font-medium text-foreground'>
                  {hasAddress ? (
                    [address || quote.address, city || quote.city, eircode || quote.eircode].filter(Boolean).join(', ')
                  ) : (
                    <span className='text-muted-foreground italic'>No address recorded</span>
                  )}
                </span>
                {(eircode || quote.eircode) && (
                  <span className='mt-0.5 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400'>
                    Eircode: {eircode || quote.eircode}
                  </span>
                )}
              </div>
            </div>

            {hasAddress && (
              <a
                href={googleMapsUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1.5 self-start rounded border border-border/60 bg-background/80 px-2 py-1 text-[11px] font-medium text-blue-600 transition-colors hover:bg-muted hover:text-blue-500 dark:text-blue-400'
              >
                <ExternalLink className='size-3' />
                <span>Open in Google Maps</span>
              </a>
            )}
          </div>

          {/* Assigned Technician / Staff Card */}
          <div className='flex flex-col justify-between gap-2.5 rounded-lg border border-border/70 bg-muted/20 p-3'>
            <div className='flex items-start gap-2.5'>
              <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-500'>
                <UserCheck2 className='size-4' />
              </div>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Assigned Staff</span>
                <span className='truncate text-xs font-semibold text-foreground'>
                  {currentAssignedStaff?.name || 'Unassigned (General Pool)'}
                </span>
                {currentAssignedStaff?.email && (
                  <span className='truncate text-[11px] text-muted-foreground'>{currentAssignedStaff.email}</span>
                )}
              </div>
            </div>

            <Select
              value={assignedAdminId}
              onValueChange={(val) => {
                if (val) handleStaffChange(val);
              }}
            >
              <SelectTrigger className='h-7 w-full bg-background/70 text-[11px]'>
                <SelectValue placeholder='Reassign staff…' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='unassigned' className='text-xs'>
                  <span className='text-muted-foreground italic'>Unassigned (Workshop Pool)</span>
                </SelectItem>
                {adminUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id} className='text-xs'>
                    <span className='font-medium'>{user.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Physical Inspection Card */}
          <div className='flex flex-col justify-between gap-2.5 rounded-lg border border-border/70 bg-muted/20 p-3 sm:col-span-2 xl:col-span-1'>
            <div className='flex items-start gap-2.5'>
              <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500'>
                <CalendarClock className='size-4' />
              </div>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Physical Inspection</span>
                <span className='text-xs font-semibold text-foreground'>
                  {inspectionDate ? (
                    formatReadableDateTime(inspectionDate)
                  ) : (
                    <span className='text-muted-foreground italic'>Not scheduled</span>
                  )}
                </span>
                {inspectionDate && (
                  <span className='text-[10px] font-medium text-amber-600 dark:text-amber-400'>
                    Customer booking confirmed
                  </span>
                )}
              </div>
            </div>

            <div className='flex items-center gap-1.5'>
              <Input
                type='datetime-local'
                value={inspectionDate}
                onChange={(e) => handleInspectionChange(e.target.value)}
                className='h-7 min-w-0 flex-1 bg-background/70 font-mono text-[11px]'
              />
              {inspectionDate && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleInspectionChange('')}
                  className='h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive'
                  title='Clear scheduled inspection'
                >
                  Clear
                </Button>
              )}
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

        {/* Milestone 5: Handover, Invoicing & Payment Tracking Section */}
        <div className='flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-xs sm:p-5'>
          <div className='flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3'>
            <div className='flex items-center gap-2.5'>
              <div className='flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500'>
                <Receipt className='size-4' />
              </div>
              <div>
                <h3 className='text-xs font-bold tracking-wider text-foreground uppercase'>
                  Milestone 5: Handover, Invoicing &amp; Payment Settlement
                </h3>
                <p className='text-[11px] text-muted-foreground'>
                  Track invoice numbers, settlement breakdown, payment methods, and vehicle handover.
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {!isSettled && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleMarkPaidInFull}
                  disabled={updateQuote.isPending || !estimatedCost}
                  className='h-7 gap-1 border-emerald-500/30 text-[11px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400'
                >
                  <CheckCircle2 className='size-3' />
                  <span>Mark Paid in Full</span>
                </Button>
              )}
              {status !== 'completed' && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleMarkHandedOver}
                  disabled={updateQuote.isPending}
                  className='h-7 gap-1 border-blue-500/30 text-[11px] text-blue-600 hover:bg-blue-500/10 dark:text-blue-400'
                >
                  <Check className='size-3' />
                  <span>Mark Handed Over</span>
                </Button>
              )}
            </div>
          </div>

          {/* Financial Breakdown Metric Cards */}
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {/* Total Estimated Cost */}
            <div className='flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/20 p-3'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Total Quote / Cost</span>
              <span className='font-mono text-lg font-bold text-foreground'>
                €{totalCostNum.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Paid Amount */}
            <div className='flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/20 p-3'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Amount Paid</span>
              <span className='font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400'>
                €{paidAmountNum.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Balance Due */}
            <div className='flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/20 p-3'>
              <span className='text-[10px] font-semibold text-muted-foreground uppercase'>Balance Due</span>
              <div className='flex items-center gap-2'>
                <span
                  className={cn(
                    'font-mono text-lg font-bold',
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
                  <span className='rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500'>
                    Settled
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Invoicing, Method & Settlement Fields */}
          <div className='grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-4'>
            {/* Payment Status */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='detail-paymentStatus' className='text-xs font-medium'>
                Payment Status
              </Label>
              <Select
                value={paymentStatus}
                onValueChange={(val) => {
                  if (val) setPaymentStatus(val as PaymentStatus);
                }}
              >
                <SelectTrigger id='detail-paymentStatus' className='h-8 text-xs'>
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

            {/* Paid Amount Input */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='detail-paidAmount' className='text-xs font-medium'>
                Paid Amount (€ EUR)
              </Label>
              <Input
                id='detail-paidAmount'
                type='number'
                step='0.01'
                min='0'
                placeholder='0.00'
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>

            {/* Payment Method */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='detail-paymentMethod' className='text-xs font-medium'>
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => {
                  if (val) setPaymentMethod(val as PaymentMethod);
                }}
              >
                <SelectTrigger id='detail-paymentMethod' className='h-8 text-xs'>
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

            {/* Invoice Number */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='detail-invoiceNumber' className='text-xs font-medium'>
                Invoice Number
              </Label>
              <Input
                id='detail-invoiceNumber'
                placeholder='e.g. INV-2026-001'
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className='h-8 font-mono text-xs uppercase'
              />
            </div>
          </div>

          {/* Handover Date & Time */}
          <div className='grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='detail-completedAt' className='flex items-center gap-1 text-xs font-medium'>
                <CheckCircle2 className='size-3 text-muted-foreground' />
                <span>Handover / Job Completion Date &amp; Time</span>
              </Label>
              <Input
                id='detail-completedAt'
                type='datetime-local'
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className='h-8 font-mono text-xs'
              />
            </div>

            <div className='flex flex-col justify-end'>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                {completedAt ? (
                  <span className='flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400'>
                    <Check className='size-3.5' /> Handed over: {formatReadableDateTime(completedAt)}
                  </span>
                ) : (
                  <span className='italic'>Vehicle has not yet been marked as collected/handed over.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Workshop Management, Customer Address & Notes Form */}
        <form
          onSubmit={handleSaveWorkshopNotes}
          className='flex flex-col gap-4 rounded-xl border border-border/80 bg-muted/15 p-4 sm:p-5'
        >
          <div className='flex items-center justify-between border-b border-border/50 pb-3'>
            <div>
              <h3 className='text-xs font-semibold tracking-wider text-foreground uppercase'>
                Workshop Management &amp; Customer Records
              </h3>
              <p className='text-[11px] text-muted-foreground'>
                Update customer address, pricing estimates, assigned technician, and internal shop notes.
              </p>
            </div>
            {savedSuccess && (
              <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                <Check className='size-3.5' />
                Saved
              </span>
            )}
          </div>

          {/* Customer Address Details in Form */}
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='inbox-address' className='text-xs'>
                Customer Street Address
              </Label>
              <Input
                id='inbox-address'
                placeholder='e.g. 14 Ballymount Road'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='inbox-city' className='text-xs'>
                City / County
              </Label>
              <Input
                id='inbox-city'
                placeholder='e.g. Dublin 12'
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='inbox-eircode' className='text-xs'>
                Irish Eircode
              </Label>
              <Input
                id='inbox-eircode'
                placeholder='D12 X345'
                value={eircode}
                onChange={(e) => setEircode(e.target.value.toUpperCase())}
                className='h-8 font-mono text-xs uppercase'
              />
            </div>
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
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v) setStatus(v as QuoteStatus);
                }}
              >
                <SelectTrigger id='inbox-status' className='h-8 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STATUSES.map((s) => (
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

            <Button
              type='submit'
              size='sm'
              disabled={updateQuote.isPending}
              className='h-8 gap-1.5 bg-red-600 text-xs text-white hover:bg-red-700'
            >
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
