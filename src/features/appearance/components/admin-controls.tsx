'use client';

import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { buildAdminTokens, presetAdminColours } from '@/lib/theme/admin';
import { ADMIN_RADII, type AdminThemeConfig, type ThemeConfigValue } from '@/lib/theme/schema';

import { ColourField } from './colour-field';
import { PresetGallery } from './preset-gallery';

// Widened: the picks are values, not literals.
const RADII: readonly number[] = ADMIN_RADII;
const TINTS = [
  ['preset', 'Preset'],
  ['none', 'None'],
  ['primary', 'Primary'],
] as const;
const MODES = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
] as const;

export function AdminControls({ draft, update }: { draft: ThemeConfigValue; update(next: ThemeConfigValue): void }) {
  const { admin } = draft;
  const set = (patch: Partial<AdminThemeConfig>) => update({ ...draft, admin: { ...admin, ...patch } });
  const tokens = buildAdminTokens(admin, 'light');
  const nearest = RADII.reduce(
    (best, r, i) => (Math.abs(r - admin.radius) < Math.abs(RADII[best]! - admin.radius) ? i : best),
    0,
  );
  return (
    <DashboardCard title='Admin colours'>
      <PresetGallery value={admin.preset} onPick={(id) => set(presetAdminColours(id))} />
      <div className='grid gap-4 sm:grid-cols-2'>
        <ColourField
          label='Primary'
          value={admin.primary}
          fallback={tokens.primary}
          onChange={(primary) => set({ primary })}
        />
        <ColourField
          label='Accent'
          value={admin.accent}
          fallback={tokens.accent}
          clearable
          onChange={(accent) => set({ accent })}
        />
      </div>
      <Field>
        <FieldLabel id='tint-label'>Neutral tint</FieldLabel>
        <RadioGroup
          aria-labelledby='tint-label'
          value={admin.tint}
          onValueChange={(tint) => set({ tint: tint as AdminThemeConfig['tint'] })}
          className='flex flex-wrap gap-4'
        >
          {TINTS.map(([value, text]) => (
            <label key={value} className='flex items-center gap-2 text-sm'>
              <RadioGroupItem value={value} /> {text}
            </label>
          ))}
        </RadioGroup>
      </Field>
      <Field>
        <FieldLabel htmlFor='radius'>Corner radius</FieldLabel>
        <div className='flex items-center gap-3'>
          <input
            id='radius'
            type='range'
            min={0}
            max={RADII.length - 1}
            step={1}
            value={nearest}
            aria-valuetext={`${RADII[nearest]}rem`}
            onChange={(event) => set({ radius: RADII[Number(event.target.value)]! })}
            className='w-full max-w-xs accent-primary'
          />
          <output htmlFor='radius' className='text-sm tabular-nums'>
            {RADII[nearest]}rem
          </output>
        </div>
      </Field>
      <Field>
        <FieldLabel id='mode-label'>Default mode</FieldLabel>
        <RadioGroup
          aria-labelledby='mode-label'
          value={admin.mode}
          onValueChange={(mode) => set({ mode: mode as AdminThemeConfig['mode'] })}
          className='flex flex-wrap gap-4'
        >
          {MODES.map(([value, text]) => (
            <label key={value} className='flex items-center gap-2 text-sm'>
              <RadioGroupItem value={value} /> {text}
            </label>
          ))}
        </RadioGroup>
      </Field>
    </DashboardCard>
  );
}
