import { BODY_TEXT } from '@/components/marketing/ui/landing-primitives';

// Admin-written page text: blank lines separate paragraphs and a line starting "## " is a
// sub-heading. Plain text only, so nothing typed in the admin can become markup.
export function PlainProse({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .flatMap((block) => {
      const lines = block.split('\n');
      // A heading line followed directly by text starts its own paragraph.
      return lines[0]!.startsWith('## ') && lines.length > 1 ? [lines[0]!, lines.slice(1).join('\n')] : [block];
    })
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <div className='flex flex-col gap-5'>
      {blocks.map((block, i) =>
        block.startsWith('## ') ? (
          <h2
            key={i}
            className='mt-4 font-site-heading text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-white uppercase sm:text-[28px] sm:leading-[34px]'
          >
            {block.slice(3).trim()}
          </h2>
        ) : (
          <p key={i} className={`${BODY_TEXT} whitespace-pre-line`}>
            {block}
          </p>
        ),
      )}
    </div>
  );
}
