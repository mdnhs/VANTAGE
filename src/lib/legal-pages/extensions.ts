import StarterKit from '@tiptap/starter-kit';
import { isSafeHref } from '@/validations/legal-page-schema';

// One extension set for the admin editor and the public renderer, matching tiptapDocSchema's
// allowlist: no code, code blocks or strike; headings h2–h4 (the page title is the h1).
export const legalExtensions = [
  StarterKit.configure({
    code: false,
    codeBlock: false,
    strike: false,
    heading: { levels: [2, 3, 4] },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      isAllowedUri: (url) => isSafeHref(url),
      // Set per link from its href (see withLinkTargets), not globally.
      HTMLAttributes: { target: null, rel: null },
    },
  }),
];
