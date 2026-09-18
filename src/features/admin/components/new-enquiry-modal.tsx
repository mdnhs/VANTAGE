'use client';

import { useState } from 'react';
import { Phone, Mail, CheckCircle2, Globe, MessageSquare, Share2, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CustomerRecord, IntakeChannel } from '../types';

interface NewEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEnquiry: (record: CustomerRecord) => void;
}

const CHANNELS: { label: IntakeChannel; icon: React.ElementType }[] = [
  { label: 'Website Form', icon: Globe },
  { label: 'Direct Phone Call', icon: Phone },
  { label: 'WhatsApp', icon: MessageSquare },
  { label: 'Email', icon: Mail },
  { label: 'Facebook / Social', icon: Share2 },
  { label: 'Walk-ins', icon: UserCheck },
];

export function NewEnquiryModal({ isOpen, onClose, onAddEnquiry }: NewEnquiryModalProps) {
  const [channel, setChannel] = useState<IntakeChannel>('Website Form');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('Dublin, Ireland');
  const [regNumber, setRegNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [year] = useState('2023');
  const [paintCode, setPaintCode] = useState('');
  const [serviceScope, setServiceScope] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [estimateValue, setEstimateValue] = useState('1500');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `JOB-2026-00${Math.floor(430 + Math.random() * 50)}`;
    const newRecord: CustomerRecord = {
      id: newId,
      contactName,
      phone,
      email,
      address,
      regNumber: regNumber.toUpperCase() || '241-D-9988',
      vehicleModel: vehicleModel || 'Vehicle Pending Assessment',
      year: parseInt(year, 10) || 2023,
      paintCode: paintCode || 'OEM Factory Code',
      serviceScope: serviceScope || 'Collision damage inspection',
      channel,
      status: 'New',
      currentMilestone: 1,
      estimateValue: parseFloat(estimateValue) || 1200,
      progressPercent: 0,
      dueTarget: 'Pending Review',
      photos: ['/assets/marketing/service-crash-repair.jpg'],
      customNotes: customNotes ? [customNotes] : ['Initial enquiry logged.'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddEnquiry(newRecord);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto border-[#242a3e] bg-[#0f1219] p-6 text-slate-200 sm:max-w-2xl'>
        <DialogHeader className='border-b border-[#242a3e] pb-4 text-left'>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='border-red-500/30 bg-red-500/10 font-mono text-[10px] text-red-400'>
              PDF Module 1 • System Intake
            </Badge>
          </div>
          <DialogTitle className='mt-1 text-lg font-bold text-white'>Log New Customer Enquiry</DialogTitle>
          <DialogDescription className='text-xs text-slate-400'>
            Capture upfront vehicle details, channel origin, and service scope.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='mt-4 space-y-5'>
          {/* Intake Channels (6 options from PDF) */}
          <div className='space-y-2'>
            <Label className='font-mono text-xs tracking-wider text-slate-400 uppercase'>Intake Channel</Label>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isSelected = channel === ch.label;
                return (
                  <Button
                    key={ch.label}
                    type='button'
                    variant={isSelected ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setChannel(ch.label)}
                    className={`flex items-center justify-start gap-2 text-xs transition ${
                      isSelected
                        ? 'border-red-500 bg-red-600 text-white shadow-sm hover:bg-red-700'
                        : 'border-[#242a3e] bg-[#141824] text-slate-300 hover:border-slate-500 hover:bg-[#1a1f2e] hover:text-white'
                    }`}
                  >
                    <Icon className={`size-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className='truncate'>{ch.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Customer Information (PDF Module 2) */}
          <div className='space-y-2.5'>
            <Label className='font-mono text-xs tracking-wider text-slate-400 uppercase'>Customer Profile Fields</Label>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='space-y-1'>
                <Label htmlFor='contactName' className='text-xs text-slate-300'>
                  Contact Name *
                </Label>
                <Input
                  id='contactName'
                  required
                  placeholder="e.g. John O'Donnell"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className='border-[#242a3e] bg-[#0a0c10] text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
                />
              </div>

              <div className='space-y-1'>
                <Label htmlFor='phone' className='text-xs text-slate-300'>
                  Phone Number *
                </Label>
                <Input
                  id='phone'
                  type='tel'
                  required
                  placeholder='+353 87 123 4567'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className='border-[#242a3e] bg-[#0a0c10] text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
                />
              </div>

              <div className='space-y-1'>
                <Label htmlFor='email' className='text-xs text-slate-300'>
                  Email Address *
                </Label>
                <Input
                  id='email'
                  type='email'
                  required
                  placeholder='john@example.ie'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='border-[#242a3e] bg-[#0a0c10] text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
                />
              </div>

              <div className='space-y-1'>
                <Label htmlFor='address' className='text-xs text-slate-300'>
                  Full Address
                </Label>
                <Input
                  id='address'
                  placeholder='e.g. 12 Ranelagh Road, Dublin 6'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className='border-[#242a3e] bg-[#0a0c10] text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
                />
              </div>
            </div>
          </div>

          {/* Vehicle / Asset Details */}
          <div className='space-y-2.5'>
            <Label className='font-mono text-xs tracking-wider text-slate-400 uppercase'>Vehicle / Asset Details</Label>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
              <div className='space-y-1'>
                <Label htmlFor='regNumber' className='text-xs text-slate-300'>
                  Irish Reg Plate *
                </Label>
                <Input
                  id='regNumber'
                  required
                  placeholder='e.g. 231-D-4512'
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                  className='border-[#242a3e] bg-[#0a0c10] font-mono text-xs text-white uppercase placeholder-slate-500 focus-visible:ring-red-500'
                />
              </div>

              <div className='space-y-1'>
                <Label htmlFor='vehicleModel' className='text-xs text-slate-300'>
                  Make &amp; Model
                </Label>
                <Input
                  id='vehicleModel'
                  placeholder='e.g. BMW 520d M-Sport'
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className='border-[#242a3e] bg-[#0a0c10] text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
                />
              </div>

              <div className='space-y-1'>
                <Label htmlFor='paintCode' className='text-xs text-slate-300'>
                  Paint Code / Color
                </Label>
                <Input
                  id='paintCode'
                  placeholder='e.g. Alpine White 300'
                  value={paintCode}
                  onChange={(e) => setPaintCode(e.target.value)}
                  className='border-[#242a3e] bg-[#0a0c10] text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
                />
              </div>
            </div>
          </div>

          {/* Service Scope & Notes */}
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label htmlFor='serviceScope' className='text-xs text-slate-300'>
                Service Scope *
              </Label>
              <Input
                id='serviceScope'
                required
                placeholder='e.g. Front bumper collision repair, laser chassis pull'
                value={serviceScope}
                onChange={(e) => setServiceScope(e.target.value)}
                className='border-[#242a3e] bg-[#0a0c10] text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
              />
            </div>

            <div className='space-y-1'>
              <Label htmlFor='estimateValue' className='text-xs text-slate-300'>
                Initial Estimate Value (€)
              </Label>
              <Input
                id='estimateValue'
                type='number'
                placeholder='1500'
                value={estimateValue}
                onChange={(e) => setEstimateValue(e.target.value)}
                className='border-[#242a3e] bg-[#0a0c10] font-mono text-xs text-white placeholder-slate-500 focus-visible:ring-red-500'
              />
            </div>

            <div className='space-y-1'>
              <Label htmlFor='customNotes' className='text-xs text-slate-300'>
                Custom Notes / Upfront Details
              </Label>
              <textarea
                id='customNotes'
                rows={2}
                placeholder='Add any damage notes, customer instructions, or insurance claim numbers...'
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className='w-full rounded-lg border border-[#242a3e] bg-[#0a0c10] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none'
              />
            </div>
          </div>

          <DialogFooter className='border-t border-[#242a3e] pt-4 sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onClose}
              className='border-[#242a3e] bg-[#141824] text-xs text-slate-300 hover:bg-[#1a1f2e] hover:text-white'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              size='sm'
              className='bg-red-600 text-xs font-semibold text-white shadow-md shadow-red-900/30 hover:bg-red-700'
            >
              <CheckCircle2 className='mr-1.5 size-3.5' />
              Save &amp; Log Enquiry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
