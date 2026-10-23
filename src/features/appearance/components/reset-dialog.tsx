'use client';

import { useState } from 'react';

import { FORM_ACTION } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRESET_IDS, PRESETS, type PresetId } from '@/lib/theme/presets';

import type { ThemeResetScope } from '../types';

const PRESET_ITEMS = PRESET_IDS.map((id) => ({ value: id, label: PRESETS[id].label }));
const SCOPES = [
  ['site', 'Site'],
  ['admin', 'Admin'],
  ['both', 'Both'],
] as const;

export function ResetDialog({
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange(open: boolean): void;
  onConfirm(input: { preset: PresetId; scope: ThemeResetScope }): void;
}) {
  const [preset, setPreset] = useState<PresetId>('vantage-red');
  const [scope, setScope] = useState<ThemeResetScope>('both');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-5 p-6 sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Reset to preset</DialogTitle>
          <DialogDescription>
            Replaces the draft colours. The site always goes back to the VANTAGE default; the preset applies to the
            admin. Corner radius and default mode stay. Nothing goes live until you publish.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor='reset-preset'>Admin preset</FieldLabel>
          <Select items={PRESET_ITEMS} value={preset} onValueChange={(next) => setPreset(next as PresetId)}>
            <SelectTrigger id='reset-preset' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel id='reset-scope'>Scope</FieldLabel>
          <RadioGroup
            aria-labelledby='reset-scope'
            value={scope}
            onValueChange={(next) => setScope(next as ThemeResetScope)}
            className='flex gap-4'
          >
            {SCOPES.map(([value, text]) => (
              <label key={value} className='flex items-center gap-2 text-sm'>
                <RadioGroupItem value={value} /> {text}
              </label>
            ))}
          </RadioGroup>
        </Field>
        <DialogFooter>
          <Button variant='outline' className={FORM_ACTION} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className={FORM_ACTION} disabled={pending} onClick={() => onConfirm({ preset, scope })}>
            Reset draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
