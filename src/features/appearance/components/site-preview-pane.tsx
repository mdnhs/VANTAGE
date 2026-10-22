'use client';

import { ExternalLinkIcon, MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

import { previewHref } from '../services/api';

const DEVICES = { desktop: 1440, tablet: 834, phone: 390 } as const;
type Device = keyof typeof DEVICES;

// The public site in draft mode, scaled to the pane. `GET /preview` enables
// draft mode (cookie) and redirects to the path, so the frame loads the
// draft theme. `refreshKey` changes after each save, adopt (discard, reset,
// restore) and publish; the frame re-enters preview at `src`.
export function SitePreviewPane({ path, refreshKey }: { path: string; refreshKey: number | null }) {
  const [device, setDevice] = useState<Device>('desktop');
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const width = DEVICES[device];
  const src = previewHref(path);
  const scale = box.width ? Math.min(1, box.width / width) : 1;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!refreshKey) return;
    const el = frame.current;
    if (!el) return;
    setLoading(true);
    // Re-enter through the preview endpoint rather than reloading: the frame may have left
    // draft mode (or the page), and this puts it back on the draft.
    el.src = src;
  }, [refreshKey, src]);
  return (
    <section
      aria-label='Site preview'
      className='flex min-w-0 flex-col gap-4 rounded-card bg-card p-4 text-card-foreground sm:p-5'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='flex items-center gap-2 text-card-title'>
          Preview
          {loading ? <Spinner aria-label='Refreshing' className='size-4 text-primary' /> : null}
        </h2>
        <div className='flex items-center gap-2'>
          <ToggleGroup
            value={[device]}
            onValueChange={(value) => value[0] && setDevice(value[0] as Device)}
            aria-label='Preview size'
            variant='outline'
            size='sm'
          >
            <ToggleGroupItem value='desktop' aria-label='Desktop'>
              <MonitorIcon aria-hidden />
            </ToggleGroupItem>
            <ToggleGroupItem value='tablet' aria-label='Tablet'>
              <TabletIcon aria-hidden />
            </ToggleGroupItem>
            <ToggleGroupItem value='phone' aria-label='Phone'>
              <SmartphoneIcon aria-hidden />
            </ToggleGroupItem>
          </ToggleGroup>
          <a
            href={src}
            target='_blank'
            rel='noopener'
            aria-label='Open the preview in a new tab'
            className='flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50'
          >
            <ExternalLinkIcon aria-hidden className='size-4' />
          </a>
        </div>
      </div>
      <div ref={boxRef} className='relative min-h-[28rem] flex-1 overflow-hidden rounded-xl bg-muted'>
        <iframe
          ref={frame}
          title='Site preview'
          src={src}
          onLoad={() => setLoading(false)}
          className={cn(
            'absolute top-0 border-0 bg-white transition-opacity',
            box.width === 0 && 'opacity-0',
            scale === 1 && device !== 'desktop' && 'shadow-lg',
          )}
          style={{
            width,
            height: box.height ? box.height / scale : '100%',
            left: Math.max(0, (box.width - width * scale) / 2),
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </section>
  );
}
