import { imageRefSchema, videoRefSchema } from '@/lib/content/image-ref';

import { ui } from './registry';

// Shared field schemas -> widgets, once for every form. Labels come from the
// field name. Both refs are nullable unions that the widget handles whole.
ui.add(imageRefSchema, { widget: 'image' });
ui.add(videoRefSchema, { widget: 'video' });
