'use client';

import { useState } from 'react';

import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { tokenLabel } from '@/lib/theme/checks';
import { formatOklch } from '@/lib/theme/color';
import type { SiteFontId } from '@/lib/theme/fonts';
import type { ThemeConfigValue } from '@/lib/theme/schema';
import { brandRgb, resolveSiteTokens } from '@/lib/theme/site';
import { LOCKABLE_SITE_TOKENS, type SiteToken } from '@/lib/theme/tokens';

import { ColourField } from './colour-field';
import { FontPicker } from './font-picker';

// Site theming is limited (no presets): one brand colour the rest of the red
// family follows, optional locks, and two fonts.
export function SiteControls({ draft, update }: { draft: ThemeConfigValue; update(next: ThemeConfigValue): void }) {
  const [open, setOpen] = useState(false);
  const { site } = draft;
  const resolved = resolveSiteTokens(site);
  const [r, g, b] = brandRgb(site);
  const setToken = (token: SiteToken, value: string | null) => {
    const tokens = { ...site.tokens };
    if (value) tokens[token as keyof typeof tokens] = value;
    else delete tokens[token as keyof typeof tokens];
    update({ ...draft, site: { ...site, tokens } });
  };
  const setFont = (slot: 'heading' | 'body', id: SiteFontId) =>
    update({ ...draft, site: { ...site, fonts: { ...site.fonts, [slot]: id } } });

  return (
    <>
      <DashboardCard title='Site colours'>
        <ColourField
          label='Brand'
          value={site.brand}
          fallback={resolved.brand}
          onChange={(brand) => update({ ...draft, site: { ...site, brand } })}
        />
        <details onToggle={(event) => setOpen(event.currentTarget.open)}>
          <summary className='cursor-pointer text-sm font-medium'>Advanced tokens</summary>
          {open ? (
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              {LOCKABLE_SITE_TOKENS.map((token) => {
                const locked = token in site.tokens;
                return (
                  <ColourField
                    key={token}
                    label={tokenLabel('site', token)}
                    value={site.tokens[token] ?? null}
                    fallback={resolved[token]}
                    onChange={(value) => setToken(token, value)}
                    lock={{
                      locked,
                      onToggle: () => setToken(token, locked ? null : formatOklch(resolved[token])),
                    }}
                  />
                );
              })}
              <div className='flex min-w-0 flex-col gap-1.5'>
                <span className='text-sm font-medium'>Glow</span>
                <div className='flex items-center gap-2'>
                  <span
                    aria-hidden
                    className='size-9 shrink-0 rounded-lg border'
                    style={{ backgroundColor: `rgb(${r} ${g} ${b})` }}
                  />
                  <p className='truncate text-xs text-muted-foreground'>
                    Follows the brand colour · {r} {g} {b}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </details>
      </DashboardCard>
      <DashboardCard title='Fonts'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FontPicker label='Heading' value={site.fonts.heading} onChange={(id) => setFont('heading', id)} />
          <FontPicker label='Body' value={site.fonts.body} onChange={(id) => setFont('body', id)} />
        </div>
      </DashboardCard>
    </>
  );
}
