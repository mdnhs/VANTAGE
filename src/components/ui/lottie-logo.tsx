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

  const source = useMemo(() => {
    if (!data) return null;
    const parsed = parseLottieJson(data);
    if (parsed) return parsed;
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        return trimmed;
      }
    }
    return null;
  }, [data]);

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
