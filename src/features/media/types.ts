import type { MediaItem as ServerMediaItem } from '@/server/services/media-library-service';

// The wire shape: the same item the service returns, with the date as a string.
export type MediaItem = Omit<ServerMediaItem, 'createdAt'> & { createdAt: string };

export type MediaKind = 'image' | 'video';
export type MediaTypeFilter = 'image' | 'video' | 'pdf';

export type MediaUse = { kind: 'setting' | 'content' | 'enquiry'; id: string; label: string; href: string | null };

export type MediaListParams = {
  q?: string;
  type?: MediaTypeFilter;
  missingAlt?: boolean;
  ids?: string[];
};

export type MediaPage = { items: MediaItem[]; hasNextPage: boolean };
