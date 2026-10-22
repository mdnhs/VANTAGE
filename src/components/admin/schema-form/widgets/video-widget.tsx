'use client';

import { type VideoRef } from '@/lib/content/image-ref';

import { RefWidget } from './ref-widget';
import { type WidgetProps } from './shell';

// The folder must contain "video": CloudinaryUpload picks the resource type
// from it.
export function VideoWidget(props: WidgetProps<VideoRef | undefined>) {
  return <RefWidget {...props} mode='video' defaultFolder='vantage/site/video' />;
}
