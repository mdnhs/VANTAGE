import { Shield, Check, X, Wrench, Headphones, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { StaffMember, StaffRole } from '../types';

interface StaffViewProps {
  staff: StaffMember[];
}

const ROLE_DESCRIPTIONS: Record<StaffRole, { icon: React.ElementType; description: string; badgeColor: string }> = {
  Admin: {
    icon: Shield,
    description: 'Full administrative authority, deletion privileges, staff governance, and high-level revenue audit.',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  Technician: {
    icon: Wrench,
    description: 'Floor operations, job status updates, spray booth / jig logging, and damage photo upload.',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  },
  'Front Desk': {
    icon: Headphones,
    description: 'Initial customer intake across all 6 channels, scheduling, direct call logs, and customer follow-up.',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  Billing: {
    icon: Receipt,
    description:
      'Insurance claim submission, itemized parts/labor invoices, direct billing, and payment reconciliation.',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
};

export function StaffView({ staff }: StaffViewProps) {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='border-red-500/30 bg-red-500/10 font-mono text-[11px] tracking-wider text-red-400 uppercase'
            >
              PDF Module 5 • Staff Access &amp; Permissions
            </Badge>
          </div>
          <h1 className='mt-1 text-2xl font-bold tracking-tight text-white'>Team Roles &amp; Access Governance</h1>
          <p className='text-xs text-slate-400'>
            Role definitions, visibility boundaries, and permissions for Admin, Technician, Front Desk, and Billing.
          </p>
        </div>

        <Badge variant='outline' className='border-[#242a3e] bg-[#141824] px-3 py-1.5 font-mono text-xs text-slate-300'>
          <span>Active Staff:</span>
          <strong className='ml-1 text-white'>{staff.length} Members</strong>
        </Badge>
      </div>

      {/* Role Cards (4 Roles from PDF) */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {(['Admin', 'Technician', 'Front Desk', 'Billing'] as StaffRole[]).map((role) => {
          const roleMeta = ROLE_DESCRIPTIONS[role];
          const Icon = roleMeta.icon;
          const membersCount = staff.filter((s) => s.role === role).length;

          return (
            <Card key={role} className='flex flex-col justify-between border-[#242a3e] bg-[#0f1219] text-slate-200'>
              <CardContent className='p-5'>
                <div className='flex items-center justify-between'>
                  <div className='flex size-9 items-center justify-center rounded-lg bg-[#141824] text-red-400'>
                    <Icon className='size-5' />
                  </div>
                  <Badge
                    variant='outline'
                    className={`font-mono text-[10px] font-bold uppercase ${roleMeta.badgeColor}`}
                  >
                    {role}
                  </Badge>
                </div>
                <h3 className='mt-3 text-base font-bold text-white'>{role}</h3>
                <p className='mt-1 text-xs leading-relaxed text-slate-400'>{roleMeta.description}</p>
              </CardContent>

              <div className='border-t border-[#1a1f2e] p-5 pt-3 font-mono text-xs text-slate-400'>
                Assigned Team Members: <strong className='text-white'>{membersCount}</strong>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className='overflow-hidden rounded-xl border border-[#242a3e] bg-[#0f1219]'>
        <div className='border-b border-[#242a3e] p-4'>
          <h3 className='text-sm font-bold text-white'>Role Permissions &amp; Boundary Restrictions</h3>
          <p className='text-xs text-slate-400'>Exact capabilities configured per operational role.</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className='border-b border-[#242a3e] bg-[#0a0c10]/60 hover:bg-[#0a0c10]/60'>
              <TableHead className='font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Permission / Capability
              </TableHead>
              <TableHead className='text-center font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Admin
              </TableHead>
              <TableHead className='text-center font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Technician
              </TableHead>
              <TableHead className='text-center font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Front Desk
              </TableHead>
              <TableHead className='text-center font-mono text-[11px] tracking-wider text-slate-400 uppercase'>
                Billing
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-[#242a3e] text-slate-300'>
            <TableRow className='border-b border-[#242a3e] hover:bg-[#141824]/50'>
              <TableCell className='font-medium'>Manage New Enquiries (6 channels)</TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <X className='mx-auto size-4 text-slate-600' />
              </TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
            </TableRow>
            <TableRow className='border-b border-[#242a3e] hover:bg-[#141824]/50'>
              <TableCell className='font-medium'>Update Job Stage (8 pipeline states)</TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <X className='mx-auto size-4 text-slate-600' />
              </TableCell>
            </TableRow>
            <TableRow className='border-b border-[#242a3e] hover:bg-[#141824]/50'>
              <TableCell className='font-medium'>Upload Damage &amp; Repair Documentation Photos</TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <X className='mx-auto size-4 text-slate-600' />
              </TableCell>
            </TableRow>
            <TableRow className='border-b border-[#242a3e] hover:bg-[#141824]/50'>
              <TableCell className='font-medium'>Direct Insurance Claim Settlement &amp; Invoicing</TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <X className='mx-auto size-4 text-slate-600' />
              </TableCell>
              <TableCell className='text-center'>
                <X className='mx-auto size-4 text-slate-600' />
              </TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
            </TableRow>
            <TableRow className='border-b border-[#242a3e] hover:bg-[#141824]/50'>
              <TableCell className='font-medium'>Staff Management &amp; System Administration</TableCell>
              <TableCell className='text-center'>
                <Check className='mx-auto size-4 text-emerald-400' />
              </TableCell>
              <TableCell className='text-center'>
                <X className='mx-auto size-4 text-slate-600' />
              </TableCell>
              <TableCell className='text-center'>
                <X className='mx-auto size-4 text-slate-600' />
              </TableCell>
              <TableCell className='text-center'>
                <X className='mx-auto size-4 text-slate-600' />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Staff Roster Directory */}
      <div className='overflow-hidden rounded-xl border border-[#242a3e] bg-[#0f1219]'>
        <div className='border-b border-[#242a3e] p-4'>
          <h3 className='text-sm font-bold text-white'>Active Team Members</h3>
        </div>

        <div className='divide-y divide-[#242a3e]'>
          {staff.map((member) => {
            const initials = member.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2);

            return (
              <div key={member.id} className='flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center'>
                <div className='flex items-center gap-3'>
                  <Avatar className='size-9 border border-slate-700 bg-red-950/80'>
                    <AvatarFallback className='bg-red-950/80 text-xs font-bold text-red-400'>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='text-sm font-bold text-white'>{member.name}</div>
                    <div className='font-mono text-xs text-slate-400'>
                      {member.email} • {member.phone}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2.5'>
                  {member.assignedBays && (
                    <Badge
                      variant='outline'
                      className='border-[#242a3e] bg-[#141824] font-mono text-[11px] text-slate-400'
                    >
                      {member.assignedBays.join(', ')}
                    </Badge>
                  )}
                  <Badge
                    variant='outline'
                    className={`font-mono text-[10px] font-bold uppercase ${ROLE_DESCRIPTIONS[member.role].badgeColor}`}
                  >
                    {member.role}
                  </Badge>
                  <Badge
                    variant='outline'
                    className='border-emerald-500/30 bg-emerald-500/15 font-mono text-[10px] text-emerald-400'
                  >
                    {member.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
