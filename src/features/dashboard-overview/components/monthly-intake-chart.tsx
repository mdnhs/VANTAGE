'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonthlyTrendItem } from '../types';

interface MonthlyIntakeChartProps {
  trends: MonthlyTrendItem[];
}

export function MonthlyIntakeChart({ trends }: MonthlyIntakeChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute max for dynamic scaling
  const maxVal = Math.max(
    ...trends.map((t) => Math.max(t.inquiries, t.completed)),
    6, // minimum baseline ceiling
  );

  const chartHeight = 160;
  const barWidth = 14;

  return (
    <Card className='flex flex-col'>
      <CardHeader className='flex flex-row items-center justify-between pb-3'>
        <div>
          <CardTitle className='text-sm font-bold tracking-wider text-foreground uppercase'>
            Monthly Intake Trends
          </CardTitle>
          <CardDescription className='text-xs'>
            Inquiry intake volume vs completed jobs over the last 6 months
          </CardDescription>
        </div>

        {/* Legend */}
        <div className='flex items-center gap-3 text-xs'>
          <div className='flex items-center gap-1.5'>
            <span className='size-2.5 rounded-sm bg-rose-500' />
            <span className='text-muted-foreground'>Inquiries</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='size-2.5 rounded-sm bg-emerald-500' />
            <span className='text-muted-foreground'>Completed</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col justify-end pt-2'>
        {/* Hover details badge */}
        <div className='flex h-6 items-center justify-between text-xs text-muted-foreground'>
          {hoveredIdx !== null ? (
            <div className='flex items-center gap-3 font-medium text-foreground'>
              <span>{trends[hoveredIdx].monthLabel}:</span>
              <span className='font-bold text-rose-500'>{trends[hoveredIdx].inquiries} Inquiries</span>
              <span className='font-bold text-emerald-500'>{trends[hoveredIdx].completed} Completed</span>
              {trends[hoveredIdx].revenue > 0 && (
                <span className='font-bold text-amber-500'>
                  €{trends[hoveredIdx].revenue.toLocaleString('en-IE')} Revenue
                </span>
              )}
            </div>
          ) : (
            <span className='text-[11px] text-muted-foreground/80'>Hover over bars to inspect monthly breakdown</span>
          )}
        </div>

        {/* Responsive Bar Chart Canvas */}
        <div className='mt-2 flex h-48 w-full items-end justify-between gap-2 border-b border-border/70 px-2 pt-4 pb-2'>
          {trends.map((item, idx) => {
            const inqHeight = Math.max(Math.round((item.inquiries / maxVal) * chartHeight), 4);
            const compHeight = Math.max(Math.round((item.completed / maxVal) * chartHeight), 4);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.monthKey}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className='group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end'
              >
                {/* Paired Bars Container */}
                <div className='flex items-end gap-1'>
                  {/* Inquiries Bar */}
                  <div
                    style={{ height: `${item.inquiries > 0 ? inqHeight : 4}px`, width: `${barWidth}px` }}
                    className={`rounded-t transition-all duration-200 ${
                      item.inquiries > 0
                        ? isHovered
                          ? 'bg-rose-400 shadow-lg shadow-rose-500/30'
                          : 'bg-rose-500/80 hover:bg-rose-500'
                        : 'bg-muted/40'
                    }`}
                    title={`${item.inquiries} inquiries`}
                  />

                  {/* Completed Bar */}
                  <div
                    style={{ height: `${item.completed > 0 ? compHeight : 4}px`, width: `${barWidth}px` }}
                    className={`rounded-t transition-all duration-200 ${
                      item.completed > 0
                        ? isHovered
                          ? 'bg-emerald-400 shadow-lg shadow-emerald-500/30'
                          : 'bg-emerald-500/80 hover:bg-emerald-500'
                        : 'bg-muted/40'
                    }`}
                    title={`${item.completed} completed`}
                  />
                </div>

                {/* X Axis Label */}
                <span
                  className={`mt-2 font-mono text-[11px] font-medium transition-colors ${
                    isHovered ? 'font-bold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className='mt-2 flex items-center justify-between text-[11px] text-muted-foreground'>
          <span>6-Month Intake Volume</span>
          <span className='font-semibold text-foreground'>
            {trends.reduce((acc, t) => acc + t.inquiries, 0)} Total Inquiries Recorded
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
