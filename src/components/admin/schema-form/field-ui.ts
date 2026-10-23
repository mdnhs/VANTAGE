import { imageRefSchema, videoRefSchema } from '@/lib/content/image-ref';

import { refKind } from './registry';

// Shared ref schemas -> widgets, once for every form. The marker lives in
// `refKind`, not `ui`: `.register(ui, { label: 'Hero' })` on these shared
// instances replaces their `ui` entry and would otherwise drop the widget.
// toJsonSchema copies it to `x-ref`, which survives .optional(), .default()
// and nesting in objects and arrays.
refKind.set(imageRefSchema, 'image');
refKind.set(videoRefSchema, 'video');
