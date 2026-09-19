'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Phone,
  MessageCircle,
  UserCheck,
  Mail,
  Share2,
  Globe,
  Sparkles,
  MapPin,
  CalendarClock,
  UserCheck2,
} from 'lucide-react';
import { useSubmitQuoteRequest } from '../../hooks/api/mutation/use-submit-quote-request';
import { useAdminUserList } from '@/features/admin-users/hooks/api/query/use-admin-user-list';
import { PIPELINE_STATUSES, type QuoteSource, type PipelineStatus } from '../../types';
import { STATUS_CONFIG } from '../quote-status-badge';

const COMMON_SERVICES = [
  'Accident & Crash Repair',
  'Full Vehicle Respray',
  'Dent Removal (PDR)',
  'Scratch & Scuff Repair',
  'Bumper Repair / Replacement',
  'Insurance Collision Claim',
  'Chassis Realignment',
  'Alloy Wheel Refurbishment',
  'Custom Paint & Detailing',
  'Other / Inspection Needed',
];

interface NewEnquiryDialogProps {
  onCreated?: (newId: string) => void;
  trigger?: React.ReactNode;
  defaultStatus?: PipelineStatus;
}

export function NewEnquiryDialog({ onCreated, trigger, defaultStatus = 'new' }: NewEnquiryDialogProps) {
  const [open, setOpen] = useState(false);
  const submitMutation = useSubmitQuoteRequest();
  const { data: adminUsers } = useAdminUserList();

  // Form State
  const [source, setSource] = useState<QuoteSource>('phone_call');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [eircode, setEircode] = useState('');
  const [assignedAdminId, setAssignedAdminId] = useState<string>('unassigned');
  const [inspectionDate, setInspectionDate] = useState('');
  const [registration, setRegistration] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [serviceType, setServiceType] = useState('Accident & Crash Repair');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PipelineStatus>(defaultStatus);
  const [estimatedCost, setEstimatedCost] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSource('phone_call');
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setEircode('');
    setAssignedAdminId('unassigned');
    setInspectionDate('');
    setRegistration('');
    setMake('');
    setModel('');
    setYear('');
    setServiceType('Accident & Crash Repair');
    setDescription('');
    setStatus(defaultStatus);
    setEstimatedCost('');
    setAdminNotes('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Valid contact phone number is required.');
      return;
    }

    // Since DB email column is NOT NULL, provide fallback if walk-in/phone has no email
    const cleanEmail = email.trim() ? email.trim() : `walkin-${Date.now().toString(36)}@customer.vantage`;

    try {
      const created = await submitMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        email: cleanEmail,
        address: address.trim() || null,
        city: city.trim() || null,
        eircode: eircode.trim() ? eircode.trim().toUpperCase() : null,
        source,
        status,
        assignedAdminId: assignedAdminId && assignedAdminId !== 'unassigned' ? assignedAdminId : null,
        inspectionDate: inspectionDate ? new Date(inspectionDate).toISOString() : null,
        registration: registration.trim() ? registration.trim().toUpperCase() : null,
        make: make.trim() || null,
        model: model.trim() || null,
        year: year ? parseInt(year, 10) : null,
        serviceType: serviceType || null,
        description: description.trim() || null,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        adminNotes: adminNotes.trim() || null,
        photoUrls: [],
      });

      resetForm();
      setOpen(false);
      if (onCreated && created?.id) {
        onCreated(created.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create enquiry';
      setError(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button size='sm' className='gap-1.5 bg-red-600 text-white shadow-sm hover:bg-red-700'>
              <Plus className='size-4' />
              <span>New Enquiry</span>
            </Button>
          )
        }
      />

      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <DialogHeader>
            <div className='flex items-center gap-2'>
              <div className='flex size-8 items-center justify-center rounded-lg bg-red-600/10 text-red-600'>
                <Sparkles className='size-4' />
              </div>
              <div>
                <DialogTitle className='text-lg font-semibold'>Log New Customer Enquiry</DialogTitle>
                <DialogDescription className='text-xs'>
                  Record an incoming lead from phone, WhatsApp, walk-in, or external channels.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className='rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive'>{error}</div>
          )}

          {/* Section 1: Intake Channel */}
          <div className='flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/30 p-3'>
            <Label className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
              1. Intake Channel & Source
            </Label>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
              {[
                { value: 'phone_call', label: 'Phone Call', icon: Phone },
                { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                { value: 'walk_in', label: 'Walk-in Customer', icon: UserCheck },
                { value: 'email', label: 'Direct Email', icon: Mail },
                { value: 'social_media', label: 'Social / FB / IG', icon: Share2 },
                { value: 'website', label: 'Website Form', icon: Globe },
              ].map((chan) => {
                const Icon = chan.icon;
                const isSelected = source === chan.value;
                return (
                  <button
                    key={chan.value}
                    type='button'
                    onClick={() => setSource(chan.value as QuoteSource)}
                    className={`flex items-center gap-2 rounded-md border p-2 text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-600/10 text-red-600 dark:bg-red-600/20'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className='size-3.5 shrink-0' />
                    <span className='truncate'>{chan.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Customer Contact */}
          <div className='flex flex-col gap-3'>
            <Label className='flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
              <MapPin className='size-3.5 text-blue-500' />
              <span>2. Customer Contact &amp; Location Details</span>
            </Label>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-name' className='text-xs font-medium'>
                  Contact Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='lead-name'
                  placeholder='e.g. Michael O’Connor'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-phone' className='text-xs font-medium'>
                  Phone Number <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='lead-phone'
                  type='tel'
                  placeholder='+353 87 123 4567'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className='flex flex-col gap-1.5'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='lead-email' className='text-xs font-medium'>
                  Email Address
                </Label>
                <span className='text-[10px] text-muted-foreground'>Optional for walk-ins & calls</span>
              </div>
              <Input
                id='lead-email'
                type='email'
                placeholder='michael@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Address & Eircode (Ireland) */}
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
              <div className='flex flex-col gap-1.5 sm:col-span-1'>
                <Label htmlFor='lead-address' className='text-xs font-medium'>
                  Street Address
                </Label>
                <Input
                  id='lead-address'
                  placeholder='e.g. 14 Ballymount Road'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-city' className='text-xs font-medium'>
                  City / County
                </Label>
                <Input
                  id='lead-city'
                  placeholder='e.g. Dublin 12'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='lead-eircode' className='text-xs font-medium'>
                    Eircode
                  </Label>
                  <span className='text-[10px] text-muted-foreground'>Irish Postcode</span>
                </div>
                <Input
                  id='lead-eircode'
                  placeholder='D12 X345'
                  value={eircode}
                  onChange={(e) => setEircode(e.target.value.toUpperCase())}
                  className='font-mono uppercase'
                />
              </div>
            </div>
          </div>

          {/* Section 3: Vehicle / Asset Details */}
          <div className='flex flex-col gap-3'>
            <Label className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
              3. Vehicle & Asset Details
            </Label>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-reg' className='text-xs font-medium'>
                  Reg Plate
                </Label>
                <Input
                  id='lead-reg'
                  placeholder='191-D-1234'
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                  className='font-mono uppercase'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-make' className='text-xs font-medium'>
                  Make
                </Label>
                <Input id='lead-make' placeholder='Toyota' value={make} onChange={(e) => setMake(e.target.value)} />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-model' className='text-xs font-medium'>
                  Model
                </Label>
                <Input id='lead-model' placeholder='Corolla' value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-year' className='text-xs font-medium'>
                  Year
                </Label>
                <Input
                  id='lead-year'
                  type='number'
                  placeholder='2019'
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Service Scope & Description */}
          <div className='flex flex-col gap-3'>
            <Label className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
              4. Service Scope & Damage
            </Label>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='lead-service' className='text-xs font-medium'>
                Service Category
              </Label>
              <Select value={serviceType} onValueChange={(val) => setServiceType(val ?? 'Accident & Crash Repair')}>
                <SelectTrigger id='lead-service'>
                  <SelectValue placeholder='Select service' />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='lead-desc' className='text-xs font-medium'>
                Damage / Work Description
              </Label>
              <Textarea
                id='lead-desc'
                rows={2}
                placeholder='e.g. Front driver-side wing and bumper scuff. Needs dent pull and blending.'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section 5: Staff Assignment & Inspection Schedule */}
          <div className='flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 p-3'>
            <Label className='flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
              <UserCheck2 className='size-3.5 text-red-500' />
              <span>5. Staff Assignment &amp; Physical Inspection</span>
            </Label>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-technician' className='text-xs font-medium'>
                  Assigned Technician / Staff
                </Label>
                <Select
                  value={assignedAdminId}
                  onValueChange={(val) => {
                    if (val) setAssignedAdminId(val);
                  }}
                >
                  <SelectTrigger id='lead-technician'>
                    <SelectValue placeholder='Unassigned' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='unassigned'>
                      <span className='text-muted-foreground italic'>Unassigned (Workshop Pool)</span>
                    </SelectItem>
                    {adminUsers?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className='font-medium'>{user.name}</span>
                        <span className='ml-1 text-xs text-muted-foreground'>({user.email})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='lead-inspection' className='flex items-center gap-1 text-xs font-medium'>
                  <CalendarClock className='size-3 text-muted-foreground' />
                  <span>Scheduled Physical Inspection</span>
                </Label>
                <Input
                  id='lead-inspection'
                  type='datetime-local'
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>
          </div>

          {/* Section 6: Initial Stage & Pricing */}
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='lead-status' className='text-xs font-medium'>
                Initial Pipeline State
              </Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v) setStatus(v as PipelineStatus);
                }}
              >
                <SelectTrigger id='lead-status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className='flex items-center gap-1.5'>
                        <span className={`size-2 rounded-full ${STATUS_CONFIG[s]?.dotClassName ?? 'bg-neutral-500'}`} />
                        {STATUS_CONFIG[s]?.label ?? s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='lead-cost' className='text-xs font-medium'>
                Estimated Cost (€ EUR)
              </Label>
              <Input
                id='lead-cost'
                type='number'
                step='0.01'
                min='0'
                placeholder='e.g. 450.00'
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>
          </div>

          {/* Section 7: Staff Notes */}
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='lead-notes' className='text-xs font-medium'>
              Internal Staff Notes
            </Label>
            <Textarea
              id='lead-notes'
              rows={2}
              placeholder='e.g. Customer will drop car by Wednesday 10 AM for physical inspection.'
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <DialogFooter className='pt-2'>
            <Button type='button' variant='outline' onClick={() => setOpen(false)} disabled={submitMutation.isPending}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={submitMutation.isPending}
              className='bg-red-600 text-white hover:bg-red-700'
            >
              {submitMutation.isPending ? 'Logging Enquiry…' : 'Save & Log Enquiry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
