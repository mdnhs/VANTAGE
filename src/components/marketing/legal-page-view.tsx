import { SECTION_BG, SECTION_CONTAINER } from '@/components/marketing/ui/landing-primitives';

// No typography plugin in this project: the rich-text body is styled through descendant variants.
const PROSE = [
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

const dateFormat = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Dublin',
});

// `html` comes from renderLegalHtml, which renders only the allowlisted, escaped Tiptap nodes.
export function LegalPageView({ title, updatedAt, html }: { title: string; updatedAt: Date | null; html: string }) {
  return (
    <main className={`grow ${SECTION_BG.base}`}>
      <div className={`${SECTION_CONTAINER} pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-[120px] xl:pb-[120px]`}>
        <article className='w-full max-w-[760px]'>
          <h1 className='font-site-heading text-[36px] leading-[1.05] font-extrabold tracking-[-0.03em] text-white uppercase sm:text-[48px] lg:text-[56px]'>
            {title}
          </h1>
          {updatedAt ? (
            <p className='mt-5 text-[13px] tracking-[0.04em] text-[#737373]'>
              Last updated <time dateTime={updatedAt.toISOString()}>{dateFormat.format(updatedAt)}</time>
            </p>
          ) : null}
          <div className={`mt-10 ${PROSE}`} dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>
    </main>
  );
}
