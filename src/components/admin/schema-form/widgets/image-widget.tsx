'use client';

import { type ImageRef } from '@/lib/content/image-ref';

import { RefWidget } from './ref-widget';
import { type WidgetProps } from './shell';

export function ImageWidget(props: WidgetProps<ImageRef | undefined>) {
  return <RefWidget {...props} mode='single-image' defaultFolder='vantage/site' />;
}
