'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SITE_FONT_IDS, SITE_FONTS, type SiteFontId } from '@/lib/theme/fonts';

const ITEMS = SITE_FONT_IDS.map((id) => ({ value: id, label: SITE_FONTS[id].label }));

// One slot (heading or body) of the curated catalogue. Every option is drawn
// in its own face; the fonts are declared at build time, so no fetch happens.
export function FontPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SiteFontId;
  onChange(value: SiteFontId): void;
}) {
  const id = `font-${label.toLowerCase()}`;
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={ITEMS} value={value} onValueChange={(next) => onChange(next as SiteFontId)}>
        <SelectTrigger id={id} className='w-full' style={{ fontFamily: `var(${SITE_FONTS[value].variable})` }}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ITEMS.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              style={{ fontFamily: `var(${SITE_FONTS[item.value].variable})` }}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
