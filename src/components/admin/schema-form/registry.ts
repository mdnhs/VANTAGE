import * as z from 'zod';

// Each Zod schema carries UI metadata in a registry, and toJSONSchema copies it
// into `x-ui`. Register last (after .optional() or .default()) so the metadata
// sits on the schema the form sees.
export type Widget =
  | 'text'
  | 'textarea'
  | 'number'
  | 'toggle'
  | 'select'
  | 'radio'
  | 'list'
  | 'group'
  | 'link'
  | 'image'
  | 'video'
  | 'weekly-hours';

export type UiMeta = {
  // Optional: shared field schemas (field-ui.ts) take the field's own name.
  label?: string;
  description?: string;
  placeholder?: string;
  widget?: Widget;
  options?: readonly { value: string; label: string }[];
  inputType?: 'text' | 'email' | 'password' | 'url' | 'tel';
  autoComplete?: string;
  step?: number;
  // Cloudinary folder for image/video uploads.
  folder?: string;
};

export const ui = z.registry<UiMeta>();
