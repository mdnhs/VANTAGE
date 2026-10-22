'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { StatusPill } from '@/components/admin/dashboard/status-pill';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { liveDeclarations } from '@/lib/theme/css';
import type { AdminThemeConfig } from '@/lib/theme/schema';

import { applyLive } from '../lib/live-tokens';

const CHARTS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

// While mounted, the draft is the admin itself (inline on <html>, which beats
// the published <style>). The cleanup returns the page to the published one.
export function useLiveAdmin(admin: AdminThemeConfig) {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  useEffect(() => {
    // Wait for next-themes to resolve, so a dark user never sees light tokens.
    if (resolvedTheme === undefined) return;
    return applyLive(document.documentElement, liveDeclarations(admin, mode));
  }, [admin, mode, resolvedTheme]);
}

export function AdminPreview() {
  return (
    <DashboardCard title='Admin preview'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-wrap gap-2'>
          <Button type='button'>Primary</Button>
          <Button type='button' variant='secondary'>
            Secondary
          </Button>
          <Button type='button' variant='outline'>
            Outline
          </Button>
          <Badge>Badge</Badge>
        </div>
        <Input aria-label='Sample input' defaultValue='Sample text' />
        <label className='flex items-center gap-2 text-sm'>
          <Switch defaultChecked aria-label='Sample switch' /> Switch
        </label>
        <div className='flex flex-wrap gap-2'>
          <StatusPill tone='success'>Published</StatusPill>
          <StatusPill tone='warning'>In progress</StatusPill>
          <StatusPill tone='danger'>Failed</StatusPill>
        </div>
        <div aria-hidden className='flex gap-2'>
          {CHARTS.map((swatch) => (
            <span key={swatch} className={`h-8 flex-1 rounded-md ${swatch}`} />
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
