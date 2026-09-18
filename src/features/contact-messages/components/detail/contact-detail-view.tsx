'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Check,
  Mail,
  MessageSquare,
  Phone,
  Save,
  Trash2,
  ExternalLink,
  User,
  Inbox,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { ContactStatusBadge } from '../contact-status-badge';
import { useUpdateContactMessage } from '../../hooks/api/mutation/use-update-contact-message';
import { useDeleteContactMessage } from '../../hooks/api/mutation/use-delete-contact-message';
import { CONTACT_STATUSES, type ContactMessage, type ContactStatus } from '../../types';

interface ContactDetailViewProps {
  message: ContactMessage;
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

export function ContactDetailView({ message: initialMessage }: ContactDetailViewProps) {
  const [status, setStatus] = useState<ContactStatus>(initialMessage.status as ContactStatus);
  const [adminNotes, setAdminNotes] = useState<string>(initialMessage.adminNotes ?? '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const updateMessage = useUpdateContactMessage(initialMessage.id);
  const deleteMessage = useDeleteContactMessage();

  const fullName = `${initialMessage.firstName} ${initialMessage.lastName}`.trim();
  const phoneDigits = initialMessage.phone.replace(/[^\d+]/g, '');

  const handleSave = async (e: React.FormEvent) => {
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
    if (window.confirm(`Delete contact inquiry from "${fullName}"? This cannot be undone.`)) {
      deleteMessage.mutate(initialMessage.id, {
        onSuccess: () => {
          window.location.href = APP_ROUTES.leads.contacts.index;
        },
      });
    }
  };

  return (
    <div className='flex max-w-5xl flex-col gap-6'>
      {/* Top Bar with Back and Direct Actions */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <Link
          href={APP_ROUTES.leads.contacts.index}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 text-xs text-muted-foreground')}
        >
          <ArrowLeft className='size-3.5' />
          <span>Back to all inquiries</span>
        </Link>

        {/* Quick Contact Buttons */}
        <div className='flex items-center gap-2'>
          {phoneDigits && (
            <a
              href={`https://wa.me/${phoneDigits.replace('+', '')}`}
              target='_blank'
              rel='noopener noreferrer'
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400',
              )}
            >
              <MessageSquare className='size-3.5' />
              <span>WhatsApp Chat</span>
            </a>
          )}

          {phoneDigits && (
            <a
              href={`tel:${phoneDigits}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5 text-xs font-semibold text-blue-500 hover:bg-blue-500/10 hover:text-blue-400',
              )}
            >
              <Phone className='size-3.5' />
              <span>Call Phone</span>
            </a>
          )}

          {initialMessage.email && (
            <a
              href={`mailto:${initialMessage.email}?subject=Re: Your enquiry with Vantage Bodyworks`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5 text-xs font-semibold text-purple-500 hover:bg-purple-500/10 hover:text-purple-400',
              )}
            >
              <Mail className='size-3.5' />
              <span>Reply via Email</span>
            </a>
          )}

          <Button
            variant='outline'
            size='sm'
            onClick={handleDelete}
            className='gap-1.5 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600'
          >
            <Trash2 className='size-3.5' />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Header */}
      <div className='flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-xs'>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>{fullName}</h1>
            <ContactStatusBadge status={status} />
          </div>
          <p className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Calendar className='size-3.5' />
            <span>Received on {formatDate(initialMessage.createdAt)}</span>
            <span>•</span>
            <span className='capitalize'>Source: {initialMessage.source.replace('_', ' ')}</span>
          </p>
        </div>
      </div>

      {/* Grid: Details & Notes */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Left 2 Cols: Inquiry & Contact Info */}
        <div className='flex flex-col gap-6 md:col-span-2'>
          {/* Customer Card */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <User className='size-4 text-muted-foreground' />
                <span>Contact Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 gap-4 text-sm sm:grid-cols-2'>
              <div className='flex flex-col gap-0.5'>
                <span className='text-xs text-muted-foreground'>First Name</span>
                <span className='font-medium text-foreground'>{initialMessage.firstName}</span>
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-xs text-muted-foreground'>Last Name</span>
                <span className='font-medium text-foreground'>{initialMessage.lastName}</span>
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-xs text-muted-foreground'>Email Address</span>
                <a href={`mailto:${initialMessage.email}`} className='font-medium text-blue-500 hover:underline'>
                  {initialMessage.email}
                </a>
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-xs text-muted-foreground'>Phone Number</span>
                <a href={`tel:${phoneDigits}`} className='font-medium text-foreground hover:underline'>
                  {initialMessage.phone}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Message Details */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Inbox className='size-4 text-muted-foreground' />
                <span>Message &amp; Inquiry</span>
              </CardTitle>
              {initialMessage.service && (
                <CardDescription>
                  Inquiring about service:{' '}
                  <span className='font-semibold text-foreground'>{initialMessage.service}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className='flex flex-col gap-4 text-sm'>
              <div className='rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground'>
                {initialMessage.message}
              </div>

              {/* Photos / Attachments */}
              {initialMessage.photoUrls && initialMessage.photoUrls.length > 0 && (
                <div className='mt-2 flex flex-col gap-3'>
                  <span className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                    Attached Files / Photos ({initialMessage.photoUrls.length})
                  </span>
                  <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                    {initialMessage.photoUrls.map((url, idx) => (
                      <div
                        key={url}
                        onClick={() => setSelectedPhoto(url)}
                        className='group relative aspect-video cursor-pointer overflow-hidden rounded-md border border-border bg-muted transition-all hover:border-red-500/50'
                      >
                        <Image
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          fill
                          className='object-cover transition-transform duration-300 group-hover:scale-105'
                        />
                        <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
                          <ExternalLink className='size-4 text-white' />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Admin Workflow & Notes */}
        <div className='flex flex-col gap-6'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Inquiry Workflow</CardTitle>
              <CardDescription>Update status and record internal workshop notes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className='flex flex-col gap-4'>
                {/* Status Changer */}
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='status' className='text-xs font-semibold'>
                    Inquiry Status
                  </Label>
                  <Select value={status} onValueChange={(val) => setStatus(val as ContactStatus)}>
                    <SelectTrigger id='status' className='w-full text-xs'>
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

                {/* Internal Admin Notes */}
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='adminNotes' className='text-xs font-semibold'>
                    Internal Staff Notes
                  </Label>
                  <Textarea
                    id='adminNotes'
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder='Notes from phone call, appointment date, follow-up status...'
                    rows={5}
                    className='text-xs'
                  />
                  <span className='text-[10px] text-muted-foreground'>
                    Visible only to authenticated staff &amp; administrators.
                  </span>
                </div>

                {/* Save Button */}
                <div className='flex items-center justify-between pt-2'>
                  {savedSuccess ? (
                    <span className='flex items-center gap-1.5 text-xs font-medium text-emerald-500'>
                      <Check className='size-3.5' />
                      <span>Saved successfully!</span>
                    </span>
                  ) : (
                    <div />
                  )}
                  <Button
                    type='submit'
                    size='sm'
                    disabled={updateMessage.isPending}
                    className='gap-1.5 text-xs font-semibold'
                  >
                    <Save className='size-3.5' />
                    <span>{updateMessage.isPending ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox Modal for Photo Attachments */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs'
        >
          <div className='relative max-h-[85vh] max-w-4xl overflow-hidden rounded-lg'>
            <Image
              src={selectedPhoto}
              alt='Enlarged damage photo'
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
