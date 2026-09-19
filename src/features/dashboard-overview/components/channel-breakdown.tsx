'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SOURCE_CONFIG } from '@/features/quote-requests/components/quote-source-badge';
import type { ChannelBreakdownItem } from '../types';
import { Globe } from 'lucide-react';

interface ChannelBreakdownProps {
  channels: ChannelBreakdownItem[];
}

export function ChannelBreakdown({ channels }: ChannelBreakdownProps) {
  return (
    <Card className='flex flex-col'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-bold tracking-wider text-foreground uppercase'>Intake Channels</CardTitle>
        <CardDescription className='text-xs'>Distribution across lead intake channels</CardDescription>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col gap-3.5'>
        {channels.length === 0 ? (
          <div className='flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground'>
            No channel data available yet.
          </div>
        ) : (
          channels.map((c) => {
            const config = SOURCE_CONFIG[c.source] ?? {
              label: c.source.replace(/_/g, ' '),
              icon: Globe,
              className: 'text-muted-foreground',
            };
            const Icon = config.icon;

            return (
              <div key={c.source} className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between text-xs'>
                  <div className='flex items-center gap-2 font-medium text-foreground'>
                    <Icon className='size-3.5 text-muted-foreground' />
                    <span>{config.label}</span>
                  </div>
                  <div className='flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground'>
                    <span className='font-semibold text-foreground'>{c.count}</span>
                    <span>({c.percentage}%)</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className='h-2 w-full overflow-hidden rounded-full bg-muted/60'>
                  <div
                    style={{ width: `${Math.max(c.percentage, 4)}%` }}
                    className='h-full rounded-full bg-red-600 transition-all duration-300'
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
