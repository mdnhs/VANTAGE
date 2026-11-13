import type { HelpArticle } from '../types';

export const MEDIA_DOCS: readonly HelpArticle[] = [
  {
    slug: 'media',
    group: 'media',
    title: 'Upload and find files',
    description: 'Add images, videos and PDFs to the media library and find them again.',
    lead: '**Media** holds every image, video and PDF used on the site. Any picture field in the admin picks from here.',
    permission: { media: ['read'] },
    keywords: ['images', 'photos', 'upload', 'library', 'video', 'pdf'],
    sections: [
      {
        title: 'Upload',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Media** and drop files on **Drop files here or choose them**, or click it to pick them from your computer.',
              'Wait for **Uploading …%** to finish for each file.',
              'Click the new file and add its alt text. See [Alt text, captions and focal point](/dashboard/help/media-details).',
            ],
          },
          { type: 'open', href: '/dashboard/media', label: 'Open Media' },
        ],
      },
      {
        title: 'File types and sizes',
        level: 3,
        blocks: [
          {
            type: 'list',
            items: [
              'Images: JPEG, PNG, WebP or AVIF, up to 20 MB.',
              'PDFs: up to 20 MB.',
              'Videos: MP4 or WebM, up to 100 MB.',
            ],
          },
          {
            type: 'p',
            text: 'Uploaded pictures are cleaned of hidden camera and location data. If the connection drops, press **Retry**.',
          },
        ],
      },
      {
        title: 'Find a file',
        blocks: [
          {
            type: 'list',
            items: [
              'Search by file name or alt text.',
              'Filter by **All**, **Images**, **Videos** or **PDFs**.',
              'Turn on **Missing alt text** to see pictures that still need a description.',
              'Press **Load more** at the bottom for older files.',
            ],
          },
        ],
      },
      {
        title: 'Use a file on a page',
        blocks: [
          {
            type: 'p',
            text: 'On any picture field, press **Choose image** to pick a file you already uploaded, or upload a new one from there.',
          },
        ],
      },
    ],
  },
  {
    slug: 'media-details',
    group: 'media',
    title: 'Alt text, captions and focal point',
    description: 'Describe pictures, set the focal point, replace or delete a file.',
    lead: 'Click a file in **Media** to open its details. This is where you describe it, replace it or delete it.',
    permission: { media: ['read'] },
    keywords: ['alt text', 'caption', 'focal point', 'decorative', 'replace', 'delete', 'accessibility'],
    sections: [
      {
        title: 'Alt text',
        blocks: [
          {
            type: 'p',
            text: 'Alt text describes a picture for people using screen readers, and helps search engines. Pictures without one show **Needs alt text** and count against SEO health.',
          },
          {
            type: 'steps',
            items: [
              'Click the picture in **Media**.',
              'Describe what it shows in one short sentence in **Alt text** (up to 300 characters), for example "Silver hatchback after a rear bumper repair".',
              'Press **Save details**.',
            ],
          },
        ],
      },
      {
        title: 'Decorative pictures',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'If a picture is only decoration (a texture or a background), turn on **Decorative (screen readers skip it)** instead of writing alt text.',
          },
        ],
      },
      {
        title: 'Caption',
        blocks: [{ type: 'p', text: 'Add an optional **Caption** (up to 500 characters) and press **Save details**.' }],
      },
      {
        title: 'Focal point',
        blocks: [
          {
            type: 'p',
            text: 'Pictures are cropped to fit different screens. Click the most important spot on the image (or use the arrow keys) so it stays in view when cropped.',
          },
        ],
      },
      {
        title: 'Replace a file',
        blocks: [
          {
            type: 'p',
            text: 'Press **Replace file (keeps every reference)** to swap in a new version. Every page using it shows the new file, with nothing to update.',
          },
        ],
      },
      {
        title: 'Delete a file',
        blocks: [
          {
            type: 'p',
            text: 'The **Used on** list shows where a file appears. A file still in use cannot be deleted: remove it from those pages first, then press **Delete file**.',
          },
          {
            type: 'callout',
            tone: 'note',
            text: 'Authors can only change and delete files they uploaded themselves.',
          },
        ],
      },
    ],
  },
];
