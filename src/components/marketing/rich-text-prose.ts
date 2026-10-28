// No typography plugin in this project: the rich-text body is styled through descendant variants.
export const PROSE = [
  'font-site-body text-base leading-[1.75] text-[#b5b5b5]',
  '[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-site-heading [&_h2]:text-[26px] [&_h2]:leading-tight [&_h2]:font-bold [&_h2]:text-white',
  '[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-site-heading [&_h3]:text-[20px] [&_h3]:font-bold [&_h3]:text-white',
  '[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:font-semibold [&_h4]:text-white',
  '[&_p]:my-4 [&_strong]:text-white',
  '[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-white',
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5',
  '[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-5 [&_blockquote]:italic',
  '[&_hr]:my-10 [&_hr]:border-[#2a2a30]',
].join(' ');
