'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react').then((mod) => mod.Lottie), { ssr: false });

interface LottieLogoProps {
  data: string | object | null | undefined;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  alt?: string;
  fallback?: React.ReactNode;
  style?: React.CSSProperties;
}

export function parseLottieJson(raw: string | object | null | undefined): object | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function LottieLogo({
  data,
  className,
  loop = true,
  autoplay = true,
  alt = 'Logo animation',
  fallback = null,
  style,
}: LottieLogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inline = useMemo(() => (data ? parseLottieJson(data) : null), [data]);
  const url = useMemo(() => {
    if (inline || typeof data !== 'string') return null;
    const trimmed = data.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') ? trimmed : null;
  }, [data, inline]);
  // A URL (the site's /brand/logo.json) is fetched after mount, so the document never rides in the page HTML.
  const [fetched, setFetched] = useState<{ url: string; doc: object } | null>(null);

  useEffect(() => {
    if (!url) return;
    let live = true;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((doc: unknown) => {
        if (live && doc && typeof doc === 'object') setFetched({ url, doc });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [url]);

  const source = inline ?? (fetched && fetched.url === url ? fetched.doc : null);

  if (!mounted || !source) {
    return <>{fallback}</>;
  }

  return (
    <div
      role='img'
      aria-label={alt}
      className={`flex items-center justify-center overflow-hidden ${className ?? ''}`}
      style={style}
    >
      <Lottie src={source} loop={loop} autoplay={autoplay} className='h-full w-full object-contain' />
    </div>
  );
}
