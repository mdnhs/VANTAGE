import type { ImageRef } from '@/lib/content/image-ref';

// A form's image slot: `undefined` = untouched (keep what the row has, including a
// legacy Cloudinary image), `null` = removed, string = a chosen media id.
export type Slot = string | null | undefined;

// What the MediaField shows for the slot: the chosen media, else the row's own media,
// else nothing.
export function slotRef(slot: Slot, rowMediaId: string | null | undefined): ImageRef {
  const id = slot === undefined ? rowMediaId : slot;
  if (id) return { kind: 'media', id };
  return null;
}

// The payload entry for a slot; nothing when untouched, so the row's image stays.
export const slotPatch = <K extends string>(key: K, slot: Slot): Partial<Record<K, string | null>> =>
  slot === undefined ? {} : ({ [key]: slot } as Record<K, string | null>);
